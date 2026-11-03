import type { UserActionState } from './types';

export interface ResponsePlan {
  title: string;
  summary: string;
  steps: Array<{ action: string; why: string }>;
}

/**
 * Turns the user's reported action into a response sequence.
 * This is guidance, not a claim that a payment can be reversed or an account
 * can be recovered. The most advanced action the user reports takes priority.
 */
const PLANS: Partial<Record<UserActionState, ResponsePlan>> = {
  installed_app: {
    title: 'You installed an app they asked for',
    summary:
      'An app installed at a stranger\u2019s request is the step that turns a conversation into control of your device. Treat it as live until it is removed, and assume anything on screen while it ran was visible to them.',
    steps: [
      {
        action: 'Turn on aeroplane mode, or disconnect Wi-Fi and mobile data, before you do anything else.',
        why: 'It cuts the app off immediately while you remove it, which matters more than the order of the remaining steps.',
      },
      {
        action: 'Uninstall the app. On Android also check Settings \u2192 Accessibility and Settings \u2192 Device admin apps, and revoke anything you do not recognise.',
        why: 'Some tools keep working after the icon is gone because they hold an accessibility or device-admin grant.',
      },
      {
        action: 'Reconnect, then change the passwords for your bank and email from a different device you trust.',
        why: 'Anything typed while the app was running should be treated as known to them, including passwords.',
      },
      {
        action: 'Call your bank on the number printed on your card and tell them a remote-access app was installed.',
        why: 'They can watch the account and stop transfers you did not make, which you cannot do yourself.',
      },
    ],
  },
  remote_access: {
    title: 'You shared your screen or gave remote access',
    summary:
      'While the session was open they could see everything you saw, including balances, one-time codes and anything you typed. Ending it is the first priority.',
    steps: [
      {
        action: 'End the session now \u2014 close the app, hang up the call, or disconnect from the internet if you cannot find the stop control.',
        why: 'Nothing else helps while they still have a live view of the screen.',
      },
      {
        action: 'Remove the screen-sharing or remote-support app, and revoke any accessibility or device-admin permission it was given.',
        why: 'The grant can outlive the session and let them reconnect later.',
      },
      {
        action: 'From a different device, change your banking and email passwords and sign out of all other sessions.',
        why: 'Treat every credential visible during the session as known to them.',
      },
      {
        action: 'Call your bank on the number printed on your card. Tell them a remote session was active and ask them to review recent and pending transactions.',
        why: 'Payments set up during the session may not have completed yet, and those are the ones that can still be stopped.',
      },
    ],
  },
  opened_link: {
    title: 'You opened the link',
    summary: 'Opening a page alone does not prove that an account or device was compromised. The important question is whether you entered information, approved anything, or installed something.',
    steps: [
      {
        action: 'Close the page. Do not enter more information, download a file, install an app, or approve a prompt from that page.',
        why: 'This stops the interaction from progressing while you verify the destination independently.',
      },
      {
        action: 'If a file or app was downloaded, do not open it. Remove it if it was installed, then run a security scan using software you already trust.',
        why: 'A link can lead to a malicious download even when the page itself looks ordinary.',
      },
      {
        action: 'If you also entered a password, OTP, PIN, or payment detail, change the reported state to “I shared a code or account detail” and follow that response plan.',
        why: 'The response is different once credentials or payment authorisation have been exposed.',
      },
    ],
  },
  shared_credentials: {
    title: 'You shared a code or account detail',
    summary: 'Treat the affected account as exposed. Use a trusted device and contact the organisation through a channel you choose yourself.',
    steps: [
      {
        action: 'If bank, UPI, card, or OTP details were shared, call your bank using the number on your card or inside its official app. Ask them to secure the account and block affected payment instruments if needed.',
        why: 'The bank can take account-specific protective steps that this tool cannot perform for you.',
      },
      {
        action: 'From a trusted device, change the exposed password through the official app or a web address you type yourself. Change reused passwords and sign out other sessions.',
        why: 'A reused or active session can let someone return even after the first password is changed.',
      },
      {
        action: 'For a financial cyber-fraud incident in India, call 1930 promptly and file the complaint at cybercrime.gov.in. Keep the complaint reference.',
        why: 'Official reporting creates a traceable case and may help authorities and the bank act quickly.',
      },
    ],
  },
  approved_payment: {
    title: 'You approved a payment request',
    summary: 'Act immediately. A payment authorisation may already have moved money; TrustLens cannot reverse it, but your bank or payment provider can tell you what action is still possible.',
    steps: [
      {
        action: 'Call your bank or payment provider using its official app or the number on your card. Ask them to block further activity and raise a dispute or fraud complaint for the transaction.',
        why: 'Only the payment provider can inspect the transaction and advise whether a stop, recall, or dispute is available.',
      },
      {
        action: 'For suspected financial cyber fraud in India, call 1930 immediately and submit the details at cybercrime.gov.in.',
        why: 'Time matters in financial-fraud reporting. Use the official channel rather than a number supplied by the sender.',
      },
      {
        action: 'Save the UTR or transaction ID, amount, time, recipient details, message, and screenshots. Do not pay anyone who promises guaranteed recovery.',
        why: 'These details support the bank and official complaint; recovery-agent scams often target victims again.',
      },
    ],
  },
  sent_money: {
    title: 'Money has already been sent',
    summary: 'This is time-sensitive. Start with your bank or payment provider now. Do not wait for another message or pay a third party to recover the money.',
    steps: [
      {
        action: 'Call your bank immediately using its official app or the number on your card. Report an unauthorised or scam-induced transfer, request a hold or recall if available, and get a complaint reference.',
        why: 'The bank must check the actual payment rails and tell you what intervention is still possible; TrustLens cannot reverse a transfer.',
      },
      {
        action: 'Call India’s cyber-fraud helpline 1930 promptly and file the complaint at cybercrime.gov.in. Keep the acknowledgement number.',
        why: 'Prompt reporting gives the official response process the best chance to act while funds may still be traceable.',
      },
      {
        action: 'Preserve the UTR or transaction ID, amount, time, recipient details, chat, call logs, and screenshots. Do not delete the conversation.',
        why: 'A clear timeline and transaction evidence make the bank and police complaint more actionable.',
      },
      {
        action: 'Ignore anyone asking for an advance fee, OTP, remote-access app, or extra transfer to “recover” the money.',
        why: 'Victims of an initial payment scam are frequently targeted by a second recovery scam.',
      },
    ],
  },
};

export function responsePlanFor(state: UserActionState | null | undefined): ResponsePlan | null {
  if (!state || state === 'not_acted') return null;
  return PLANS[state] ?? null;
}
