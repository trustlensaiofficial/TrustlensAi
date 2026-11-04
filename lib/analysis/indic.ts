import type { Signal, SignalMatch } from './types';
import { isNegatedCredentialInstruction, isProtectiveSecrecyAdvice } from './match-safety';

/**
 * Hindi scam patterns, and native-script Tamil and Devanagari.
 *
 * The benchmark is why this exists. Measured against the labelled corpus, the
 * engine scored **0% recall on Tamil script, 0% on Devanagari and 25% on Hindi
 * in Latin script** — the Tamil rules covered Latin script only and there was
 * no Hindi coverage at all. Messages that named an OTP and demanded it in
 * Hindi came back `no_signals_detected`, which is the worst possible answer:
 * not a warning, and not an admission of ignorance either.
 *
 * Two things make native script easier than transliteration, and one harder.
 * Easier: there is one spelling, so no variant explosion. Easier still: the
 * loan words that matter — OTP, PIN, UPI, KYC, bank — are usually left in
 * Latin letters even inside a Devanagari or Tamil sentence, so they anchor a
 * pattern reliably. Harder: word order differs, and the verb lands at the end,
 * so a pattern written as "verb then object" matches nothing.
 *
 * So every rule below accepts the demand on either side of its object.
 *
 * What is NOT claimed: this is tested against the corpus in
 * `tests/fixtures/corpus.ts` and nothing else. `docs/DETECTION_BENCHMARK.md`
 * records the measured figure per language, and no language is described as
 * fully supported on the strength of it.
 */

interface IndicRule {
  id: string;
  title: string;
  severity: Signal['severity'];
  category: Signal['category'];
  explanation: string;
  patterns: RegExp[];
}

/* ------------------------------------------------------- shared fragments */

/** Credentials, which stay in Latin letters in practice. */
const CRED = '(?:otp|o\\.t\\.p|upi\\s*pin|pin|cvv|password|atm\\s*pin|mpin)';

/** Hindi imperative "tell / give / send / enter", Latin script. */
const HI_DEMAND =
  '(?:bata(?:iye|do|dijiye|na)?|batao|de(?:na|do|dijiye)?|bhej(?:iye|o|na)?|dal(?:iye|o|na)?|likh(?:iye|o)?|share\\s*kar(?:iye|o|ke)?|enter\\s*kar(?:iye|o|ke)?)';

/** Devanagari imperative forms of the same verbs. */
const DEV_DEMAND = '(?:बताइए|बताओ|बतायें|बताएं|दीजिए|दो|दें|भेजिए|भेजो|भेजें|डालिए|डालो|डालें|लिखिए|करें|करिए|करो)';

/** Tamil-script imperative forms. */
const TA_DEMAND = '(?:சொல்லுங்கள்|சொல்லு|கொடுங்கள்|கொடு|அனுப்புங்கள்|போடுங்கள்|போட்டு|செய்யுங்கள்|அழுத்தி|அழுத்துங்கள்|பூர்த்தி)';

