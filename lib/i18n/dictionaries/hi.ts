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

  'activity.deleteAll': 'इस डिवाइस से सभी {n} हटाएँ',
  'activity.deleteNote': 'यहाँ हटाने पर वे तुरंत इस ब्राउज़र से मिट जाती हैं।',

  'check.textNote': 'सर्वर पर जाँचा जाता है और सिर्फ़ डेटा की तरह बरता जाता है — मॉडल के लिए निर्देश की तरह कभी नहीं। अपने पासवर्ड या कार्ड नंबर डालने की ज़रूरत नहीं।',
  'check.liveLinksNote': 'सिर्फ़ DNS हल करता है और पेज का मेटाडेटा पढ़ता है। निजी और आंतरिक पते मना कर दिए जाते हैं, और हर रीडायरेक्ट दोबारा जाँचा जाता है।',
  'respond.pick': 'जो सबसे क़रीब हो वही चुनिए। यहाँ आप जो चुनते हैं वह कहीं नहीं भेजा जाता — सलाह आपके ही डिवाइस पर बनती है।',

  'check.liveLinksOffline': 'ऑफ़लाइन उपलब्ध नहीं। शब्द और लिंक की बनावट फिर भी यहीं जाँचे जाते हैं।',

  'respond.question': 'अब तक क्या हो चुका है?',

  /* ---------------------------- contexts, the share page, incident states */
  'ctx.bank_scam': 'बैंक या भुगतान',
  'ctx.bank_scam.hint': 'बैंक, UPI, OTP, रिफ़ंड',
  'ctx.generic': 'संदेश या चैट',
  'ctx.generic.hint': 'SMS, WhatsApp, ईमेल',
  'ctx.website': 'लिंक या वेबसाइट',
  'ctx.website.hint': 'आपको भेजा गया URL',
  'ctx.job_offer': 'नौकरी का प्रस्ताव',
  'ctx.job_offer.hint': 'भर्ती का संदेश',
  'ctx.invoice': 'बिल या इनवॉइस',
  'ctx.invoice.hint': 'भुगतान अनुरोध',
  'ctx.proposal': 'निवेश',
  'ctx.proposal.hint': 'मुनाफ़ा, जमा राशि',
  'check.lede': 'चुनिए आपको क्या मिला, फिर उसे चिपकाइए। आपको चेतावनी संकेत, सटीक सबूत और जो अब भी अज्ञात है — सब दिखेगा।',
  'share.pageTitle': 'यह संदेश जाँचिए',
  'share.pageLede': 'किसी दूसरी ऐप से साझा किया गया। अभी कुछ जाँचा नहीं गया — देख लीजिए, फिर जाँच चलाइए।',
  'share.pageEmpty': 'उस साझा में कुछ नहीं आया। नीचे संदेश चिपकाइए।',
  'act.not_acted': 'बस मुझे मिला',
  'act.not_acted.d': 'मैंने क्लिक नहीं किया, जवाब नहीं दिया, पैसे नहीं भेजे।',
  'act.opened_link': 'मैंने लिंक खोला',
  'act.opened_link.d': 'मैंने दबाया, पर आगे क्या हुआ पक्का नहीं पता।',
  'act.shared_credentials': 'मैंने OTP, PIN या पासवर्ड बताया',
  'act.shared_credentials.d': 'मैंने कोई कोड या खाते की जानकारी लिखी या बोली।',
  'act.installed_app': 'उन्होंने जो ऐप कहा, मैंने इंस्टॉल की',
  'act.installed_app.d': 'उन्होंने कुछ डाउनलोड करने को कहा।',
  'act.remote_access': 'मैंने स्क्रीन शेयर की या रिमोट एक्सेस दिया',
  'act.remote_access.d': 'वे मेरी स्क्रीन देख सकते थे या डिवाइस चला सकते थे।',
  'act.approved_payment': 'मैंने एक भुगतान अनुरोध मंज़ूर किया',
  'act.approved_payment.d': 'मैंने अपना UPI PIN डाला या प्रॉम्प्ट मंज़ूर किया।',
  'act.sent_money': 'मैंने पैसे भेज दिए',
  'act.sent_money.d': 'पैसे मेरे खाते से निकल चुके हैं।',

  /* -------------------------------------------------- screen ledes */
  'screen.activity.lede': 'इसी ब्राउज़र में, इसी डिवाइस पर रखी हैं। बिना नेटवर्क के खुलती हैं — और जब तक आप साइन इन न करें, दूसरे डिवाइस पर नहीं जातीं।',
  'screen.respond.lede': 'सही क़दम इस पर निर्भर करता है कि बात कहाँ तक पहुँची। बताइए क्या हुआ — आपको आम चेतावनी नहीं, वही योजना मिलेगी।',
  'screen.privacy.lede': 'जो उत्पाद आपसे संदिग्ध संदेश चिपकाने को कहता है, उसे अपने बारे में साफ़-साफ़ बताना चाहिए।',
  'screen.alerts.lede': 'कई अलग-अलग रिपोर्टों में पहचाने गए धोखाधड़ी के तरीक़े, साझा संकेतों के हिसाब से समूहबद्ध।',
  'screen.story.lede': 'उत्पाद जो भी जाँच करता है, एक-एक दृश्य में समझाया गया — यह भी कि हर जाँच क्या नहीं बता सकती।',
  'screen.privacy.title': 'आप जो जाँचते हैं उसका क्या होता है',

  /* ------------------------------------------- install and activity */
  'install.title': 'TrustLens को एक टैप की दूरी पर रखिए',
  'install.ios': 'iPhone या iPad पर: Safari में Share दबाइए, फिर “Add to Home Screen” चुनिए।',
  'install.other': 'अगर आपका ब्राउज़र इंस्टॉल करने देता है, तो उसका मेन्यू खोलकर “Install app” या “Add to Home screen” चुनिए।',
  'install.action': 'होम स्क्रीन पर जोड़ें',
  'install.done': 'इंस्टॉल हो गया',
  'activity.emptyTitle': 'अभी तक कुछ नहीं जाँचा',
  'activity.emptyNote': 'आपकी जाँचें इसी डिवाइस पर रहती हैं — वे ऑफ़लाइन भी चलती हैं और खाते की ज़रूरत नहीं।',
  'activity.emptyTitleFull': 'इस डिवाइस पर अभी कोई जाँच नहीं',
  'activity.emptyNoteFull': 'आप जो भी जाँचते हैं वह इसी ब्राउज़र में सहेजा जाता है, इसलिए बिना नेटवर्क के भी फिर खुलता है।',
  'activity.start': 'कुछ जाँचिए',
  'activity.delete': 'यह रिपोर्ट हटाएँ',

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
