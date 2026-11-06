import type { AssessmentLevel, SignalSeverity } from '../analysis/types';
import { DEFAULT_LOCALE, isLocale, type Locale } from './locales';

/**
 * The report's own copy — the verdict, the severity words, the section
 * headings and the standing advice.
 *
 * Kept separate from the interface dictionary because these sentences are
 * authored against the analysis types: a new assessment level or severity is
 * a compile error here, which is exactly what you want for the words someone
 * reads before deciding whether to send money.
 *
 * Two things changed from the previous version, both deliberate.
 *
 * It follows the interface language now, instead of having its own picker.
 * Two language controls on one screen is a question nobody should have to
 * answer twice, and the second one was easy to miss — so a Tamil reader got
 * a Tamil interface wrapped around an English report.
 *
 * And Tamil and Hindi are written in their own scripts. They were romanised,
 * on the reasoning that a very large number of speakers type that way on a
 * phone — which is true, and was the right call when nothing else in the
 * product was translated. Now that the interface is in Tamil script,
 * "Ingu periya warning signs irukku" underneath தமிழ் chrome reads as two
 * different products stitched together.
 *
 * Telugu is new here, and comes with the same caveat it carries everywhere:
 * the interface and this copy are Telugu, the detection rules are not.
 */

interface Copy {
  /** The verdict banner, by assessment level. */
  level: Record<AssessmentLevel, { title: string; sub: string }>;
  /** Severity words used on each finding. */
  severity: Record<SignalSeverity, string>;
  /** Section headings a worried person scans for. */
  ui: {
    whatWeFound: string;
    exactText: string;
    whyItMatters: string;
    whatWeChecked: string;
    couldNotCheck: string;
    whatToDo: string;
    askSender: string;
    getHelp: string;
    noSignals: string;
    howEstablished: string;
    deterministic: string;
    retrieved: string;
    inference: string;
  };
  /** The one line that matters most, whatever the verdict. */
  goldenRule: string;
}

const EN: Copy = {
  level: {
    high_risk: {
      title: 'Strong warning signs',
      sub: 'Treat this as unsafe until you have checked it yourself through a channel you already trust.',
    },
    elevated_risk: {
      title: 'Needs verification',
      sub: 'Several things here are worth checking before you act on it.',
    },
    some_signals: {
      title: 'A few things to check',
      sub: 'Nothing conclusive, but verify before sending money or sharing anything.',
    },
    no_signals_detected: {
      title: 'No strong warning signs found',
      sub: 'This is not proof that it is genuine. It only means our checks did not match anything.',
    },
  },
  severity: { critical: 'Critical', high: 'Serious', medium: 'Worth noting', low: 'Minor' },
  ui: {
    whatWeFound: 'What we found',
    exactText: 'The exact words that triggered this',
    whyItMatters: 'Why this matters',
    whatWeChecked: 'What we actually checked',
    couldNotCheck: 'What we could not check',
    whatToDo: 'What to do next',
    askSender: 'Questions to ask the sender',
    getHelp: 'Where to get help',
    noSignals: 'None of our rules matched this text.',
    howEstablished: 'How this was established',
    deterministic: 'Fixed rule',
    retrieved: 'Checked',
    inference: 'AI reading',
  },
  goldenRule:
    'Never share an OTP, PIN or password. Verify using a number you already have — not one from the message.',
};

const TA: Copy = {
  level: {
    high_risk: {
      title: 'வலுவான எச்சரிக்கை அறிகுறிகள்',
      sub: 'நீங்கள் ஏற்கெனவே நம்பும் வழியில் நீங்களே சரிபார்க்கும் வரை இதைப் பாதுகாப்பற்றதாகவே கருதுங்கள்.',
    },
    elevated_risk: {
      title: 'சரிபார்க்க வேண்டியது',
      sub: 'இதில் பல விஷயங்கள் செயல்படுவதற்கு முன் சரிபார்க்கத் தக்கவை.',
    },
    some_signals: {
      title: 'சில விஷயங்களைப் பாருங்கள்',
      sub: 'உறுதியான ஒன்றும் இல்லை. ஆனால் பணம் அனுப்பும் முன்னோ எதையும் பகிரும் முன்னோ சரிபாருங்கள்.',
    },
    no_signals_detected: {
      title: 'வலுவான எச்சரிக்கை அறிகுறிகள் எதுவும் இல்லை',
      sub: 'இது உண்மையானது என்பதற்கு இது ஆதாரம் அல்ல. எங்கள் சோதனைகள் எதுவும் பொருந்தவில்லை என்பது மட்டுமே.',
    },
  },
  severity: { critical: 'மிக முக்கியம்', high: 'தீவிரம்', medium: 'கவனிக்க வேண்டியது', low: 'சிறியது' },
  ui: {
    whatWeFound: 'நாங்கள் கண்டறிந்தது',
    exactText: 'இதைத் தூண்டிய சரியான வார்த்தைகள்',
    whyItMatters: 'இது ஏன் முக்கியம்',
    whatWeChecked: 'நாங்கள் உண்மையில் சரிபார்த்தவை',
    couldNotCheck: 'எங்களால் சரிபார்க்க முடியாதவை',
    whatToDo: 'அடுத்து என்ன செய்வது',
    askSender: 'அனுப்பியவரிடம் கேட்க வேண்டிய கேள்விகள்',
    getHelp: 'உதவி எங்கே கிடைக்கும்',
    noSignals: 'எங்கள் விதிகள் எதுவும் இந்த உரையுடன் பொருந்தவில்லை.',
    howEstablished: 'இது எப்படித் தெரிந்தது',
    deterministic: 'நிலையான விதி',
    retrieved: 'சரிபார்க்கப்பட்டது',
    inference: 'AI கருத்து',
  },
  goldenRule:
    'OTP, PIN அல்லது கடவுச்சொல்லை யாருடனும் பகிராதீர்கள். செய்தியில் உள்ள எண்ணுக்கு அல்ல — உங்களிடம் ஏற்கெனவே உள்ள அதிகாரப்பூர்வ எண்ணில் மட்டுமே சரிபாருங்கள்.',
};

