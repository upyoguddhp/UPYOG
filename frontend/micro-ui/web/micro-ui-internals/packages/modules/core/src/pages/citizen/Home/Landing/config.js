/**
 * Static configuration for the citizen landing page.
 * Anything an ULB should be able to change (service cards, WhatsApp / ticket links)
 * comes from MDMS `common-masters.uiHomePage`; this file only holds structure + defaults.
 * Every user-visible string is an i18n key with a default so the page renders
 * correctly even before the localization module is populated.
 */

export const ALL_SERVICES_URL = "/digit-ui/citizen/all-services";
export const LOGIN_URL = "/digit-ui/citizen/login";

// Auto-play interval for the "How it works" stepper (ms)
export const STEP_INTERVAL = 6000;

export const popularSearches = [
  { key: "LANDING_POPULAR_PT", text: "Pay property tax", match: "pt" },
  { key: "LANDING_POPULAR_TL", text: "Trade licence", match: "tl" },
  { key: "LANDING_POPULAR_WS", text: "Water connection", match: "ws" },
  { key: "LANDING_POPULAR_PGR", text: "Complaints", match: "pgr" },
];

export const steps = [
  { id: "signin", icon: "user", titleKey: "LANDING_STEP_SIGNIN", title: "Sign in with mobile", descKey: "LANDING_STEP_SIGNIN_DESC", desc: "Verify with a one-time password. No password to remember.", timeKey: "LANDING_STEP_SIGNIN_TIME", time: "20 sec" },
  { id: "choose", icon: "search", titleKey: "LANDING_STEP_CHOOSE", title: "Choose a service", descKey: "LANDING_STEP_CHOOSE_DESC", desc: "Search or browse. See fees, time and documents before you start.", timeKey: "LANDING_STEP_CHOOSE_TIME", time: "30 sec" },
  { id: "upload", icon: "upload", titleKey: "LANDING_STEP_UPLOAD", title: "Upload documents", descKey: "LANDING_STEP_UPLOAD_DESC", desc: "Add a photo or PDF. File size and type are checked as you add them.", timeKey: "LANDING_STEP_UPLOAD_TIME", time: "2 min" },
  { id: "pay", icon: "pay", titleKey: "LANDING_STEP_PAY", title: "Pay online", descKey: "LANDING_STEP_PAY_DESC", desc: "UPI, card or net banking. A receipt is generated instantly.", timeKey: "LANDING_STEP_PAY_TIME", time: "1 min" },
  { id: "track", icon: "clock", titleKey: "LANDING_STEP_TRACK", title: "Track live", descKey: "LANDING_STEP_TRACK_DESC", desc: "See every step and the officer handling it, with SMS updates.", timeKey: "LANDING_STEP_TRACK_TIME", time: "Anytime" },
  { id: "download", icon: "download", titleKey: "LANDING_STEP_DOWNLOAD", title: "Download certificate", descKey: "LANDING_STEP_DOWNLOAD_DESC", desc: "Get your e-signed certificate or licence as a verifiable PDF.", timeKey: "LANDING_STEP_DOWNLOAD_TIME", time: "Instant" },
];

export const helpCards = [
  { id: "grievance", icon: "alert", tone: "grievance", titleKey: "LANDING_HELP_GRIEVANCE", title: "Grievance", subKey: "LANDING_HELP_GRIEVANCE_SUB", sub: "A problem in your city", descKey: "LANDING_HELP_GRIEVANCE_DESC", desc: "Garbage, street-lights, water supply, roads. Add the location and a photo, and track it with an ID.", ctaKey: "LANDING_HELP_GRIEVANCE_CTA", cta: "Register grievance" },
  { id: "ticket", icon: "ticket", tone: "ticket", titleKey: "LANDING_HELP_TICKET", title: "Support ticket", subKey: "LANDING_HELP_TICKET_SUB", sub: "Help with the portal or an application", descKey: "LANDING_HELP_TICKET_DESC", desc: "Payment failed, document rejected, login issue. Your ticket reaches the right officer with the application attached.", ctaKey: "LANDING_HELP_TICKET_CTA", cta: "Create ticket" },
  { id: "chat", icon: "bot", tone: "chat", titleKey: "LANDING_HELP_CHAT", title: "Chat assistant", subKey: "LANDING_HELP_CHAT_SUB", sub: "Instant answers, any time", descKey: "LANDING_HELP_CHAT_DESC", desc: "Ask about fees, documents and application status in Hindi or English.", ctaKey: "LANDING_HELP_CHAT_CTA", cta: "Start chat" },
];

