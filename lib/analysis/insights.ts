import type {
  Completeness,
  EvidenceRecord,
  InputContext,
  ModelStatus,
  PositiveIndicator,
  QuestionToAsk,
  Signal,
  SignalCategory,
} from './types';

/**
 * Derived report sections: observations that did not raise concern, questions
 * the user can put to the sender, and how complete the investigation was.
 *
 * Everything here is computed from signals and evidence that actually exist.
 * Nothing is invented, and nothing is phrased as reassurance — the absence of
 * a warning sign is weak evidence and is labelled as such throughout.
 */

const ABSENT: Array<{ id: string; category: SignalCategory; title: string; detail: string }> = [
  {
    id: 'pos.no_credential_request',
    category: 'credentials',
    title: 'No password, PIN or one-time code was requested',
    detail:
      'None of the credential-request patterns matched. This is the single most reliable indicator of an account-takeover attempt, so its absence is meaningful — though a request could still come later in the conversation.',
  },
  {
    id: 'pos.no_payment_demand',
    category: 'payment',
    title: 'No hard-to-reverse payment was demanded',
    detail:
      'No gift-card, cryptocurrency, wire-transfer or upfront-fee pattern matched. Those rails are chosen precisely because money cannot be recovered, so not seeing them here removes the most costly failure mode.',
  },
  {
    id: 'pos.no_secrecy',
    category: 'secrecy',
    title: 'You were not asked to keep this secret',
    detail:
      'No isolation or confidentiality demand matched. Pressure to hide a request from family, colleagues or your bank is characteristic of coercive fraud, and it is absent here.',
  },
  {
    id: 'pos.no_urgency',
    category: 'urgency',
    title: 'No artificial deadline was applied',
    detail:
      'No time-pressure pattern matched. Manufactured urgency exists to stop you verifying, so its absence means you have time to carry out the checks below.',
  },
  {
    id: 'pos.no_threat',
    category: 'threat',
    title: 'No penalty or legal threat was made',
    detail:
      'No threat of arrest, suspension, fine or disconnection matched. Such threats are used to induce panic rather than to communicate a real consequence.',
  },
];

/**
 * Observations that did not raise concern.
 *
 * Deliberately conservative: we only report the absence of categories that are
 * genuinely diagnostic, and only when the input was substantial enough for the
 * absence to mean anything.
 */
export function buildPositives(
  signals: Signal[],
  evidence: EvidenceRecord[],
  text: string,
): PositiveIndicator[] {
  const out: PositiveIndicator[] = [];
  // On a very short input, "nothing matched" says more about the input length
  // than about the content, so we stay quiet.
  if (text.trim().length < 40) return out;

  const present = new Set(signals.map((s) => s.category));
  for (const candidate of ABSENT) {
    if (!present.has(candidate.category)) {
      out.push({ id: candidate.id, title: candidate.title, detail: candidate.detail });
    }
  }

  // Retrieved facts that genuinely count in the subject's favour.
  const http = evidence.find((e) => e.id === 'ev.http' && e.status === 'observed');
  if (http && /HTTP 2\d\d/.test(http.detail)) {
    out.push({
      id: 'pos.host_responded',
      title: 'The address resolves and the host responded',
      detail:
        'The domain exists and returned a normal response when we checked it. This confirms the address is real; it says nothing about whether its content is trustworthy.',
    });
  }
  const noRedirect = !evidence.some((e) => e.id === 'ev.redirect');
  if (http && noRedirect) {
    out.push({
      id: 'pos.no_redirect',
      title: 'The link did not redirect elsewhere',
      detail:
        'The address served content directly rather than bouncing through other domains. Redirect chains are often used to disguise a final destination.',
    });
  }

  return out.slice(0, 6);
}

