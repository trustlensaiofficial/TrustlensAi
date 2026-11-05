/**
 * The labelled benchmark corpus.
 *
 * `docs/PRODUCT_CHARTER.md` §6 item 7 forbids publishing any accuracy figure
 * until measured precision and recall exist. This file is what makes that
 * measurement possible, so two rules govern it:
 *
 *  1. **Nothing here is written to make the numbers look good.** Cases are
 *     added because they are realistic, and whatever score falls out is the
 *     score that gets reported. Tuning the corpus to the detector would make
 *     the resulting figure a decoration rather than a measurement.
 *  2. **The benign half carries equal weight.** A detector that flags
 *     everything scores perfect recall and is useless — worse than useless,
 *     because people stop reading warnings that are always on. Roughly half
 *     of these cases must come back unflagged, and several are deliberately
 *     written to look alarming while being completely ordinary.
 *
 * `scam: true` means a person acting on this message would plausibly lose
 * money, credentials or device control. `scam: false` means the message is
 * genuinely ordinary, even where it mentions OTPs, KYC, refunds or money.
 */

import type { InputContext } from '../../lib/analysis/types';

export type Language = 'en' | 'ta-latin' | 'ta' | 'hi-latin' | 'hi';

export type Category =
  | 'bank_impersonation'
  | 'upi_payment'
  | 'otp_credential'
  | 'remote_access'
  | 'job_offer'
  | 'invoice'
  | 'investment'
  | 'lottery_prize'
  | 'delivery'
  | 'impersonation'
  | 'phishing_link'
  | 'ordinary';

export interface CorpusCase {
  id: string;
  text: string;
  scam: boolean;
  language: Language;
  category: Category;
  /** The context a user would plausibly have selected, if any. */
  context?: InputContext;
  /** Why this case is in the corpus, where that is not obvious. */
  note?: string;
}

/* ------------------------------------------------------------ English scam */

