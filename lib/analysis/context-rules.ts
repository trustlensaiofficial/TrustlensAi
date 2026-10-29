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

const BANK_SCAM_RULES: ContextRule[] = [
  {
    id: 'bank.secret_request',
    title: 'Request for an OTP, PIN or password',
    category: 'credentials',
    severity: 'critical',
    explanation:
      'No bank, and no genuine bank employee, ever asks for your OTP, UPI PIN, ATM PIN, CVV or net-banking password. Anyone asking is trying to complete a payment or login as you. Never type or read these out — not even to someone who already knows your name and account details.',
    patterns: [
      /\b(otp|one[-\s]?time\s+(password|pin|code))\b[^.!?]{0,40}?\b(share|send|tell|give|provide|read|confirm|enter|forward)\b/gi,
      /\b(share|send|tell|give|provide|read\s+out|forward|confirm)\b[^.!?]{0,30}?\b(otp|upi\s*pin|atm\s*pin|mpin|cvv|net\s*banking\s+password|card\s+pin)\b/gi,
      /\b(upi\s*pin|mpin|atm\s*pin|card\s*pin|cvv)\b/gi,
      /\b(enter|type)\s+(your\s+)?(pin|otp|password)\b/gi,
    ],
  },
  {
    id: 'bank.account_block_threat',
    title: 'Threat that the account will be blocked',
    category: 'threat',
    severity: 'high',
    explanation:
      'A deadline attached to your account being frozen is there to stop you checking. Banks do not close accounts over an unanswered SMS, and any genuine KYC requirement can be completed inside the bank\u2019s own app on your own schedule.',
    patterns: [
      /\b(account|card|net\s*banking|upi)\b[^.!?]{0,40}?\b(will\s+be|has\s+been|is\s+being)\s+(blocked|suspended|frozen|deactivated|closed|locked)\b/gi,
      /\b(kyc)\b[^.!?]{0,40}?\b(expired|pending|incomplete|update|suspend)/gi,
      /\b(update|complete|verify)\s+(your\s+)?kyc\b/gi,
      /\b(dear\s+customer)\b[^.!?]{0,60}?\b(blocked|suspended|kyc)\b/gi,
    ],
  },
  {
    id: 'bank.safe_account_transfer',
    title: 'Instruction to move money to a “safe account”',
    category: 'payment',
    severity: 'critical',
    explanation:
      'There is no such thing as a safe account. A bank protects your money by freezing fraudulent activity, never by asking you to transfer it somewhere else. This instruction exists only to move funds beyond recovery.',
    patterns: [
      /\b(safe|secure|protected|new)\s+account\b[^.!?]{0,50}?\b(transfer|move|send|shift|deposit)\b/gi,
      /\b(transfer|move|send|shift)\b[^.!?]{0,40}?\b(to\s+(a|the|this)\s+(safe|secure|protected|new)\s+account)\b/gi,
      /\byour\s+(money|funds|balance)\s+(is|are)\s+(not\s+safe|at\s+risk)\b/gi,
    ],
  },
  {
    id: 'bank.remote_access',
    title: 'Asked to install a screen-sharing or remote-access app',
    category: 'link',
    severity: 'critical',
    explanation:
      'AnyDesk, TeamViewer, QuickSupport and similar tools hand full control of your phone to the caller, including everything on screen and every code that arrives. A bank will never ask you to install one.',
    patterns: [
      /\b(anydesk|teamviewer|quick\s*support|rustdesk|airdroid|screen\s*share|remote\s+(access|desktop))\b/gi,
      /\b(install|download)\b[^.!?]{0,40}?\b(apk|app)\b[^.!?]{0,40}?\b(assist|support|verify|kyc)\b/gi,
      /\b(download|install)\s+(this\s+|the\s+)?apk\b/gi,
    ],
  },
  {
    id: 'bank.upi_collect',
    title: 'UPI collect or “approve to receive” request',
    category: 'payment',
    severity: 'critical',
    explanation:
      'Approving a UPI request and entering your PIN always sends money out — it never receives it. A refund, cashback or prize that requires your PIN is a payment you are making, not one you are receiving.',
    patterns: [
      /\b(approve|accept|authorise|authorize)\b[^.!?]{0,40}?\b(request|collect)\b[^.!?]{0,40}?\b(receive|refund|cashback|credit)\b/gi,
      /\b(enter\s+(your\s+)?(upi\s*)?pin)\b[^.!?]{0,40}?\b(receive|refund|credit|cashback)\b/gi,
      /\b(collect\s+request|payment\s+request)\b[^.!?]{0,40}?\b(approve|accept)\b/gi,
    ],
  },
  {
    id: 'bank.fake_support_number',
    title: 'Customer-care number supplied inside the message',
    category: 'impersonation',
    severity: 'high',
    explanation:
      'A helpline printed in a suspicious message leads back to the sender. The only number worth calling is the one on the back of your card, on your statement, or inside the bank\u2019s official app.',
    patterns: [
      /\b(customer\s*(care|service|support)|helpline|toll[-\s]?free)\b[^.!?]{0,40}?\b(\+?\d[\d\s-]{7,})/gi,
      /\b(call|contact|dial|whatsapp)\b[^.!?]{0,30}?\b(\+?\d[\d\s-]{9,})/gi,
    ],
  },
];

const BY_CONTEXT: Record<InputContext, ContextRule[]> = {
  generic: [],
  website: [],
  bank_scam: BANK_SCAM_RULES,
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
  bank_scam: 'Bank scam',
  website: 'Website or link',
  job_offer: 'Job offer',
  invoice: 'Invoice or payment request',
  proposal: 'Business proposal',
};
