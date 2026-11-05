import type { Signal, SignalCategory, SignalMatch } from './types';
import { isNegatedCredentialInstruction, isProtectiveSecrecyAdvice } from './match-safety';

/**
 * Tamil-language scam patterns, written in Latin script.
 *
 * A very large number of Tamil speakers type and read Tamil in Latin letters
 * on a phone, and scams targeting them are written the same way. The existing
 * English rules miss all of it: "OTP-ah share pannunga" contains the word OTP
 * but none of the English phrasing around it, so the sentence that actually
 * makes the demand goes undetected.
 *
 * Transliteration has no single spelling. "pannunga" is also written
 * "panunga", "pannuga" and "paNNunga"; "kudunga" appears as "kodunga" and
 * "koduga". Every pattern below accepts the common variants rather than one
 * canonical form, because insisting on one spelling would miss most real
 * messages.
 *
 * Tamil script (அ-ஃ) is deliberately NOT covered. These patterns were tested
 * in Latin script only, and claiming script support that was never tested is
 * precisely the kind of overstatement this product argues against.
 */

interface TanglishRule {
  id: string;
  title: string;
  severity: Signal['severity'];
  category: Signal['category'];
  explanation: string;
  patterns: RegExp[];
}

/* Spelling fragments reused across rules. */
const DO = '(?:pannu(?:nga|ngo|ga)?|panu(?:nga|ga)?|paNNunga|pannunga)';
const GIVE = '(?:k[ou]du(?:nga|ngo|ga)?|kudu|kodu)';
const SAY = '(?:sollu(?:nga|ga)?|solunga|sollunga)';

