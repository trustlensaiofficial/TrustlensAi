/**
 * The canonical dictionary.
 *
 * Every other language is typed against this one, so a missing key is a
 * compile error rather than an English word appearing mid-sentence in Tamil.
 * Keys are grouped by surface and never by component, because a string moves
 * between components and its meaning does not.
 *
 * Copy rules that the translations have to carry, not just the words:
 *
 *   * Never say "safe". The product can say which rules matched and which did
 *     not; it cannot certify anything, and every language must stop short of
 *     the same line.
 *   * The verdict words are deliberately not colour names or scores. Someone
 *     frightened reads the first three words and acts.
 *   * Second person, present tense, active voice. "Share the OTP" is what the
 *     scammer wrote; "do not share it" is what we write back.
 */
export const en = {
  /* ------------------------------------------------------------- the shell */
  'app.name': 'TrustLens AI',
  'app.tagline': 'Pause. Verify. Then act.',
  'app.home': 'TrustLens AI — dashboard',
  'app.online': 'Online',
  'app.offline': 'Offline',
  'app.footerTeam': 'TrustLens AI · Team Reshiram · DEX26223',
  'app.footerCaveat': 'Evidence-first analysis. Never a guarantee that something is genuine.',

  /* --------------------------------------------------------------- the dock */
  'dock.open': 'Tools',
  'dock.close': 'Close',
  'dock.title': 'Tools and settings',
  'dock.kaval': 'Ask Kaval',
  'dock.kavalHint': 'Why something was flagged, and what to do next',
  'dock.dashboard': 'Dashboard',
  'dock.dashboardHint': 'Back to all your checks',
  'dock.account': 'Your account',
  'dock.accountHint': 'Sign-in, passkeys and saved reports',
  'dock.privacy': 'Privacy and settings',
  'dock.privacyHint': 'What leaves this device, and what does not',
  'dock.story': 'How TrustLens works',
  'dock.storyHint': 'Every check, and its limits',
  'dock.appearance': 'Appearance',
  'dock.appearanceHint': 'Light or dark',
  'dock.language': 'Language',
  'dock.sos': 'Already sent money? Call 1930',
  'dock.sosHint': 'India’s cyber-financial fraud helpline',

  /* ---------------------------------------------------------- the dashboard */
  'home.status': 'Protection active',
  'home.title1': 'Pause. Verify.',
  'home.title2': 'Then act.',
  'home.sub':
    'Check anything that asks you for money, details or a tap — and see the evidence behind the answer, not just a verdict.',
  'home.startCheck': 'Start a check',
  'home.needHelp': 'I need help now',
  'home.toolsTitle': 'What would you like to check?',
  'home.toolsNote': 'Every card opens a real check',
  'home.recentTitle': 'Your recent checks',
  'home.seeAll': 'See all',
  'home.sosTitle': 'Already sent money?',
  'home.sosBody':
    'If money has already left your account, call before anything else. The first hours decide whether it can be held.',
  'home.sosSteps': 'See every step',
  'home.promise':
    'TrustLens analyses only what you choose to share with it. It does not read messages, calls or contacts from other apps on their own.',

  /* ------------------------------------------------------- the ten features */
  'feature.message.title': 'Message check',
  'feature.message.blurb': 'An SMS, WhatsApp, email or chat you were sent.',
  'feature.message.action': 'Check a message',
  'feature.link.title': 'Link and website check',
  'feature.link.blurb': 'Where a link really goes, and whether the site is a lookalike.',
  'feature.link.action': 'Check a link',
  'feature.bank.title': 'Bank and UPI protection',
  'feature.bank.blurb': 'OTP, PIN, refund and “safe account” pressure.',
  'feature.bank.action': 'Check a payment request',
  'feature.job.title': 'Job offer check',
  'feature.job.blurb': 'Recruitment messages that ask for a fee or a deposit.',
  'feature.job.action': 'Review an offer',
  'feature.invoice.title': 'Invoice and payment request',
  'feature.invoice.blurb': 'Bills, and requests to change where money is sent.',
  'feature.invoice.action': 'Review an invoice',
  'feature.proposal.title': 'Investment and offer claims',
  'feature.proposal.blurb': 'Promised returns, deposits and pressure to decide now.',
  'feature.proposal.action': 'Review a claim',
  'feature.respond.title': 'Something already happened',
  'feature.respond.blurb': 'Money sent, OTP shared, or an app installed.',
  'feature.respond.action': 'Get the next steps',
  'feature.alerts.title': 'Scam alerts',
  'feature.alerts.blurb': 'Patterns several people have reported recently.',
  'feature.alerts.action': 'See what is circulating',
  'feature.activity.title': 'Your reports and history',
  'feature.activity.blurb': 'Reopen a past check, or export it as a report.',
  'feature.activity.action': 'Open your reports',
  'feature.learn.title': 'How TrustLens works',
  'feature.learn.blurb': 'What each check does, and what it cannot tell you.',
  'feature.learn.action': 'See how it works',

  /* ------------------------------------------------------------- the verdict */
  'verdict.high_risk': 'Strong warning signs',
  'verdict.high_risk.sub': 'Treat this as unsafe until you have verified it independently.',
  'verdict.elevated_risk': 'Serious warning signs',
  'verdict.elevated_risk.sub': 'Do not act on this until you have checked through a channel you already trust.',
  'verdict.some_signals': 'Some warning signs',
  'verdict.some_signals.sub': 'Worth a second look before you act.',
  'verdict.no_signals_detected': 'No rules matched',
  // The most important sentence in the product. It must survive translation
  // intact: "no warning signs" is not "safe", and saying so is the whole
  // difference between an honest tool and a false reassurance.
  'verdict.no_signals_detected.sub':
    'That is not the same as safe. It means none of our rules matched — verify through a number you already have.',

  /* ------------------------------------------------------------ the sharing */
  'share.title': 'Warn someone else',
  'share.lede': 'Sends a short summary of what was found — not your whole message.',
  'share.native': 'Share…',
  'share.nativeHint': 'WhatsApp, Telegram, email and anything else on this device',
  'share.whatsapp': 'WhatsApp',
  'share.telegram': 'Telegram',
  'share.email': 'Email',
  'share.sms': 'Text message',
  'share.copy': 'Copy',
  'share.copied': 'Copied',
  'share.includeEvidence': 'Include the exact words that were flagged',
  'share.includeEvidenceHint':
    'Useful for warning someone — but a real message often carries your name or the last digits of your account beside them, and a forward is forever.',
  'share.savePdf': 'Save as PDF',
  'share.savePdfHint': 'Opens your printer dialog — choose “Save as PDF”',

  /* ------------------------------------------------------------ the language */
  'lang.title': 'Language',
  'lang.sub': 'Changes the whole interface.',
  // Stated at the point of choosing, which is the only place it cannot be
  // missed. Translating the buttons does not translate the rules.
  'lang.detectionNote':
    'The interface changes language. The checks themselves read English, Tamil and Hindi — a message in another language is still analysed, but with those rules.',
  'lang.detectionFull': 'Checks cover this language',
  'lang.detectionNone': 'Interface only — checks read English, Tamil and Hindi',
  'lang.planned': 'Kannada, Malayalam, Bengali and Marathi are planned.',

  'activity.deleteAll': 'Delete all {n} from this device',
  'activity.deleteNote': 'Deleting here removes them from this browser immediately.',

  'check.textNote': 'Analysed on the server and treated strictly as data — never as an instruction to the model. You do not need to include your own passwords or card numbers.',
  'check.liveLinksNote': 'Resolves DNS and reads page metadata only. Private and internal addresses are refused and every redirect is re-validated.',
  'respond.pick': 'Pick whichever is closest. Nothing you choose here is sent anywhere — the guidance is produced on your own device.',

  'check.liveLinksOffline': 'Unavailable offline. The wording and link structure are still checked locally.',

  'respond.question': 'What has already happened?',

  /* ---------------------------- contexts, the share page, incident states */
  'ctx.bank_scam': 'Bank or payment',
  'ctx.bank_scam.hint': 'Bank, UPI, OTP, refund',
  'ctx.generic': 'Message or chat',
  'ctx.generic.hint': 'SMS, WhatsApp, email',
  'ctx.website': 'Link or website',
  'ctx.website.hint': 'A URL you were sent',
  'ctx.job_offer': 'Job offer',
  'ctx.job_offer.hint': 'Recruitment message',
  'ctx.invoice': 'Invoice or bill',
  'ctx.invoice.hint': 'Payment request',
  'ctx.proposal': 'Investment',
  'ctx.proposal.hint': 'Returns, deposits',
  'check.lede': 'Choose what you received, then paste it. You will see the warning signs, the exact evidence and what is still unknown.',
  'share.pageTitle': 'Check this message',
  'share.pageLede': 'Shared from another app. Nothing has been analysed yet — check it over, then run the check.',
  'share.pageEmpty': 'Nothing arrived with that share. Paste the message below instead.',
  'act.not_acted': 'I only received it',
  'act.not_acted.d': 'I have not clicked, replied or paid.',
  'act.opened_link': 'I opened the link',
  'act.opened_link.d': 'I tapped it, but I am not sure what happened next.',
  'act.shared_credentials': 'I shared an OTP, PIN or password',
  'act.shared_credentials.d': 'I typed or read out a code or account detail.',
  'act.installed_app': 'I installed an app they asked for',
  'act.installed_app.d': 'They told me to download something.',
  'act.remote_access': 'I shared my screen or gave remote access',
  'act.remote_access.d': 'They could see my screen or control my device.',
  'act.approved_payment': 'I approved a payment request',
  'act.approved_payment.d': 'I entered my UPI PIN or approved a prompt.',
  'act.sent_money': 'I transferred money',
  'act.sent_money.d': 'Money has already left my account.',

  /* -------------------------------------------------- screen ledes */
  'screen.activity.lede': 'Kept in this browser, on this device. They open with no network — and they do not follow you to another device unless you sign in.',
  'screen.respond.lede': 'The right move depends on how far it went. Tell us what has happened and you get that plan, not a general warning.',
  'screen.privacy.lede': 'A product that asks you to paste a suspicious message owes you a clear account of its own behaviour.',
  'screen.alerts.lede': 'Campaigns recognised across several independent reports, grouped by the indicators they share.',
  'screen.story.lede': 'Every check the product runs, narrated one scene at a time — including what each one cannot tell you.',
  'screen.privacy.title': 'What happens to what you check',

  /* ------------------------------------------- install and activity */
  'install.title': 'Keep TrustLens one tap away',
  'install.ios': 'On iPhone or iPad: tap Share in Safari, then choose “Add to Home Screen”.',
  'install.other': 'If your browser supports installation, open its menu and choose “Install app” or “Add to Home screen”.',
  'install.action': 'Add to home screen',
  'install.done': 'Installed',
  'activity.emptyTitle': 'Nothing checked yet',
  'activity.emptyNote': 'Checks you run are kept on this device, so they work offline and need no account.',
  'activity.emptyTitleFull': 'No checks on this device yet',
  'activity.emptyNoteFull': 'Anything you check is saved here, in this browser, so it opens again with no network.',
  'activity.start': 'Check something',
  'activity.delete': 'Delete this report',

  /* ------------------------------------------------------- the opening */
  'open.line': 'Check a message, link or payment request before you act on it — and see the evidence behind every answer.',
  'open.start': 'Start',
  'open.haveAccount': 'Already have an account?',
  'open.signIn': 'Sign in',
  'open.promise': 'TrustLens checks only what you choose to share with it. It cannot read your messages, calls or contacts on its own.',

  /* ------------------------------------------------------ the check screen */
  'check.step1': 'What are you checking?',
  'check.step2': 'Paste the message, or the link',
  'check.placeholder': 'Paste the full message here. Links inside it are examined too.',
  'check.liveLinks': 'Check links over the network',
  'check.cloudAi': 'Allow optional cloud AI explanation',
  'check.saveAccount': 'Save an account copy (optional)',
  'check.run': 'Check this',
  'check.running': 'Checking…',
  'check.clear': 'Clear',
  'check.examples': 'Try an example',

  /* --------------------------------------------------------------- the basics */
  'common.back': 'Back',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.copy': 'Copy',
  'common.delete': 'Delete',
  'common.loading': 'Working…',
  'common.retry': 'Try again',
  'common.required': 'This is needed before the check can run.',
  'common.offlineNote': 'You are offline. Checks still run — link lookups do not.',
  'common.errorGeneric': 'That did not complete. Try again in a moment.',
  'common.errorRateLimited': 'Too many checks just now. Wait a few seconds and try again.',
} as const;

/**
 * The key set, and the shape every other language must fill.
 *
 * `as const` above makes each English value a literal type, which is what
 * gives `DictKey` its exact union — but it would also demand that the Tamil
 * dictionary's value for 'app.online' be the literal string "Online". So the
 * contract is keys-exact, values-string: a missing or misspelled key is a
 * compile error, and the translation is free to be a translation.
 */
export type DictKey = keyof typeof en;
export type Dict = Record<DictKey, string>;
