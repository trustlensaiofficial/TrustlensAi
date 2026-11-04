/**
 * Suppresses credential-request matches that are clearly part of protective
 * advice (for example, "Never share your OTP"). A warning about a scam must
 * not itself be classified as a scam.
 */
export function isNegatedCredentialInstruction(text: string, matchStart: number): boolean {
  const prefix = text.slice(Math.max(0, matchStart - 48), matchStart);
  return /(?:\bnever|\bdon't|\bdo not|\bshould not|\bshouldn't|\bavoid)(?:\s+\w+){0,3}\s*$/i.test(prefix);
}
