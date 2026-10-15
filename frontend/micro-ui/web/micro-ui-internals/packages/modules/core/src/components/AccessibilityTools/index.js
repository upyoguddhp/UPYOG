import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULTS,
  resetAccessibility,
  setAccessibility,
  speakPage,
  speechSupported,
  stopSpeaking,
  useAccessibility,
} from "./settings";

const G = {
  speaker: <path d="M4 9v6h4l5 4V5L8 9H4zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11" />,
  spacing: <path d="M4 6v12M20 6v12M8 12h8M8 12l2-2M8 12l2 2M16 12l-2-2M16 12l-2 2" />,
  lineheight: <path d="M8 6h12M8 12h12M8 18h12M4 4v16M2 6l2-2 2 2M2 18l2 2 2-2" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  a: <path d="M5 19L12 5l7 14M8 14h8" />,
  link: <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />,
  dyslexia: <path d="M3 18L8 6l5 12M5 14h6M15 8h6M15 12h6M15 16h4" />,
  image: <path d="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M3 3l18 18" />,
  cursor: <path d="M6 3l12 8-5 1.5L16 20l-3 1-3-7-4 3z" />,
  moon: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />,
  invert: <path d="M12 3a9 9 0 100 18V3z" />,
  eye: <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z" />,
  drop: <path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z" />,
  reset: <path d="M4 12a8 8 0 108-8M4 4v5h5" />,
  check: <path d="M5 13l4 4L19 7" />,
};

const Glyph = ({ name }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {G[name]}
  </svg>
);

/** One tool tile. `level`/`steps` render the small step dots used by multi-level tools. */
const Tile = ({ icon, label, active, onClick, steps, level, wide }) => (
  <button
    type="button"
    className={`A11yTile ${active ? "is-active" : ""} ${wide ? "A11yTile--wide" : ""}`}
    onClick={onClick}
    aria-pressed={!!active}
  >
    <span className="A11yTile__icon"><Glyph name={icon} /></span>
    <span className="A11yTile__label">{label}</span>
    {steps ? (
      <span className="A11yTile__steps" aria-hidden="true">
        {Array.from({ length: steps }).map((_, i) => (
          <i key={i} className={i < level ? "is-on" : ""} />
        ))}
      </span>
    ) : null}
    {active ? <span className="A11yTile__tick"><Glyph name="check" /></span> : null}
  </button>
);

const cycle = (value, max) => (value >= max ? 0 : value + 1);

/**
 * GIGW-style accessibility tools panel (text to speech, spacing, line height, font size,
 * highlight links, dyslexia font, hide images, big cursor, dark / invert, ADHD mask, saturation, reset).
 * Preferences persist and apply to every page. Opens on click or keyboard; Esc closes.
 */
const AccessibilityTools = ({ buttonClassName = "", compact = false }) => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const s = useAccessibility();
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onDoc = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  useEffect(() => () => stopSpeaking(), []);

  const toggleSpeech = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const lang = Digit.StoreData.getCurrentLanguage() === "hi_IN" ? "hi-IN" : "en-IN";
    const u = speakPage(lang, { onEnd: () => setSpeaking(false) });
    setSpeaking(!!u);
  };

  const satLabels = [tt("A11Y_SATURATION", "Saturation"), tt("A11Y_LOW_SAT", "Low saturation"), tt("A11Y_HIGH_SAT", "High saturation"), tt("A11Y_DESATURATE", "Desaturate")];
  const changed = JSON.stringify(s) !== JSON.stringify(DEFAULTS);

  return (
    <div className="A11yTools" ref={wrap}>
      <button
        type="button"
        className={`A11yTools__btn ${buttonClassName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={tt("A11Y_TOOLS", "Accessibility tools")}
        title={tt("A11Y_TOOLS", "Accessibility tools")}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="4.5" r="2" />
          <path d="M5 8.5l7 1.5 7-1.5M12 10v5M12 15l-3 6M12 15l3 6" />
        </svg>
        {compact ? null : <span>{tt("A11Y_SHORT", "Accessibility")}</span>}
      </button>

      {open && (
        <div className="A11yPanel" role="dialog" aria-label={tt("A11Y_TOOLS", "Accessibility tools")}>
          <div className="A11yPanel__head">{tt("A11Y_TOOLS", "Accessibility tools")}</div>
          <div className="A11yPanel__grid">
            {speechSupported() && <Tile icon="speaker" label={tt("A11Y_TTS", "Text to speech")} active={speaking} onClick={toggleSpeech} />}
            <Tile icon="spacing" label={tt("A11Y_SPACING", "Text spacing")} active={s.spacing > 0} steps={3} level={s.spacing} onClick={() => setAccessibility({ spacing: cycle(s.spacing, 3) })} />
            <Tile icon="lineheight" label={tt("A11Y_LINE_HEIGHT", "Line height")} active={s.lineHeight > 0} steps={3} level={s.lineHeight} onClick={() => setAccessibility({ lineHeight: cycle(s.lineHeight, 3) })} />
            <Tile icon="plus" label={tt("A11Y_FONT_UP", "Increase font size")} active={s.fontSize > 0} onClick={() => setAccessibility({ fontSize: Math.min(2, s.fontSize + 1) })} />
            <Tile icon="a" label={tt("A11Y_FONT_NORMAL", "Normal fonts")} active={s.fontSize === 0} onClick={() => setAccessibility({ fontSize: 0 })} />
            <Tile icon="minus" label={tt("A11Y_FONT_DOWN", "Decrease font size")} active={s.fontSize < 0} onClick={() => setAccessibility({ fontSize: -1 })} />
            <Tile icon="link" label={tt("A11Y_LINKS", "Highlight links")} active={s.links} onClick={() => setAccessibility({ links: !s.links })} />
            <Tile icon="dyslexia" label={tt("A11Y_DYSLEXIA", "Dyslexia friendly")} active={s.dyslexia} onClick={() => setAccessibility({ dyslexia: !s.dyslexia })} />
            <Tile icon="image" label={tt("A11Y_HIDE_IMAGES", "Hide images")} active={s.hideImages} onClick={() => setAccessibility({ hideImages: !s.hideImages })} />
            <Tile icon="cursor" label={tt("A11Y_CURSOR", "Cursor")} active={s.cursor} onClick={() => setAccessibility({ cursor: !s.cursor })} />
            <Tile icon="moon" label={tt("A11Y_DARK", "Contrast: light / dark")} active={s.theme === "dark"} onClick={() => setAccessibility({ theme: s.theme === "dark" ? "normal" : "dark" })} />
            <Tile icon="invert" label={tt("A11Y_INVERT", "Invert colors")} active={s.theme === "invert"} onClick={() => setAccessibility({ theme: s.theme === "invert" ? "normal" : "invert" })} />
            <Tile icon="eye" label={tt("A11Y_ADHD", "ADHD mode")} active={s.adhd} onClick={() => setAccessibility({ adhd: !s.adhd })} />
            <Tile icon="drop" label={satLabels[s.saturation]} active={s.saturation > 0} steps={3} level={s.saturation} onClick={() => setAccessibility({ saturation: cycle(s.saturation, 3) })} />
          </div>
          <button type="button" className="A11yPanel__reset" onClick={() => { stopSpeaking(); setSpeaking(false); resetAccessibility(); }} disabled={!changed}>
            <Glyph name="reset" /> {tt("A11Y_RESET", "Reset all settings")}
          </button>
        </div>
      )}
    </div>
  );
};

export default AccessibilityTools;
