import type { Dict } from './en';

/**
 * Hindi, in Devanagari.
 *
 * Written rather than machine-translated. The register is आप throughout —
 * someone opens this product frightened, and तुम from a stranger at that
 * moment reads as an instruction rather than help.
 *
 * Product nouns stay in Latin script — OTP, PIN, UPI, WhatsApp, PDF. That is
 * how every bank SMS in India writes them, and transliterating them into
 * Devanagari would make the interface slower to read, not more Hindi.
 *
 * The brand name is never translated: "TrustLens" here and "TrustLens" on a
 * bank's fraud page must be the same string, or the product has taught
 * someone to accept a lookalike.
 */
export const hi: Dict = {
  'app.name': 'TrustLens AI',
  'app.tagline': 'रुकिए। जाँचिए। फिर कीजिए।',
  'app.home': 'TrustLens AI — होम',
  'app.online': 'ऑनलाइन',
  'app.offline': 'ऑफ़लाइन',
  'app.footerTeam': 'TrustLens AI · Team Reshiram · DEX26223',
  'app.footerCaveat': 'सबूत पर आधारित जाँच। यह कभी इस बात की गारंटी नहीं कि कुछ असली है।',

  'dock.open': 'टूल्स',
  'dock.close': 'बंद करें',
  'dock.title': 'टूल्स और सेटिंग्स',
  'dock.kaval': 'कवल से पूछिए',
  'dock.kavalHint': 'चेतावनी क्यों आई, और आगे क्या करें',
  'dock.dashboard': 'होम',
  'dock.dashboardHint': 'अपनी सभी जाँचों पर वापस',
  'dock.account': 'आपका खाता',
  'dock.accountHint': 'साइन-इन, पासकी और सहेजी गई रिपोर्ट',
  'dock.privacy': 'निजता और सेटिंग्स',
  'dock.privacyHint': 'इस डिवाइस से क्या बाहर जाता है, और क्या नहीं',
  'dock.story': 'TrustLens कैसे काम करता है',
  'dock.storyHint': 'हर जाँच, और उसकी सीमाएँ',
  'dock.appearance': 'रूप',
  'dock.appearanceHint': 'हल्का या गहरा',
  'dock.language': 'भाषा',
  'dock.sos': 'पैसे भेज चुके हैं? 1930 पर कॉल करें',
  'dock.sosHint': 'भारत की साइबर वित्तीय धोखाधड़ी हेल्पलाइन',

  'home.status': 'सुरक्षा चालू है',
  'home.title1': 'रुकिए। जाँचिए।',
  'home.title2': 'फिर कीजिए।',
  'home.sub':
    'जो भी आपसे पैसे, जानकारी या एक टैप माँगे, उसे जाँचिए — सिर्फ़ नतीजा नहीं, उसके पीछे का सबूत भी देखिए।',
  'home.startCheck': 'जाँच शुरू करें',
  'home.needHelp': 'मुझे अभी मदद चाहिए',
  'home.toolsTitle': 'आप क्या जाँचना चाहते हैं?',
  'home.toolsNote': 'हर कार्ड एक असली जाँच खोलता है',
  'home.recentTitle': 'आपकी हाल की जाँचें',
  'home.seeAll': 'सब देखें',
  'home.sosTitle': 'पैसे भेज चुके हैं?',
  'home.sosBody':
    'अगर पैसे आपके खाते से निकल चुके हैं, तो किसी और काम से पहले कॉल कीजिए। पहले कुछ घंटे ही तय करते हैं कि उन्हें रोका जा सकता है या नहीं।',
  'home.sosSteps': 'हर क़दम देखें',
  'home.promise':
    'TrustLens सिर्फ़ वही जाँचता है जो आप उसे देना चुनते हैं। यह दूसरी ऐप्स के संदेश, कॉल या संपर्क अपने आप नहीं पढ़ता।',

  'feature.message.title': 'संदेश जाँच',
  'feature.message.blurb': 'आपको आया कोई SMS, WhatsApp, ईमेल या चैट।',
  'feature.message.action': 'संदेश जाँचें',
  'feature.link.title': 'लिंक और वेबसाइट जाँच',
  'feature.link.blurb': 'लिंक असल में कहाँ ले जाता है, और साइट नक़ली तो नहीं।',
  'feature.link.action': 'लिंक जाँचें',
  'feature.bank.title': 'बैंक और UPI सुरक्षा',
  'feature.bank.blurb': 'OTP, PIN, रिफ़ंड और “सुरक्षित खाते” का दबाव।',
  'feature.bank.action': 'भुगतान अनुरोध जाँचें',
  'feature.job.title': 'नौकरी के प्रस्ताव की जाँच',
  'feature.job.blurb': 'ऐसे भर्ती संदेश जो फ़ीस या जमा राशि माँगते हैं।',
  'feature.job.action': 'प्रस्ताव देखें',
  'feature.invoice.title': 'बिल और भुगतान अनुरोध',
  'feature.invoice.blurb': 'बिल, और पैसे कहाँ भेजे जाएँ यह बदलने के अनुरोध।',
  'feature.invoice.action': 'बिल देखें',
  'feature.proposal.title': 'निवेश और पेशकश के दावे',
  'feature.proposal.blurb': 'पक्के मुनाफ़े का वादा, जमा राशि, और अभी फ़ैसला करने का दबाव।',
  'feature.proposal.action': 'दावा देखें',
  'feature.respond.title': 'कुछ हो चुका है',
  'feature.respond.blurb': 'पैसे भेज दिए, OTP बता दिया, या कोई ऐप इंस्टॉल कर ली।',
  'feature.respond.action': 'अगले क़दम देखें',
  'feature.alerts.title': 'धोखाधड़ी चेतावनियाँ',
  'feature.alerts.blurb': 'हाल में कई लोगों ने जो तरीक़े बताए हैं।',
  'feature.alerts.action': 'देखें क्या चल रहा है',
  'feature.activity.title': 'आपकी रिपोर्ट और इतिहास',
  'feature.activity.blurb': 'पुरानी जाँच फिर खोलें, या रिपोर्ट के रूप में निकालें।',
  'feature.activity.action': 'अपनी रिपोर्ट खोलें',
  'feature.learn.title': 'TrustLens कैसे काम करता है',
  'feature.learn.blurb': 'हर जाँच क्या करती है, और क्या नहीं बता सकती।',
  'feature.learn.action': 'देखें यह कैसे काम करता है',

  'verdict.high_risk': 'पक्के चेतावनी संकेत',
  'verdict.high_risk.sub': 'जब तक आप ख़ुद अलग से जाँच न लें, इसे असुरक्षित ही मानिए।',
  'verdict.elevated_risk': 'गंभीर चेतावनी संकेत',
  'verdict.elevated_risk.sub':
    'जिस ज़रिए पर आप पहले से भरोसा करते हैं, उससे जाँचे बिना इस पर कुछ न कीजिए।',
  'verdict.some_signals': 'कुछ चेतावनी संकेत',
  'verdict.some_signals.sub': 'कुछ करने से पहले एक बार और देख लीजिए।',
  'verdict.no_signals_detected': 'कोई नियम मेल नहीं खाया',
  // The sentence that must survive translation intact.
  'verdict.no_signals_detected.sub':
    'इसका मतलब सुरक्षित नहीं है। सिर्फ़ इतना कि हमारा कोई नियम मेल नहीं खाया — अपने पास पहले से मौजूद नंबर से जाँच लीजिए।',

  'share.title': 'किसी और को सावधान कीजिए',
  'share.lede': 'जो मिला उसका छोटा सारांश भेजता है — आपका पूरा संदेश नहीं।',
  'share.native': 'साझा करें…',
  'share.nativeHint': 'WhatsApp, Telegram, ईमेल और इस डिवाइस पर मौजूद बाक़ी सब',
  'share.whatsapp': 'WhatsApp',
  'share.telegram': 'Telegram',
  'share.email': 'ईमेल',
  'share.sms': 'टेक्स्ट संदेश',
  'share.copy': 'कॉपी करें',
  'share.copied': 'कॉपी हो गया',
  'share.includeEvidence': 'जिन शब्दों पर चेतावनी आई, वे भी जोड़ें',
  'share.includeEvidenceHint':
    'किसी को सावधान करने में मदद करता है — पर असली संदेश में अक्सर आपका नाम या खाते के आख़िरी अंक पास ही होते हैं, और एक बार भेजा हुआ वापस नहीं आता।',
  'share.savePdf': 'PDF के रूप में सहेजें',
  'share.savePdfHint': 'प्रिंट विंडो खुलेगी — “Save as PDF” चुनिए',

  'lang.title': 'भाषा',
  'lang.sub': 'पूरा इंटरफ़ेस बदल देता है।',
  'lang.detectionNote':
    'इंटरफ़ेस की भाषा बदलती है। जाँच के नियम अंग्रेज़ी, तमिल और हिन्दी पढ़ते हैं — किसी और भाषा का संदेश भी जाँचा जाएगा, पर इन्हीं नियमों से।',
  'lang.detectionFull': 'जाँच इस भाषा को कवर करती है',
  'lang.detectionNone': 'सिर्फ़ इंटरफ़ेस — जाँच अंग्रेज़ी, तमिल और हिन्दी पढ़ती है',
  'lang.planned': 'कन्नड़, मलयालम, बांग्ला और मराठी की योजना है।',

  /* ------------------------------------------------------- the opening */
  'open.line': 'किसी संदेश, लिंक या भुगतान अनुरोध पर कुछ करने से पहले उसे जाँचिए — और हर जवाब के पीछे का सबूत भी देखिए।',
  'open.start': 'शुरू कीजिए',
  'open.haveAccount': 'पहले से खाता है?',
  'open.signIn': 'साइन इन कीजिए',
  'open.promise': 'TrustLens सिर्फ़ वही जाँचता है जो आप उसे देना चुनते हैं। यह आपके संदेश, कॉल या संपर्क अपने आप नहीं पढ़ सकता।',

  /* ------------------------------------------------------ the check screen */
  'check.step1': 'आप क्या जाँच रहे हैं?',
  'check.step2': 'संदेश, या लिंक यहाँ चिपकाइए',
  'check.placeholder': 'पूरा संदेश यहाँ चिपकाइए। उसके अंदर के लिंक भी जाँचे जाते हैं।',
  'check.liveLinks': 'लिंक को नेटवर्क पर जाँचें',
  'check.cloudAi': 'वैकल्पिक क्लाउड AI व्याख्या की अनुमति दें',
  'check.saveAccount': 'खाते में एक प्रति सहेजें (वैकल्पिक)',
  'check.run': 'इसे जाँचिए',
  'check.running': 'जाँच हो रही है…',
  'check.clear': 'साफ़ करें',
  'check.examples': 'एक उदाहरण आज़माइए',

  'common.back': 'वापस',
  'common.cancel': 'रद्द करें',
  'common.close': 'बंद करें',
  'common.copy': 'कॉपी करें',
  'common.delete': 'हटाएँ',
  'common.loading': 'चल रहा है…',
  'common.retry': 'फिर कोशिश करें',
  'common.required': 'जाँच चलने से पहले यह ज़रूरी है।',
  'common.offlineNote': 'आप ऑफ़लाइन हैं। जाँचें फिर भी चलेंगी — लिंक की जाँच नहीं।',
  'common.errorGeneric': 'यह पूरा नहीं हुआ। थोड़ी देर में फिर कोशिश कीजिए।',
  'common.errorRateLimited': 'अभी बहुत सारी जाँचें हो गईं। कुछ सेकंड रुककर फिर कोशिश कीजिए।',
};
