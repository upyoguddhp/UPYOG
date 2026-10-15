import { useEffect, useState } from "react";

/**
 * Accessibility preferences (GIGW style tools): one shared store, persisted in
 * localStorage and applied to <html> as classes + CSS variables, so every page of
 * the portal honours them. Styles live in the CSS package (components/accessibility.scss).
 */
const STORAGE_KEY = "upyog.accessibility";

export const DEFAULTS = {
  fontSize: 0, // -1 smaller, 0 normal, 1 larger, 2 largest
  spacing: 0, // 0..3 letter / word spacing
  lineHeight: 0, // 0..3
  links: false, // highlight links
  dyslexia: false,
  hideImages: false,
  cursor: false, // big cursor
  theme: "normal", // normal | dark | invert
  adhd: false, // reading mask
  saturation: 0, // 0 normal, 1 low, 2 high, 3 greyscale
};

const FONT_ZOOM = { "-1": 0.9, 0: 1, 1: 1.12, 2: 1.25 };
const SATURATION_FILTER = { 0: "", 1: "saturate(0.5)", 2: "saturate(1.8)", 3: "grayscale(1)" };

const read = () => {
  try {
    return { ...DEFAULTS, ...(JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch (e) {
    return { ...DEFAULTS };
  }
};

const write = (s) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    /* storage unavailable (private mode): preferences still apply for this session */
  }
};

let state = typeof window !== "undefined" ? read() : { ...DEFAULTS };
const listeners = new Set();

/* ADHD reading mask follows the pointer */
let maskHandler = null;
const setMask = (on) => {
  if (on && !maskHandler) {
    maskHandler = (e) => document.documentElement.style.setProperty("--a11y-y", `${e.clientY}px`);
    document.documentElement.style.setProperty("--a11y-y", "40vh");
    window.addEventListener("mousemove", maskHandler, { passive: true });
  } else if (!on && maskHandler) {
    window.removeEventListener("mousemove", maskHandler);
    maskHandler = null;
  }
};

export const applyAccessibility = (s = state) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const toggle = (c, on) => root.classList.toggle(c, !!on);

  // font size: zoom the app root
  const zoom = FONT_ZOOM[s.fontSize] || 1;
  root.style.setProperty("--a11y-zoom", String(zoom));
  toggle("a11y-zoom", zoom !== 1);

  [1, 2, 3].forEach((n) => {
    toggle(`a11y-spacing-${n}`, s.spacing === n);
    toggle(`a11y-lh-${n}`, s.lineHeight === n);
  });
  toggle("a11y-links", s.links);
  toggle("a11y-dyslexia", s.dyslexia);
  toggle("a11y-hide-images", s.hideImages);
  toggle("a11y-cursor", s.cursor);
  toggle("a11y-adhd", s.adhd);
  setMask(s.adhd);

  // colour filters (theme + saturation) are composed into one filter value
  const parts = [];
  if (s.theme === "dark") parts.push("invert(1) hue-rotate(180deg)");
  if (s.theme === "invert") parts.push("invert(1)");
  if (SATURATION_FILTER[s.saturation]) parts.push(SATURATION_FILTER[s.saturation]);
  root.style.setProperty("--a11y-filter", parts.join(" ") || "none");
  toggle("a11y-filter", parts.length > 0);
  toggle("a11y-theme-dark", s.theme === "dark");
};

export const getAccessibility = () => state;

export const setAccessibility = (patch) => {
  state = { ...state, ...patch };
  write(state);
  applyAccessibility(state);
  listeners.forEach((l) => l(state));
};

export const resetAccessibility = () => setAccessibility({ ...DEFAULTS });

/** Apply saved preferences (call once when a page mounts). */
export const applyStoredAccessibility = () => applyAccessibility(state);

export const useAccessibility = () => {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    setS(state);
    return () => listeners.delete(setS);
  }, []);
  return s;
};

/* ---------------------------------------------------------------- text to speech */
export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

const readableText = () => {
  const sel = window.getSelection && window.getSelection().toString().trim();
  if (sel) return sel;
  const el = document.getElementById("landing-main") || document.querySelector("main") || document.getElementById("root");
  return (el ? el.innerText : "").replace(/\s+/g, " ").trim().slice(0, 4000);
};

export const stopSpeaking = () => speechSupported() && window.speechSynthesis.cancel();

/** Reads the selected text, or the main content when nothing is selected. Returns the utterance. */
export const speakPage = (lang = "en-IN", handlers = {}) => {
  if (!speechSupported()) return null;
  stopSpeaking();
  const text = readableText();
  if (!text) return null;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.95;
  u.onend = handlers.onEnd;
  u.onerror = handlers.onEnd;
  window.speechSynthesis.speak(u);
  return u;
};
