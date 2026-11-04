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

  /*
   * Hindi and the native scripts put the verb last, so their prohibition also
   * lands after the credential: "OTP kisi ko mat bataiye", "ओटीपी किसी को न
   * बताएं", "OTP யாருக்கும் சொல்ல வேண்டாம்". Reading only the prefix would
   * flag every one of those safety warnings as the scam it warns about —
   * which the benchmark corpus has a case for in each language.
   */
  const indicNegation =
    /(?:\bmat\s+\w+|\bna\s+(?:bata|de|bhej)\w*|\bnahi\s+(?:bata|puchh|maang|poochh)\w*|kabhi\s+nahi|मत\s*\S+|\bन\s*\S*(?:बताएं|बताइए|दें)|कभी\s*नहीं|नहीं\s*पूछ\S*|சொல்ல\s*வேண்டாம்|கேட்க\s*மாட்டார்கள்|வேண்டாம்|கூடாது|சொல்லக்கூடாது)/i.test(
      suffix,
    );

  return englishNegation || tanglishNegation || indicNegation;
}

/**
 * Suppresses isolation matches that are protective advice about a credential.
 *
 * "Do not tell anyone about this" from a scammer is an isolation demand, and a
 * strong one. "Never share your OTP or UPI PIN with anyone" has the same
 * surface form and the opposite meaning — and the distinguishing feature is
 * the object: a scammer telling you to keep your OTP from everyone is
 * incoherent, because they are the one who wants it.
 *
 * So an isolation pattern whose span names a credential is advice, not a
 * demand. Without this the product flags its own safety guidance as
 * elevated_risk, which is the single most embarrassing false positive
 * available to it.
 */
export function isProtectiveSecrecyAdvice(matchText: string): boolean {
  const namesCredential =
    /\b(otp|one[-\s]?time\s*(password|code|pin)|upi\s*pin|m-?pin|atm\s*pin|cvv|card\s*(number|details)|password|net\s*banking\s*(id|credentials)|passcode)\b/i.test(
      matchText,
    );
  const isProhibition = /\b(never|do\s+not|don'?t|should\s+not|shouldn'?t|avoid)\b/i.test(matchText);
  return namesCredential && isProhibition;
}
