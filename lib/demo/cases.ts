import type { InputKind } from '../analysis/types';

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
  /** What a reviewer should watch for when they run it. */
  expectation: string;
  text: string;
}

export const DEMO_CASES: DemoCase[] = [
  {
    slug: 'digital-arrest',
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
    label: 'Bank phishing SMS with a lookalike link',
    kind: 'message',
    expectation:
      'Should flag the one-time-code request as critical and identify that the link\'s registrable domain is not the bank\'s.',
    text: `Dear Customer, your account will be suspended within 24 hours due to incomplete KYC. Please verify your account immediately at https://hdfcbank.com.kyc-update-secure.xyz/verify

Share the OTP sent to your registered mobile number with our executive to complete verification. Last warning.`,
  },
  {
    slug: 'deepfake-payment',
    label: 'Video-call payment instruction (deepfake pattern)',
    kind: 'message',
    expectation:
      'Should flag the secrecy demand and the irreversible transfer, and should state plainly that it cannot assess whether a video call was synthetic.',
    text: `Following our video call just now, please proceed with the transfer we discussed. As this relates to a confidential acquisition, do not discuss it with anyone in the finance team or the wider office until the announcement.

Wire transfer the first tranche today to the account in the attached instructions. I am travelling, so reply here rather than calling the office line.`,
  },
  {
    slug: 'lookalike-url',
    label: 'Lookalike domain on its own',
    kind: 'url',
    expectation:
      'Should identify the brand-in-subdomain trick and name the real registrable domain. With live checks on, it also reports what the host actually returned.',
    text: 'https://paypal.com.account-verify.secure-id.top/signin',
  },
  {
    slug: 'health-claim',
    label: 'Viral health claim',
    kind: 'claim',
    expectation:
      'Should flag the absolute language and the unidentified study, and should state that no fact database was queried.',
    text:
      'A new study proves that this common kitchen spice completely cures type 2 diabetes in three weeks. Doctors don\'t want you to know because it would end their income from medication.',
  },
  {
    slug: 'benign-transactional',
    label: 'Ordinary transactional message (control)',
    kind: 'message',
    expectation:
      'Should match no rules and should say explicitly that this is not a guarantee the message is genuine.',
    text: `Hi Anita, your order #48217 has shipped and is scheduled to arrive on Thursday. You can track it from the Orders section of your account, or reply to this email if the delivery address needs changing.`,
  },
  {
    slug: 'benign-internal',
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
