import type { ChecklistStep, InputKind, Signal, SignalCategory } from './types';

/**
 * Builds the "verify before you act" checklist.
 *
 * The product's point is that a warning alone does not help someone decide.
 * Each step is a concrete action the user can take through a channel they
 * already control, chosen from the categories that actually fired.
 */

const BY_CATEGORY: Partial<Record<SignalCategory, ChecklistStep[]>> = {
  credentials: [
    {
      id: 'chk.never_share_code',
      action: 'Do not share the code, password or PIN — not even with someone who says they are from your bank.',
      why: 'A one-time code is the last step of a login or payment. Giving it away completes the action for whoever asked.',
    },
    {
      id: 'chk.already_shared',
      action: 'If you already shared a code or card detail, call your bank now using the number printed on your card, and ask them to block the transaction.',
      why: 'Fast reporting is the main factor in whether a payment can still be recalled.',
    },
  ],
  payment: [
    {
      id: 'chk.hold_payment',
      action: 'Do not send money, and do not buy gift cards or cryptocurrency for anyone who contacted you.',
      why: 'These payment types are chosen because they cannot be reversed once sent.',
    },
    {
      id: 'chk.confirm_independently',
      action: 'If you believe you genuinely owe this, log in to the organisation\'s own app or site yourself and look for the charge there.',
      why: 'A real obligation will be visible in your own account. It will not exist only inside the message.',
    },
  ],
  impersonation: [
    {
      id: 'chk.callback_official',
      action: 'Look up the organisation\'s number independently — on your card, your statement, or by typing its address yourself — and call that, not any number in the message.',
      why: 'Contact details inside a suspicious message lead back to the sender. An independent channel breaks that loop.',
    },
  ],
  domain: [
    {
      id: 'chk.type_domain',
      action: 'Do not click the link. Type the organisation\'s address into your browser yourself, or use its app.',
      why: 'This guarantees you reach the real site regardless of how convincing the link looked.',
    },
    {
      id: 'chk.read_registrable',
      action: 'Read the domain from the right: the two parts just before the first single slash are who really controls the page.',
      why: 'Brand names placed in subdomains or paths are the most common way a hostile link is made to look legitimate.',
    },
  ],
  threat: [
    {
      id: 'chk.no_instant_enforcement',
      action: 'Treat any threat of immediate arrest, fine or disconnection as a reason to slow down, not speed up.',
      why: 'Enforcement bodies do not open contact with an unsolicited demand for instant payment or data.',
    },
  ],
  secrecy: [
    {
      id: 'chk.tell_someone',
      action: 'Tell someone you trust right now, and end the call if you are on one.',
      why: 'Secrecy is the mechanism that makes these scams work. No legitimate authority requires you to hide a case from your family or bank.',
    },
  ],
  lure: [
    {
      id: 'chk.never_applied',
      action: 'Ask yourself whether you entered this draw, ordered this parcel, or applied for this refund.',
      why: 'A reward you never sought is bait for the fee or data request that follows.',
    },
  ],
  link: [
    {
      id: 'chk.no_install',
      action: 'Do not install any app or open any attachment this message points to.',
      why: 'Remote-access and banking malware is delivered exactly this way.',
    },
  ],
  channel: [
    {
      id: 'chk.stay_on_platform',
      action: 'Keep the conversation on the original platform rather than moving to WhatsApp or Telegram.',
      why: 'Moving channels removes moderation, records and any dispute protection.',
    },
  ],
  urgency: [
    {
      id: 'chk.pause',
      action: 'Give yourself a deliberate pause before doing anything the message asks.',
      why: 'Time pressure is applied precisely because verification defeats the request.',
    },
  ],
  'claim-language': [
    {
      id: 'chk.find_source',
      action: 'Find the primary source: the journal name, authors and year. If the claim cites "a study" without naming one, treat it as unsupported until you find it.',
      why: 'A claim that cannot be traced to a source cannot be assessed, and that absence is itself informative.',
    },
    {
      id: 'chk.check_factcheck',
      action: 'Search an established fact-checking service and the relevant official health or regulatory body for the same claim.',
      why: 'Widely circulated claims have usually already been examined by someone with access to the primary material.',
    },
  ],
};

const BASELINE: Record<InputKind, ChecklistStep> = {
  message: {
    id: 'chk.baseline_message',
    action: 'Verify through a channel you chose, not one the message gave you.',
    why: 'This single habit defeats most impersonation, because it removes the sender\'s control over where you end up.',
  },
  url: {
    id: 'chk.baseline_url',
    action: 'Never enter a password or payment detail on a page you reached from a link you did not expect.',
    why: 'Credential-harvesting pages are visually indistinguishable from the real thing; the route you took is the reliable signal.',
  },
  claim: {
    id: 'chk.baseline_claim',
    action: 'Check whether the claim is reported by more than one independent, named source.',
    why: 'A single unattributed source repeated many times is still one source.',
  },
};

const CATEGORY_PRIORITY: SignalCategory[] = [
  'secrecy', 'credentials', 'payment', 'domain', 'threat',
  'link', 'impersonation', 'lure', 'channel', 'claim-language', 'urgency',
];

/** Highest-value steps first, capped so the list stays actionable. */
export function buildChecklist(signals: Signal[], kind: InputKind, limit = 6): ChecklistStep[] {
  const present = new Set(signals.map((s) => s.category));
  const steps: ChecklistStep[] = [];
  const seen = new Set<string>();

  for (const category of CATEGORY_PRIORITY) {
    if (!present.has(category)) continue;
    for (const step of BY_CATEGORY[category] ?? []) {
      if (seen.has(step.id)) continue;
      seen.add(step.id);
      steps.push(step);
    }
  }

  const baseline = BASELINE[kind];
  if (!seen.has(baseline.id)) steps.push(baseline);

  return steps.slice(0, limit);
}