/**
 * Site-level defaults used by the website chrome (utility bar / footer).
 * Override per tenant through MDMS uiHomePage when needed.
 */
export const siteDefaults = {
  helpline: "+91 177-2809784",
  helplineHours: "Mon–Sat, 9:30 AM – 6:00 PM",
  fontScales: [0.9, 1, 1.12],
};

/**
 * Hero background videos (played muted, one after another, behind the hero content).
 * Files live in web/public/videos/hero (served from /digit-ui/videos/hero/).
 * Replace any file with department footage, or edit this list. Clips that fail to load are skipped.
 */
/**
 * Hero background media mode:
 *   "videos"          = civic-service clips (sweeping, garbage collection, paying taxes, dues, ads, payments, segregation)
 *   "himachal-videos" = Himachal photo clips (Shimla, hill towns, mountain roads)
 *   "scenes"          = animated Himachal civic scenes (illustrated, Indian characters)
 */
export const HERO_MEDIA_MODE = "videos";
export const HERO_SCENE_SECONDS = 7;
export const HERO_VIDEO_BASE = "/digit-ui/videos/hero/";
export const HERO_CLIP_SECONDS = 8; // max seconds shown per clip before moving on

/** Civic-service clips (default). Files live in web/public/videos/hero/. */
export const heroVideos = [
  { id: "sweeping", file: "street-sweeping.mp4", titleKey: "LANDING_VIDEO_SWEEPING", title: "Clean streets, every morning" },
  { id: "garbage", file: "garbage-collection.mp4", titleKey: "LANDING_VIDEO_GARBAGE", title: "Doorstep garbage collection" },
  { id: "services", file: "online-services.mp4", titleKey: "LANDING_VIDEO_SERVICES", title: "Pay property tax and bills online" },
  { id: "dues", file: "tracking-dues.mp4", titleKey: "LANDING_VIDEO_DUES", title: "Track your dues in one place" },
  { id: "ads", file: "online-advertising.mp4", titleKey: "LANDING_VIDEO_ADS", title: "Advertisement permissions, online" },
  { id: "payments", file: "online-payments.mp4", titleKey: "LANDING_VIDEO_PAYMENTS", title: "Secure online payments" },
  { id: "segregation", file: "waste-segregation.mp4", titleKey: "LANDING_VIDEO_SEGREGATION", title: "Segregate waste at source" },
];

/** Himachal photo clips (mode "himachal-videos"). */
export const heroVideosHimachal = [
  { id: "shimla", file: "shimla-timelapse.mp4", titleKey: "LANDING_HPVIDEO_CLEAN", title: "Clean streets, every morning" },
  { id: "town", file: "hill-town.mp4", titleKey: "LANDING_HPVIDEO_GARBAGE", title: "Doorstep garbage collection in every hill town" },
  { id: "road", file: "mountain-road.mp4", titleKey: "LANDING_HPVIDEO_SERVICES", title: "Pay property tax and bills online, from anywhere" },
  { id: "mall", file: "shimla-mall-road.mp4", titleKey: "LANDING_HPVIDEO_DUES", title: "Track your dues in one place" },
  { id: "sunset", file: "shimla-sunset.mp4", titleKey: "LANDING_HPVIDEO_ADS", title: "Advertisement permissions, online" },
  { id: "cable", file: "cable-cars.mp4", titleKey: "LANDING_HPVIDEO_PAYMENTS", title: "Secure online payments" },
  { id: "peaks", file: "himalayan-peaks.mp4", titleKey: "LANDING_HPVIDEO_SEGREGATION", title: "Segregate waste at source, keep the Himalayas clean" },
];

/**
 * Bhashini website translation plugin (public, key-less). Set BHASHINI_ENABLED to false to disable.
 * It translates page text in place; wrap dynamic regions with the class "bhashini-skip-translation" to exclude them.
 */
export const BHASHINI_ENABLED = true;
export const BHASHINI_SCRIPT = "https://translation-plugin.bhashini.co.in/v4/website_translation_utility.js";
export const BHASHINI_CSS = "https://translation-plugin.bhashini.co.in/v4/website_translation_utility.css";
