import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useInterval from "../../../../hooks/useInterval";
import Icon from "./Icons";
import { steps, STEP_INTERVAL } from "./config";

/** Small CSS-drawn mock of what the user sees in each step. */
const Preview = ({ id, tt }) => {
  switch (id) {
    case "signin":
      return (
        <div className="HIWPreview__body">
          <div className="HIWField">{tt("LANDING_PV_MOBILE", "Mobile number")}<b>+91 ••••• ••123</b></div>
          <div className="HIWOtp">{[1, 2, 3, 4, 5, 6].map((n) => <i key={n} className={n < 4 ? "is-filled" : ""} />)}</div>
          <div className="HIWBtn">{tt("LANDING_PV_VERIFY", "Verify & continue")}</div>
        </div>
      );
    case "choose":
      return (
        <div className="HIWPreview__body">
          <div className="HIWField"><Icon name="search" size={16} /> {tt("LANDING_PV_SEARCH", "property tax")}</div>
          {["Pay property tax", "Property mutation", "Assessment certificate"].map((x, i) => (
            <div key={x} className={`HIWRow ${i === 0 ? "is-active" : ""}`}><Icon name="doc" size={16} /> {x}</div>
          ))}
        </div>
      );
    case "upload":
      return (
        <div className="HIWPreview__body">
          <div className="HIWDrop"><Icon name="upload" size={24} /> {tt("LANDING_PV_DROP", "Drag files here or tap to take a photo")}</div>
          {[["Identity proof.pdf", 100], ["Ownership.pdf", 70], ["Address proof.jpg", 0]].map(([n, p]) => (
            <div className="HIWFile" key={n}><span>{n}</span><em><i style={{ width: `${p}%` }} /></em></div>
          ))}
        </div>
      );
    case "pay":
      return (
        <div className="HIWPreview__body">
          <div className="HIWAmount">{tt("LANDING_PV_PAYABLE", "Amount payable")}<b>₹ 4,820</b></div>
          <div className="HIWMethods">{["UPI", "Card", "Net banking"].map((m, i) => <span key={m} className={i === 0 ? "is-active" : ""}>{m}</span>)}</div>
          <div className="HIWBtn">{tt("LANDING_PV_PAY", "Pay securely")}</div>
        </div>
      );
    case "track":
      return (
        <div className="HIWPreview__body">
          <ol className="HIWTimeline">
            {["Submitted", "Documents verified", "Field inspection", "Approval"].map((x, i) => (
              <li key={x} className={i < 2 ? "is-done" : i === 2 ? "is-current" : ""}><span />{x}</li>
            ))}
          </ol>
        </div>
      );
    default:
      return (
        <div className="HIWPreview__body">
          <div className="HIWCert"><Icon name="check" size={28} strokeWidth={2.6} /><b>{tt("LANDING_PV_ISSUED", "Certificate issued")}</b><small>{tt("LANDING_PV_QR", "QR-verifiable · e-signed")}</small></div>
          <div className="HIWBtn"><Icon name="download" size={16} /> {tt("LANDING_PV_DL", "Download PDF")}</div>
        </div>
      );
  }
};

/**
 * Interactive "How it works": auto-plays a step every STEP_INTERVAL ms, pauses on
 * hover/focus, click or arrow keys pin a step, and honours prefers-reduced-motion.
 */
const HowItWorks = () => {
  const { t } = useTranslation();
  const tt = (key, text) => t(key, { defaultValue: text });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const reduce = useRef(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const playing = !paused && !pinned && !reduce.current;
  useInterval(() => setActive((a) => (a + 1) % steps.length), playing ? STEP_INTERVAL : null);

  const choose = useCallback((i) => {
    setActive(i);
    setPinned(true);
  }, []);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); choose((active + 1) % steps.length); }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); choose((active - 1 + steps.length) % steps.length); }
  };

  // restart the progress bar animation whenever the active step changes
  const [tick, setTick] = useState(0);
  useEffect(() => setTick((n) => n + 1), [active]);

  const step = steps[active];
  const go = (d) => choose((active + d + steps.length) % steps.length);
  return (
    <section className="HowX" id="landing-how" aria-labelledby="howx-title">
      <header className="HowX__head">
        <span className="HowX__eyebrow">{tt("LANDING_HOW_EYEBROW", "Simple process")}</span>
        <h2 id="howx-title">{tt("LANDING_HOW_TITLE", "How it works")}</h2>
        <p>{tt("LANDING_HOW_SUB", "Six steps, about five minutes. Tap a step to see what you'll do.")}</p>
      </header>

      <div
        className="HowX__stage"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <ol className="HowX__track" role="tablist" aria-label={tt("LANDING_HOW_TITLE", "How it works")} onKeyDown={onKeyDown}>
          {steps.map((s, i) => (
            <li key={s.id} className={`HowX__node ${i === active ? "is-active" : ""} ${i < active ? "is-past" : ""}`}>
              <button type="button" role="tab" aria-selected={i === active} tabIndex={i === active ? 0 : -1} onClick={() => choose(i)}>
                <span className="HowX__dot">{i < active ? <Icon name="check" size={18} strokeWidth={3} /> : <Icon name={s.icon} size={20} />}</span>
                <span className="HowX__nodeLabel">{tt(s.titleKey, s.title)}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="HowX__card" aria-live="polite">
          <div className="HowX__info">
            <span className="HowX__step">{tt("LANDING_HOW_STEP_OF", "Step")} {active + 1} / {steps.length}</span>
            <h3>{tt(step.titleKey, step.title)}</h3>
            <p>{tt(step.descKey, step.desc)}</p>
            <span className="HowX__time"><Icon name="clock" size={16} /> {tt(step.timeKey, step.time)}</span>
            <span className="HowX__bar">
              <i key={tick} className={playing ? "is-running" : ""} style={{ animationDuration: `${STEP_INTERVAL}ms` }} />
            </span>
            <div className="HowX__controls">
              <button type="button" onClick={() => go(-1)} aria-label={tt("LANDING_HOW_PREV", "Previous step")}>
                <Icon name="arrow" size={18} className="HowX__prev" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={tt("LANDING_HOW_NEXT", "Next step")}>
                <Icon name="arrow" size={18} />
              </button>
              <button type="button" className="HowX__play" onClick={() => setPinned((p) => !p)} aria-pressed={!pinned}>
                <Icon name={pinned ? "play" : "pause"} size={16} />
                {pinned ? tt("LANDING_HOW_RESUME", "Resume auto-play") : tt("LANDING_HOW_AUTOPLAY", "Auto-play")}
              </button>
            </div>
          </div>
          <div className="HowX__device">
            <div className="HIWPreview">
              <div className="HIWPreview__bar"><i /><i /><i /></div>
              <div className="HIWPreview__head"><h3>{tt(step.titleKey, step.title)}</h3></div>
              <Preview id={step.id} tt={tt} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
