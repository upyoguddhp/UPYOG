import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useInterval from "../../../../hooks/useInterval";
import Icon from "./Icons";
import { steps, STEP_INTERVAL } from "./config";

/** Per-step browser window: address bar text, heading and the clear, high-contrast screen content. */
const SCREENS = {
  signin: { url: "citizenseva.hp.gov.in / login", titleKey: "LANDING_PV_T_SIGNIN", title: "Sign in with your mobile number" },
  choose: { url: "citizenseva.hp.gov.in / services", titleKey: "LANDING_PV_T_CHOOSE", title: "What do you need today?" },
  upload: { url: "citizenseva.hp.gov.in / apply / documents", titleKey: "LANDING_PV_T_UPLOAD", title: "Trade Licence — New" },
  pay: { url: "citizenseva.hp.gov.in / apply / payment", titleKey: "LANDING_PV_T_PAY", title: "Pay the fee" },
  track: { url: "citizenseva.hp.gov.in / track", titleKey: "LANDING_PV_T_TRACK", title: "Your application status" },
  download: { url: "citizenseva.hp.gov.in / certificate", titleKey: "LANDING_PV_T_DOWNLOAD", title: "Your certificate is ready" },
};

const Chip = ({ tone, children }) => <span className={`HXChip HXChip--${tone}`}>{children}</span>;

