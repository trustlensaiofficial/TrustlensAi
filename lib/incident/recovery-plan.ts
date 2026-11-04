/**
 * What to do now, for someone who has already acted.
 *
 * This is the half of the product nothing else in the market serves. Google
 * and Truecaller both stop at the warning; neither helps the person who has
 * already paid. See `docs/COMPETITOR_RESEARCH.md` §3.3.
 *
 * Three rules, all of them load-bearing:
 *
 *  1. **Recovery is never promised.** `disclaimer` is mandatory on every plan.
 *     TrustLens cannot reverse a transfer, freeze an account or file a report
 *     on anyone's behalf, and says so.
 *  2. **Channels are routed, not listed.** Chakshu is for suspected fraudulent
 *     *communications*. 1930 and cybercrime.gov.in are for actual financial
 *     cybercrime. They are not interchangeable, and handing someone five
 *     numbers at the worst moment of their week is not help.
 *  3. **The second scam is named.** People who have just lost money are
 *     targeted by fake recovery agents, and they are findable precisely
 *     because they complained in public. Every plan that follows a loss warns
 *     about this explicitly.
 */

/** The twelve states from `docs/openapi.yaml`, which is authoritative. */
export type UserActionState =
  | 'received_only'
  | 'opened_link'
  | 'entered_credentials'
  | 'shared_otp_or_pin'
  | 'installed_app'
  | 'shared_screen'
  | 'granted_remote_access'
  | 'scanned_qr_only'
  | 'entered_upi_pin'
  | 'approved_payment_request'
  | 'transferred_money'
  | 'shared_identity_documents';

export type Urgency = 'immediate' | 'prompt' | 'routine';

export interface RecoveryStep {
  order: number;
  action: string;
  why: string;
}

export interface OfficialChannel {
  name: string;
  contact: string;
  url?: string;
  useWhen: string;
  /** Rendered above the step list, not inside it. */
  urgent?: boolean;
}

export interface RecoveryPlan {
  actionState: UserActionState;
  urgency: Urgency;
  title: string;
  summary: string;
  steps: RecoveryStep[];
  officialChannels: OfficialChannel[];
  disclaimer: string;
}

/* ------------------------------------------------------- official channels */

const HELPLINE_1930: OfficialChannel = {
  name: 'National Cyber Crime Helpline',
  contact: '1930',
  url: 'https://cybercrime.gov.in',
  useWhen:
    'Call now if money has left your account, or if you approved a payment and are not sure whether it went through. The call is logged into the government system that asks whichever bank or wallet currently holds the money to freeze it — which is why the first hours matter more than anything else you could do.',
  urgent: true,
};

const CYBERCRIME_PORTAL: OfficialChannel = {
  name: 'National Cyber Crime Reporting Portal',
  contact: 'cybercrime.gov.in',
  url: 'https://cybercrime.gov.in',
  useWhen:
    'File the written complaint here after calling, and keep the acknowledgement number. A report is worth filing even when nothing was taken.',
};

const BANK: OfficialChannel = {
  name: 'Your bank’s own fraud line',
  contact: 'The number printed on your debit or credit card',
  useWhen:
    'Use the number on the card or inside your bank’s own app — never a number from the message or the caller. Only your bank can see the transaction and tell you whether a hold, recall or dispute is still possible.',
  urgent: true,
};

const CHAKSHU: OfficialChannel = {
  name: 'Chakshu (Sanchar Saathi)',
  contact: 'sancharsaathi.gov.in',
  url: 'https://sancharsaathi.gov.in',
  useWhen:
    'Report the fraudulent call, SMS or WhatsApp message itself here. This is the right place when the problem is the communication rather than a financial loss — it is not a substitute for 1930 if money has gone.',
};

const MRM: OfficialChannel = {
  name: 'Money Restoration Module (I4C)',
  contact: 'Through your 1930 complaint',
  url: 'https://cybercrime.gov.in',
  useWhen:
    'Once a freeze has actually held some of the money, this is the process for getting it released back to you. It only applies after a complaint exists, so it follows 1930 rather than replacing it.',
};

/* ---------------------------------------------------------------- warnings */

