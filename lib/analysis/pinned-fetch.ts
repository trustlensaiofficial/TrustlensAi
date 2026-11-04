/**
 * A fetch that can only connect to an address we already validated.
 *
 * This closes the DNS-rebinding hole in the SSRF guard. The guard resolves a
 * hostname, checks every returned address against the blocked ranges, and then
 * — in the old code — handed the *hostname* to `fetch`, which resolved it all
 * over again. A hostile nameserver answering with a one-second TTL could
 * return a public address to the check and a private one to the connection,
 * and the guard would never see it. Validate-then-fetch is not a defence when
 * something else does the resolving.
 *
 * The fix is to stop resolving twice. `connect.lookup` is replaced with a
 * function that ignores DNS entirely and returns only the addresses the guard
 * approved, so the socket physically cannot go anywhere else.
 *
 * What this deliberately does **not** change: the hostname is still used for
 * TLS SNI and certificate verification. Rewriting the URL to the bare IP and
 * carrying the original `Host` header would also pin the address, but it would
 * break certificate validation — and silently accepting a certificate that
 * does not match is a worse hole than the one being closed. Node's `lookup`
 * option affects address resolution only, which is exactly the narrow thing
 * wanted here.
 */

import { Agent, type Dispatcher } from 'undici';

/** An address the guard has already checked against the blocked ranges. */
export interface PinnedAddress {
  address: string;
  family: number;
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address?: string | Array<{ address: string; family: number }>,
  family?: number,
) => void;

/**
 * Node accepts the address family as a number or as "IPv4"/"IPv6".
 *
 * Both forms appear in practice depending on the caller, and reading only the
 * numeric one would silently treat a string request as "no preference" — which
 * would hand back an IPv6 address to a connector that asked for IPv4.
 */
function familyNumber(family: number | string | undefined): number {
  if (family === 4 || family === 'IPv4') return 4;
  if (family === 6 || family === 'IPv6') return 6;
  return 0;
}

/**
 * Builds the `lookup` replacement.
 *
 * Exported for tests: the refusal path is the part that matters, and it is
 * much easier to assert on directly than through a socket.
 */
export function pinnedLookup(expectedHost: string, addresses: readonly PinnedAddress[]) {
  const host = expectedHost.toLowerCase();

  return function lookup(
    hostname: string,
    options: { all?: boolean; family?: number | string } | number | undefined,
    callback: LookupCallback,
  ): void {
    /*
     * A connection to a host other than the one we validated means a redirect
     * or a library has changed the destination behind our back. Refuse rather
     * than resolve it — falling back to real DNS here would reopen the hole
     * this function exists to close.
     */
    if (hostname.toLowerCase() !== host) {
      const err: NodeJS.ErrnoException = new Error(
        `refusing to resolve ${hostname}: only ${expectedHost} was validated for this request`,
      );
      err.code = 'ERR_TRUSTLENS_HOST_NOT_PINNED';
      callback(err);
      return;
    }

    const wantAll = typeof options === 'object' && options?.all === true;
    const family = familyNumber(typeof options === 'number' ? options : options?.family);

    const usable = family === 0 ? [...addresses] : addresses.filter((a) => a.family === family);

    if (usable.length === 0) {
      const err: NodeJS.ErrnoException = new Error(
        `no validated address for ${expectedHost}${family ? ` in family ${family}` : ''}`,
      );
      err.code = 'ENOTFOUND';
      callback(err);
      return;
    }

    if (wantAll) {
      callback(null, usable.map((a) => ({ address: a.address, family: a.family })));
    } else {
      const first = usable[0]!;
      callback(null, first.address, first.family);
    }
  };
}

/** A response plus the agent that must be released once its body is done. */
export interface PinnedResponse {
  response: Response;
  /** Releases the connection. Safe to call more than once. */
  dispose: () => Promise<void>;
}

/**
 * Fetches `url`, able to connect only to `addresses`.
 *
 * The agent is **not** destroyed when this returns, because the caller has not
 * read the body yet — tearing it down here would break the stream it is about
 * to read. The caller owns `dispose` and must call it once the body is
 * consumed or abandoned; a per-hop agent that is never released would leak a
 * socket on every redirect.
 *
 * The timeout and abort signal stay with the caller, as before.
 */
export async function fetchPinned(
  // Only these two fields are needed, so any parsed-URL shape works.
  url: { href: string; hostname: string },
  addresses: readonly PinnedAddress[],
  init: RequestInit,
): Promise<PinnedResponse> {
  const agent = new Agent({
    connect: {
      // Cast because Node's LookupFunction types `family` more narrowly than
      // the runtime actually passes it; `familyNumber` handles both forms.
      lookup: pinnedLookup(url.hostname, addresses) as never,
      // A rebinding attack can also be a stall. Keep the handshake bounded
      // independently of the caller's overall abort signal.
      timeout: 5_000,
    },
    // One connection per request; nothing is reused across hosts or hops.
    connections: 1,
    pipelining: 0,
  });

  let released = false;
  const dispose = async () => {
    if (released) return;
    released = true;
    await agent.destroy().catch(() => {});
  };

  try {
    /*
     * `dispatcher` is an undici extension to RequestInit that Node's fetch
     * honours but the DOM typings do not describe, hence the cast. Without it
     * the request would use the global dispatcher and resolve DNS itself,
     * which is the whole bug.
     */
    const response = await fetch(url.href, {
      ...init,
      dispatcher: agent,
    } as RequestInit & { dispatcher: Dispatcher });
    return { response, dispose };
  } catch (err) {
    // Nothing to read, so release immediately rather than handing back a
    // disposer the caller has no response to pair it with.
    await dispose();
    throw err;
  }
}