const HI: Copy = {
  level: {
    high_risk: {
      title: 'गंभीर चेतावनी संकेत',
      sub: 'जब तक आप अपने भरोसे के ज़रिए से ख़ुद जाँच न लें, इसे असुरक्षित मानिए।',
    },
    elevated_risk: {
      title: 'जाँचना ज़रूरी है',
      sub: 'कुछ बातें संदिग्ध हैं। कुछ भी करने से पहले जाँच लीजिए।',
    },
    some_signals: {
      title: 'कुछ बातें देख लीजिए',
      sub: 'कुछ पक्का नहीं है। पर पैसे भेजने या कुछ साझा करने से पहले जाँच लीजिए।',
    },
    no_signals_detected: {
      title: 'कोई बड़ी चेतावनी नहीं मिली',
      sub: 'इसका मतलब यह नहीं कि यह असली है। सिर्फ़ इतना कि हमारे नियम मेल नहीं खाए।',
    },
  },
  severity: { critical: 'बेहद गंभीर', high: 'गंभीर', medium: 'ध्यान देने लायक', low: 'छोटा' },
  ui: {
    whatWeFound: 'हमें क्या मिला',
    exactText: 'जिन शब्दों पर यह चेतावनी आई',
    whyItMatters: 'यह क्यों मायने रखता है',
    whatWeChecked: 'हमने असल में क्या जाँचा',
    couldNotCheck: 'जो हम जाँच नहीं सके',
    whatToDo: 'अब क्या करें',
    askSender: 'भेजने वाले से ये सवाल पूछिए',
    getHelp: 'मदद कहाँ मिलेगी',
    noSignals: 'हमारा कोई नियम इस टेक्स्ट से मेल नहीं खाया।',
    howEstablished: 'यह कैसे पता चला',
    deterministic: 'तय नियम',
    retrieved: 'जाँचा गया',
    inference: 'AI की राय',
  },
  goldenRule:
    'OTP, PIN या पासवर्ड किसी को मत दीजिए। संदेश में दिए नंबर पर नहीं — अपने पास पहले से मौजूद आधिकारिक नंबर पर ही जाँच कीजिए।',
};

const TE: Copy = {
  level: {
    high_risk: {
      title: 'బలమైన హెచ్చరిక సంకేతాలు',
      sub: 'మీరు ఇప్పటికే నమ్మే మార్గం ద్వారా మీరే సరిచూసే వరకు దీన్ని సురక్షితం కాదని భావించండి.',
    },
    elevated_risk: {
      title: 'సరిచూడవలసినది',
      sub: 'దీనిలో కొన్ని విషయాలు చర్య తీసుకునే ముందు సరిచూడదగినవి.',
    },
    some_signals: {
      title: 'కొన్ని విషయాలు చూడండి',
      sub: 'ఖచ్చితమైనది ఏమీ లేదు. కానీ డబ్బు పంపే ముందు లేదా ఏదైనా పంచుకునే ముందు సరిచూడండి.',
    },
    no_signals_detected: {
      title: 'బలమైన హెచ్చరిక సంకేతాలేవీ కనిపించలేదు',
      sub: 'ఇది నిజమైనదని దీనికి ఆధారం కాదు. మా తనిఖీలేవీ సరిపోలలేదని మాత్రమే.',
    },
  },
  severity: { critical: 'చాలా తీవ్రం', high: 'తీవ్రం', medium: 'గమనించదగినది', low: 'చిన్నది' },
  ui: {
    whatWeFound: 'మేము కనుగొన్నది',
    exactText: 'దీనిని ప్రేరేపించిన సరిగ్గా ఆ పదాలు',
    whyItMatters: 'ఇది ఎందుకు ముఖ్యం',
    whatWeChecked: 'మేము నిజంగా తనిఖీ చేసినవి',
    couldNotCheck: 'మేము తనిఖీ చేయలేనివి',
    whatToDo: 'తర్వాత ఏం చేయాలి',
    askSender: 'పంపినవారిని అడగవలసిన ప్రశ్నలు',
    getHelp: 'సహాయం ఎక్కడ దొరుకుతుంది',
    noSignals: 'మా నియమాలేవీ ఈ వచనంతో సరిపోలలేదు.',
    howEstablished: 'ఇది ఎలా తెలిసింది',
    deterministic: 'స్థిర నియమం',
    retrieved: 'తనిఖీ చేయబడింది',
    inference: 'AI అభిప్రాయం',
  },
  goldenRule:
    'OTP, PIN లేదా పాస్‌వర్డ్‌ను ఎవరితోనూ పంచుకోవద్దు. సందేశంలోని నంబర్‌కు కాదు — మీ దగ్గర ఇప్పటికే ఉన్న అధికారిక నంబర్‌లో మాత్రమే సరిచూడండి.',
};

const COPY: Record<Locale, Copy> = { en: EN, ta: TA, hi: HI, te: TE };

export function copy(locale: Locale): Copy {
  return COPY[locale] ?? COPY[DEFAULT_LOCALE];
}

/**
 * The language a stored report was written in.
 *
 * Reports saved before the interface had a locale carry no language, and
 * older ones carry 'en' | 'ta' | 'hi'. Both still resolve.
 */
export function readLang(raw: string | null | undefined): Locale {
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/** @deprecated Use `Locale`. Kept so stored reports keep type-checking. */
export type Lang = Locale;