/** The second scam. Stated on every plan that follows a loss. */
const RECOVERY_SCAM_STEP = {
  action:
    'Ignore anyone who contacts you offering to recover the money — especially for an upfront fee, a "processing charge", an OTP, or by asking you to install something.',
  why:
    'Being defrauded makes you a target for a second fraud aimed specifically at victims, and complaining in public is how they find you. No genuine agency charges a fee to recover stolen money, and nobody who can actually help will ask for an OTP.',
};

const PRESERVE_EVIDENCE_STEP = {
  action:
    'Keep everything: the UTR or transaction ID, the amount, the time, the payee address, the full chat, the call log and screenshots. Do not delete the conversation.',
  why:
    'The bank and the police both work from these details, and the conversation is usually the only record of what you were told.',
};

const DISCLAIMER =
  'This is guidance, not a recovery service. TrustLens cannot reverse a payment, freeze an account, or file a report for you, and nothing here guarantees that money can be recovered. The steps are ordered to give the official process the best chance of acting in time.';

/* -------------------------------------------------------------------- plans */

interface PlanBody {
  urgency: Urgency;
  title: string;
  summary: string;
  steps: Array<{ action: string; why: string }>;
  channels: OfficialChannel[];
}

const PLANS: Record<UserActionState, PlanBody> = {
  received_only: {
    urgency: 'routine',
    title: 'You received it and did not act',
    summary:
      'Nothing has been lost, and there is nothing urgent to do. The useful thing now is to make sure the next message like it reaches someone who is ready for it.',
    steps: [
      {
        action: 'Do not reply, and do not call any number the message supplied.',
        why: 'A reply confirms the number is live and reaching a real person, which is itself worth money to whoever sent it.',
      },
      {
        action: 'Block and report the sender inside the app it arrived in.',
        why: 'In-app reports feed the platform’s own filtering, which is what stops it reaching the next person.',
      },
      {
        action: 'Tell whoever in your family is most likely to get the same message next.',
        why: 'These campaigns send the same text to thousands of numbers. Someone you know will receive it.',
      },
    ],
    channels: [CHAKSHU],
  },

  opened_link: {
    urgency: 'routine',
    title: 'You opened the link but entered nothing',
    summary:
      'Opening a page is not, on its own, evidence that anything was taken. What matters is whether you typed something, approved something, or installed something — and if the answer to all three is no, you are probably fine.',
    steps: [
      {
        action: 'Close the page. Do not enter anything, approve any prompt, or install anything it offers.',
        why: 'The page cannot do much without you. Almost every real loss needs one more action from the person reading it.',
      },
      {
        action: 'If something downloaded, do not open it. Delete it, and remove it if it installed.',
        why: 'A download is inert until it runs.',
      },
      {
        action: 'If you were signed in to a real account in the same browser, sign out of other sessions and change that password from a device you trust.',
        why: 'This is cheap insurance against the small chance the page was able to use an existing session.',
      },
    ],
    channels: [CHAKSHU, CYBERCRIME_PORTAL],
  },

  scanned_qr_only: {
    urgency: 'routine',
    title: 'You scanned the code but did not complete a payment',
    summary:
      'Scanning a code only opens a payment screen. If you did not enter your PIN, no money moved — a QR code cannot pull money from your account by itself.',
    steps: [
      {
        action: 'Close the payment screen without entering your UPI PIN.',
        why: 'The PIN is the step that authorises the payment. Without it, there is nothing to reverse.',
      },
      {
        action: 'Open your UPI app’s history and confirm no pending or completed payment appears.',
        why: 'Checking takes a few seconds and replaces worry with a fact.',
      },
      {
        action: 'If you also approved anything in your UPI app, treat this as a payment and call your bank.',
        why: 'An approval is the part that matters, and only the bank can see whether it completed.',
      },
    ],
    channels: [CHAKSHU, CYBERCRIME_PORTAL],
  },

  entered_credentials: {
    urgency: 'prompt',
    title: 'You entered a username and password',
    summary:
      'Assume the credentials are now known to someone else, and change them before anything is built on top of them. The password itself is usually not the goal — access to your email or bank is.',
    steps: [
      {
        action: 'Change that password now, from a different device, and change it anywhere else you reused it.',
        why: 'Reuse is what turns one stolen password into several compromised accounts.',
      },
      {
        action: 'Sign out of all other sessions in that account’s security settings.',
        why: 'Changing a password does not always end a session that is already open.',
      },
      {
        action: 'Turn on two-step verification, preferring an app or a passkey over SMS codes.',
        why: 'It means the password alone is no longer enough, which is the point.',
      },
      {
        action: 'Check the account for changes someone else made: a new recovery email or phone, a forwarding rule, a new trusted device.',
        why: 'A forwarding rule is how someone keeps reading your mail after you have locked them out, and it is easy to miss.',
      },
    ],
    channels: [CYBERCRIME_PORTAL, CHAKSHU],
  },

  shared_otp_or_pin: {
    urgency: 'immediate',
    title: 'You shared an OTP or a PIN',
    summary:
      'An OTP exists to authorise one specific action, and whoever has it can complete that action without needing anything else from you. Treat this as time-critical even if nothing has appeared on your statement yet.',
    steps: [
      {
        action: 'Call your bank now on the number printed on your card and tell them you shared a one-time code.',
        why: 'There may be a transaction in flight that has not settled. Those are the ones that can still be stopped, and only the bank can see them.',
      },
      {
        action: 'Ask them to block the card or freeze the account while you check, and get a complaint reference.',
        why: 'A freeze is reversible in minutes. A completed transfer usually is not.',
      },
      {
        action: 'Change your internet-banking password and UPI PIN from a device you trust.',
        why: 'Anything you typed or read aloud during the call should be treated as known to them.',
      },
      PRESERVE_EVIDENCE_STEP,
      RECOVERY_SCAM_STEP,
    ],
    channels: [BANK, HELPLINE_1930, CYBERCRIME_PORTAL],
  },

  installed_app: {
    urgency: 'prompt',
    title: 'You installed an app they asked you to install',
    summary:
      'An app installed at a stranger’s request is the step that turns a conversation into control of your phone. Treat it as live until it is removed, and assume anything on screen while it ran was visible to them.',
    steps: [
      {
        action: 'Turn on aeroplane mode before anything else.',
        why: 'It cuts the app off immediately, which matters more than the order of everything that follows.',
      },
      {
        action: 'Uninstall the app. Then check Settings → Accessibility and Settings → Device admin apps and revoke anything you do not recognise.',
        why: 'Some of these keep working after the icon is gone, because the real power was in the accessibility or device-admin grant rather than the app.',
      },
      {
        action: 'Reconnect, then change your bank and email passwords from a different device.',
        why: 'Treat everything typed while it was running as known to them.',
      },
      {
        action: 'Call your bank on the number on your card and tell them a remote-support app was installed.',
        why: 'They can monitor the account and stop transfers you did not make. You cannot do that yourself.',
      },
    ],
    channels: [BANK, CYBERCRIME_PORTAL],
  },

  shared_screen: {
    urgency: 'immediate',
    title: 'You shared your screen',
    summary:
      'While the session was open they saw what you saw — balances, one-time codes, anything you typed. Ending it comes before everything else, because nothing else helps while they are still watching.',
    steps: [
      {
        action: 'End the session now. Close the app, hang up, or turn on aeroplane mode if you cannot find the stop control.',
        why: 'Nothing else you do matters while they still have a live view of the screen.',
      },
      {
        action: 'Remove the screen-sharing app and revoke any accessibility or device-admin permission it was given.',
        why: 'The grant can outlive the session and let them reconnect later.',
      },
      {
        action: 'From a different device, change your banking and email passwords and sign out of all other sessions.',
        why: 'Treat every credential visible during the session as known to them.',
      },
      {
        action: 'Call your bank on the number on your card and ask them to review recent and pending transactions.',
        why: 'Payments set up during the session may not have settled yet, and those are the ones that can still be stopped.',
      },
      RECOVERY_SCAM_STEP,
    ],
    channels: [BANK, HELPLINE_1930, CYBERCRIME_PORTAL],
  },

  granted_remote_access: {
    urgency: 'immediate',
    title: 'You gave someone remote access to your device',
    summary:
      'Remote access is control, not just visibility: they could type, approve prompts and move money without you touching the phone. Assume anything reachable from the device is reachable by them until you have cut it off.',
    steps: [
      {
        action: 'Turn on aeroplane mode now.',
        why: 'This ends their control immediately. Finding the right button to press inside the app takes longer.',
      },
      {
        action: 'Uninstall the remote-access tool, then revoke every accessibility and device-admin permission you do not recognise.',
        why: 'These grants are how access survives the app being deleted.',
      },
      {
        action: 'From a different device, change your banking, email and UPI credentials and sign out of all other sessions.',
        why: 'Anything stored or typed on that device should be treated as taken.',
      },
      {
        action: 'Call your bank on the number on your card. Tell them remote access was active and ask them to check for transactions and any new payee or mandate added.',
        why: 'A standing mandate set up during the session keeps taking money afterwards, and it is the thing people forget to look for.',
      },
      PRESERVE_EVIDENCE_STEP,
      RECOVERY_SCAM_STEP,
    ],
    channels: [BANK, HELPLINE_1930, CYBERCRIME_PORTAL],
  },

  entered_upi_pin: {
    urgency: 'immediate',
    title: 'You entered your UPI PIN',
    summary:
      'Entering a UPI PIN authorises a payment. If you were told it was needed to receive a refund, the money moved the other way — out of your account. Act on that assumption now and confirm afterwards.',
    steps: [
      {
        action: 'Call 1930 now. Do not wait until you have checked your balance.',
        why: 'The call starts the process that asks whichever account now holds the money to freeze it. That window is measured in hours, and checking first spends it.',
      },
      {
        action: 'Call your bank on the number printed on your card, report an unauthorised payment and get a complaint reference.',
        why: 'The bank works the payment side while 1930 works the freeze side. Both are worth starting.',
      },
      {
        action: 'Open your UPI app and note the exact amount, time and payee address.',
        why: 'Every channel will ask for these, and having them ready shortens the call.',
      },
      {
        action: 'File the written complaint at cybercrime.gov.in and keep the acknowledgement number.',
        why: 'The written complaint is what the case rests on afterwards.',
      },
      PRESERVE_EVIDENCE_STEP,
      RECOVERY_SCAM_STEP,
    ],
    channels: [HELPLINE_1930, BANK, CYBERCRIME_PORTAL, MRM],
  },

  approved_payment_request: {
    urgency: 'immediate',
    title: 'You approved a payment request',
    summary:
      'Approving a collect request pays whoever sent it. If it was described as a refund, that was the deception — a refund never needs your approval. Treat the money as gone and move fast, because speed is the only thing that still helps.',
    steps: [
      {
        action: 'Call 1930 now.',
        why: 'This is what triggers a freeze request to the account currently holding the money, and it works best within the first hours.',
      },
      {
        action: 'Call your bank on the number on your card. Ask about a recall and get a complaint reference.',
        why: 'Only the bank can see whether the payment has settled or is still in flight.',
      },
      {
        action: 'Check your UPI app for any standing mandate or AutoPay that was set up at the same time, and cancel it.',
        why: 'A mandate keeps taking money on a schedule long after the first payment, and it is the step most people miss.',
      },
      {
        action: 'File at cybercrime.gov.in and keep the acknowledgement number.',
        why: 'The written complaint is what any later restoration depends on.',
      },
      PRESERVE_EVIDENCE_STEP,
      RECOVERY_SCAM_STEP,
    ],
    channels: [HELPLINE_1930, BANK, CYBERCRIME_PORTAL, MRM],
  },

  transferred_money: {
    urgency: 'immediate',
    title: 'Money has already left your account',
    summary:
      'This is the one case where minutes genuinely matter. Call 1930 before you do anything else, including reading the rest of this. Everything after step one can wait ten minutes; step one cannot.',
    steps: [
      {
        action: 'Call 1930 now, before gathering documents or checking your balance.',
        why: 'The call is logged into the government system that asks whichever bank or wallet now holds the money to freeze it before it moves again. Reporting within the first day or two is what decides whether that works.',
      },
      {
        action: 'Call your bank on the number printed on your card. Report a scam-induced transfer, ask for a hold or recall, and get a complaint reference.',
        why: 'The bank checks the payment rails and tells you what intervention is still available. TrustLens cannot do any of this.',
      },
      {
        action: 'File the complaint at cybercrime.gov.in and keep the acknowledgement number safe.',
        why: 'The acknowledgement number is what every later conversation, including any restoration of frozen funds, will refer back to.',
      },
      PRESERVE_EVIDENCE_STEP,
      RECOVERY_SCAM_STEP,
      {
        action: 'Tell someone you trust what happened today.',
        why: 'Scams work by isolating people, and the pressure to keep it quiet is part of the method. Saying it out loud also makes the second approach easier to refuse.',
      },
    ],
    channels: [HELPLINE_1930, BANK, CYBERCRIME_PORTAL, MRM],
  },

  shared_identity_documents: {
    urgency: 'prompt',
    title: 'You shared identity documents',
    summary:
      'Copies of an Aadhaar, PAN or passport are used to open accounts and take loans in your name. Nothing may happen for weeks, so the work here is watching for it rather than undoing it.',
    steps: [
      {
        action: 'Check your credit report now, and again in a month.',
        why: 'An account or loan opened in your name shows up there first, and early is much easier to dispute than late.',
      },
      {
        action: 'Lock or freeze your credit report with the bureaus if they offer it.',
        why: 'It blocks new credit being opened in your name while leaving your existing accounts working.',
      },
      {
        action: 'Check your Aadhaar authentication history for uses you do not recognise, and lock your biometrics on the UIDAI site.',
        why: 'Locking biometrics prevents an authentication you did not initiate, and it is reversible whenever you need it.',
      },
      {
        action: 'File a written complaint at cybercrime.gov.in now, even though nothing has happened yet.',
        why: 'A complaint that predates the misuse is strong evidence later that the account was never yours.',
      },
      RECOVERY_SCAM_STEP,
    ],
    channels: [CYBERCRIME_PORTAL, CHAKSHU],
  },
};

