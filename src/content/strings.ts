// Every visible string on the site lives here, so the owner approves one file (docs/product.md, public words).
// `provenance` marks each string `approved: <source>` (reused verbatim from approved app copy) or `new` (the owner's
// batch approval); strings.test.ts fails on a string without a mark. Banned words are checked over src/ (scripts/check.sh).
export interface Strings {
  readonly siteName: string;
  readonly menuBar: { readonly appMenu: string };
  readonly desktop: { readonly placeholder: string };
  readonly listen: {
    readonly title: string;
    readonly play: string;
    readonly pause: string;
    readonly playAgain: string;
    readonly statusIdle: string;
    readonly statusStarting: string;
    readonly statusPlaying: string;
    readonly statusPaused: string;
    readonly statusEnded: string;
    readonly statusError: string;
    readonly bands: string;
    readonly timer: string;
    readonly timerOff: string;
    readonly timerMinutes: string;
    readonly timerLeft: string;
    readonly output: string;
    readonly headphones: string;
    readonly speaker: string;
    readonly headphonesNote: string;
    readonly speakerNote: string;
    readonly proEyebrow: string;
    readonly proTune: string;
    readonly proLayers: string;
    readonly proPrograms: string;
    readonly free: string;
    readonly safety: string;
    readonly goalFocus: string;
    readonly goalCreate: string;
    readonly goalRelax: string;
    readonly goalSleep: string;
    readonly delta: string;
    readonly theta: string;
    readonly alpha: string;
    readonly beta: string;
    readonly gamma: string;
    readonly deepSleep: string;
    readonly daydream: string;
    readonly calmFocus: string;
    readonly deepWork: string;
    readonly peak: string;
  };
  readonly get: {
    readonly title: string;
    readonly appName: string;
    readonly subtitle: string;
    readonly pitch: string;
    readonly badgeAlt: string;
    readonly qrHeading: string;
    readonly qrNote: string;
    readonly qrAlt: string;
    readonly free: string;
    readonly noAccount: string;
    readonly plansHeading: string;
    readonly monthly: string;
    readonly annual: string;
    readonly lifetime: string;
    readonly proHeading: string;
    readonly proBody: string;
    readonly barLabel: string;
    readonly barAction: string;
  };
  readonly features: {
    readonly eyebrowPro: string;
    readonly eyebrowFree: string;
    readonly getIt: string;
    readonly tune: FeatureStrings;
    readonly layers: FeatureStrings;
    readonly programs: FeatureStrings;
    readonly progress: FeatureStrings;
    readonly iphone: FeatureStrings & {
      readonly surfaces: string;
      readonly lockScreen: string;
      readonly dynamicIsland: string;
      readonly controlCenter: string;
      readonly widget: string;
      readonly siri: string;
    };
  };
  readonly aboutSound: {
    readonly title: string;
    readonly binauralHeading: string;
    readonly binauralTag: string;
    readonly leftEar: string;
    readonly rightEar: string;
    readonly difference: string;
    readonly binauralBody: string;
    readonly isochronicHeading: string;
    readonly isochronicTag: string;
    readonly isochronicBody: string;
    readonly isochronicAlt: string;
    readonly researchHeading: string;
    readonly researchBody: string;
    readonly researchPromise: string;
    readonly safetyHeading: string;
    readonly safetyDriving: string;
    readonly safetyMedical: string;
    readonly safetyVolume: string;
  };
  readonly aboutApp: {
    readonly title: string;
    readonly name: string;
    readonly version: string;
    readonly credits: string;
    readonly madeBy: string;
    readonly privacyHeading: string;
    readonly privacyBody: string;
    readonly privacyLink: string;
    readonly supportLink: string;
    readonly termsLink: string;
    readonly trademarks: string;
    readonly getApp: string;
  };
}

interface FeatureStrings {
  readonly title: string;
  readonly heading: string;
  readonly body: string;
  readonly caption: string;
  readonly frameAlt: string;
}