const RULES: IndicRule[] = [
  /* ------------------------------------------------ credentials: Hindi */
  {
    id: 'hi.otp_request',
    title: 'Asks you to share an OTP or PIN (Hindi)',
    severity: 'critical',
    category: 'credentials',
    explanation:
      'No bank, payment app or government office ever asks for an OTP, PIN or CVV — not by phone, not by message, not to "verify" anything. Anyone asking is trying to take money out of the account, not protect it.',
    patterns: [
      // Object first, verb last: the ordinary Hindi order.
      new RegExp(`\\b${CRED}\\b[^.!?]{0,40}?\\b${HI_DEMAND}\\b`, 'gi'),
      // And the reverse, which appears in mixed English-Hindi messages.
      new RegExp(`\\b${HI_DEMAND}\\b[^.!?]{0,40}?\\b${CRED}\\b`, 'gi'),
    ],
  },
  {
    id: 'dev.otp_request',
    title: 'Asks you to share an OTP or PIN (Devanagari)',
    severity: 'critical',
    category: 'credentials',
    explanation:
      'No bank, payment app or government office ever asks for an OTP, PIN or CVV. Anyone asking is trying to take money out of the account, not protect it.',
    patterns: [
      new RegExp(`\\b${CRED}\\b[^.!?।]{0,40}?${DEV_DEMAND}`, 'gi'),
      new RegExp(`${DEV_DEMAND}[^.!?।]{0,40}?\\b${CRED}\\b`, 'gi'),
      // ओटीपी / पिन spelled out in Devanagari.
      new RegExp(`(?:ओटीपी|पिन|पासवर्ड)[^.!?।]{0,40}?${DEV_DEMAND}`, 'gi'),
    ],
  },

  /* ------------------------------------------------ credentials: Tamil */
  {
    id: 'tas.otp_request',
    title: 'Asks you to share an OTP or PIN (Tamil script)',
    severity: 'critical',
    category: 'credentials',
    explanation:
      'No bank, payment app or government office ever asks for an OTP, PIN or CVV. Anyone asking is trying to take money out of the account, not protect it.',
    patterns: [
      new RegExp(`\\b${CRED}\\b[^.!?]{0,40}?${TA_DEMAND}`, 'gi'),
      new RegExp(`${TA_DEMAND}[^.!?]{0,40}?\\b${CRED}\\b`, 'gi'),
      // Tamil for "number" after a credential, then a demand.
      new RegExp(`\\b${CRED}\\b\\s*எண்[^.!?]{0,30}?${TA_DEMAND}`, 'gi'),
    ],
  },

  /* ------------------------------------------- UPI PIN to "receive" money */
  {
    id: 'indic.upi_pin_to_receive',
    title: 'Says a UPI PIN is needed to receive money',
    severity: 'critical',
    category: 'payment',
    explanation:
      'A UPI PIN authorises a payment leaving your account. It is never needed to receive money. A message saying otherwise is describing the opposite of what will happen.',
    patterns: [
      // Hindi, Latin: "refund ke liye UPI PIN daliye"
      new RegExp(`\\b(?:refund|cashback|paisa|paise|rupaye|amount)\\b[^.!?]{0,60}?\\bupi\\s*pin\\b`, 'gi'),
      new RegExp(`\\bupi\\s*pin\\b[^.!?]{0,60}?\\b(?:aa\\s*jayega|aayega|milega|credit\\s*ho)\\b`, 'gi'),
      // Devanagari: रिफंड ... UPI PIN ... आ जाएगा
      /(?:रिफंड|रिफ़ंड|पैसा|पैसे|रुपये)[^.!?।]{0,60}?\bupi\s*pin\b/gi,
      /\bupi\s*pin\b[^.!?।]{0,60}?(?:आ\s*जाएगा|आएगा|मिलेगा|जमा)/gi,
      // Tamil script: பணம் ... UPI PIN ... சேரும்
      /(?:பணம்|திரும்ப|ரீஃபண்ட்)[^.!?]{0,60}?\bupi\s*pin\b/gi,
      /\bupi\s*pin\b[^.!?]{0,60}?(?:சேரும்|வரும்|கிடைக்கும்)/gi,
    ],
  },

  /* ------------------------------------------------- account-block threat */
  {
    id: 'indic.account_block',
    title: 'Threatens that the account will be blocked',
    severity: 'high',
    category: 'threat',
    explanation:
      'Manufactured urgency. A real bank writes through its own app or by post and gives you time; it does not threaten to close an account within hours by message.',
    patterns: [
      // Hindi, Latin: "account band ho jayega", "block ho jayega"
      /\b(?:account|khata|khaata)\b[^.!?]{0,40}?\b(?:band|block|freeze|bandh)\b[^.!?]{0,20}?\b(?:ho\s*jayega|ho\s*jaega|hoga|kar\s*diya)\b/gi,
      /\b(?:band|block)\s*ho\s*jayega\b/gi,
      // Devanagari: खाता बंद हो जाएगा
      /(?:खाता|अकाउंट)[^.!?।]{0,40}?(?:बंद|ब्लॉक|फ्रीज)[^.!?।]{0,20}?(?:हो\s*जाएगा|हो\s*जायेगा|होगा)/gi,
      // Tamil script: கணக்கு முடக்கப்படும்
      /(?:கணக்கு|வங்கிக்\s*கணக்கு)[^.!?]{0,40}?(?:முடக்கப்படும்|முடக்கம்|நிறுத்தப்படும்|ரத்து)/gi,
    ],
  },

  /* ------------------------------------------------------- KYC pressure */
  {
    id: 'indic.kyc_pressure',
    title: 'Demands an urgent KYC update',
    severity: 'high',
    category: 'impersonation',
    explanation:
      'A genuine KYC update is done at a branch or inside your bank’s own app, with weeks of notice. A KYC message with a link and a deadline is one of the most common frauds in India.',
    patterns: [
      // Hindi, Latin
      /\bkyc\b[^.!?]{0,50}?\b(?:update\s*nahi|turant|jaldi|abhi|nahi\s*hua|karwaiye|kar\s*lijiye)\b/gi,
      // Devanagari
      /\bkyc\b[^.!?।]{0,50}?(?:तुरंत|अपडेट|पूरा\s*कीजिए|नहीं\s*हुआ)/gi,
      // Tamil script — "KYC புதுப்பிக்கப்படவில்லை"
      /\bkyc\b[^.!?]{0,50}?(?:புதுப்பிக்கப்படவில்லை|புதுப்பிக்க|புதுப்பிக்கவும்|முடிக்கவும்)/gi,
    ],
  },

  /* ---------------------------------------------- transfer to a safe account */
  {
    id: 'indic.safe_account',
    title: 'Tells you to move money to a "safe" account',
    severity: 'critical',
    category: 'payment',
    explanation:
      'There is no such thing as a safe or temporary account that a bank moves your money to. This instruction exists only in fraud: the "safe account" belongs to the caller.',
    patterns: [
      // Hindi, Latin: "safe account mein transfer kar dijiye"
      /\b(?:safe|surakshit|secure)\s*(?:account|khata)\b[^.!?]{0,40}?\b(?:transfer|bhej|dal|daal)\w*/gi,
      /\b(?:transfer|bhej)\w*\b[^.!?]{0,40}?\b(?:safe|surakshit)\s*(?:account|khata)\b/gi,
      // "aapka paisa surakshit nahi hai"
      /\b(?:paisa|paise|khata|account)\b[^.!?]{0,30}?\bsurakshit\s*nahi\b/gi,
      // Devanagari
      /(?:सुरक्षित|सेफ)\s*(?:खाते|खाता|अकाउंट)[^.!?।]{0,40}?(?:ट्रांसफर|भेज|डाल)/gi,
    ],
  },

  /* ------------------------------------------------------ job-offer fee */
  {
    id: 'indic.job_fee',
    title: 'Asks for a fee to confirm a job',
    severity: 'high',
    category: 'payment',
    explanation:
      'A genuine employer never charges you to be hired. A registration, security or processing fee for a job offer is the fraud itself, and "refundable" does not change that.',
    patterns: [
      // Hindi, Latin
      /\b(?:registration|security|processing)\s*(?:fee|fees|charge|shulk)\b[^.!?]{0,50}?\b(?:bhej|pay|jama|de)\w*/gi,
      /\b(?:salary|naukri|kaam|job)\b[^.!?]{0,80}?\b(?:registration|processing)\s*fees?\b/gi,
      // Devanagari
      /(?:रजिस्ट्रेशन|पंजीकरण|प्रोसेसिंग)\s*(?:शुल्क|फीस)[^.!?।]{0,50}?(?:भेज|जमा|दें)/gi,
      // Tamil script
      /(?:பதிவு|செயலாக்க)\s*(?:கட்டணம்|தொகை)[^.!?]{0,50}?(?:அனுப்ப|செலுத்த)/gi,
    ],
  },

  /* ----------------------------------------------------- prize / lottery */
  {
    id: 'indic.prize_fee',
    title: 'Claims a prize and asks for a fee',
    severity: 'high',
    category: 'lure',
    explanation:
      'A real prize is never released against a payment from the winner. A processing, tax or clearance fee on winnings is the entire purpose of the message.',
    patterns: [
      /\b(?:lottery|inaam|prize|lucky\s*draw)\b[^.!?]{0,80}?\b(?:fee|fees|charge|shulk|tax)\b/gi,
      /(?:लॉटरी|इनाम|पुरस्कार)[^.!?।]{0,80}?(?:शुल्क|फीस|टैक्स)/gi,
      /(?:லாட்டரி|பரிசு)[^.!?]{0,80}?(?:கட்டணம்|தொகை)/gi,
    ],
  },

  /* ------------------------------------------- link pressure, any script */
  {
    id: 'indic.link_pressure',
    title: 'Pushes you to open a link to avoid a consequence',
    severity: 'high',
    category: 'link',
    explanation:
      'A link in a threatening message is the mechanism, not the message. Open your bank or service app yourself instead — if the warning were real, it would be waiting for you there.',
    patterns: [
      // Hindi, Latin: "link click kijiye warna account band"
      /\b(?:link|website)\b[^.!?]{0,40}?\b(?:click\s*kar\w*|khol\w*|dabaye)\b[^.!?]{0,40}?\b(?:warna|nahi\s*to|otherwise)\b/gi,
      /\b(?:warna|nahi\s*to)\b[^.!?]{0,60}?\b(?:band|block|freeze)\b/gi,
      // Devanagari: इस लिंक ... दबाएं ... वरना
      /(?:लिंक|वेबसाइट)[^.!?।]{0,40}?(?:दबाएं|दबाइए|क्लिक|खोलें)/gi,
      // Tamil script: இந்த இணைப்பை அழுத்தி
      /(?:இணைப்பை|லிங்க்)[^.!?]{0,30}?(?:அழுத்தி|அழுத்துங்கள்|திறக்க)/gi,
    ],
  },
];