const EN_SCAM: CorpusCase[] = [
  {
    id: 'en.s.kyc',
    text: 'Dear customer, your bank account will be blocked within 30 minutes. Complete your KYC immediately by clicking http://sbi-kyc-verify.example.com/update or your funds will be frozen.',
    scam: true, language: 'en', category: 'bank_impersonation', context: 'bank_scam',
  },
  {
    id: 'en.s.safe_account',
    text: 'This is the fraud prevention department. We detected an unauthorised transaction. Your money is not safe where it is. Transfer your balance to the safe account our officer will provide. Do not disconnect the call.',
    scam: true, language: 'en', category: 'bank_impersonation', context: 'bank_scam',
    note: 'The canonical safe-account scam. The wording that earlier read as no transfer demand at all.',
  },
  {
    id: 'en.s.refund_collect',
    text: 'Your order was cancelled. Refund of Rs 2,499 is pending. Accept the request and enter your UPI PIN to receive it.',
    scam: true, language: 'en', category: 'upi_payment',
    note: 'A UPI PIN authorises a debit. The claim and the mechanism contradict.',
  },
  {
    id: 'en.s.qr_refund',
    text: 'Scan this QR code to receive your cashback of Rs 500 in your account instantly.',
    scam: true, language: 'en', category: 'upi_payment',
  },
  {
    id: 'en.s.upi_uri',
    text: 'Claim your refund now: upi://collect?pa=refunds@okaxis&pn=Refund%20Cell&am=2499&cu=INR',
    scam: true, language: 'en', category: 'upi_payment',
  },
  {
    id: 'en.s.otp_share',
    text: 'To cancel the unauthorised transaction, please share the OTP you just received with our verification officer immediately.',
    scam: true, language: 'en', category: 'otp_credential',
  },
  {
    id: 'en.s.anydesk',
    text: 'To help us verify your account, kindly install AnyDesk from the Play Store so our technical team can guide you through the steps.',
    scam: true, language: 'en', category: 'remote_access',
  },
  {
    id: 'en.s.job_fee',
    text: 'Congratulations! You are selected for a work from home job with salary Rs 45,000 per month. No interview required. Pay a refundable registration fee of Rs 1,500 to confirm your offer letter today.',
    scam: true, language: 'en', category: 'job_offer', context: 'job_offer',
  },
  {
    id: 'en.s.job_docs',
    text: 'You are shortlisted. Send your Aadhaar card, PAN card and a cancelled cheque photo on WhatsApp to complete onboarding. Processing charge Rs 999 payable to the HR account.',
    scam: true, language: 'en', category: 'job_offer', context: 'job_offer',
  },
  {
    id: 'en.s.invoice_change',
    text: 'Please note our bank details have changed with immediate effect. Kindly remit the pending invoice amount to the new account number given below. Urgent, the old account is closed.',
    scam: true, language: 'en', category: 'invoice', context: 'invoice',
  },
  {
    id: 'en.s.investment',
    text: 'Join our premium trading group. Guaranteed returns of 20% per month with zero risk. Limited seats. Deposit minimum Rs 10,000 today and withdraw anytime.',
    scam: true, language: 'en', category: 'investment',
  },
  {
    id: 'en.s.withdrawal_fee',
    text: 'Your trading profit of Rs 1,84,000 is ready. To release the withdrawal you must first pay the 8% tax clearance fee to the account below.',
    scam: true, language: 'en', category: 'investment',
  },
  {
    id: 'en.s.lottery',
    text: 'Congratulations! Your mobile number has won Rs 25,00,000 in the KBC lucky draw. To claim your prize, send your bank details and pay the processing fee of Rs 5,600.',
    scam: true, language: 'en', category: 'lottery_prize',
  },
  {
    id: 'en.s.electricity',
    // The number is digit-shaped on purpose. It was written 90XXXXXX21, and
    // the redaction was the only reason this case failed: `channel.supplied_number`
    // needs digits to recognise "contact our officer <mobile>", so the corpus
    // was measuring a message no scammer would ever send. 9000000021 is
    // obviously synthetic and still exercises the rule a real one would.
    text: 'Dear consumer, your electricity connection will be disconnected tonight at 9:30 pm as your previous month bill was not updated. Immediately contact our officer 9000000021.',
    scam: true, language: 'en', category: 'impersonation',
  },
  {
    id: 'en.s.parcel_customs',
    text: 'Your parcel is held at customs due to prohibited items. A legal case may be filed against your Aadhaar. Pay the clearance charge immediately and do not share this with anyone.',
    scam: true, language: 'en', category: 'delivery',
  },
  {
    id: 'en.s.phishing_link',
    text: 'Your Netflix payment failed. Update your card details at http://netfIix-billing.example.com/pay to avoid cancellation within 24 hours.',
    scam: true, language: 'en', category: 'phishing_link',
    note: 'Capital I substituted for the l in Netflix.',
  },
  {
    id: 'en.s.family_emergency',
    text: 'Hi, this is your uncle. I lost my phone and this is my new number. I am stuck at the hospital and need Rs 20,000 urgently. Please transfer to this account, I will return it tomorrow. Do not call, I cannot talk now.',
    scam: true, language: 'en', category: 'impersonation',
  },
  {
    id: 'en.s.sim_block',
    text: 'Your SIM card will be deactivated within 2 hours as per new TRAI rules. Click http://trai-kyc-update.example.net and submit your details to keep your number active.',
    scam: true, language: 'en', category: 'impersonation',
  },
];

/* ---------------------------------------------------------- English benign */

