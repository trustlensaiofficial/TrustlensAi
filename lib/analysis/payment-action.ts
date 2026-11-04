/**
 * What is this message persuading me to do with money?
 *
 * This is the product's central question and the thing a spam label cannot
 * answer. "Suspicious message" tells someone nothing about whether approving
 * the prompt in front of them will move money out of their account.
 *
 * The specific deception this module exists to catch: a UPI *collect* request
 * presented as a refund. NPCI is explicit that entering a UPI PIN authorises
 * a payment — it is never how money is received. So when a message says
 * "accept the request and enter your PIN to receive your refund", the
 * direction of money is the opposite of what the message claims, and that
 * single fact is worth more to the reader than any risk score.
 *
 * Hard boundaries, enforced by the types below:
 *   - Parsing a `upi://` URI establishes the payee, the amount and the note.
 *     It establishes NOTHING about whether the beneficiary is genuine.
 *   - This module never initiates, approves or cancels a payment.
 *   - It never asks for a PIN, and it never claims money has moved.
 *   - `unknowns` is non-empty by construction: beneficiary legitimacy is
 *     always unverified, because we have no authorised NPCI or bank
 *     integration and will not imply one.
 */

/** Which concrete action the sender wants taken. */
export type PaymentActionKind =
  | 'send_money'
  | 'approve_collect'
  | 'enter_upi_pin'
  | 'scan_qr'
  | 'share_credentials'
  | 'install_app'
  | 'none';

/**
 * Which way money actually moves.
 *
 * `user_pays` is asserted whenever the mechanism debits the user, even when
 * the message claims a credit. That contradiction is the finding.
 */
export type PaymentDirection = 'user_pays' | 'user_receives' | 'unclear';

export interface UpiInstruction {
  /** Virtual Payment Address — the account that would be credited. */
  payeeVpa: string | null;
  /** Display name supplied in the URI. Attacker-controlled; never identity. */
  payeeName: string | null;
  amount: string | null;
  currency: string | null;
  note: string | null;
  /** Raw scheme-level mode, where present. */
  mode: string | null;
}

export interface PaymentAction {
  detected: boolean;
  kind: PaymentActionKind;
  direction: PaymentDirection;
  upi: UpiInstruction | null;
  /** Plain-language account of what the action does. */
  explanation: string;
  /** Always non-empty when something was detected. */
  unknowns: string[];
  /**
   * True when the message's claim and the mechanism disagree — a refund
   * promise attached to a debit. The highest-value signal in the module.
   */
  claimContradiction: boolean;
}

const NOT_DETECTED: PaymentAction = {
  detected: false,
  kind: 'none',
  direction: 'unclear',
  upi: null,
  explanation: '',
  unknowns: [],
  claimContradiction: false,
};

/** Shown whenever any payment action is found. */
const ALWAYS_UNKNOWN = [
  'Whether the person or business receiving the money is genuine. A payment address can be created by anyone, and the name shown in it is chosen by whoever made it.',
  'Whether any money has actually moved. TrustLens has no access to bank or UPI transaction systems.',
];

/* ------------------------------------------------------------------- UPI */

/**
 * Parses a `upi://pay?...` deep link.
 *
 * Returns `null` rather than guessing when the scheme is absent — a half-read
 * payment instruction is worse than none, because the reader would act on it.
 */