export const INDIC_RULE_COUNT = RULES.length;

function collect(text: string, patterns: RegExp[]): SignalMatch[] {
  const seen = new Set<string>();
  const out: SignalMatch[] = [];
  for (const pattern of patterns) {
    // Each pattern carries /g, so the lastIndex has to be reset between runs.
    pattern.lastIndex = 0;
    for (const m of text.matchAll(pattern)) {
      if (m.index === undefined) continue;
      const key = `${m.index}:${m[0].length}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ text: m[0].trim(), start: m.index, end: m.index + m[0].length });
    }
  }
  return out;
}

/**
 * Runs the Hindi and native-script rules over any text.
 *
 * Unconditional, like the Tamil-in-Latin rules, and for the same reason: real
 * messages mix scripts freely. "आपका account band ho jayega, OTP बताइए" is one
 * sentence in three writing systems, and gating on a detected language would
 * miss most of what actually arrives.
 */
export function detectIndicSignals(text: string): Signal[] {
  const out: Signal[] = [];
  for (const rule of RULES) {
    const matches = collect(text, rule.patterns).filter((match) => {
      // Protective advice must never be read as the thing it warns about.
      if (rule.category === 'credentials' && isNegatedCredentialInstruction(text, match.start)) return false;
      if (rule.category === 'secrecy' && isProtectiveSecrecyAdvice(match.text)) return false;
      return true;
    });
    if (matches.length === 0) continue;
    out.push({
      id: rule.id,
      title: rule.title,
      category: rule.category,
      severity: rule.severity,
      explanation: rule.explanation,
      matches,
    });
  }
  return out;
}
