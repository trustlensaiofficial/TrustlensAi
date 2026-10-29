import type { InputContext, InputKind } from '../analysis/types';

/**
 * Example cases for reviewers.
 *
 * Every one is clearly labelled as a demonstration in the UI. The text is
 * composed for this product — it is paraphrased from publicly documented scam
 * patterns, not copied from a real victim's message, and no real person,
 * account number or domain belonging to a third party appears in it.
 *
 * The benign cases are deliberately included: a detector that only ever sees
 * scams proves nothing about its false-positive behaviour, and reviewers should
 * be able to confirm the tool stays quiet on ordinary messages.
 */

export interface DemoCase {
  slug: string;
  label: string;
  kind: InputKind;
  /** Unlocks the context-specific rule set for this scenario. */
  context: InputContext;
  /** One-line framing of the situation, shown above the sample. */
  scenario: string;
  /** What a reviewer should watch for when they run it. */
  expectation: string;
  text: string;
}

export const DEMO_CASES: DemoCase[] = [
  {
    slug: 'digital-arrest',
    context: 'generic',
    scenario:
      'A caller claims to be from a cyber-crime unit and says a parcel in your name was seized.',
    label: 'Coercive "digital arrest" call script',
    kind: 'message',
    expectation:
      'Should surface the isolation demand as critical, alongside the threat of arrest and the irreversible payment request.',
    text: `This is an official notice from the Cyber Crime Investigation Cell. A parcel registered in your name has been seized containing illegal items. A non-bailable warrant has been issued and you are now under digital arrest.

Do not tell anyone, including your family, as this is a confidential investigation. Stay on the call until verification is complete.

To close the case today you must transfer the verification amount of 48,500 to the account details provided by the officer. Failure to comply within 2 hours will result in immediate arrest.`,
  },
  {
    slug: 'bank-otp-phish',
    context: 'bank_scam',
    scenario:
      'An SMS says your bank account will be suspended unless you verify today.',
    label: 'Bank phishing SMS with a lookalike link',
    kind: 'message',
    expectation:
      'Should flag the one-time-code request as critical and identify that the link\'s registrable domain is not the bank\'s.',
    text: `Dear Customer, your account will be suspended within 24 hours due to incomplete KYC. Please verify your account immediately at https://hdfcbank.com.kyc-update-secure.xyz/verify

Share the OTP sent to your registered mobile number with our executive to complete verification. Last warning.`,
  },
  {
    slug: 'deepfake-payment',
    context: 'invoice',
    scenario:
      'Your CFO messages after a video call asking you to wire the first tranche of a confidential deal.',
    label: 'Video-call payment instruction (deepfake pattern)',
    kind: 'message',
    expectation:
      'Should flag the secrecy demand and the irreversible transfer, and should state plainly that it cannot assess whether a video call was synthetic.',
    text: `Following our video call just now, please proceed with the transfer we discussed. As this relates to a confidential acquisition, do not discuss it with anyone in the finance team or the wider office until the announcement.

Wire transfer the first tranche today to the account in the attached instructions. I am travelling, so reply here rather than calling the office line.`,
  },
  {
    slug: 'lookalike-url',
    context: 'website',
    scenario:
      'You were sent a payment link and want to know where it actually goes.',
    label: 'Lookalike domain on its own',
    kind: 'url',
    expectation:
      'Should identify the brand-in-subdomain trick and name the real registrable domain. With live checks on, it also reports what the host actually returned.',
    text: 'https://paypal.com.account-verify.secure-id.top/signin',
  },
  {
    slug: 'health-claim',
    context: 'generic',
    scenario:
      'A post in a family group chat claims a spice cures diabetes.',
    label: 'Viral health claim',
    kind: 'claim',
    expectation:
      'Should flag the absolute language and the unidentified study, and should state that no fact database was queried.',
    text:
      'A new study proves that this common kitchen spice completely cures type 2 diabetes in three weeks. Doctors don\'t want you to know because it would end their income from medication.',
  },
  {
    slug: 'job-offer-scam',
    label: 'Recruitment offer with an upfront fee',
    kind: 'message',
    context: 'job_offer',
    scenario:
      'A recruiter messages about a remote role you never applied for, and the offer arrives without an interview.',
    expectation:
      'Should flag the missing interview, the upfront payment, the free-email recruiter and the premature request for bank details.',
    text: `Congratulations! Your profile has been shortlisted for the Remote Data Operations Associate position. Direct joining — no interview is required.

Salary: 45,000 per month for simple data entry tasks, 3 hours daily, work from home.

To confirm your seat, a refundable security deposit of 2,500 is required for the onboarding kit and training portal access. This amount is returned with your first salary.

Please share your bank account details, IFSC and a copy of your Aadhaar to process your salary account. Our HR team will complete the formalities on WhatsApp.

Reply to hr.recruitment.team2024@gmail.com to proceed.`,
  },
  {
    slug: 'invoice-bank-change',
    label: 'Supplier invoice with changed bank details',
    kind: 'message',
    context: 'invoice',
    scenario:
      'A supplier you genuinely work with emails an overdue invoice — but the bank details are different from last time.',
    expectation:
      'Should flag the changed payment details as critical, the payment urgency, and the discouragement of a phone check. The top action should be to call a number you already held.',
    text: `Dear Accounts Payable,

Please find attached invoice INV-20418 for the September engagement, now overdue.

Please note our bank details have changed following our recent banking migration. Do not use the old account. The new beneficiary account is detailed in the attachment.

As this payment is already past due, we would appreciate same-day settlement to avoid suspension of service.

There is no need to call to confirm — our accounts team is currently unavailable during the migration, so please reply by email only.

Kind regards,
Accounts Receivable`,
  },
  {
    slug: 'business-proposal',
    label: 'Investment proposal with guaranteed returns',
    kind: 'claim',
    context: 'proposal',
    scenario:
      'A vendor pitches an investment partnership and wants a decision and a deposit before you can do any checks.',
    expectation:
      'Should flag the guaranteed return as critical, the pressure to sign, the upfront payment, and the stated-but-unevidenced credentials.',
    text: `Following our introduction, we would like to formalise the partnership.

Our award-winning, industry-leading platform has partnered with several Fortune 500 clients and delivers a guaranteed 18% return per annum with no risk to capital.

Only 4 allocation slots remain in this round and the window closes by end of day tomorrow. We would need the signed agreement and the initial payment of 250,000 to secure the allocation.

Please sign the NDA before we disclose the detailed financials and client list.`,
  },
  {
    slug: 'bank-safe-account',
    label: 'Caller asking you to move money to a “safe account”',
    kind: 'message',
    context: 'bank_scam',
    scenario:
      'Someone calling themselves your bank’s fraud team says your account is compromised and wants you to act now.',
    expectation:
      'Should flag the safe-account transfer and the remote-access app as critical, plus the block threat and the number supplied in the message.',
    text: `This is the fraud prevention department. We have detected an unauthorised transaction on your account and your account will be blocked within 30 minutes.

Your money is not safe where it is. To protect it, please transfer your balance to the safe account our officer will provide.

To help us verify, kindly install AnyDesk from the Play Store so our technical team can guide you through the steps.

Do not disconnect the call. For any confirmation, contact our customer care on 1800-xxx-9021.`,
  },
  {
    slug: 'upi-collect-refund',
    label: 'UPI request disguised as a refund',
    kind: 'message',
    context: 'bank_scam',
    scenario:
      'A “refund” arrives as a UPI collect request that asks you to enter your PIN to receive the money.',
    expectation:
      'Should flag the UPI collect deception and the PIN request as critical, and explain that entering a PIN always sends money rather than receiving it.',
    text: `Your refund of 4,750 has been initiated against your cancelled order.

To receive the amount, please approve the payment request sent to your UPI app and enter your UPI PIN to confirm the credit.

If the request expires, the refund will be cancelled and cannot be claimed again.`,
  },
  {
    slug: 'benign-bank-notice',
    label: 'Genuine bank notification (control)',
    kind: 'message',
    context: 'bank_scam',
    scenario:
      'An ordinary transaction alert of the kind banks really send — included to check the bank rules do not over-fire.',
    expectation:
      'Should match no bank rules. Mentioning a bank, a card and a balance is not a scam, and the tool must stay quiet.',
    text: `Rs. 2,480.00 debited from your account ending 4417 on 12 Nov at Blue Fig Cafe. Available balance Rs. 18,902.35.

If you did not make this transaction, please review it in your banking app or visit your nearest branch.`,
  },
  {
    slug: 'benign-transactional',
    context: 'generic',
    scenario:
      'An ordinary order-shipped notification, included as a control.',
    label: 'Ordinary transactional message (control)',
    kind: 'message',
    expectation:
      'Should match no rules and should say explicitly that this is not a guarantee the message is genuine.',
    text: `Hi Anita, your order #48217 has shipped and is scheduled to arrive on Thursday. You can track it from the Orders section of your account, or reply to this email if the delivery address needs changing.`,
  },
  {
    slug: 'benign-internal',
    context: 'generic',
    scenario:
      'An ordinary message from a colleague, included as a control.',
    label: 'Ordinary work message (control)',
    kind: 'message',
    expectation: 'Should match no rules — useful for checking the tool does not cry wolf.',
    text:
      'Thanks for the review comments. I have pushed the fix to the feature branch and re-run the test suite; everything passes locally. Could you take another look before standup tomorrow?',
  },
];

export function findDemoCase(slug: string): DemoCase | undefined {
  return DEMO_CASES.find((c) => c.slug === slug);
}
