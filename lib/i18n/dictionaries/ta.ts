import type { Dict } from './en';

/**
 * Tamil, in Tamil script.
 *
 * Written rather than machine-translated, because the register matters more
 * than the words. Every imperative uses the -ungal form: this is a product
 * someone opens frightened, and the familiar -u form reads as an order from a
 * stranger at exactly the wrong moment.
 *
 * Product nouns stay in Latin script — OTP, PIN, UPI, WhatsApp, PDF. That is
 * how they are written on every bank SMS and every phone in Tamil Nadu, and
 * transliterating them would make the interface harder to read, not more
 * Tamil.
 *
 * The brand name is never translated. "TrustLens" on this screen and
 * "TrustLens" on the bank's fraud page have to be the same string, or the
 * product has taught someone to accept a lookalike.
 */
export const ta: Dict = {
  'app.name': 'TrustLens AI',
  'app.tagline': 'நிறுத்துங்கள். சரிபாருங்கள். பிறகு செயல்படுங்கள்.',
  'app.home': 'TrustLens AI — முகப்பு',
  'app.online': 'ஆன்லைன்',
  'app.offline': 'ஆஃப்லைன்',
  'app.footerTeam': 'TrustLens AI · Team Reshiram · DEX26223',
  'app.footerCaveat': 'ஆதாரம் முதன்மையான ஆய்வு. எதுவும் உண்மையானது என்பதற்கு இது ஒருபோதும் உத்தரவாதம் அல்ல.',

  'dock.open': 'கருவிகள்',
  'dock.close': 'மூடு',
  'dock.title': 'கருவிகளும் அமைப்புகளும்',
  'dock.kaval': 'காவலிடம் கேளுங்கள்',
  'dock.kavalHint': 'ஏன் எச்சரிக்கப்பட்டது, அடுத்து என்ன செய்வது',
  'dock.dashboard': 'முகப்பு',
  'dock.dashboardHint': 'உங்கள் எல்லா சோதனைகளுக்கும் திரும்புங்கள்',
  'dock.account': 'உங்கள் கணக்கு',
  'dock.accountHint': 'உள்நுழைவு, பாஸ்கீ, சேமித்த அறிக்கைகள்',
  'dock.privacy': 'தனியுரிமையும் அமைப்புகளும்',
  'dock.privacyHint': 'இந்தச் சாதனத்தை விட்டு எது வெளியே செல்கிறது, எது செல்லவில்லை',
  'dock.story': 'TrustLens எப்படி வேலை செய்கிறது',
  'dock.storyHint': 'ஒவ்வொரு சோதனையும், அதன் எல்லைகளும்',
  'dock.appearance': 'தோற்றம்',
  'dock.appearanceHint': 'வெளிச்சம் அல்லது இருள்',
  'dock.language': 'மொழி',
  'dock.sos': 'ஏற்கெனவே பணம் அனுப்பிவிட்டீர்களா? 1930-ஐ அழையுங்கள்',
  'dock.sosHint': 'இந்தியாவின் சைபர் நிதி மோசடி உதவி எண்',

  'home.status': 'பாதுகாப்பு இயங்குகிறது',
  'home.title1': 'நிறுத்துங்கள். சரிபாருங்கள்.',
  'home.title2': 'பிறகு செயல்படுங்கள்.',
  'home.sub':
    'பணம், விவரங்கள் அல்லது ஒரு தட்டலைக் கேட்கும் எதையும் சரிபாருங்கள் — முடிவு மட்டுமல்ல, அதற்குப் பின்னால் உள்ள ஆதாரத்தையும் பாருங்கள்.',
  'home.startCheck': 'சோதனையைத் தொடங்குங்கள்',
  'home.needHelp': 'எனக்கு இப்போது உதவி வேண்டும்',
  'home.toolsTitle': 'எதைச் சரிபார்க்க விரும்புகிறீர்கள்?',
  'home.toolsNote': 'ஒவ்வொரு அட்டையும் உண்மையான சோதனையைத் திறக்கும்',
  'home.recentTitle': 'உங்கள் சமீபத்திய சோதனைகள்',
  'home.seeAll': 'அனைத்தையும் பாருங்கள்',
  'home.sosTitle': 'ஏற்கெனவே பணம் அனுப்பிவிட்டீர்களா?',
  'home.sosBody':
    'உங்கள் கணக்கிலிருந்து பணம் ஏற்கெனவே வெளியேறியிருந்தால், வேறு எதற்கும் முன் அழையுங்கள். அதை நிறுத்த முடியுமா என்பதை முதல் சில மணி நேரங்களே தீர்மானிக்கின்றன.',
  'home.sosSteps': 'ஒவ்வொரு படியையும் பாருங்கள்',
  'home.promise':
    'நீங்கள் பகிர்ந்து கொள்ளத் தேர்வு செய்வதை மட்டுமே TrustLens ஆய்வு செய்கிறது. மற்ற செயலிகளிலிருந்து செய்திகளையோ, அழைப்புகளையோ, தொடர்புகளையோ அது தானாகப் படிப்பதில்லை.',

  'feature.message.title': 'செய்தி சோதனை',
  'feature.message.blurb': 'உங்களுக்கு வந்த SMS, WhatsApp, மின்னஞ்சல் அல்லது அரட்டைச் செய்தி.',
  'feature.message.action': 'செய்தியைச் சரிபாருங்கள்',
  'feature.link.title': 'இணைப்பு மற்றும் இணையதளச் சோதனை',
  'feature.link.blurb': 'இணைப்பு உண்மையில் எங்கே செல்கிறது, அந்தத் தளம் போலியானதா.',
  'feature.link.action': 'இணைப்பைச் சரிபாருங்கள்',
  'feature.bank.title': 'வங்கி மற்றும் UPI பாதுகாப்பு',
  'feature.bank.blurb': 'OTP, PIN, பணத்திருப்பம் மற்றும் “பாதுகாப்பான கணக்கு” அழுத்தம்.',
  'feature.bank.action': 'பணக் கோரிக்கையைச் சரிபாருங்கள்',
  'feature.job.title': 'வேலை வாய்ப்புச் சோதனை',
  'feature.job.blurb': 'கட்டணமோ வைப்புத்தொகையோ கேட்கும் வேலை செய்திகள்.',
  'feature.job.action': 'வாய்ப்பை ஆய்வு செய்யுங்கள்',
  'feature.invoice.title': 'விலைப்பட்டியல் மற்றும் பணக் கோரிக்கை',
  'feature.invoice.blurb': 'பில்கள், மற்றும் பணம் செல்லும் இடத்தை மாற்றச் சொல்லும் கோரிக்கைகள்.',
  'feature.invoice.action': 'விலைப்பட்டியலை ஆய்வு செய்யுங்கள்',
  'feature.proposal.title': 'முதலீடு மற்றும் சலுகைக் கூற்றுகள்',
  'feature.proposal.blurb': 'உறுதியளிக்கப்பட்ட வருமானம், வைப்புத்தொகை, இப்போதே முடிவெடுக்கும் அழுத்தம்.',
  'feature.proposal.action': 'கூற்றை ஆய்வு செய்யுங்கள்',
  'feature.respond.title': 'ஏற்கெனவே ஏதோ நடந்துவிட்டது',
  'feature.respond.blurb': 'பணம் அனுப்பியது, OTP பகிர்ந்தது, அல்லது ஒரு செயலி நிறுவியது.',
  'feature.respond.action': 'அடுத்த படிகளைப் பெறுங்கள்',
  'feature.alerts.title': 'மோசடி எச்சரிக்கைகள்',
  'feature.alerts.blurb': 'சமீபத்தில் பலர் தெரிவித்த மோசடி முறைகள்.',
  'feature.alerts.action': 'என்ன பரவுகிறது என்று பாருங்கள்',
  'feature.activity.title': 'உங்கள் அறிக்கைகளும் வரலாறும்',
  'feature.activity.blurb': 'பழைய சோதனையை மீண்டும் திறங்கள், அல்லது அறிக்கையாக வெளியே எடுங்கள்.',
  'feature.activity.action': 'உங்கள் அறிக்கைகளைத் திறங்கள்',
  'feature.learn.title': 'TrustLens எப்படி வேலை செய்கிறது',
  'feature.learn.blurb': 'ஒவ்வொரு சோதனையும் என்ன செய்கிறது, என்ன சொல்ல முடியாது.',
  'feature.learn.action': 'எப்படி வேலை செய்கிறது என்று பாருங்கள்',

  'verdict.high_risk': 'வலுவான எச்சரிக்கை அறிகுறிகள்',
  'verdict.high_risk.sub': 'நீங்களே தனியாகச் சரிபார்க்கும் வரை இதைப் பாதுகாப்பற்றதாகவே கருதுங்கள்.',
  'verdict.elevated_risk': 'தீவிர எச்சரிக்கை அறிகுறிகள்',
  'verdict.elevated_risk.sub':
    'நீங்கள் ஏற்கெனவே நம்பும் வழியில் சரிபார்க்கும் வரை இதன் அடிப்படையில் செயல்பட வேண்டாம்.',
  'verdict.some_signals': 'சில எச்சரிக்கை அறிகுறிகள்',
  'verdict.some_signals.sub': 'செயல்படுவதற்கு முன் இன்னொரு முறை பாருங்கள்.',
  'verdict.no_signals_detected': 'எந்த விதியும் பொருந்தவில்லை',
  // The sentence that must survive translation intact.
  'verdict.no_signals_detected.sub':
    'இது பாதுகாப்பானது என்று அர்த்தமல்ல. எங்கள் விதிகள் எதுவும் பொருந்தவில்லை என்பது மட்டுமே — உங்களிடம் ஏற்கெனவே உள்ள எண் மூலம் சரிபாருங்கள்.',

  'share.title': 'மற்றவர்களை எச்சரியுங்கள்',
  'share.lede': 'கண்டறியப்பட்டதன் சுருக்கத்தை அனுப்பும் — உங்கள் முழுச் செய்தியை அல்ல.',
  'share.native': 'பகிருங்கள்…',
  'share.nativeHint': 'WhatsApp, Telegram, மின்னஞ்சல் மற்றும் இந்தச் சாதனத்தில் உள்ள மற்ற அனைத்தும்',
  'share.whatsapp': 'WhatsApp',
  'share.telegram': 'Telegram',
  'share.email': 'மின்னஞ்சல்',
  'share.sms': 'குறுஞ்செய்தி',
  'share.copy': 'நகலெடுங்கள்',
  'share.copied': 'நகலெடுக்கப்பட்டது',
  'share.includeEvidence': 'எச்சரிக்கப்பட்ட சரியான வார்த்தைகளையும் சேர்க்கவும்',
  'share.includeEvidenceHint':
    'மற்றவரை எச்சரிக்க இது உதவும் — ஆனால் உண்மையான செய்தியில் உங்கள் பெயரோ கணக்கின் கடைசி இலக்கங்களோ அதற்குப் பக்கத்தில் இருக்கலாம், ஒருமுறை பகிர்ந்ததை திரும்பப் பெற முடியாது.',
  'share.savePdf': 'PDF ஆகச் சேமியுங்கள்',
  'share.savePdfHint': 'அச்சுப் பலகம் திறக்கும் — “Save as PDF” தேர்வு செய்யுங்கள்',

  'lang.title': 'மொழி',
  'lang.sub': 'முழு இடைமுகத்தையும் மாற்றும்.',
  'lang.detectionNote':
    'இடைமுகத்தின் மொழி மாறும். சோதனை விதிகள் ஆங்கிலம், தமிழ் மற்றும் இந்தியைப் படிக்கின்றன — வேறு மொழியில் உள்ள செய்தியும் ஆய்வு செய்யப்படும், ஆனால் அதே விதிகளைக் கொண்டுதான்.',
  'lang.detectionFull': 'இந்த மொழியை சோதனைகள் உள்ளடக்குகின்றன',
  'lang.detectionNone': 'இடைமுகம் மட்டும் — சோதனைகள் ஆங்கிலம், தமிழ், இந்தி படிக்கின்றன',
  'lang.planned': 'கன்னடம், மலையாளம், வங்காளம் மற்றும் மராத்தி திட்டமிடப்பட்டுள்ளன.',

  /* ------------------------------------------------------ the check screen */
  'check.step1': 'நீங்கள் எதைச் சரிபார்க்கிறீர்கள்?',
  'check.step2': 'செய்தியை, அல்லது இணைப்பை ஒட்டுங்கள்',
  'check.placeholder': 'முழுச் செய்தியையும் இங்கே ஒட்டுங்கள். அதற்குள் உள்ள இணைப்புகளும் ஆய்வு செய்யப்படும்.',
  'check.liveLinks': 'இணைப்புகளை இணையத்தில் சரிபார்',
  'check.cloudAi': 'விருப்பத் தேர்வாக கிளவுட் AI விளக்கத்தை அனுமதி',
  'check.saveAccount': 'கணக்கில் ஒரு நகலைச் சேமி (விருப்பம்)',
  'check.run': 'இதைச் சரிபாருங்கள்',
  'check.running': 'சரிபார்க்கிறது…',
  'check.clear': 'அழி',
  'check.examples': 'ஓர் எடுத்துக்காட்டை முயற்சியுங்கள்',

  'common.back': 'திரும்பு',
  'common.cancel': 'ரத்து செய்',
  'common.close': 'மூடு',
  'common.copy': 'நகலெடு',
  'common.delete': 'நீக்கு',
  'common.loading': 'செயல்படுகிறது…',
  'common.retry': 'மீண்டும் முயற்சி செய்யுங்கள்',
  'common.required': 'சோதனை இயங்கும் முன் இது தேவை.',
  'common.offlineNote': 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். சோதனைகள் இயங்கும் — இணைப்புத் தேடல்கள் இயங்காது.',
  'common.errorGeneric': 'அது முடியவில்லை. சிறிது நேரத்தில் மீண்டும் முயற்சி செய்யுங்கள்.',
  'common.errorRateLimited': 'இப்போது அதிகமான சோதனைகள். சில வினாடிகள் காத்திருந்து மீண்டும் முயற்சி செய்யுங்கள்.',
};
