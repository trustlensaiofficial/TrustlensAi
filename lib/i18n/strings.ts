import type { AssessmentLevel, SignalSeverity } from '../analysis/types';

/**
 * Explanation languages.
 *
 * Scoped deliberately to the decision-critical copy — the verdict, the
 * severity words and the standing advice — rather than the whole interface.
 * Those are the sentences someone acts on, and they are authored per language
 * rather than machine-translated, so the Tanglish reads the way people
 * actually speak rather than like translated English.
 *
 * "Tanglish" is Tamil written in Latin script, which is how a very large
 * number of Tamil speakers actually type and read on a phone. Tamil script is
 * not offered yet because the detector patterns and the narration were not
 * tested in it, and claiming support we have not tested is the one thing this
 * product must never do.
 */
export const LANGS = ['en', 'ta'] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABEL: Record<Lang, string> = {
  en: 'English',
  ta: 'Tamil (Tanglish)',
};

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
  goldenRule: 'Never share an OTP, PIN or password. Verify using a number you already have — not one from the message.',
};

const TA: Copy = {
  level: {
    high_risk: {
      title: 'Ingu periya warning signs irukku',
      sub: 'Idhu safe illa-nu nenachikkonga. Neenga nambura official channel-la check panna varaikkum nambadheenga.',
    },
    elevated_risk: {
      title: 'Verify panna vendiyadhu irukku',
      sub: 'Sila vishayangal sandhegamaa irukku. Act panradhukku munnadi check pannunga.',
    },
    some_signals: {
      title: 'Konjam check panna vendiyadhu irukku',
      sub: 'Confirm-aa onnum illa. Aana panam anuppuradhukko, edhuvum share panradhukko munnadi verify pannunga.',
    },
    no_signals_detected: {
      title: 'Periya warning signs edhuvum kidaikkala',
      sub: 'Idhu genuine-nu proof illa. Namma check panna rules edhukkum match aagala, adhu mattum dhaan.',
    },
  },
  severity: { critical: 'Romba critical', high: 'Seriousaana', medium: 'Kavanikka vendiyadhu', low: 'Chinnadhu' },
  ui: {
    whatWeFound: 'Naanga kandupidichadhu',
    exactText: 'Indha vaarthaigal dhaan flag pannudhu',
    whyItMatters: 'Idhu yen mukkiyam',
    whatWeChecked: 'Naanga nijamaa check panna vishayangal',
    couldNotCheck: 'Naanga check panna mudiyadhadhu',
    whatToDo: 'Adutha step enna',
    askSender: 'Anuppuna aalukitta ketka vendiya kelvigal',
    getHelp: 'Udhavi enga kidaikkum',
    noSignals: 'Namma rules edhuvum indha text-la match aagala.',
    howEstablished: 'Idhu eppadi theriyudhu',
    deterministic: 'Fixed rule',
    retrieved: 'Check pannachu',
    inference: 'AI yosanai',
  },
  goldenRule: 'OTP, PIN, password — yaarukkum share pannadheenga. Message-la irukkira number-ku call pannadheenga; unkitta already irukkira official number-la mattum verify pannunga.',
};

const COPY: Record<Lang, Copy> = { en: EN, ta: TA };

export function copy(lang: Lang): Copy {
  return COPY[lang];
}

/** The language a visitor last chose. Falls back to English. */
export function readLang(raw: string | null | undefined): Lang {
  return raw === 'ta' ? 'ta' : 'en';
}