const CONTEXT_QUESTIONS: Record<InputContext, QuestionToAsk[]> = {
  bank_scam: [
    {
      id: 'q.bank.callback',
      question: 'Can I hang up and call you back on the number printed on the back of my card?',
      why: 'A real bank will say yes without hesitation. This single question ends almost every bank impersonation call, which is why the caller will resist it.',
    },
    {
      id: 'q.bank.why_code',
      question: 'Why do you need a code that your own system just sent to me?',
      why: 'There is no legitimate answer. A one-time code authorises a payment or login for whoever holds it — the bank never needs it read back.',
    },
    {
      id: 'q.bank.in_app',
      question: 'Can I see this request inside the bank’s own app instead?',
      why: 'A genuine block, KYC requirement or transaction appears in the app you already have. If it exists only in the message, the message is the problem.',
    },
    {
      id: 'q.bank.safe_account',
      question: 'Which regulation requires me to move my own money to another account?',
      why: 'None does. Banks freeze suspect activity in place; they never ask a customer to transfer funds elsewhere for safety.',
    },
  ],
  job_offer: [
    {
      id: 'q.job.entity',
      question: 'Which registered legal entity is making this offer, and what is its company registration number?',
      why: 'A real employer answers immediately, and the number can be checked against the public company register yourself.',
    },
    {
      id: 'q.job.process',
      question: 'Who will interview me, what is their role, and can we speak on a company phone number or video call?',
      why: 'Recruitment fraud collapses when it has to produce a named person on a verifiable company channel.',
    },
    {
      id: 'q.job.cost',
      question: 'Will I be asked to pay for anything at any stage — training, equipment, registration or visa processing?',
      why: 'Getting a "no" in writing makes any later request a contradiction you can point to.',
    },
    {
      id: 'q.job.offer_letter',
      question: 'Can you send a formal offer letter on company letterhead from a company email address before I share any personal details?',
      why: 'It moves the exchange onto a channel tied to the organisation and creates a document with legal weight.',
    },
  ],
  invoice: [
    {
      id: 'q.inv.confirm_voice',
      question: 'Can I call you on the number I already have on file to confirm these bank details?',
      why: 'This is the decisive check. Confirming an account change by voice on a previously known number defeats invoice redirection, which is why the fraudster will resist it.',
    },
    {
      id: 'q.inv.why_changed',
      question: 'Why have the payment details changed, and when did the change take effect for other customers?',
      why: 'A genuine change has an ordinary business explanation and a date that others can corroborate.',
    },
    {
      id: 'q.inv.match_name',
      question: 'Does the account name exactly match your registered company name?',
      why: 'A beneficiary name that differs from the trading entity is a common and checkable tell.',
    },
    {
      id: 'q.inv.original_po',
      question: 'Which purchase order or contract does this invoice correspond to?',
      why: 'It ties the request to something in your own records rather than to the message in front of you.',
    },
  ],
  proposal: [
    {
      id: 'q.prop.registration',
      question: 'What is the company registration number and registered address, and who are the directors?',
      why: 'All three are public records you can check independently, without relying on anything in the proposal.',
    },
    {
      id: 'q.prop.references',
      question: 'Can you provide two contactable client references I can approach directly?',
      why: 'Named, reachable references are difficult to fabricate and easy for you to verify.',
    },
    {
      id: 'q.prop.risk',
      question: 'What are the realistic downside scenarios, and what happens to my money if the venture fails?',
      why: 'A credible counterparty discusses risk plainly. Deflection here is itself informative.',
    },
    {
      id: 'q.prop.regulator',
      question: 'Are you regulated for this activity, and under which licence or registration?',
      why: 'Regulatory status is verifiable on the regulator’s own register, which you should search yourself.',
    },
  ],
  website: [
    {
      id: 'q.web.who',
      question: 'Who operates this site, and does a contactable business address appear anywhere on it?',
      why: 'Legitimate services identify their operator. Anonymity on a site asking for money or credentials is a serious gap.',
    },
    {
      id: 'q.web.independent',
      question: 'Can I reach the same page by typing the organisation’s address myself, rather than following this link?',
      why: 'If the content only exists behind the supplied link, the link is the problem.',
    },
  ],
  generic: [
    {
      id: 'q.gen.channel',
      question: 'Can we confirm this through a channel I already use for you — a number or address I held before today?',
      why: 'Verification only works through a route the sender does not control.',
    },
    {
      id: 'q.gen.specifics',
      question: 'Can you give me the specific reference, account or case number this relates to?',
      why: 'A genuine matter has identifiers you can look up in your own records.',
    },
  ],
};