const EN_BENIGN: CorpusCase[] = [
  {
    id: 'en.b.otp_received',
    text: 'I got the OTP for the train booking, it is on my phone. Shall I complete the payment now?',
    scam: false, language: 'en', category: 'ordinary',
    note: 'Mentions an OTP with no demand. This exact wording was once a false positive.',
  },
  {
    id: 'en.b.bank_debit_alert',
    text: 'Dear Customer, Rs 450.00 has been debited from your A/c XX4471 on 02-11-26 to VPA swiggy@icici. Not you? Call the number on your card.',
    scam: false, language: 'en', category: 'ordinary',
    note: 'A real bank alert. Mentions debit, VPA and an account; demands nothing.',
  },
  {
    id: 'en.b.real_kyc_notice',
    text: 'Your periodic KYC update is due. Please visit any branch with your original documents at your convenience before 31 March. No action is needed online.',
    scam: false, language: 'en', category: 'ordinary',
    note: 'Genuine KYC language with no urgency, link or payment.',
  },
  {
    id: 'en.b.delivery',
    text: 'Your order will be delivered today between 2 and 6 pm. The delivery partner may call you on your registered number.',
    scam: false, language: 'en', category: 'delivery',
  },
  {
    id: 'en.b.interview',
    text: 'Thank you for applying. We would like to invite you for a technical interview on Thursday at 11 am. Please reply with your availability. There is no fee at any stage of our process.',
    scam: false, language: 'en', category: 'job_offer', context: 'job_offer',
  },
  {
    id: 'en.b.real_invoice',
    text: 'Please find attached invoice INV-2026-0481 for the November consignment, payable within 30 days to our usual account as per the contract.',
    scam: false, language: 'en', category: 'invoice', context: 'invoice',
  },
  {
    id: 'en.b.upi_bill',
    text: 'Here is the electricity bill payment link for this month: upi://pay?pa=tneb@okhdfc&am=1240&cu=INR',
    scam: false, language: 'en', category: 'upi_payment',
    note: 'A real payment request with no deceptive framing. Must not be flagged as a scam.',
  },
  {
    id: 'en.b.family',
    text: 'Amma, I reached the station safely. Will call you after dinner. Do not worry.',
    scam: false, language: 'en', category: 'ordinary',
  },
  {
    id: 'en.b.refund_genuine',
    text: 'Your refund of Rs 799 has been processed and will be credited to your original payment method within 5 to 7 working days. No action is required from you.',
    scam: false, language: 'en', category: 'ordinary',
    note: 'A genuine refund: mentions a refund and an amount, asks for nothing.',
  },
  {
    id: 'en.b.account_notice',
    text: 'We have updated our terms of service. Your account remains active and no action is needed. You can read the changes in the app under Settings.',
    scam: false, language: 'en', category: 'ordinary',
  },
  {
    id: 'en.b.password_reset',
    text: 'We received a request to reset your password. If this was you, use the button in the official app. If it was not you, ignore this message and your password stays unchanged.',
    scam: false, language: 'en', category: 'ordinary',
  },
  {
    id: 'en.b.salary',
    text: 'Your salary for October has been credited. Payslip is available on the employee portal.',
    scam: false, language: 'en', category: 'ordinary',
  },
  {
    id: 'en.b.friend_money',
    text: 'Can you send me the 500 I owe you for the tickets? No hurry, whenever you get a chance.',
    scam: false, language: 'en', category: 'ordinary',
    note: 'A real person asking for real money. Ordinary life, not fraud.',
  },
  {
    id: 'en.b.appointment',
    text: 'Your appointment at the clinic is confirmed for Monday 10:30 am. Please arrive 10 minutes early and bring your previous reports.',
    scam: false, language: 'en', category: 'ordinary',
  },
  {
    id: 'en.b.otp_warning',
    text: 'Never share your OTP or UPI PIN with anyone, including bank staff. Your bank will never ask for it.',
    scam: false, language: 'en', category: 'ordinary',
    note: 'A safety warning. Contains every keyword and is the opposite of a scam.',
  },
  {
    id: 'en.b.genuine_support',
    text: 'Thanks for contacting support. Your ticket number is 884213. We will update you by email within one working day.',
    scam: false, language: 'en', category: 'ordinary',
  },
];

/* ------------------------------------------- Tamil in Latin script (scam) */