export const strings: Strings = {
  siteName: 'FocusTones',
  menuBar: { appMenu: 'FocusTones' },
  desktop: { placeholder: 'The desktop is under construction.' },
  listen: {
    title: 'Listen',
    play: 'Play',
    pause: 'Pause',
    playAgain: 'Play again',
    statusIdle: 'Ready when you are',
    statusStarting: 'Fading in',
    statusPlaying: 'Playing',
    statusPaused: 'Paused',
    statusEnded: 'Session finished',
    statusError: 'Sound could not start in this browser',
    bands: 'Band',
    timer: 'Timer',
    timerOff: 'Off',
    timerMinutes: 'min',
    timerLeft: 'left',
    output: 'Mode',
    headphones: 'Headphones',
    speaker: 'Speaker',
    headphonesNote: 'With headphones, each ear hears its own frequency for true binaural beats.',
    speakerNote: 'No headphones? Speaker mode pulses the tone instead, so it works on any speaker.',
    proEyebrow: 'In the app, with Pro',
    proTune: 'Tune',
    proLayers: 'Layers',
    proPrograms: 'Programs',
    free: 'Five band presets, any timer and Speaker mode are free, with no time limit.',
    safety: 'Keep the volume moderate. The orb never flashes at the beat.',
    goalFocus: 'Focus',
    goalCreate: 'Create',
    goalRelax: 'Relax',
    goalSleep: 'Sleep',
    delta: 'Delta',
    theta: 'Theta',
    alpha: 'Alpha',
    beta: 'Beta',
    gamma: 'Gamma',
    deepSleep: 'Deep Sleep',
    daydream: 'Daydream',
    calmFocus: 'Calm Focus',
    deepWork: 'Deep Work',
    peak: 'Peak',
  },
  get: {
    title: 'Get FocusTones',
    appName: 'FocusTones: Binaural Beats',
    subtitle: 'Focus, Study & Sleep Sounds',
    pitch: 'Binaural beats generated live on your iPhone, for deep work and study.',
    badgeAlt: 'Download on the App Store',
    qrHeading: 'On a computer? Scan with your iPhone.',
    qrNote: 'The camera opens the App Store page.',
    qrAlt: 'QR code that opens FocusTones on the App Store',
    free: 'Five band presets, any timer and Speaker mode are free, with no time limit.',
    noAccount: 'No account and no ads.',
    plansHeading: 'FocusTones Pro plans (US prices; your local price is shown before you buy):',
    monthly: 'Monthly: $6.99 a month.',
    annual: 'Annual: a 7-day trial, then $39.99 a year.',
    lifetime: 'Lifetime: $79.99, one purchase with no renewal.',
    proHeading: 'What Pro adds',
    proBody:
      'FocusTones Pro unlocks fine tuning (the beat to 0.1 Hz, the carrier and levels), layers, the full preset library, saved mixes, Programs and your full Progress history.',
    barLabel: 'FocusTones for iPhone',
    barAction: 'Get',
  },
  features: {
    eyebrowPro: 'With Pro',
    eyebrowFree: 'Free in the app',
    getIt: 'Get it on the App Store',
    tune: {
      title: 'Tune',
      heading: 'An instrument you can tune',
      body: 'Set the beat in steps of 0.1 Hz and the carrier anywhere from 80 to 1000 Hz, and hear each change as you make it.',
      caption: 'Tune every beat to 0.1 Hz.',
      frameAlt: 'The app’s Tune sheet: beat 10.0 Hz, carrier 220 Hz, mode, tone level and layer.',
    },
    layers: {
      title: 'Layers',
      heading: 'Lay something underneath',
      body: 'Lay White, Pink or Brown noise, Rain or Ocean under the tone, with its own level and brightness.',
      caption: 'With Pro, along with the carrier, levels and a layer of rain or noise.',
      frameAlt: 'The app’s Tune sheet with the Rain layer selected, and its level and brightness sliders.',
    },
    programs: {
      title: 'Programs',
      heading: 'Save the sound that works',
      body: 'Save your own mixes, and play Programs that glide from band to band, like Wind Down.',
      caption: 'With Pro: your own mixes and presets for every goal.',
      frameAlt: 'The app’s Mixes tab: saved mixes and presets for every goal.',
    },
    progress: {
      title: 'Progress',
      heading: 'See your focus time',
      body: 'Progress shows the minutes you listened each day, your streak and your recent sessions.',
      caption: 'Minutes by day, your streak and recent sessions.',
      frameAlt: 'The app’s Progress tab: today, streak, this week’s minutes by day and recent sessions.',
    },
    iphone: {
      title: 'iPhone everywhere',
      heading: 'Runs the whole work block',
      body: 'Set a timer and the sound fades out at the end. It keeps playing with the screen locked, starts from Control Center, the widget or Siri, and can play under your own music.',
      caption: 'Set a timer. Let it fade.',
      frameAlt: 'The app’s Listen screen with a timer running on the Deep Sleep preset.',
      surfaces: 'Where it shows up',
      lockScreen: 'Lock Screen',
      dynamicIsland: 'Dynamic Island',
      controlCenter: 'Control Center',
      widget: 'Widget',
      siri: '“Start focus in FocusTones”',
    },
  },
  aboutSound: {
    title: 'About the sound',
    binauralHeading: 'Binaural beats',
    binauralTag: 'Headphones',
    leftEar: 'Left ear',
    rightEar: 'Right ear',
    difference: 'What you hear · the 16 Hz difference',
    binauralBody:
      'Each ear gets a slightly different tone. The difference can be heard as a slow beat. Binaural mode needs headphones.',
    isochronicHeading: 'Speaker mode',
    isochronicTag: 'Isochronic',
    isochronicBody: 'One tone softly rises and falls at the beat. It works on speakers without headphones.',
    isochronicAlt: 'One tone rising and falling at the beat',
    researchHeading: 'What the research says',
    researchBody:
      'Studies of binaural beats are small. Results on attention and relaxation are mixed and modest; some studies find a difference and others do not. A steady sound without lyrics may simply suit your focus block.',
    researchPromise: 'FocusTones is sound for focus and rest. It promises no particular effect.',
    safetyHeading: 'Listening safely',
    safetyDriving: 'Don’t listen while driving or operating machinery.',
    safetyMedical: 'If you have epilepsy or a seizure disorder, or wear a pacemaker, ask a doctor first.',
    safetyVolume: 'Keep the volume moderate. The orb never flashes at the beat.',
  },
  aboutApp: {
    title: 'About FocusTones',
    name: 'FocusTones',
    version: 'Web trial 1.0',
    credits: 'The free web trial of FocusTones: Binaural Beats. The sound and the orb are made in your browser.',
    madeBy: 'Made by Tyl Softworks.',
    privacyHeading: 'Privacy',
    privacyBody: 'This site sets no cookies and sends nothing anywhere.',
    privacyLink: 'Privacy Policy',
    supportLink: 'Support',
    termsLink: 'Terms of Use',
    trademarks: 'iPhone and App Store are trademarks of Apple Inc. FocusTones is not affiliated with Apple.',
    getApp: 'Get the iPhone app',
  },
};

