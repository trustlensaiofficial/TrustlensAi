import type { Signal, SignalCategory, SignalMatch, SignalSeverity } from './types';

/**
 * Deterministic warning-sign rules.
 *
 * These run with no network and no model, so they are reproducible and
 * testable. Each rule reports the exact text span that triggered it, which is
 * what makes a finding explainable rather than an opaque verdict.
 *
 * Patterns are intentionally conservative: a rule that fires on ordinary
 * business language would train users to ignore the product.
 */
interface Rule {
  id: string;
  title: string;
  category: SignalCategory;
  severity: SignalSeverity;
  explanation: string;
  patterns: RegExp[];
  /** Rules that only make sense for a factual claim rather than a message. */
  claimOnly?: boolean;
}

const RULES: Rule[] = [
  {
    id: 'urgency.deadline',
    title: 'Artificial time pressure',
    category: 'urgency',
    severity: 'medium',
    explanation:
      'A short deadline discourages you from pausing to verify. Legitimate organisations let you confirm a request through a channel you already trust.',
    patterns: [
      /\b(act|respond|reply|confirm|verify|pay)\s+(now|immediately|at once|within\s+\d+\s*(minutes?|hours?|days?))\b/gi,
      /\b(within|in)\s+(the\s+next\s+)?\d+\s*(minutes?|hours?)\b/gi,
      /\b(expires?|expiring|ends)\s+(today|tonight|in\s+\d+\s*\w+)\b/gi,
      /\b(immediate|urgent|time[-\s]?sensitive)\s+(action|attention|response|payment)\s+(is\s+)?(required|needed)\b/gi,
      /\b(last|final)\s+(warning|notice|reminder|chance)\b/gi,
    ],
  },
  {
    id: 'threat.consequence',
    title: 'Threatened penalty or loss of access',
    category: 'threat',
    severity: 'high',
    explanation:
      'Threats of suspension, fines or arrest are used to create panic. Real enforcement does not arrive first as an unsolicited message demanding instant action.',
    patterns: [
      /\b(account|card|service|subscription|number|sim)\s+(will\s+be|has\s+been|is\s+being)\s+(suspended|blocked|closed|terminated|deactivated|frozen|locked)\b/gi,
      /\b(legal|police|court|criminal)\s+(action|case|proceedings|notice|complaint)\b/gi,
      /\b(arrest|warrant|custody|fir|summons|non[-\s]?bailable)\b/gi,
      /\b(fine|penalty)\s+of\s+[^\s]{0,12}\d/gi,
      /\b(you\s+will\s+(be\s+)?(arrested|prosecuted|charged|fined))\b/gi,
    ],
  },
  {
    id: 'secrecy.isolation',
    title: 'Pressure to keep the request secret',
    category: 'secrecy',
    severity: 'critical',
    explanation:
      'Isolating you from people who would notice the fraud is a hallmark of coercive scams, including "digital arrest" schemes. No legitimate authority forbids you from consulting family or your bank.',
    patterns: [
      /\b(do\s+not|don'?t|never)\s+(tell|inform|discuss|share\s+this\s+with|disclose\s+to)\s+(anyone|anybody|your\s+(family|wife|husband|parents|friends|colleagues))\b/gi,
      /\b(keep|treat)\s+(this|it)\s+(strictly\s+)?(confidential|secret|between\s+us)\b/gi,
      /\b(stay|remain)\s+on\s+(the\s+)?(call|line)\b/gi,
      /\bdigital\s+arrest\b/gi,
      /\b(do\s+not|don'?t)\s+(hang\s+up|end\s+the\s+call|disconnect)\b/gi,
    ],
  },
  {
    id: 'payment.irreversible',
    title: 'Request for hard-to-reverse payment',
    category: 'payment',
    severity: 'critical',
    explanation:
      'Gift cards, cryptocurrency and wire transfers are chosen because they are difficult or impossible to recover. A genuine refund or fee never requires these.',
    patterns: [
      /\b(gift\s+cards?|google\s+play\s+card|itunes\s+card|steam\s+card|amazon\s+card)\b/gi,
      /\b(bitcoin|btc|ethereum|usdt|tether|crypto(currency)?\s+wallet)\b/gi,
      /\b(wire\s+transfer|western\s+union|moneygram)\b/gi,
      /\b(send|transfer|deposit|pay)\s+(the\s+)?(money|amount|funds|fee)\s+to\s+(this|the\s+following)\b/gi,
      /\b(upi|paytm|phonepe|gpay|zelle|cash\s*app|venmo)\s+(id|number|to)\b/gi,
    ],
  },
  {
    id: 'payment.upfront_fee',
    title: 'Upfront fee to receive something',
    category: 'payment',
    severity: 'high',
    explanation:
      'Being asked to pay before receiving a prize, refund, loan or job is a classic advance-fee pattern. Money you are genuinely owed is never gated behind a payment.',
    patterns: [
      /\b(processing|clearance|registration|security|handling|customs|release)\s+(fee|charge|deposit)\b/gi,
      /\b(pay|deposit)\s+[^\s]{0,12}\d[\d,.]*\s+(to\s+)?(claim|receive|release|unlock|process)\b/gi,
      /\b(refundable\s+deposit)\b/gi,
    ],
  },
  {
    id: 'credentials.request',
    title: 'Request for credentials or one-time codes',
    category: 'credentials',
    severity: 'critical',
    explanation:
      'No legitimate bank, platform or official will ask for your password, OTP, PIN or CVV. Anyone requesting a one-time code is almost certainly trying to complete a login or payment as you.',
    patterns: [
      /\b(otp|one[-\s]?time\s+(password|code|pin)|verification\s+code|security\s+code|auth(entication)?\s+code)\b/gi,
      /\b(share|send|provide|enter|confirm|tell\s+(me|us))\s+(your\s+)?(password|passcode|pin|cvv|otp)\b/gi,
      /\b(card\s+number|cvv|expiry\s+date)\b/gi,
      /\b(net\s*banking|internet\s+banking)\s+(login|credentials|password|user\s*id)\b/gi,
      /\b(aadhaar|pan\s+card|social\s+security\s+number|ssn)\s+(number|details)?\b/gi,
    ],
  },
  {
    id: 'credentials.verify_pretext',
    title: 'Verification pretext for collecting data',
    category: 'credentials',
    severity: 'medium',
    explanation:
      '"Verify your account" framing is used to make data collection feel procedural. Verification should always be something you initiate from the organisation\'s own app or site.',
    patterns: [
      /\b(verify|confirm|update|re[-\s]?activate|revalidate)\s+(your\s+)?(account|identity|details|information|kyc|profile)\b/gi,
      /\b(click|tap|follow)\s+(the\s+|this\s+)?link\s+(to|and)\s+(verify|confirm|update|unlock|restore)\b/gi,
    ],
  },
  {
    id: 'impersonation.authority',
    title: 'Claimed authority or well-known brand',
    category: 'impersonation',
    severity: 'medium',
    explanation:
      'Naming a bank, platform or government body borrows trust the sender has not earned. The name in a message is not proof of who sent it.',
    patterns: [
      /\b(microsoft|apple|google|amazon|paypal|netflix|meta|facebook|instagram|whatsapp)\s+(support|security|team|account|billing|service)\b/gi,
      /\b(income\s+tax|customs|cbi|ed\s+department|enforcement\s+directorate|trai|police\s+department|cyber\s+cell)\b/gi,
      /\b(irs|hmrc|social\s+security\s+administration|medicare)\b/gi,
      /\b(fedex|dhl|ups|royal\s+mail|india\s+post|courier)\s+(delivery|parcel|package|shipment|customs)\b/gi,
      /\b(bank\s+(of|security)\s+\w+|your\s+bank'?s?\s+(security|fraud)\s+(team|department))\b/gi,
    ],
  },
  {
    id: 'lure.reward',
    title: 'Unexpected reward or windfall',
    category: 'lure',
    severity: 'high',
    explanation:
      'Prizes, refunds and inheritances you never applied for are bait. The reward exists to make the later fee or data request feel worthwhile.',
    patterns: [
      /\b(you\s+(have\s+)?(won|been\s+selected|are\s+eligible)|congratulations)\b/gi,
      /\b(lottery|jackpot|lucky\s+draw|prize\s+money|unclaimed\s+(funds|amount|refund)|inheritance)\b/gi,
      /\b(guaranteed|assured)\s+(returns?|profit|income)\b/gi,
      /\b(double|triple)\s+your\s+(money|investment)\b/gi,
      /\b(work\s+from\s+home|part[-\s]?time\s+job)\s+.{0,40}\b(daily|per\s+day|weekly)\s+(income|payment|earning)/gi,
    ],
  },
  {
    id: 'channel.offplatform',
    title: 'Push to move to a private channel',
    category: 'channel',
    severity: 'medium',
    explanation:
      'Moving the conversation to a personal messaging app removes platform protections, moderation and any record a dispute could rely on.',
    patterns: [
      /\b(contact|message|text|reach|add)\s+(me|us)\s+on\s+(whatsapp|telegram|signal|wechat)\b/gi,
      /\b(whatsapp|telegram)\s+(me|us|this\s+number)\b/gi,
      /\b(continue|discuss)\s+(this\s+)?(on|over)\s+(whatsapp|telegram|signal)\b/gi,
    ],
  },
  {
    id: 'link.generic_greeting',
    title: 'Generic greeting with an action link',
    category: 'link',
    severity: 'low',
    explanation:
      'An organisation that holds your account normally knows your name. A generic greeting suggests a template sent to many recipients.',
    patterns: [/\b(dear\s+(customer|user|client|sir\/madam|account\s+holder))\b/gi],
  },
  {
    id: 'link.attachment_risk',
    title: 'Executable or app-install attachment',
    category: 'link',
    severity: 'critical',
    explanation:
      'Installing an app or running an attachment from an unsolicited message is how remote-access and banking malware is delivered.',
    patterns: [
      /\b[\w-]+\.(apk|exe|scr|msi|bat|cmd|vbs|jar)\b/gi,
      /\b(install|download)\s+(this\s+|the\s+)?(app|apk|application|software|tool)\s+(to|and)\b/gi,
      /\b(anydesk|teamviewer|quick\s*support|remote\s+desktop)\b/gi,
    ],
  },
  {
    id: 'claim.absolute_language',
    title: 'Absolute certainty in a factual claim',
    category: 'claim-language',
    severity: 'medium',
    explanation:
      'Words like "proves", "cures" or "100%" overstate what research can show. Strong evidence is usually reported with stated limits and effect sizes.',
    claimOnly: true,
    patterns: [
      /\b(proves?|proven|definitively\s+shows?)\b/gi,
      /\b(100\s*%|completely|totally|entirely)\s+(safe|effective|cures?|prevents?|eliminates?)\b/gi,
      /\b(miracle|magic|secret)\s+(cure|remedy|treatment|method)\b/gi,
      /\b(cures?|eliminates?|reverses?)\s+(all|any|every)\b/gi,
    ],
  },
  {
    id: 'claim.suppression_narrative',
    title: 'Suppression narrative',
    category: 'claim-language',
    severity: 'medium',
    explanation:
      'Claiming that experts are hiding a finding pre-emptively explains away the absence of supporting evidence, which makes the claim unfalsifiable.',
    claimOnly: true,
    patterns: [
      /\b(doctors?|scientists?|experts?|government|they)\s+(don'?t|do\s+not|wont|won'?t)\s+want\s+you\s+to\s+know\b/gi,
      /\b(mainstream\s+media|big\s+pharma)\s+(is\s+)?(hiding|suppressing|covering\s+up)\b/gi,
      /\b(banned|censored|silenced)\s+(study|research|doctor|video)\b/gi,
    ],
  },
  {
    id: 'claim.unsourced_study',
    title: 'Study referenced without identifying it',
    category: 'claim-language',
    severity: 'low',
    explanation:
      'A claim that cites "a new study" without naming the journal, authors or year cannot be checked, which is itself useful information.',
    claimOnly: true,
    patterns: [
      /\b(a\s+)?(new\s+|recent\s+|latest\s+)?stud(y|ies)\s+(shows?|says?|proves?|found|reveals?)\b/gi,
      /\b(scientists?|researchers?)\s+(have\s+)?(found|discovered|confirmed)\b/gi,
    ],
  },
];

/** De-duplicates overlapping matches from sibling patterns in one rule. */
function collectMatches(text: string, patterns: RegExp[]): SignalMatch[] {
  const found: SignalMatch[] = [];
  for (const pattern of patterns) {
    // Clone so the shared module-level regex keeps no lastIndex state.
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      const start = m.index;
      const end = m.index + m[0].length;
      const overlaps = found.some((f) => start < f.end && end > f.start);
      if (!overlaps) found.push({ text: m[0], start, end });
      if (found.length >= 12) return found;
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

/**
 * Runs every applicable rule against the input.
 * `kind` gates claim-specific language rules so a phishing SMS is not marked
 * down for rhetoric rules meant for factual assertions.
 */
export function detectSignals(text: string, kind: 'message' | 'url' | 'claim'): Signal[] {
  const signals: Signal[] = [];
  for (const rule of RULES) {
    if (rule.claimOnly && kind !== 'claim') continue;
    const matches = collectMatches(text, rule.patterns);
    if (matches.length === 0) continue;
    signals.push({
      id: rule.id,
      title: rule.title,
      category: rule.category,
      severity: rule.severity,
      explanation: rule.explanation,
      matches,
    });
  }
  return signals;
}

/** Exposed for tests and for the "rules applied" count shown in the report. */
export function ruleCount(kind: 'message' | 'url' | 'claim'): number {
  return RULES.filter((r) => !r.claimOnly || kind === 'claim').length;
}