const TA_LATIN_SCAM: CorpusCase[] = [
  {
    id: 'ta.l.s.otp',
    text: 'Ungal account block aagum. OTP number udane sollunga, illana account close aagiddum.',
    scam: true, language: 'ta-latin', category: 'otp_credential',
  },
  {
    id: 'ta.l.s.upi_pin',
    text: 'Refund varuthu sir. UPI PIN enter pannunga, money ungaluku varum. Seekiram pannunga.',
    scam: true, language: 'ta-latin', category: 'upi_payment',
  },
  {
    id: 'ta.l.s.money',
    text: 'Ungaluku lottery jeichirukku. Processing fee 3500 rupees ippo anuppunga, prize money udane varum.',
    scam: true, language: 'ta-latin', category: 'lottery_prize',
  },
  {
    id: 'ta.l.s.bank',
    text: 'Bank manager pesuren. Ungal KYC update aagala. Indha link click pannунga illana account freeze aagum.',
    scam: true, language: 'ta-latin', category: 'bank_impersonation', context: 'bank_scam',
  },
  {
    id: 'ta.l.s.job',
    text: 'Work from home job irukku, salary 35000. Interview illa. Registration fee 1200 pay pannunga, offer letter udane anuppurom.',
    scam: true, language: 'ta-latin', category: 'job_offer', context: 'job_offer',
  },
  {
    id: 'ta.l.s.app',
    text: 'Verification ku indha app download pannunga, naanga screen la guide pannurom. Yaarukkum sollakoodadhu.',
    scam: true, language: 'ta-latin', category: 'remote_access',
  },
];

/* ----------------------------------------- Tamil in Latin script (benign) */

const TA_LATIN_BENIGN: CorpusCase[] = [
  {
    id: 'ta.l.b.family',
    text: 'Amma, naan office la irukken. Saaptutu veetuku varuven. Kavala padatheenga.',
    scam: false, language: 'ta-latin', category: 'ordinary',
  },
  {
    id: 'ta.l.b.otp_mention',
    text: 'Train ticket OTP vandhuchu, naan payment complete panniten. Ticket phone la irukku.',
    scam: false, language: 'ta-latin', category: 'ordinary',
    note: 'Mentions OTP and payment; nobody is being asked for anything.',
  },
  {
    id: 'ta.l.b.money_friend',
    text: 'Machan, antha 500 rupees next week tharen. Ippo konjam kashtam.',
    scam: false, language: 'ta-latin', category: 'ordinary',
  },
  {
    id: 'ta.l.b.warning',
    text: 'Yaarukkum OTP or UPI PIN sollakoodadhu. Bank staff kooda kekka maatanga.',
    scam: false, language: 'ta-latin', category: 'ordinary',
    note: 'A safety warning in Tamil. Keyword-dense and benign.',
  },
  {
    id: 'ta.l.b.delivery',
    text: 'Ungal order indha evening delivery aagum. Delivery boy call pannuvaar.',
    scam: false, language: 'ta-latin', category: 'delivery',
  },
];

/* ------------------------------------------------- Tamil script (scam) */

const TA_SCAM: CorpusCase[] = [
  {
    id: 'ta.s.otp',
    text: 'உங்கள் வங்கிக் கணக்கு முடக்கப்படும். உடனே OTP எண்ணை சொல்லுங்கள்.',
    scam: true, language: 'ta', category: 'otp_credential',
  },
  {
    id: 'ta.s.upi',
    text: 'உங்களுக்கு பணம் திரும்ப வர வேண்டும். UPI PIN போட்டால் உடனே கணக்கில் சேரும்.',
    scam: true, language: 'ta', category: 'upi_payment',
  },
  {
    id: 'ta.s.kyc',
    text: 'KYC புதுப்பிக்கப்படவில்லை. இந்த இணைப்பை அழுத்தி விவரங்களை பூர்த்தி செய்யுங்கள், இல்லையெனில் கணக்கு முடக்கப்படும்.',
    scam: true, language: 'ta', category: 'bank_impersonation', context: 'bank_scam',
  },
];

/* ------------------------------------------------ Tamil script (benign) */

const TA_BENIGN: CorpusCase[] = [
  {
    id: 'ta.b.family',
    text: 'அம்மா, நான் பாதுகாப்பாக வந்து சேர்ந்தேன். இரவு உணவுக்குப் பிறகு அழைக்கிறேன்.',
    scam: false, language: 'ta', category: 'ordinary',
  },
  {
    id: 'ta.b.warning',
    text: 'உங்கள் OTP அல்லது UPI PIN யாருக்கும் சொல்ல வேண்டாம். வங்கி ஊழியர்கள் கேட்க மாட்டார்கள்.',
    scam: false, language: 'ta', category: 'ordinary',
  },
];