const APPROVED_PAGE = 'approved: focustones-ios docs/marketing/web/page.md';
const APPROVED_COPY = 'approved: focustones-ios docs/marketing/store/1.0/copy.md';
const APPROVED_SHOTS = 'approved: focustones-ios docs/marketing/store/1.0/shots.md';
const APPROVED_ABOUT = 'approved: focustones-ios App/AboutSoundView.swift (shipped in the app)';
const NEW = 'new';

/** Where each string came from, keyed by its path in `strings`. A key with no entry here fails strings.test.ts. */
export const provenance: Readonly<Record<string, string>> = {
  siteName: NEW,
  'menuBar.appMenu': NEW,
  'desktop.placeholder': NEW,
  'listen.title': NEW,
  'listen.play': NEW,
  'listen.pause': NEW,
  'listen.playAgain': NEW,
  'listen.statusIdle': NEW,
  'listen.statusStarting': NEW,
  'listen.statusPlaying': NEW,
  'listen.statusPaused': NEW,
  'listen.statusEnded': NEW,
  'listen.statusError': NEW,
  'listen.bands': NEW,
  'listen.timer': 'new (the label the app uses, TimerView.swift)',
  'listen.timerOff': 'new (the label the app uses, TimerView.swift)',
  'listen.timerMinutes': 'new (the label the app uses, TimerView.swift)',
  'listen.timerLeft': NEW,
  'listen.output': NEW,
  'listen.headphones': `${APPROVED_PAGE} feature-3`,
  'listen.speaker': `${APPROVED_PAGE} feature-3`,
  'listen.headphonesNote': `${APPROVED_PAGE} feature-3`,
  'listen.speakerNote': `${APPROVED_PAGE} feature-3`,
  'listen.proEyebrow': NEW,
  'listen.proTune': 'new (the feature name the app uses)',
  'listen.proLayers': 'new (the feature name the app uses)',
  'listen.proPrograms': 'new (the feature name the app uses)',
  'listen.free': `${APPROVED_PAGE} closing`,
  'listen.safety': APPROVED_ABOUT,
  'listen.goalFocus': 'new (the goal name the app uses, Catalog.swift)',
  'listen.goalCreate': 'new (the goal name the app uses, Catalog.swift)',
  'listen.goalRelax': 'new (the goal name the app uses, Catalog.swift)',
  'listen.goalSleep': 'new (the goal name the app uses, Catalog.swift)',
  'listen.delta': `${APPROVED_PAGE} feature-1`,
  'listen.theta': `${APPROVED_PAGE} feature-1`,
  'listen.alpha': `${APPROVED_PAGE} feature-1`,
  'listen.beta': `${APPROVED_PAGE} feature-1`,
  'listen.gamma': `${APPROVED_PAGE} feature-1`,
  'listen.deepSleep': `${APPROVED_PAGE} feature-1`,
  'listen.daydream': `${APPROVED_PAGE} feature-1`,
  'listen.calmFocus': `${APPROVED_PAGE} feature-1`,
  'listen.deepWork': `${APPROVED_PAGE} feature-1`,
  'listen.peak': `${APPROVED_PAGE} feature-1`,
  'get.title': NEW,
  'get.appName': `${APPROVED_COPY} Name`,
  'get.subtitle': `${APPROVED_COPY} Subtitle`,
  'get.pitch': `${APPROVED_PAGE} card`,
  'get.badgeAlt': 'approved: Apple App Store marketing guidelines (badge text)',
  'get.qrHeading': NEW,
  'get.qrNote': NEW,
  'get.qrAlt': NEW,
  'get.free': `${APPROVED_PAGE} closing`,
  'get.noAccount': `${APPROVED_PAGE} feature-6`,
  'get.plansHeading': `${APPROVED_COPY} Description`,
  'get.monthly': `${APPROVED_COPY} Description`,
  'get.annual': `${APPROVED_COPY} Description`,
  'get.lifetime': `${APPROVED_COPY} Description`,
  'get.proHeading': `${APPROVED_COPY} Description (WHAT PRO ADDS)`,
  'get.proBody': `${APPROVED_COPY} Description (WHAT PRO ADDS)`,
  'get.barLabel': NEW,
  'get.barAction': NEW,
  'features.eyebrowPro': `${APPROVED_SHOTS} (“With Pro”)`,
  'features.eyebrowFree': NEW,
  'features.getIt': NEW,
  'features.tune.title': NEW,
  'features.tune.heading': `${APPROVED_PAGE} feature-2`,
  'features.tune.body': `${APPROVED_PAGE} feature-2 (first sentence)`,
  'features.tune.caption': APPROVED_SHOTS,
  'features.tune.frameAlt': NEW,
  'features.layers.title': NEW,
  'features.layers.heading': NEW,
  'features.layers.body': `${APPROVED_COPY} Description (second bullet, Lay White, Pink or Brown noise…)`,
  'features.layers.caption': `${APPROVED_SHOTS} 02-tune subcaption`,
  'features.layers.frameAlt': NEW,
  'features.programs.title': NEW,
  'features.programs.heading': `${APPROVED_SHOTS} 04-mixes caption`,
  'features.programs.body': `${APPROVED_COPY} Description (third bullet, Save your own mixes…)`,
  'features.programs.caption': `${APPROVED_SHOTS} 04-mixes subcaption`,
  'features.programs.frameAlt': NEW,
  'features.progress.title': NEW,
  'features.progress.heading': `${APPROVED_PAGE} feature-5`,
  'features.progress.body': `${APPROVED_PAGE} feature-5 (second sentence)`,
  'features.progress.caption': `${APPROVED_SHOTS} 05-progress subcaption`,
  'features.progress.frameAlt': NEW,
  'features.iphone.title': NEW,
  'features.iphone.heading': `${APPROVED_PAGE} feature-4`,
  'features.iphone.body': `${APPROVED_PAGE} feature-4 (second sentence)`,
  'features.iphone.caption': `${APPROVED_SHOTS} 03-timer caption`,
  'features.iphone.frameAlt': NEW,
  'features.iphone.surfaces': NEW,
  'features.iphone.lockScreen': `${APPROVED_COPY} Description (Lock Screen)`,
  'features.iphone.dynamicIsland': NEW,
  'features.iphone.controlCenter': `${APPROVED_COPY} Description (Control Center)`,
  'features.iphone.widget': `${APPROVED_COPY} Description (the widget)`,
  'features.iphone.siri': `${APPROVED_COPY} Description (Siri phrase)`,
  'aboutSound.title': APPROVED_ABOUT,
  'aboutSound.binauralHeading': APPROVED_ABOUT,
  'aboutSound.binauralTag': APPROVED_ABOUT,
  'aboutSound.leftEar': APPROVED_ABOUT,
  'aboutSound.rightEar': APPROVED_ABOUT,
  'aboutSound.difference': APPROVED_ABOUT,
  'aboutSound.binauralBody': APPROVED_ABOUT,
  'aboutSound.isochronicHeading': APPROVED_ABOUT,
  'aboutSound.isochronicTag': APPROVED_ABOUT,
  'aboutSound.isochronicBody': APPROVED_ABOUT,
  'aboutSound.isochronicAlt': APPROVED_ABOUT,
  'aboutSound.researchHeading': APPROVED_ABOUT,
  'aboutSound.researchBody': APPROVED_ABOUT,
  'aboutSound.researchPromise': APPROVED_ABOUT,
  'aboutSound.safetyHeading': APPROVED_ABOUT,
  'aboutSound.safetyDriving': APPROVED_ABOUT,
  'aboutSound.safetyMedical': APPROVED_ABOUT,
  'aboutSound.safetyVolume': APPROVED_ABOUT,
  'aboutApp.title': NEW,
  'aboutApp.name': NEW,
  'aboutApp.version': NEW,
  'aboutApp.credits': NEW,
  'aboutApp.madeBy': NEW,
  'aboutApp.privacyHeading': NEW,
  'aboutApp.privacyBody': 'new (the wording the owner gave in issue #6)',
  'aboutApp.privacyLink': `${APPROVED_COPY} Description (Privacy Policy)`,
  'aboutApp.supportLink': NEW,
  'aboutApp.termsLink': `${APPROVED_COPY} Description (Terms of Use)`,
  'aboutApp.trademarks': NEW,
  'aboutApp.getApp': NEW,
};
