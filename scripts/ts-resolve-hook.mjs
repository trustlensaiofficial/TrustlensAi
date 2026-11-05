/**
 * Lets Node run the project's TypeScript directly.
 *
 * Node strips types natively now, but it does not do bundler-style extension
 * resolution: `import { x } from './checklist'` throws ERR_MODULE_NOT_FOUND
 * because there is no `checklist` on disk, only `checklist.ts`. Every file in
 * lib/ imports that way, which is correct for Next and fatal for `node`.
 *
 * So resolution is retried with `.ts` before giving up. Used by
 * scripts/benchmark-detection.mjs, which needs the real engine rather than a
 * compiled copy that could drift from it.
 */
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    if (err?.code !== 'ERR_MODULE_NOT_FOUND') throw err;
    // Only relative imports — a bare package name that is missing is a real
    // error, not a missing extension.
    if (!specifier.startsWith('.')) throw err;
    for (const suffix of ['.ts', '.tsx', '/index.ts']) {
      try {
        return await next(specifier + suffix, context);
      } catch {
        /* try the next one */
      }
    }
    throw err;
  }
}
