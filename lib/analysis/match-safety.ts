/**
 * Suppresses credential-request matches that are clearly part of protective
 * advice (for example, "Never share your OTP"). A warning about a scam must
 * not itself be classified as a scam.
 */
export function isNegatedCredentialInstruction(text: string, matchStart: number): boolean {
  const prefix = text.slice(Math.max(0, matchStart - 64), matchStart);
  const suffix = text.slice(matchStart, Math.min(text.length, matchStart + 112));
  const englishNegation =
    /(?:\bnever|\bdon't|\bdo not|\bshould not|\bshouldn't|\bavoid)(?:\s+\w+){0,4}\s*$/i.test(prefix);
  // In common Tanglish advice, the credential is named first and the
  // prohibition appears at the end ("OTP ah ... share pannadheenga").
  const tanglishNegation =
    /\b(?:pannadheenga|pannatheenga|pannathinga|solladheenga|sollatheenga|kodukkadheenga|anuppadheenga)\b/i.test(suffix);
  return englishNegation || tanglishNegation;
}