const SIGNAL_QUESTIONS: Array<{ category: SignalCategory; q: QuestionToAsk }> = [
  {
    category: 'credentials',
    q: {
      id: 'q.sig.code',
      question: 'Why do you need a code that was sent to me, when you should already be able to verify me another way?',
      why: 'There is no legitimate answer. A one-time code completes a login or payment for whoever holds it.',
    },
  },
  {
    category: 'impersonation',
    q: {
      id: 'q.sig.identity',
      question: 'What is your full name, role and direct line, and can I reach you through the organisation’s main switchboard?',
      why: 'Routing through a publicly listed switchboard confirms the person exists inside the organisation they claim.',
    },
  },
  {
    category: 'domain',
    q: {
      id: 'q.sig.domain',
      question: 'Why does this link not use your organisation’s own domain?',
      why: 'It forces an explanation for the single most objective discrepancy in the message.',
    },
  },
];

export function buildQuestions(signals: Signal[], context: InputContext, limit = 5): QuestionToAsk[] {
  const out: QuestionToAsk[] = [];
  const seen = new Set<string>();
  const present = new Set(signals.map((s) => s.category));

  for (const { category, q } of SIGNAL_QUESTIONS) {
    if (present.has(category) && !seen.has(q.id)) {
      seen.add(q.id);
      out.push(q);
    }
  }
  for (const q of CONTEXT_QUESTIONS[context] ?? []) {
    if (out.length >= limit) break;
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
  }
  if (out.length === 0) out.push(...(CONTEXT_QUESTIONS.generic ?? []));
  return out.slice(0, limit);
}

/**
 * How much of the possible investigation actually ran.
 *
 * Every item is a real field, so the meter cannot flatter the report: when the
 * model is unavailable or a host did not respond, the score genuinely drops.
 */
export function buildCompleteness(
  signals: Signal[],
  evidence: EvidenceRecord[],
  model: ModelStatus,
  hadUrl: boolean,
): Completeness {
  const dnsOk = evidence.some((e) => e.id === 'ev.dns' && e.status === 'observed');
  const httpOk = evidence.some((e) => e.id === 'ev.http' && e.status === 'observed');
  const structureOk = evidence.some((e) => e.id === 'ev.registrable_domain' && e.status === 'observed');

  const items: Completeness['items'] = [
    {
      label: 'Deterministic rules applied',
      present: true,
      note: `${signals.length} of the applicable rules matched. This step always runs and needs no network or model.`,
    },
    {
      label: 'Link structure parsed',
      present: structureOk,
      note: structureOk
        ? 'The address was broken down offline and its registrable domain identified.'
        : hadUrl
          ? 'A link was present but its structure could not be parsed.'
          : 'No link was present, so there was nothing to parse.',
    },
    {
      label: 'Domain resolved',
      present: dnsOk,
      note: dnsOk
        ? 'The hostname resolved to public addresses and passed the private-range check.'
        : hadUrl
          ? 'The domain did not resolve, or the check was not run.'
          : 'Not applicable: no link was present.',
    },
    {
      label: 'Destination contacted',
      present: httpOk,
      note: httpOk
        ? 'The host responded and its page metadata was read.'
        : hadUrl
          ? 'The destination was not reached, so nothing is known about its content.'
          : 'Not applicable: no link was present.',
    },
    {
      label: 'Contextual interpretation',
      present: model.used,
      note: model.used
        ? 'A language model reviewed the rule matches and evidence and added labelled inferences.'
        : (model.reason ?? 'The contextual layer did not run.'),
    },
  ];

  // Items that are "not applicable" should not be counted against the report.
  const applicable = items.filter(
    (i) => hadUrl || !['Link structure parsed', 'Domain resolved', 'Destination contacted'].includes(i.label),
  );

  return {
    score: applicable.filter((i) => i.present).length,
    max: applicable.length,
    items,
  };
}