const RULES: TanglishRule[] = [
  {
    id: 'ta.otp_request',
    title: 'Asks you to share an OTP or PIN',
    severity: 'critical',
    category: 'credentials',
    explanation:
      'No bank, payment app or government office ever asks for an OTP, PIN or CVV — not by phone, not by message, not to "verify" anything. Anyone asking is trying to take money from the account, not protect it.',
    patterns: [
      new RegExp(`\\b(otp|pin|cvv|password)\\b[^.!?]{0,40}?\\b(?:${GIVE}|share\\s*${DO}|${SAY})`, 'gi'),
      new RegExp(`\\b(otp|pin|cvv)[\\s-]*(?:ah|a|ai|va)?\\b[^.!?]{0,30}?\\b(?:${GIVE}|share)`, 'gi'),
      /\b(otp|pin)\b[^.!?]{0,30}?\b(sollunga|solunga|sollu)\b/gi,
      // Mixed: an English verb with a Tamil imperative ending, which is how
      // most of these are actually written.
      new RegExp(`\\b(otp|upi\\s*pin|pin|cvv)\\b[^.!?]{0,30}?\\b(?:enter|type|put|send|share)\\s*${DO}`, 'gi'),
      new RegExp(`\\b(?:enter|type|put)\\s*${DO}[^.!?]{0,30}?\\b(otp|upi\\s*pin|pin|cvv)\\b`, 'gi'),
      /\bverify\s*(pannunga|panunga|pannuga)\b[^.!?]{0,40}?\b(otp|pin)\b/gi,
    ],
  },
  {
    id: 'ta.account_block',
    title: 'Threatens that the account will be blocked',
    severity: 'high',
    category: 'threat',
    explanation:
      'Manufactured urgency. A real bank writes to you through the app or post and gives you time; it does not threaten to close your account within hours over a message.',
    patterns: [
      /\b(account|akkaun[dt]|kanakku)\b[^.!?]{0,40}?\b(block|blaak|close|freeze|nirutha|niruthi)\w*\b/gi,
      /\b(block|close)\s*(aagidum|aagum|agiduum|aayidum|pannidu\w*)\b/gi,
      // Requires a Tamil marker. Bare English "KYC update" is an ordinary
      // bank notice, and matching it here made a genuine one score 6.
      /\b(kyc)\b[^.!?]{0,40}?\b(mudinj\w*|mudiy\w*|aagala|aagalai|aagville|pannala|illana|illaina)\b/gi,
      /\b(kyc)\b[^.!?]{0,30}?\bupdate\b[^.!?]{0,30}?\b(aagala|aagalai|pannunga|panunga|illana|illaina|seekiram)\b/gi,
      /\b(indha|indhu|inniku|innaiku|today)\b[^.!?]{0,30}?\b(block|close)\w*\b/gi,
    ],
  },
  {
    id: 'ta.money_transfer',
    title: 'Asks you to transfer or send money',
    severity: 'high',
    category: 'payment',
    explanation:
      'A request to move money from a message you did not expect. Transfers are effectively irreversible once made, so verify through a number you already have before sending anything.',
    patterns: [
      new RegExp(`\\b(panam|money|amount|rupees?|rs\\.?)\\b[^.!?]{0,40}?\\b(?:anupp|anup|send|transfer|pod)\\w*\\s*(?:${DO})?`, 'gi'),
      new RegExp(`\\b(?:anupp|anup)\\w*\\s*${DO}\\b`, 'gi'),
      /\b(safe|secure)\s*(account|akkaun[dt])\b[^.!?]{0,40}?\b(transfer|anupp\w*|move)\b/gi,
      /\b(deposit|advance|fees?|fee)\b[^.!?]{0,30}?\b(kattunga|kattanum|katta|pay\s*pannunga)\b/gi,
    ],
  },
  {
    id: 'ta.link_click',
    title: 'Pushes you to open a link',
    severity: 'medium',
    category: 'link',
    explanation:
      'A link combined with urgency is how credential-stealing pages are delivered. Open your bank through its own app instead — never through a link you were sent.',
    patterns: [
      new RegExp(`\\b(link|website|site)\\b[^.!?]{0,30}?\\b(?:click|open|pathunga|paarunga)\\w*\\s*(?:${DO})?`, 'gi'),
      new RegExp(`\\bclick\\s*${DO}\\b`, 'gi'),
      /\b(link)\s*(ah|a)?\s*(open|click)\b/gi,
    ],
  },
  {
    id: 'ta.urgency',
    title: 'Demands that you act immediately',
    severity: 'medium',
    category: 'urgency',
    explanation:
      'Pressure to act now is the core technique: it is meant to stop you checking with anyone. A genuine institution is willing to wait while you verify.',
    patterns: [
      /\b(udane|udaney|seekiram|sikkiram|immediately|ippove|ippothe)\b/gi,
      /\b(last|kadaisi|final)\s*(chance|warning|notice|vaippu)\b/gi,
      /\b(\d+)\s*(mani|hours?|nimisham|minutes?)\b[^.!?]{0,25}?\b(mattum|only|within|ulla)\b/gi,
    ],
  },
  {
    id: 'ta.impersonation',
    title: 'Claims to be from a bank or the authorities',
    severity: 'high',
    category: 'impersonation',
    explanation:
      'Anyone can claim an identity in a message. The claim itself is not evidence — and real officials do not demand payments or codes over chat.',
    patterns: [
      /\b(bank|vangi)\b[^.!?]{0,25}?\b(?:il|la|lerundhu|irundhu|iruthu)\b[^.!?]{0,25}?\b(pesure|pesuren|pesuraen|call|speaking)\b/gi,
      /\b(police|cyber\s*crime|customs|income\s*tax)\b[^.!?]{0,30}?\b(?:il|la|lerundhu|irundhu)\b/gi,
      /\b(manager|officer|executive)\s*(pesure|pesuren|speaking)\b/gi,
    ],
  },
  {
    id: 'ta.remote_access',
    title: 'Asks you to install an app or share your screen',
    severity: 'critical',
    category: 'channel',
    explanation:
      'Screen-sharing and remote-support apps hand over everything you can see, including balances and one-time codes. No genuine support process needs this.',
    patterns: [
      new RegExp(`\\b(anydesk|teamviewer|quicksupport|screen\\s*shar\\w*)\\b[^.!?]{0,40}?\\b(?:install|download|${DO})`, 'gi'),
      new RegExp(`\\b(app|application)\\b[^.!?]{0,25}?\\b(?:install|download)\\s*${DO}\\b`, 'gi'),
      /\b(screen|mobile)\b[^.!?]{0,25}?\b(share|kaatu|kaattunga)\w*\b/gi,
    ],
  },
];