/** Clear, large mock of what the citizen sees in each step (all copy is a translatable default). */
const Preview = ({ id, tt }) => {
  switch (id) {
    case "signin":
      return (
        <div className="HXBody">
          <div className="HXLabel">{tt("LANDING_PV_MOBILE", "Mobile number")}</div>
          <div className="HXInput"><b>+91</b> 98765 43210</div>
          <div className="HXLabel">{tt("LANDING_PV_ENTER_OTP", "Enter the 6-digit OTP")}</div>
          <div className="HXOtp">{["4", "7", "2", "9", "", ""].map((d, i) => <i key={i} className={d ? "is-filled" : i === 4 ? "is-focus" : ""}>{d}</i>)}</div>
          <div className="HXButton">{tt("LANDING_PV_VERIFY", "Verify & continue")}</div>
          <div className="HXChips"><Chip tone="green">{tt("LANDING_PV_NO_PASSWORD", "No password to remember")}</Chip><Chip tone="amber">{tt("LANDING_PV_OTP_VALID", "OTP valid 5 min")}</Chip></div>
        </div>
      );
    case "choose":
      return (
        <div className="HXBody">
          <div className="HXInput HXInput--search"><Icon name="search" size={20} /> {tt("LANDING_PV_SEARCH", "property tax")}</div>
          {[["Pay property tax", "3 min"], ["Property mutation", "15 days"], ["Assessment certificate", "2 days"]].map(([x, tm], i) => (
            <div key={x} className={`HXRow${i === 0 ? " is-active" : ""}`}>
              <span className="HXRow__icon"><Icon name="doc" size={20} /></span>
              <b>{tt(`LANDING_PV_SVC_${i}`, x)}</b>
              <em>{tm}</em>
            </div>
          ))}
          <div className="HXChips"><Chip tone="green">{tt("LANDING_PV_SEE_FEES", "See fees & documents first")}</Chip></div>
        </div>
      );
    case "upload":
      return (
        <div className="HXBody">
          <div className="HXDrop">
            <Icon name="upload" size={30} />
            <b>{tt("LANDING_PV_DROP", "Drag files here or tap to take a photo")}</b>
            <small>{tt("LANDING_PV_DROP_SUB", "PDF / JPG · up to 5 MB each")}</small>
          </div>
          {[["Identity proof.pdf", 100, "Verified ✓", "done"], ["Premises ownership.pdf", 72, "Uploading 72%", "busy"], ["Address proof.jpg", 0, "Waiting", "wait"]].map(([n, pc, st, k]) => (
            <div className={`HXFile HXFile--${k}`} key={n}>
              <Icon name="doc" size={22} /><b>{n}</b>
              <em><i style={{ width: `${pc}%` }} /></em>
              <span>{st}</span>
            </div>
          ))}
          <div className="HXChips"><Chip tone="green">{tt("LANDING_PV_AUTOCHECK", "Auto-check: blur · size · type")}</Chip><Chip tone="amber">{tt("LANDING_PV_DRAFT", "Save as draft anytime")}</Chip></div>
        </div>
      );
    case "pay":
      return (
        <div className="HXBody">
          <div className="HXAmount"><span>{tt("LANDING_PV_PAYABLE", "Amount payable")}</span><b>₹ 4,820</b></div>
          <div className="HXMethods">
            {[["UPI", "BHIM · GPay · PhonePe"], ["Card", "Debit / Credit"], ["Net banking", "All major banks"]].map(([m, sub], i) => (
              <div key={m} className={i === 0 ? "is-active" : ""}><b>{m}</b><small>{sub}</small></div>
            ))}
          </div>
          <div className="HXButton">{tt("LANDING_PV_PAY", "Pay securely")}</div>
          <div className="HXChips"><Chip tone="green">{tt("LANDING_PV_SECURE", "Secure payment")}</Chip><Chip tone="amber">{tt("LANDING_PV_RECEIPT", "Instant receipt")}</Chip></div>
        </div>
      );
    case "track":
      return (
        <div className="HXBody">
          <ol className="HXTimeline">
            {[["Submitted", "Today, 10:42 AM"], ["Documents verified", "Today, 11:30 AM"], ["Field inspection", "In progress"], ["Approval & certificate", "Next"]].map(([x, when], i) => (
              <li key={x} className={i < 2 ? "is-done" : i === 2 ? "is-current" : ""}>
                <span className="HXTimeline__dot">{i < 2 ? <Icon name="check" size={14} strokeWidth={3} /> : null}</span>
                <b>{tt(`LANDING_PV_TL_${i}`, x)}</b>
                <small>{when}</small>
              </li>
            ))}
          </ol>
          <div className="HXChips"><Chip tone="amber">{tt("LANDING_PV_SMS", "SMS updates at every step")}</Chip></div>
        </div>
      );
    default:
      return (
        <div className="HXBody">
          <div className="HXCert">
            <span className="HXCert__tick"><Icon name="check" size={30} strokeWidth={3} /></span>
            <div>
              <b>{tt("LANDING_PV_ISSUED", "Trade Licence issued")}</b>
              <small>{tt("LANDING_PV_QR", "e-signed · QR-verifiable")}</small>
            </div>
            <span className="HXCert__qr" aria-hidden="true">{Array.from({ length: 25 }, (_, i) => <i key={i} className={[0, 2, 4, 6, 10, 12, 14, 18, 20, 22, 24].includes(i) ? "is-on" : ""} />)}</span>
          </div>
          <div className="HXButton"><Icon name="download" size={18} /> {tt("LANDING_PV_DL", "Download PDF")}</div>
          <div className="HXChips"><Chip tone="green">{tt("LANDING_PV_VALID_PAN", "Valid across Himachal Pradesh")}</Chip></div>
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
            <div className="HXWin" key={step.id}>
              <div className="HXWin__bar">
                <i /><i /><i />
                <span className="HXWin__url">{(SCREENS[step.id] || SCREENS.signin).url}</span>
              </div>
              <div className="HXWin__body">
                <span className="HXWin__step">
                  {tt("LANDING_HOW_STEP_OF", "Step")} {active + 1} {tt("LANDING_HOW_OF", "of")} {steps.length} · {tt(step.titleKey, step.title)}
                </span>
                <h4 className="HXWin__title">{tt((SCREENS[step.id] || SCREENS.signin).titleKey, (SCREENS[step.id] || SCREENS.signin).title)}</h4>
                <Preview id={step.id} tt={tt} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