/* ------------------------------------------------------------------ public */

/**
 * How exposed each state is, used to compare two reported actions.
 *
 * A case keeps the *furthest* action, never the latest. Someone who
 * transferred money and later says they also opened a link has not become less
 * exposed, and a plan that quietly downgraded on the milder answer would be
 * dangerous advice dressed as responsiveness.
 */
const EXPOSURE: Record<UserActionState, number> = {
  received_only: 0,
  opened_link: 1,
  scanned_qr_only: 2,
  installed_app: 3,
  entered_credentials: 4,
  shared_identity_documents: 5,
  shared_screen: 6,
  shared_otp_or_pin: 7,
  granted_remote_access: 8,
  entered_upi_pin: 9,
  approved_payment_request: 10,
  transferred_money: 11,
};

/** The more exposed of two states. Used when a case gains a new report. */
export function furthestAction(
  a: UserActionState | null | undefined,
  b: UserActionState | null | undefined,
): UserActionState | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return (EXPOSURE[b] ?? 0) > (EXPOSURE[a] ?? 0) ? b : a;
}

export function isUserActionState(value: unknown): value is UserActionState {
  /*
   * hasOwnProperty, not `in`: the `in` operator walks the prototype chain, so
   * a request body carrying actionState "toString" or "constructor" would have
   * passed this guard and then been handed Object.prototype's own member as if
   * it were a plan. This is reachable from untrusted input, which is what
   * makes it worth the extra call.
   */
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PLANS, value);
}

/** The plan for a reported action. Every state has one; none returns null. */
export function recoveryPlanFor(actionState: UserActionState): RecoveryPlan {
  const body = PLANS[actionState];
  return {
    actionState,
    urgency: body.urgency,
    title: body.title,
    summary: body.summary,
    steps: body.steps.map((s, i) => ({ order: i + 1, action: s.action, why: s.why })),
    officialChannels: body.channels,
    disclaimer: DISCLAIMER,
  };
}

/** Every state, for a client that needs to offer the choice. */
export function allActionStates(): UserActionState[] {
  return (Object.keys(PLANS) as UserActionState[]).sort((a, b) => EXPOSURE[a] - EXPOSURE[b]);
}
