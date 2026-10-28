import type { InputContext, Signal, SignalCategory, SignalMatch, SignalSeverity } from './types';

/**
 * Context-specific warning-sign rules.
 *
 * The generic rules in `detectors.ts` apply to any text. These apply only when
 * the user tells us what they are looking at, which lets them be far more
 * specific without raising false positives elsewhere: "our bank details have
 * changed" is unremarkable in a general message and a serious signal on an
 * invoice.
 */

interface ContextRule {
  id: string;
  title: string;
  category: SignalCategory;
  severity: SignalSeverity;
  explanation: string;
  patterns: RegExp[];
}

const JOB_OFFER_RULES: ContextRule[] = [
  {
    id: 'job.no_interview',
    title: 'Offer made without any interview',
    category: 'lure',
    severity: 'high',
    explanation:
      'Legitimate employers assess candidates before hiring. An offer that arrives with no interview, or after only a chat-app conversation, is the most common opening of a recruitment scam.',
    patterns: [
      /\b(no|without)\s+(an?\s+)?(interview|screening|cv|resume)\s+(is\s+)?(required|needed|necessary)\b/gi,
      /\b(selected|shortlisted|hired|approved)\s+(for\s+this\s+(role|position)\s+)?(directly|automatically|without\s+interview)\b/gi,
      /\b(direct|instant|immediate)\s+(joining|hiring|selection|appointment)\b/gi,
    ],
  },
  {
    id: 'job.upfront_cost',
    title: 'Candidate asked to pay before starting',
    category: 'payment',
    severity: 'critical',
    explanation:
      'A real employer pays you. Charges for training, registration, equipment, a laptop, a security deposit or visa processing are the mechanism of the scam, not a condition of the job.',
    patterns: [
      /\b(registration|training|onboarding|processing|security|refundable|administrative)\s+(fee|charge|deposit|amount)\b/gi,
      /\b(pay|deposit|transfer|send)\b[^.!?]{0,40}?\b(to\s+(secure|confirm|reserve|block)\s+(your\s+)?(seat|position|role|offer))/gi,
      /\b(purchase|buy|pay\s+for)\s+(the\s+)?(laptop|equipment|software|kit|starter\s+pack)\b[^.!?]{0,40}?\b(reimburse|refund)/gi,
    ],
  },
  {
    id: 'job.personal_email_recruiter',
    title: 'Recruiter writing from a free email account',
    category: 'impersonation',
    severity: 'high',
    explanation:
      'A company recruiting for itself writes from its own domain. A free consumer mailbox means nothing connects the sender to the company they name.',
    patterns: [
      /\b[\w.+-]+@(gmail|yahoo|outlook|hotmail|protonmail|rediffmail|aol|mail|yandex|zoho)\.(com|co\.[a-z]{2}|in|ru)\b/gi,
    ],
  },
  {
    id: 'job.chat_app_only',
    title: 'Hiring conducted entirely on a chat app',
    category: 'channel',
    severity: 'high',
    explanation:
      'Recruitment handled only through WhatsApp or Telegram avoids every record a real HR process creates, and makes the "employer" untraceable once money moves.',
    patterns: [
      /\b(interview|onboarding|hiring|joining|hr\s+round)\b[^.!?]{0,40}?\b(whatsapp|telegram|signal)\b/gi,
      /\b(whatsapp|telegram)\b[^.!?]{0,30}?\b(hr|recruiter|hiring\s+manager|team)\b/gi,
    ],
  },
  {
    id: 'job.unrealistic_pay',
    title: 'Pay out of proportion to the work described',
    category: 'lure',
    severity: 'medium',
    explanation:
      'Large guaranteed daily or weekly earnings for simple, unskilled tasks is the standard framing of task-based and money-mule recruitment.',
    patterns: [
      /\b(earn|income|salary|payout)\b[^.!?]{0,30}?\b(daily|per\s+day|weekly|per\s+task|per\s+review)\b/gi,
      /\b(simple|easy|basic)\s+(task|work|job)\b[^.!?]{0,40}?\b(high|great|excellent)\s+(pay|income|salary)/gi,
      /\b(part[-\s]?time|work\s+from\s+home)\b[^.!?]{0,50}?\b(guaranteed|assured)\s+(income|earning|payment)/gi,
    ],
  },
  {
    id: 'job.premature_bank_details',
    title: 'Bank or identity details requested before any contract',
    category: 'credentials',
    severity: 'critical',
    explanation:
      'Payroll details are collected after a signed offer, through an HR system. Asking for them up front is either identity theft or preparation to move money through your account.',
    patterns: [
      /\b(share|send|provide|submit)\b[^.!?]{0,40}?\b(bank\s+(account|details)|account\s+number|ifsc|iban|routing\s+number|passport|aadhaar|pan\s+card|ssn)\b/gi,
      /\b(bank\s+details|account\s+details)\b[^.!?]{0,40}?\b(to\s+(process|release|credit)\s+(your\s+)?(salary|payment|stipend))/gi,
    ],
  },
];

