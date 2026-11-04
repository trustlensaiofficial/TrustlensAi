import type { Report } from '../analysis/types';

export interface LocalAnswerInput {
  message: string;
  report?: Report | null;
}

/**
 * Deterministic, report-aware Kaval fallback.
 *
 * This is intentionally a small safety guide, not a pretend language model.
 * It only uses facts present in the report and conservative incident guidance.
 */
export function answerKavalLocally({ message, report }: LocalAnswerInput): string {
  const q = message.toLocaleLowerCase().replace(/[’']/g, "'");
  const moneyMoved = /they took my money|money (?:is )?gone|sent (?:the )?money|transferred|transfer(?:red)? money|paid them|payment (?:was )?sent|already paid|lost money|debit(?:ed)?/.test(q);
  const sharedSecret = /shared|sent|gave|told|entered|typed|submitted/.test(q) && /otp|one.?time password|pin|password|cvv|card number|bank details|upi pin|credential/.test(q);
  const installed = /installed|downloaded/.test(q) && /app|application|apk/.test(q);
  const remote = /screen.?share|remote access|anydesk|teamviewer|quick.?support|remote app/.test(q);
  const clicked = /clicked|opened|tapped|visited/.test(q) && /link|url|website|button|message/.test(q);
  const next = /what (?:should|do) i do|what now|next step|help me|right now|they took|already happened/.test(q);

  if (moneyMoved) {
    return [
      'Act immediately. In India, call 1930 now to report the cyber-financial fraud. Then call your bank using the number on your card or its official app and ask them to block further transactions and raise a fraud dispute.',
      'Report at https://cybercrime.gov.in/. Keep the transaction ID, amount, time, UPI ID/account details and screenshots. Do not delete messages. Recovery is not guaranteed, but reporting quickly matters.',
      report ? reportContext(report) : 'I do not have a report attached to this conversation, so I cannot assess the message or transfer itself.'
    ].filter(Boolean).join('\n\n');
  }

  if (sharedSecret) {
    return [
      'Treat the shared detail as compromised. Call your bank using its official app or the number on your card immediately. Ask them to block the affected card/account or UPI access, reset credentials from the official app/site, and review recent transactions.',
      'Never share another OTP, PIN, CVV or password with the caller or anyone claiming they can reverse the transaction. If money has moved, call 1930 immediately and report at https://cybercrime.gov.in/.',
      report ? reportContext(report) : 'I do not have a report attached, so I cannot tell which account or service was involved.'
    ].join('\n\n');
  }

  if (installed || remote) {
    return [
      'Disconnect the device from the internet. Do not open the app or continue screen sharing. From a different trusted device, contact your bank through its official app/number and ask them to secure the account and review transactions.',
      'Remove the suspicious remote-access app only when you can do so safely; consider getting the device checked before using banking apps again. Change important passwords from a separate trusted device. If money moved, call 1930 immediately and report at https://cybercrime.gov.in/.',
      report ? reportContext(report) : ''
    ].filter(Boolean).join('\n\n');
  }

  if (clicked) {
    return [
      'Close the page. Do not download anything, allow notifications, enter details, approve a UPI collect request or install an app from it. Open your bank or service by typing its known official address or using its official app.',
      'If you entered a password, OTP, card detail or UPI PIN, contact the bank/service immediately using a trusted channel. If money moved, call 1930 and report at https://cybercrime.gov.in/.',
      report ? reportContext(report) : ''
    ].filter(Boolean).join('\n\n');
  }

  if (!report) {
    return [
      'I can help with scam and online-safety questions. Do not share OTPs, UPI PINs, passwords or CVVs with anyone. Verify payment requests by contacting the person or organisation through a number or website you already know—not the contact details in the suspicious message.',
      'If you have already sent money in India, call 1930 immediately and report at https://cybercrime.gov.in/.',
      'For an explanation of a specific warning, open a TrustLens report and ask Kaval while viewing it.'
    ].join('\n\n');
  }

  const signals = report.signals.slice(0, 5);
  const list = signals.length
    ? signals.map((s) => `• ${s.title}${s.matches[0]?.text ? ` — “${s.matches[0].text.slice(0, 100)}”` : ''}`).join('\n')
    : '• No deterministic warning-sign rule matched. This does not prove the message is genuine.';

  if (/why|suspicious|flag|warning|risk|danger|scam/.test(q)) {
    return [
      `This report is rated ${report.assessment.level.replaceAll('_', ' ')}. ${report.assessment.headline}.`,
      'The report found these warning signs:',
      list,
      reportContext(report),
      'These are indicators, not proof of who sent the message or their intent. Verify independently before paying, clicking or sharing information.'
    ].join('\n\n');
  }

  if (/check|verify|source|evidence|did you|checked/.test(q)) {
    return [
      'Here is what this report actually checked:',
      report.uncertainty.checked.length ? report.uncertainty.checked.map((x) => `• ${x}`).join('\n') : '• No external checks are recorded.',
      'Not checked or unresolved:',
      report.uncertainty.notChecked.length ? report.uncertainty.notChecked.map((x) => `• ${x}`).join('\n') : '• None listed.',
      'I cannot confirm the sender’s identity or guarantee that the content is genuine.'
    ].join('\n\n');
  }

  if (/thank|hello|hi\b|who are you/.test(q)) {
    return 'I’m Kaval, TrustLens AI’s scam-safety guide. I can explain this report, its warning signs and what to do next. I cannot verify a sender’s identity or declare a message genuine.';
  }

  if (next || /do next|action|safe to|should i/.test(q)) {
    const steps = report.checklist.slice(0, 5).map((s) => `• ${s.action} — ${s.why}`).join('\n');
    return [
      'Before acting, use a separate channel you choose to verify the request. Do not use phone numbers, links or QR codes supplied in the suspicious message.',
      steps || '• Do not pay, click or share credentials until independently verified.',
      reportContext(report),
      'If money has already moved, call 1930 immediately in India and report at https://cybercrime.gov.in/.'
    ].join('\n\n');
  }

  return [
    'I’m running in local safety-guide mode, so I can answer common scam and incident-response questions but not open-ended questions like a cloud AI assistant.',
    reportContext(report),
    'Try asking: “Why is this suspicious?”, “What was checked?”, “I clicked the link — what now?”, or “I shared my OTP — what should I do?”'
  ].join('\n\n');
}

function reportContext(report: Report): string {
  const checked = report.uncertainty.checked.slice(0, 3);
  const unknown = report.uncertainty.notChecked.slice(0, 3);
  return [
    `For this report: ${report.assessment.summary}`,
    checked.length ? `Checks recorded: ${checked.join('; ')}.` : '',
    unknown.length ? `Still unknown: ${unknown.join('; ')}.` : ''
  ].filter(Boolean).join('\n');
}
