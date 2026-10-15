/**
 * Accessibility Statement content (GIGW 3.0 / WCAG 2.1).
 * Only features that exist in this portal are listed. The department must fill in the
 * values marked CONFIGURE before publishing: audit status, contact officer and review date.
 */
export const statementConfig = {
  // CONFIGURE: update after a formal accessibility audit (e.g. by an STQC / empanelled auditor)
  auditStatus: "pending", // "pending" | "partial" | "conformant"
  auditedOn: "", // e.g. "12 March 2027"
  lastReviewed: "14 October 2026",

  // CONFIGURE: grievance / accessibility contact for this portal
  contact: {
    name: "", // e.g. "Nodal Officer, Directorate of Urban Development"
    email: "",
    phone: "+91 177-2809784",
    hours: "Mon–Sat, 9:30 AM – 6:00 PM",
    postalAddress: "",
  },

  standards: [
    { id: "gigw", label: "GIGW 3.0: Guidelines for Indian Government Websites and Apps", url: "https://guidelines.india.gov.in/" },
    { id: "wcag", label: "WCAG 2.1: Web Content Accessibility Guidelines", url: "https://www.w3.org/TR/WCAG21/" },
    { id: "bhashini", label: "Bhashini: language translation service", url: "https://bhashini.gov.in/" },
  ],
};

/** Features implemented in this portal (labels are i18n keys with English defaults). */
export const featureList = [
  { id: "skip", key: "A11Y_STMT_F_SKIP", text: "“Skip to main content” link at the top of every page." },
  { id: "landmarks", key: "A11Y_STMT_F_LANDMARKS", text: "Page structure uses header, navigation, main and footer regions, and form fields have labels." },
  { id: "keyboard", key: "A11Y_STMT_F_KEYBOARD", text: "Menus, tabs, search, the accessibility panel and the “How it works” steps can be operated from the keyboard; Esc closes open panels." },
  { id: "size", key: "A11Y_STMT_F_SIZE", text: "Text size can be decreased, reset or increased; text spacing and line height have three levels each." },
  { id: "contrast", key: "A11Y_STMT_F_CONTRAST", text: "Light / dark contrast, colour inversion and three saturation levels." },
  { id: "links", key: "A11Y_STMT_F_LINKS", text: "Links can be highlighted, and a larger mouse cursor can be turned on." },
  { id: "dyslexia", key: "A11Y_STMT_F_DYSLEXIA", text: "Dyslexia-friendly font, an ADHD reading mask, and an option to hide images." },
  { id: "tts", key: "A11Y_STMT_F_TTS", text: "Text to speech reads the selected text or the main content (uses the voices installed on your device)." },
  { id: "motion", key: "A11Y_STMT_F_MOTION", text: "Moving background media can be paused, and it is switched off automatically if your device asks for reduced motion." },
  { id: "language", key: "A11Y_STMT_F_LANGUAGE", text: "English and Hindi are built in, and the Bhashini plugin translates pages into more Indian languages." },
  { id: "persist", key: "A11Y_STMT_F_PERSIST", text: "Your accessibility choices are remembered in your browser for your next visit." },
];

export const limitations = [
  { id: "audit", key: "A11Y_STMT_L_AUDIT", text: "A formal accessibility audit and testing with assistive technologies (screen readers, switch devices) have not been completed yet." },
  { id: "modules", key: "A11Y_STMT_L_MODULES", text: "Some service modules inherited from the UPYOG platform may not yet meet every accessibility requirement." },
  { id: "translation", key: "A11Y_STMT_L_TRANSLATION", text: "Machine translation by Bhashini may be imperfect; the English or Hindi text is the reference." },
  { id: "documents", key: "A11Y_STMT_L_DOCUMENTS", text: "Some uploaded or downloadable documents (for example scanned PDFs or certificates) may not be fully accessible." },
  { id: "video", key: "A11Y_STMT_L_VIDEO", text: "Background videos on the home page are decorative, have no audio, and carry no information that is not available as text." },
];