const INVOICE_RULES: ContextRule[] = [
  {
    id: 'invoice.changed_bank_details',
    title: 'Payment details changed on this invoice',
    category: 'payment',
    severity: 'critical',
    explanation:
      'A late change of bank details is the single most common invoice-redirection fraud. Whether or not the message is genuine, these details must be confirmed by calling a number you already held for this supplier — never one from the invoice.',
    patterns: [
      /\b(bank|account|payment|remittance|banking)\s+(details|information|instructions)\b[^.!?]{0,40}?\b(have\s+)?(changed|been\s+updated|are\s+new|updated)\b/gi,
      /\b(new|updated|revised|different|alternate)\s+(bank|account|beneficiary|remittance)\s+(details|account|number|information)\b/gi,
      /\b(please\s+)?(note|be\s+advised)\b[^.!?]{0,30}?\b(our\s+)?(new|changed)\s+(bank|account)\b/gi,
      /\b(do\s+not|don'?t)\s+(use|pay\s+to)\s+(the\s+)?(old|previous)\s+account\b/gi,
    ],
  },
  {
    id: 'invoice.payment_urgency',
    title: 'Pressure to pay immediately',
    category: 'urgency',
    severity: 'high',
    explanation:
      'Urgency is applied to stop you confirming the account change through a channel the sender does not control. A genuine supplier will wait for you to verify.',
    patterns: [
      /\b(immediate|urgent|same[-\s]day|today)\b[^.!?]{0,30}?\b(payment|settlement|transfer|remittance)\b/gi,
      /\b(overdue|past\s+due|final\s+notice|service\s+will\s+be\s+suspended)\b/gi,
      /\b(process|release|make)\s+(this\s+)?payment\s+(today|immediately|urgently|before)\b/gi,
    ],
  },
  {
    id: 'invoice.verification_discouraged',
    title: 'Verification by phone discouraged',
    category: 'secrecy',
    severity: 'critical',
    explanation:
      'Any reason offered for why you should not phone to confirm a payment change is itself the warning sign. Confirming by voice on a number you already hold is the one control this fraud cannot survive.',
    patterns: [
      /\b(no\s+need|not\s+necessary|do\s+not\s+need)\s+to\s+(call|phone|confirm|verify)\b/gi,
      /\b(accounts?|finance)\s+(team|department)\s+is\s+(unavailable|away|not\s+reachable)\b/gi,
      /\b(reply|confirm)\s+(by\s+)?email\s+(only|instead)\b/gi,
    ],
  },
];

const PROPOSAL_RULES: ContextRule[] = [
  {
    id: 'proposal.guaranteed_return',
    title: 'Guaranteed or fixed return promised',
    category: 'lure',
    severity: 'critical',
    explanation:
      'No lawful investment guarantees a return. A fixed percentage promised regardless of performance is either a misrepresentation or a Ponzi structure.',
    patterns: [
      // Allows a figure between the adjective and the noun, as in
      // "guaranteed 18% return" — the most common real phrasing.
      /\b(guaranteed|assured|fixed|risk[-\s]free)\b[^.!?]{0,24}?\b(returns?|roi|profit|income|yield)\b/gi,
      /\b\d{1,3}(?:\.\d+)?\s*%\b[^.!?]{0,24}?\b(per\s+(month|week|annum|year)|monthly|weekly|annually)\b/gi,
      /\b(no|zero)\s+risk\b[^.!?]{0,30}?\b(invest\w*|return|profit|capital|principal)\b/gi,
      /\b(capital|principal)\s+(is\s+)?(fully\s+)?(protected|guaranteed|secure)\b/gi,
    ],
  },
  {
    id: 'proposal.pressure_to_sign',
    title: 'Pressure to commit before due diligence',
    category: 'urgency',
    severity: 'high',
    explanation:
      'A limited window to sign, or a demand to sign before you can check registration and references, exists to prevent the checks that would end the discussion.',
    patterns: [
      // "sign\w*" so "signed agreement" counts, and a window may close
      // without the verb appearing in the same clause.
      /\b(sign\w*|commit\w*|confirm\w*|decide|deadline)\b[^.!?]{0,45}?\b(by\s+(today|tomorrow|end\s+of\s+day|close\s+of\s+business)|within\s+\d+\s*(hours?|days?))\b/gi,
      /\b(window|offer|round|allocation)\s+(closes|ends|expires)\b[^.!?]{0,30}?\b(today|tomorrow|end\s+of\s+day)\b/gi,
      // Allows a qualifier between the count and the noun: "only 4 allocation slots".
      /\bonly\s+\d+\s+[\w\s]{0,20}?(slots?|spots?|places?|allocations?|units?)\s+(remain|left|available)/gi,
      /\b(limited|exclusive|closing\s+soon|last\s+chance)\b[^.!?]{0,30}?\b(slots?|spots?|places?|allocation|opportunity|round)\b/gi,
      // Either word order: sign-before-disclosure, or disclosure-after-signing.
      /\b(sign\w*|nda|agreement)\b[^.!?]{0,45}?\bbefore\s+(we\s+)?(share|disclose|provide|release)\b/gi,
      /\bbefore\s+(we\s+)?(share|disclose|provide|release)\b[^.!?]{0,45}?\b(sign\w*|nda|agreement)\b/gi,
    ],
  },
  {
    id: 'proposal.unverifiable_credentials',
    title: 'Credentials stated but not evidenced',
    category: 'claim-language',
    severity: 'medium',
    explanation:
      'Awards, partnerships, certifications and client names are checkable facts. Stating them without a registration number, a verifiable link or a named reference makes them assertions, not evidence.',
    patterns: [
      /\b(award[-\s]winning|industry[-\s]leading|globally\s+recognised|recognized|certified|accredited)\b/gi,
      /\b(partnered|partnership)\s+with\b[^.!?]{0,40}?\b(fortune|leading|major|top)\b/gi,
      /\b(trusted\s+by|clients?\s+include)\b/gi,
    ],
  },
  {
    id: 'proposal.upfront_fee',
    title: 'Upfront payment required to proceed',
    category: 'payment',
    severity: 'high',
    explanation:
      'A fee to receive a contract, release funds or secure an allocation is an advance-fee pattern. Real commercial terms do not require you to pay before anything is delivered.',
    patterns: [
      /\b(upfront|advance|initial)\s+(payment|fee|deposit|investment)\s+(of|is)\b/gi,
      /\b(pay|transfer|remit)\b[^.!?]{0,40}?\b(to\s+(secure|release|activate|allocate)\s+(the\s+)?(contract|funds|allocation|agreement))/gi,
    ],
  },
];

const BY_CONTEXT: Record<InputContext, ContextRule[]> = {
  generic: [],
  website: [],
  job_offer: JOB_OFFER_RULES,
  invoice: INVOICE_RULES,
  proposal: PROPOSAL_RULES,
};

function collect(text: string, patterns: RegExp[]): SignalMatch[] {
  const found: SignalMatch[] = [];
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      const start = m.index;
      const end = start + m[0].length;
      if (!found.some((f) => start < f.end && end > f.start)) found.push({ text: m[0], start, end });
      if (found.length >= 10) return found;
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

/** Rules that apply only to the context the user selected. */
export function detectContextSignals(text: string, context: InputContext): Signal[] {
  const out: Signal[] = [];
  for (const rule of BY_CONTEXT[context] ?? []) {
    const matches = collect(text, rule.patterns);
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

export function contextRuleCount(context: InputContext): number {
  return (BY_CONTEXT[context] ?? []).length;
}

export const CONTEXT_LABEL: Record<InputContext, string> = {
  generic: 'Message or text',
  website: 'Website or link',
  job_offer: 'Job offer',
  invoice: 'Invoice or payment request',
  proposal: 'Business proposal',
};