/* --------------------------------------- Hindi in Latin script (scam) */

const HI_LATIN_SCAM: CorpusCase[] = [
  {
    id: 'hi.l.s.otp',
    text: 'Aapka account band ho jayega. Turant OTP bataiye warna paisa block ho jayega.',
    scam: true, language: 'hi-latin', category: 'otp_credential',
  },
  {
    id: 'hi.l.s.upi',
    text: 'Refund ke liye UPI PIN daliye, paisa turant aapke khate mein aa jayega.',
    scam: true, language: 'hi-latin', category: 'upi_payment',
  },
  {
    id: 'hi.l.s.safe',
    text: 'Main bank se bol raha hoon. Aapka paisa surakshit nahi hai. Turant safe account mein transfer kar dijiye.',
    scam: true, language: 'hi-latin', category: 'bank_impersonation', context: 'bank_scam',
  },
  {
    id: 'hi.l.s.job',
    text: 'Ghar baithe kaam kijiye, salary 40000 mahina. Koi interview nahi. Registration fees 1500 bhejiye aur offer letter paiye.',
    scam: true, language: 'hi-latin', category: 'job_offer', context: 'job_offer',
  },
];

/* ------------------------------------- Hindi in Latin script (benign) */

const HI_LATIN_BENIGN: CorpusCase[] = [
  {
    id: 'hi.l.b.family',
    text: 'Maa, main station pahunch gaya hoon. Khana khane ke baad phone karunga.',
    scam: false, language: 'hi-latin', category: 'ordinary',
  },
  {
    id: 'hi.l.b.warning',
    text: 'Apna OTP ya UPI PIN kisi ko mat bataiye. Bank wale kabhi nahi puchhte.',
    scam: false, language: 'hi-latin', category: 'ordinary',
  },
  {
    id: 'hi.l.b.friend',
    text: 'Bhai wo 500 rupaye agle hafte de dunga, abhi thoda tight hai.',
    scam: false, language: 'hi-latin', category: 'ordinary',
  },
];

/* --------------------------------------------- Hindi script (scam/benign) */

const HI_SCAM: CorpusCase[] = [
  {
    id: 'hi.s.otp',
    text: 'आपका खाता बंद हो जाएगा। तुरंत OTP बताइए वरना पैसा रुक जाएगा।',
    scam: true, language: 'hi', category: 'otp_credential',
  },
  {
    id: 'hi.s.upi',
    text: 'रिफंड पाने के लिए UPI PIN डालिए, पैसा तुरंत आपके खाते में आ जाएगा।',
    scam: true, language: 'hi', category: 'upi_payment',
  },
];

const HI_BENIGN: CorpusCase[] = [
  {
    id: 'hi.b.family',
    text: 'माँ, मैं सुरक्षित पहुँच गया हूँ। खाना खाने के बाद फ़ोन करूँगा।',
    scam: false, language: 'hi', category: 'ordinary',
  },
  {
    id: 'hi.b.warning',
    text: 'अपना OTP या UPI PIN किसी को न बताएं। बैंक कर्मचारी कभी नहीं पूछते।',
    scam: false, language: 'hi', category: 'ordinary',
  },
];

export const CORPUS: CorpusCase[] = [
  ...EN_SCAM, ...EN_BENIGN,
  ...TA_LATIN_SCAM, ...TA_LATIN_BENIGN,
  ...TA_SCAM, ...TA_BENIGN,
  ...HI_LATIN_SCAM, ...HI_LATIN_BENIGN,
  ...HI_SCAM, ...HI_BENIGN,
];

export const LANGUAGES: Language[] = ['en', 'ta-latin', 'ta', 'hi-latin', 'hi'];

export function casesFor(language: Language): CorpusCase[] {
  return CORPUS.filter((c) => c.language === language);
}