export function parseUpiUri(raw: string): UpiInstruction | null {
  const match = raw.match(/\bupi:\/\/(pay|collect|mandate)\?([^\s"'<>]+)/i);
  // Both groups are guarded: strict indexed access treats a capture as
  // possibly undefined, and a half-read payment instruction is worse than
  // none because the reader would act on it.
  const mode = match?.[1];
  const query = match?.[2];
  if (!mode || !query) return null;

  const params = new URLSearchParams(query);
  const get = (k: string): string | null => {
    const v = params.get(k);
    return v && v.trim() ? v.trim() : null;
  };

  return {
    payeeVpa: get('pa'),
    payeeName: get('pn'),
    amount: get('am'),
    currency: get('cu') ?? (get('am') ? 'INR' : null),
    note: get('tn'),
    mode: mode.toLowerCase(),
  };
}

/** Bare VPAs (`name@bank`) mentioned in text, excluding ordinary email hosts. */
export function extractVpas(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b([a-z0-9][a-z0-9._-]{1,48})@([a-z]{2,24})\b/gi)) {
    const handle = `${m[1]}@${m[2]}`.toLowerCase();
    if (/@(gmail|yahoo|outlook|hotmail|proton|icloud|rediffmail|live|aol)$/.test(handle)) continue;
    out.add(handle);
  }
  return [...out];
}

/* -------------------------------------------------------------- language */

/** The message claims money is coming TO the reader. */
const CLAIMS_INBOUND =
  /\b(refund|cashback|reward|prize|winnings?|compensation|returned?|credit(ed)?|receive|claim\s+your)\b/i;

/** A collect request: the sender asks, the reader approves, the reader pays. */
const COLLECT =
  /\b(collect\s*request|payment\s*request|request\s*money|accept\s+the\s+request|approve\s+the\s+request|pending\s+request)\b/i;

/** Entering a PIN. Always authorisation, never receipt. */
const PIN_ENTRY =
  /\b(enter|put|type|provide|give|key\s*in)\b[^.!?]{0,30}?\b(upi\s*pin|mpin|m-pin|pin)\b/i;

const SCAN_QR = /\b(scan|point\s+your\s+camera\s+at)\b[^.!?]{0,30}?\b(qr|barcode|code)\b/i;

const SEND_MONEY =
  /\b(send|transfer|pay|remit|deposit|wire)\b[^.!?]{0,30}?\b(rs\.?|inr|₹|\d{3,}|money|amount|fee|charge)\b/i;

const SHARE_CREDENTIALS =
  /\b(share|send|provide|enter|confirm|tell|forward)\b[^.!?]{0,30}?\b(otp|one[-\s]?time|cvv|card\s+number|password|net\s*banking)\b/i;

const INSTALL_APP =
  /\b(install|download|apk)\b[^.!?]{0,30}?\b(app|application|anydesk|teamviewer|quicksupport)\b/i;

/* ------------------------------------------------------------- explain  */

function explainCollect(claimsRefund: boolean): string {
  const mechanism =
    'A UPI collect request is someone asking you for money. Approving it and entering your PIN authorises a payment **out** of your account.';
  const npci =
    'NPCI switched off person-to-person collect requests on 1 October 2025, specifically because they were used this way. ' +
    'Only registered merchants can send one now — so an individual claiming to send you a payment request is describing something UPI no longer does.';
  if (!claimsRefund) return `${mechanism}\n\n${npci}`;
  return (
    `${mechanism}\n\n` +
    'This message describes it as a refund. That cannot be true: you never enter a UPI PIN to receive money, only to send it. ' +
    'A genuine refund arrives on its own, with nothing for you to approve.\n\n' +
    npci
  );
}

function explainPin(claimsRefund: boolean): string {
  const mechanism =
    'Entering a UPI PIN authorises a payment. It is the step that moves money out, and it is never required to receive money.';
  return claimsRefund
    ? `${mechanism}\n\nSo a request to enter your PIN "to receive" something is describing the opposite of what will happen.`
    : mechanism;
}

function explainQr(claimsRefund: boolean): string {
  const mechanism =
    'A QR code can contain a payment instruction. Scanning one may open a payment for you to approve — it does not collect money for you.';
  return claimsRefund
    ? `${mechanism}\n\nBeing told to scan a code to receive a refund is the common form of this scam: the code is set up to take a payment, not send one.`
    : mechanism;
}

/* ---------------------------------------------------------------- detect */

/**
 * Identifies the requested payment action in a message, plus any decoded QR.
 *
 * `qrPayload` is decoded on the client, on-device — the raw image never needs
 * to reach the server for this to work.
 */
export function detectPaymentAction(text: string, qrPayload?: string | null): PaymentAction {
  const haystack = qrPayload ? `${text}\n${qrPayload}` : text;
  const upi = parseUpiUri(haystack);
  const claimsRefund = CLAIMS_INBOUND.test(text);

  /*
   * Order is by consequence, not by how clearly each is worded. Entering a
   * PIN and approving a collect request are the two steps that actually move
   * money, so they outrank a QR instruction that merely leads to them.
   */
  let kind: PaymentActionKind = 'none';
  if (PIN_ENTRY.test(text)) kind = 'enter_upi_pin';
  else if (COLLECT.test(text) || upi?.mode === 'collect') kind = 'approve_collect';
  else if (SCAN_QR.test(text) || (qrPayload && upi)) kind = 'scan_qr';
  else if (SEND_MONEY.test(text) || upi?.mode === 'pay') kind = 'send_money';
  else if (SHARE_CREDENTIALS.test(text)) kind = 'share_credentials';
  else if (INSTALL_APP.test(text)) kind = 'install_app';

  if (kind === 'none' && !upi) return NOT_DETECTED;

  // Every mechanism here debits the user. A message claiming otherwise is
  // contradicting the thing it is asking for.
  const debits = kind === 'enter_upi_pin' || kind === 'approve_collect' || kind === 'send_money' || kind === 'scan_qr';
  const direction: PaymentDirection = debits ? 'user_pays' : kind === 'none' ? 'unclear' : 'unclear';
  const claimContradiction = debits && claimsRefund;

  let explanation: string;
  switch (kind) {
    case 'approve_collect': explanation = explainCollect(claimsRefund); break;
    case 'enter_upi_pin':   explanation = explainPin(claimsRefund); break;
    case 'scan_qr':         explanation = explainQr(claimsRefund); break;
    case 'send_money':
      explanation = 'This is asking you to send money. Transfers are effectively irreversible once made.';
      break;
    case 'share_credentials':
      explanation = 'This is asking for a code or card detail rather than a payment. Anyone who has those can move money without you approving anything.';
      break;
    case 'install_app':
      explanation = 'This is asking you to install software. A remote-access or support app can see your screen, including balances and one-time codes.';
      break;
    default:
      explanation = 'A payment instruction was found in this content.';
  }

  const unknowns = [...ALWAYS_UNKNOWN];
  if (upi?.payeeName) {
    unknowns.push(
      `Whether "${upi.payeeName}" is the real name of the account holder. That label is set by whoever created the payment request, not verified by the bank.`,
    );
  }
  if (upi && !upi.amount) {
    unknowns.push('The amount, which is not fixed in this instruction — it would be set when the payment is opened.');
  }

  return { detected: true, kind, direction, upi, explanation, unknowns, claimContradiction };
}

/** Short label for a report heading. */
export function paymentActionLabel(action: PaymentAction): string {
  switch (action.kind) {
    case 'enter_upi_pin':     return 'You are being asked to enter your UPI PIN';
    case 'approve_collect':   return 'You are being asked to approve a payment request';
    case 'scan_qr':           return 'You are being asked to scan a payment code';
    case 'send_money':        return 'You are being asked to send money';
    case 'share_credentials': return 'You are being asked for a code or card detail';
    case 'install_app':       return 'You are being asked to install an app';
    default:                  return 'No payment action identified';
  }
}