/**
 * Whether a match is actually Tamil, or just English the pattern also accepts.
 *
 * This matters because several rules deliberately allow the Tamil demand
 * marker to be absent — real messages mix an English verb with a Tamil object
 * constantly. The cost is that pure English matches too: "account will be
 * blocked" hits `ta.account_block`, and "immediately" hits `ta.urgency`.
 *
 * The detection is right in both cases; those ARE warning signs. The label was
 * not. A report that tells someone it found a Tamil pattern in an English
 * message is making a claim about their message that is simply false, and this
 * product's whole argument is that it does not do that.
 *
 * So the rule still fires, and the "(Tamil)" suffix is earned by the evidence.
 */
const TAMIL_SCRIPT = /[\u0B80-\u0BFF]/;

/** Romanised tokens that do not occur in English. */
const TAMIL_ROMAN =
  /\b(?:pannunga|panunga|pannuga|pannidu\w*|pannala|kattunga|kattanum|katta|udane|udaney|seekiram|sikkiram|ippove|ippothe|anupp\w*|anup\w*|panam|kanakku|akkaun[dt]|mudinj\w*|mudiy\w*|aagala|aagalai|aagville|aagidum|aagum|agiduum|aayidum|nirutha|niruthi|pathunga|paarunga|vaippu|kadaisi|nimisham|mani|mattum|indha|indhu|inniku|innaiku|illana|illaina|blaak|ulla)\b/i;

function isTamilEvidence(matches: SignalMatch[]): boolean {
  return matches.some((m) => TAMIL_SCRIPT.test(m.text) || TAMIL_ROMAN.test(m.text));
}

function collect(text: string, patterns: RegExp[]): SignalMatch[] {
  const out: SignalMatch[] = [];
  const seen = new Set<string>();
  for (const pattern of patterns) {
    // Each rule's regexes are module-level and carry /g, so lastIndex must be
    // reset or a second call silently starts mid-string.
    pattern.lastIndex = 0;
    for (const m of text.matchAll(pattern)) {
      const start = m.index ?? 0;
      const matched = m[0].trim();
      if (!matched || seen.has(matched.toLowerCase())) continue;
      seen.add(matched.toLowerCase());
      out.push({ text: matched, start, end: start + matched.length });
      if (out.length >= 4) return out;
    }
  }
  return out;
}

/**
 * Runs the Tanglish rules over any text.
 *
 * Run unconditionally, because real messages mix languages freely — an
 * English bank name with a Tamil demand in the same sentence is the norm, not
 * the exception. An earlier comment here claimed English text does not match
 * these patterns. It does: "account will be blocked" and "immediately" both
 * hit rules labelled Tamil, which put a finding in the report attributing a
 * Tamil pattern to a message with no Tamil in it.
 *
 * Two things follow. The "(Tamil)" suffix is now earned by the evidence rather
 * than fixed in the rule. And where a rule fires on English alone in a
 * category the English engine already reported, it is dropped — it was a
 * second copy of the same finding under a misleading name, and two findings
 * that say one thing read as twice the evidence.
 *
 * @param coveredCategories categories the deterministic English rules already
 *        matched. Pass none to keep every match.
 */
export function detectTanglishSignals(
  text: string,
  coveredCategories: ReadonlySet<SignalCategory> = new Set(),
): Signal[] {
  const out: Signal[] = [];
  for (const rule of RULES) {
    const matches = collect(text, rule.patterns).filter(
      (match) => {
        // Protective advice must never be read as the thing it warns about.
        if (rule.category === 'credentials' && isNegatedCredentialInstruction(text, match.start)) return false;
        if (rule.category === 'secrecy' && isProtectiveSecrecyAdvice(match.text)) return false;
        return true;
      },
    );
    if (matches.length === 0) continue;

    const tamil = isTamilEvidence(matches);
    if (!tamil && coveredCategories.has(rule.category)) continue;

    out.push({
      id: rule.id,
      title: tamil ? `${rule.title} (Tamil)` : rule.title,
      category: rule.category,
      severity: rule.severity,
      explanation: rule.explanation,
      matches,
    });
  }
  return out;
}

/** Rule count, for the completeness figure shown in the report. */
export const TANGLISH_RULE_COUNT = RULES.length;
