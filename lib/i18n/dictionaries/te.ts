import type { Dict } from './en';

/**
 * Telugu, in Telugu script.
 *
 * One thing about this language is different from the others and has to stay
 * visible in the product: the detection rules do not read Telugu. The
 * interface is translated; `lib/analysis` has measured coverage in English,
 * Tamil and Hindi only, and a Telugu message is analysed with those rules.
 *
 * That is why `lang.detectionNone` exists and why `LOCALE_INFO.te` carries
 * `detectionCoverage: 'none'`. Translating a button is not the same as
 * teaching the detector a language, and a product whose entire argument is
 * that it does not overclaim cannot start here.
 *
 * Register is the respectful -ండి imperative throughout. Product nouns stay
 * in Latin — OTP, PIN, UPI, WhatsApp, PDF — because that is how every bank
 * SMS writes them.
 */
export const te: Dict = {
  'app.name': 'TrustLens AI',
  'app.tagline': 'ఆగండి. సరిచూడండి. తర్వాత చేయండి.',
  'app.home': 'TrustLens AI — హోమ్',
  'app.online': 'ఆన్‌లైన్',
  'app.offline': 'ఆఫ్‌లైన్',
  'app.footerTeam': 'TrustLens AI · Team Reshiram · DEX26223',
  'app.footerCaveat': 'ఆధారాల ఆధారంగా విశ్లేషణ. ఏదైనా నిజమైనదని ఇది ఎప్పుడూ హామీ ఇవ్వదు.',

  'dock.open': 'సాధనాలు',
  'dock.close': 'మూసివేయండి',
  'dock.title': 'సాధనాలు మరియు సెట్టింగ్‌లు',
  'dock.kaval': 'కావల్‌ను అడగండి',
  'dock.kavalHint': 'దేనికి హెచ్చరిక వచ్చింది, తర్వాత ఏం చేయాలి',
  'dock.dashboard': 'హోమ్',
  'dock.dashboardHint': 'మీ అన్ని తనిఖీలకు తిరిగి',
  'dock.account': 'మీ ఖాతా',
  'dock.accountHint': 'సైన్-ఇన్, పాస్‌కీలు, సేవ్ చేసిన నివేదికలు',
  'dock.privacy': 'గోప్యత మరియు సెట్టింగ్‌లు',
  'dock.privacyHint': 'ఈ పరికరం నుండి ఏది బయటకు వెళ్తుంది, ఏది వెళ్ళదు',
  'dock.story': 'TrustLens ఎలా పనిచేస్తుంది',
  'dock.storyHint': 'ప్రతి తనిఖీ, దాని పరిమితులు',
  'dock.appearance': 'రూపం',
  'dock.appearanceHint': 'లేత లేదా ముదురు',
  'dock.language': 'భాష',
  'dock.sos': 'ఇప్పటికే డబ్బు పంపారా? 1930కి కాల్ చేయండి',
  'dock.sosHint': 'భారత సైబర్ ఆర్థిక మోసం హెల్ప్‌లైన్',

  'home.status': 'రక్షణ పనిచేస్తోంది',
  'home.title1': 'ఆగండి. సరిచూడండి.',
  'home.title2': 'తర్వాత చేయండి.',
  'home.sub':
    'మీ నుండి డబ్బు, వివరాలు లేదా ఒక ట్యాప్ అడిగే దేన్నైనా సరిచూడండి — తీర్పు మాత్రమే కాదు, దాని వెనుక ఉన్న ఆధారాన్ని కూడా చూడండి.',
  'home.startCheck': 'తనిఖీ ప్రారంభించండి',
  'home.needHelp': 'నాకు ఇప్పుడే సహాయం కావాలి',
  'home.toolsTitle': 'మీరు ఏమి సరిచూడాలనుకుంటున్నారు?',
  'home.toolsNote': 'ప్రతి కార్డు నిజమైన తనిఖీని తెరుస్తుంది',
  'home.recentTitle': 'మీ ఇటీవలి తనిఖీలు',
  'home.seeAll': 'అన్నీ చూడండి',
  'home.sosTitle': 'ఇప్పటికే డబ్బు పంపారా?',
  'home.sosBody':
    'మీ ఖాతా నుండి డబ్బు ఇప్పటికే వెళ్ళిపోయి ఉంటే, మరేదైనా చేసే ముందు కాల్ చేయండి. దాన్ని ఆపగలమా అనేది మొదటి కొన్ని గంటలే నిర్ణయిస్తాయి.',
  'home.sosSteps': 'ప్రతి అడుగు చూడండి',
  'home.promise':
    'మీరు పంచుకోవాలని ఎంచుకున్న దాన్ని మాత్రమే TrustLens విశ్లేషిస్తుంది. ఇతర యాప్‌ల సందేశాలు, కాల్‌లు లేదా పరిచయాలను అది స్వయంగా చదవదు.',

  'feature.message.title': 'సందేశ తనిఖీ',
  'feature.message.blurb': 'మీకు వచ్చిన SMS, WhatsApp, ఇమెయిల్ లేదా చాట్.',
  'feature.message.action': 'సందేశాన్ని సరిచూడండి',
  'feature.link.title': 'లింక్ మరియు వెబ్‌సైట్ తనిఖీ',
  'feature.link.blurb': 'లింక్ నిజంగా ఎక్కడికి తీసుకెళ్తుంది, సైట్ నకిలీదా.',
  'feature.link.action': 'లింక్‌ను సరిచూడండి',
  'feature.bank.title': 'బ్యాంక్ మరియు UPI రక్షణ',
  'feature.bank.blurb': 'OTP, PIN, రీఫండ్ మరియు “సురక్షిత ఖాతా” ఒత్తిడి.',
  'feature.bank.action': 'చెల్లింపు అభ్యర్థనను సరిచూడండి',
  'feature.job.title': 'ఉద్యోగ ఆఫర్ తనిఖీ',
  'feature.job.blurb': 'ఫీజు లేదా డిపాజిట్ అడిగే నియామక సందేశాలు.',
  'feature.job.action': 'ఆఫర్‌ను పరిశీలించండి',
  'feature.invoice.title': 'ఇన్‌వాయిస్ మరియు చెల్లింపు అభ్యర్థన',
  'feature.invoice.blurb': 'బిల్లులు, డబ్బు ఎక్కడికి పంపాలో మార్చమనే అభ్యర్థనలు.',
  'feature.invoice.action': 'ఇన్‌వాయిస్‌ను పరిశీలించండి',
  'feature.proposal.title': 'పెట్టుబడి మరియు ఆఫర్ వాదనలు',
  'feature.proposal.blurb': 'హామీ ఇచ్చిన రాబడి, డిపాజిట్లు, ఇప్పుడే నిర్ణయించమనే ఒత్తిడి.',
  'feature.proposal.action': 'వాదనను పరిశీలించండి',
  'feature.respond.title': 'ఇప్పటికే ఏదో జరిగింది',
  'feature.respond.blurb': 'డబ్బు పంపారు, OTP చెప్పారు, లేదా ఒక యాప్ ఇన్‌స్టాల్ చేశారు.',
  'feature.respond.action': 'తర్వాతి అడుగులు పొందండి',
  'feature.alerts.title': 'మోసం హెచ్చరికలు',
  'feature.alerts.blurb': 'ఇటీవల చాలా మంది తెలిపిన పద్ధతులు.',
  'feature.alerts.action': 'ఏం జరుగుతోందో చూడండి',
  'feature.activity.title': 'మీ నివేదికలు మరియు చరిత్ర',
  'feature.activity.blurb': 'పాత తనిఖీని మళ్ళీ తెరవండి, లేదా నివేదికగా ఎగుమతి చేయండి.',
  'feature.activity.action': 'మీ నివేదికలను తెరవండి',
  'feature.learn.title': 'TrustLens ఎలా పనిచేస్తుంది',
  'feature.learn.blurb': 'ప్రతి తనిఖీ ఏం చేస్తుంది, ఏం చెప్పలేదు.',
  'feature.learn.action': 'ఎలా పనిచేస్తుందో చూడండి',

  'verdict.high_risk': 'బలమైన హెచ్చరిక సంకేతాలు',
  'verdict.high_risk.sub': 'మీరే విడిగా సరిచూసే వరకు దీన్ని సురక్షితం కాదని భావించండి.',
  'verdict.elevated_risk': 'తీవ్రమైన హెచ్చరిక సంకేతాలు',
  'verdict.elevated_risk.sub':
    'మీరు ఇప్పటికే నమ్మే మార్గం ద్వారా సరిచూసే వరకు దీనిపై ఏమీ చేయవద్దు.',
  'verdict.some_signals': 'కొన్ని హెచ్చరిక సంకేతాలు',
  'verdict.some_signals.sub': 'ఏదైనా చేసే ముందు మరోసారి చూడండి.',
  'verdict.no_signals_detected': 'ఏ నియమమూ సరిపోలలేదు',
  // The sentence that must survive translation intact.
  'verdict.no_signals_detected.sub':
    'దీని అర్థం సురక్షితం అని కాదు. మా నియమాలేవీ సరిపోలలేదని మాత్రమే — మీ దగ్గర ఇప్పటికే ఉన్న నంబర్ ద్వారా సరిచూడండి.',

  'share.title': 'మరొకరిని హెచ్చరించండి',
  'share.lede': 'కనుగొన్నదాని చిన్న సారాంశాన్ని పంపుతుంది — మీ పూర్తి సందేశాన్ని కాదు.',
  'share.native': 'పంచుకోండి…',
  'share.nativeHint': 'WhatsApp, Telegram, ఇమెయిల్ మరియు ఈ పరికరంలోని మిగిలినవన్నీ',
  'share.whatsapp': 'WhatsApp',
  'share.telegram': 'Telegram',
  'share.email': 'ఇమెయిల్',
  'share.sms': 'టెక్స్ట్ సందేశం',
  'share.copy': 'కాపీ చేయండి',
  'share.copied': 'కాపీ అయ్యింది',
  'share.includeEvidence': 'హెచ్చరిక వచ్చిన సరిగ్గా ఆ పదాలను కూడా చేర్చండి',
  'share.includeEvidenceHint':
    'ఎవరినైనా హెచ్చరించడానికి ఉపయోగపడుతుంది — కానీ నిజమైన సందేశంలో తరచూ మీ పేరు లేదా ఖాతా చివరి అంకెలు పక్కనే ఉంటాయి, ఒకసారి పంపినది వెనక్కి రాదు.',
  'share.savePdf': 'PDFగా సేవ్ చేయండి',
  'share.savePdfHint': 'ప్రింట్ విండో తెరుచుకుంటుంది — “Save as PDF” ఎంచుకోండి',

  'lang.title': 'భాష',
  'lang.sub': 'మొత్తం ఇంటర్‌ఫేస్‌ను మారుస్తుంది.',
  'lang.detectionNote':
    'ఇంటర్‌ఫేస్ భాష మారుతుంది. తనిఖీ నియమాలు ఇంగ్లీష్, తమిళం మరియు హిందీ చదువుతాయి — వేరే భాషలోని సందేశం కూడా విశ్లేషించబడుతుంది, కానీ అవే నియమాలతో.',
  'lang.detectionFull': 'తనిఖీలు ఈ భాషను కవర్ చేస్తాయి',
  'lang.detectionNone': 'ఇంటర్‌ఫేస్ మాత్రమే — తనిఖీలు ఇంగ్లీష్, తమిళం, హిందీ చదువుతాయి',
  'lang.planned': 'కన్నడ, మలయాళం, బెంగాలీ మరియు మరాఠీ ప్రణాళికలో ఉన్నాయి.',

  'activity.deleteAll': 'ఈ పరికరం నుండి మొత్తం {n} తొలగించండి',
  'activity.deleteNote': 'ఇక్కడ తొలగిస్తే అవి వెంటనే ఈ బ్రౌజర్ నుండి పోతాయి.',

  'check.textNote': 'సర్వర్\u200cలో విశ్లేషించబడుతుంది, కేవలం డేటాగా మాత్రమే — మోడల్\u200cకు ఆదేశంగా ఎప్పుడూ కాదు. మీ సొంత పాస్\u200cవర్డ్\u200cలు లేదా కార్డ్ నంబర్లు చేర్చాల్సిన అవసరం లేదు.',
  'check.liveLinksNote': 'DNS మాత్రమే పరిష్కరించి, పేజీ మెటాడేటా చదువుతుంది. ప్రైవేట్ మరియు అంతర్గత చిరునామాలు తిరస్కరించబడతాయి, ప్రతి రీడైరెక్ట్ మళ్ళీ ధృవీకరించబడుతుంది.',
  'respond.pick': 'ఏది దగ్గరగా ఉంటే అది ఎంచుకోండి. ఇక్కడ మీరు ఎంచుకున్నది ఎక్కడికీ పంపబడదు — మార్గదర్శకత్వం మీ పరికరంలోనే తయారవుతుంది.',

  'check.liveLinksOffline': 'ఆఫ్\u200cలైన్\u200cలో అందుబాటులో లేదు. పదాలు మరియు లింక్ నిర్మాణం ఇక్కడే తనిఖీ చేయబడతాయి.',

  'respond.question': 'ఇప్పటివరకు ఏం జరిగింది?',

  /* ---------------------------- contexts, the share page, incident states */
  'ctx.bank_scam': 'బ్యాంక్ లేదా చెల్లింపు',
  'ctx.bank_scam.hint': 'బ్యాంక్, UPI, OTP, రీఫండ్',
  'ctx.generic': 'సందేశం లేదా చాట్',
  'ctx.generic.hint': 'SMS, WhatsApp, ఇమెయిల్',
  'ctx.website': 'లింక్ లేదా వెబ్\u200cసైట్',
  'ctx.website.hint': 'మీకు వచ్చిన URL',
  'ctx.job_offer': 'ఉద్యోగ ఆఫర్',
  'ctx.job_offer.hint': 'నియామక సందేశం',
  'ctx.invoice': 'ఇన్\u200cవాయిస్ లేదా బిల్లు',
  'ctx.invoice.hint': 'చెల్లింపు అభ్యర్థన',
  'ctx.proposal': 'పెట్టుబడి',
  'ctx.proposal.hint': 'రాబడి, డిపాజిట్లు',
  'check.lede': 'మీకు ఏది వచ్చిందో ఎంచుకుని, దాన్ని అతికించండి. హెచ్చరిక సంకేతాలు, సరైన ఆధారం, ఇంకా తెలియనివి — అన్నీ కనిపిస్తాయి.',
  'share.pageTitle': 'ఈ సందేశాన్ని సరిచూడండి',
  'share.pageLede': 'మరో యాప్ నుండి పంచుకోబడింది. ఇంకా ఏమీ విశ్లేషించలేదు — చూసుకుని, తనిఖీ చేయండి.',
  'share.pageEmpty': 'ఆ పంపకంలో ఏమీ రాలేదు. కింద సందేశాన్ని అతికించండి.',
  'act.not_acted': 'నాకు వచ్చింది, అంతే',
  'act.not_acted.d': 'నేను క్లిక్ చేయలేదు, జవాబు ఇవ్వలేదు, డబ్బు పంపలేదు.',
  'act.opened_link': 'నేను లింక్ తెరిచాను',
  'act.opened_link.d': 'నొక్కాను, కానీ ఆ తర్వాత ఏమైందో ఖచ్చితంగా తెలియదు.',
  'act.shared_credentials': 'నేను OTP, PIN లేదా పాస్\u200cవర్డ్ చెప్పాను',
  'act.shared_credentials.d': 'ఒక కోడ్ లేదా ఖాతా వివరాన్ని టైప్ చేశాను లేదా చెప్పాను.',
  'act.installed_app': 'వారు చెప్పిన యాప్ ఇన్\u200cస్టాల్ చేశాను',
  'act.installed_app.d': 'ఏదో డౌన్\u200cలోడ్ చేయమని చెప్పారు.',
  'act.remote_access': 'స్క్రీన్ షేర్ చేశాను లేదా రిమోట్ యాక్సెస్ ఇచ్చాను',
  'act.remote_access.d': 'వారు నా స్క్రీన్ చూడగలిగారు లేదా పరికరాన్ని నియంత్రించగలిగారు.',
  'act.approved_payment': 'నేను ఒక చెల్లింపు అభ్యర్థనను ఆమోదించాను',
  'act.approved_payment.d': 'నా UPI PIN నమోదు చేశాను లేదా ప్రాంప్ట్\u200cను ఆమోదించాను.',
  'act.sent_money': 'నేను డబ్బు పంపాను',
  'act.sent_money.d': 'డబ్బు ఇప్పటికే నా ఖాతా నుండి వెళ్ళిపోయింది.',

  /* -------------------------------------------------- screen ledes */
  'screen.activity.lede': 'ఈ బ్రౌజర్\u200cలో, ఈ పరికరంలో ఉంచబడ్డాయి. నెట్\u200cవర్క్ లేకున్నా తెరుచుకుంటాయి — మీరు సైన్ ఇన్ చేయకపోతే మరో పరికరానికి రావు.',
  'screen.respond.lede': 'సరైన చర్య ఎంత దూరం వెళ్ళిందనే దానిపై ఆధారపడుతుంది. ఏం జరిగిందో చెప్పండి — సాధారణ హెచ్చరిక కాదు, ఆ ప్రణాళికే వస్తుంది.',
  'screen.privacy.lede': 'అనుమానాస్పద సందేశాన్ని అతికించమని అడిగే ఉత్పత్తి, తన సొంత ప్రవర్తన గురించి స్పష్టంగా చెప్పాలి.',
  'screen.alerts.lede': 'పలు స్వతంత్ర నివేదికలలో గుర్తించిన మోసం పద్ధతులు, అవి పంచుకునే సూచికల ప్రకారం సమూహపరచబడ్డాయి.',
  'screen.story.lede': 'ఉత్పత్తి చేసే ప్రతి తనిఖీ, ఒక్కో దృశ్యంగా వివరించబడింది — ప్రతి ఒక్కటి ఏం చెప్పలేదో కూడా.',
  'screen.privacy.title': 'మీరు సరిచూసే దానికి ఏం జరుగుతుంది',

  /* ------------------------------------------- install and activity */
  'install.title': 'TrustLens\u200cను ఒక ట్యాప్ దూరంలో ఉంచుకోండి',
  'install.ios': 'iPhone లేదా iPad\u200cలో: Safari\u200cలో Share నొక్కి, “Add to Home Screen” ఎంచుకోండి.',
  'install.other': 'మీ బ్రౌజర్ ఇన్\u200cస్టాల్\u200cను సపోర్ట్ చేస్తే, దాని మెనూ తెరిచి “Install app” లేదా “Add to Home screen” ఎంచుకోండి.',
  'install.action': 'హోమ్ స్క్రీన్\u200cకు జోడించండి',
  'install.done': 'ఇన్\u200cస్టాల్ అయ్యింది',
  'activity.emptyTitle': 'ఇంకా ఏదీ తనిఖీ చేయలేదు',
  'activity.emptyNote': 'మీరు చేసే తనిఖీలు ఈ పరికరంలోనే ఉంటాయి — అవి ఆఫ్\u200cలైన్\u200cలో కూడా పనిచేస్తాయి, ఖాతా అవసరం లేదు.',
  'activity.emptyTitleFull': 'ఈ పరికరంలో ఇంకా తనిఖీలు లేవు',
  'activity.emptyNoteFull': 'మీరు తనిఖీ చేసేది ఈ బ్రౌజర్\u200cలో సేవ్ అవుతుంది, కాబట్టి నెట్\u200cవర్క్ లేకున్నా మళ్ళీ తెరుచుకుంటుంది.',
  'activity.start': 'ఏదైనా సరిచూడండి',
  'activity.delete': 'ఈ నివేదికను తొలగించండి',

  /* ------------------------------------------------------- the opening */
  'open.line': 'ఒక సందేశం, లింక్ లేదా చెల్లింపు అభ్యర్థనపై చర్య తీసుకునే ముందు దాన్ని సరిచూడండి — ప్రతి సమాధానం వెనుక ఉన్న ఆధారాన్ని కూడా చూడండి.',
  'open.start': 'ప్రారంభించండి',
  'open.haveAccount': 'ఇప్పటికే ఖాతా ఉందా?',
  'open.signIn': 'సైన్ ఇన్ చేయండి',
  'open.promise': 'మీరు పంచుకోవాలని ఎంచుకున్న దాన్ని మాత్రమే TrustLens సరిచూస్తుంది. మీ సందేశాలు, కాల్\u200cలు లేదా పరిచయాలను అది స్వయంగా చదవలేదు.',

  /* ------------------------------------------------------ the check screen */
  'check.step1': 'మీరు దేన్ని సరిచూస్తున్నారు?',
  'check.step2': 'సందేశాన్ని, లేదా లింక్\u200cను అతికించండి',
  'check.placeholder': 'పూర్తి సందేశాన్ని ఇక్కడ అతికించండి. దానిలోని లింక్\u200cలు కూడా పరిశీలించబడతాయి.',
  'check.liveLinks': 'లింక్\u200cలను నెట్\u200cవర్క్\u200cలో సరిచూడండి',
  'check.cloudAi': 'ఐచ్ఛిక క్లౌడ్ AI వివరణను అనుమతించండి',
  'check.saveAccount': 'ఖాతాలో ఒక కాపీని సేవ్ చేయండి (ఐచ్ఛికం)',
  'check.run': 'దీన్ని సరిచూడండి',
  'check.running': 'సరిచూస్తోంది…',
  'check.clear': 'తొలగించండి',
  'check.examples': 'ఒక ఉదాహరణ ప్రయత్నించండి',

  'common.back': 'వెనక్కి',
  'common.cancel': 'రద్దు చేయండి',
  'common.close': 'మూసివేయండి',
  'common.copy': 'కాపీ చేయండి',
  'common.delete': 'తొలగించండి',
  'common.loading': 'జరుగుతోంది…',
  'common.retry': 'మళ్ళీ ప్రయత్నించండి',
  'common.required': 'తనిఖీ జరగడానికి ముందు ఇది అవసరం.',
  'common.offlineNote': 'మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. తనిఖీలు ఇంకా పనిచేస్తాయి — లింక్ శోధనలు పనిచేయవు.',
  'common.errorGeneric': 'అది పూర్తి కాలేదు. కొద్దిసేపటిలో మళ్ళీ ప్రయత్నించండి.',
  'common.errorRateLimited': 'ఇప్పుడు చాలా తనిఖీలు అయ్యాయి. కొన్ని సెకన్లు ఆగి మళ్ళీ ప్రయత్నించండి.',
};
