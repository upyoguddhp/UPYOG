import React from "react";
import { Link } from "react-router-dom";
import { ntlText } from "../../config/newTLMessages";
import { useNTLDocuments } from "./useNTLDocuments";

const Ico = ({ d, size = 20 }) => (
  <svg className="npt-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
export const NTL_ICONS = {
  check: "M5 13l4 4L19 7",
  shield: "M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5zM9 12l2 2 4-4",
  phone: "M5 3h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2z",
  map: "M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zM12 7.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z",
  building: "M4 21V5l8-3 8 3v16M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4",
  user: "M12 4a4 4 0 110 8 4 4 0 010-8zM4 21c0-4 4-6 8-6s8 2 8 6",
  users: "M9 5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 010 7M18 14c2.5.6 4 2.5 4 5",
  plus: "M12 5v14M5 12h14",
  copy: "M8 8h11v13H8zM5 16V3h11",
  print: "M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chev: "M9 6l6 6-6 6",
  alert: "M12 3l10 18H2zM12 10v5M12 18v.5",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
};
export const NTLIcon = ({ name, size }) => <Ico d={NTL_ICONS[name]} size={size} />;

export const NTLTricolour = () => (
  <span className="npt-tri" aria-hidden="true">
    <i /><i /><i />
  </span>
);

export const NTLCrumbs = ({ t, current }) => (
  <nav className="npt-crumbs" aria-label="Breadcrumb">
    <Link to="/digit-ui/citizen">{ntlText(t, "NTL_CRUMB_HOME")}</Link>
    <span>›</span>
    <Link to="/digit-ui/citizen/newtl/my-registrations">{ntlText(t, "NTL_CRUMB_PT")}</Link>
    <span>›</span>
    <strong aria-current="page">{current || ntlText(t, "NTL_CRUMB_NEW")}</strong>
  </nav>
);

export const NTLPageHead = ({ title, sub, children }) => (
  <div className="npt-pagehead">
    <div className="npt-pagehead__text">
      <h1>{title}</h1>
      {sub ? <p>{sub}</p> : null}
    </div>
    {children ? <div className="npt-pagehead__info">{children}</div> : null}
  </div>
);

// steps: [{key, head}] ; active: index of the highlighted step (steps.length = the review step)
export const NTLStepper = ({ t, steps, active, onGo }) => (
  <nav className="npt-stepper" aria-label={ntlText(t, "NTL_STEPPER_LABEL")}>
    <ol>
      {steps.map((s, i) => {
        const state = i < active ? "done" : i === active ? "now" : "todo";
        const label = ntlText(t, s.head);
        const inner = (
          <React.Fragment>
            <span className="npt-stepper__dot">{state === "done" ? <NTLIcon name="check" size={16} /> : i + 1}</span>
            <span className="npt-stepper__label">{label}</span>
          </React.Fragment>
        );
        return (
          <li key={s.key} className={`npt-stepper__item is-${state}`} aria-current={state === "now" ? "step" : undefined}>
            {state === "done" && onGo ? (
              <button type="button" onClick={() => onGo(s)}>{inner}</button>
            ) : (
              <span>{inner}</span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

export const NTLProgressCard = ({ t, steps, active, total }) => {
  const pct = Math.round(((active + 1) / total) * 100);
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <section className="npt-side npt-progress-card">
      <h2>{ntlText(t, "NTL_PROGRESS_TITLE")}</h2>
      <div className="npt-progress-card__body">
        <svg width="96" height="96" viewBox="0 0 96 96" role="img" aria-label={`${pct}%`}>
          <circle cx="48" cy="48" r={r} fill="none" stroke="#e3eaf6" strokeWidth="9" />
          <circle cx="48" cy="48" r={r} fill="none" stroke="#e8730c" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 48 48)" />
          <text x="48" y="54" textAnchor="middle" fontSize="18" fontWeight="800" fill="#16203f">{pct}%</text>
        </svg>
        <ul>
          {steps.map((s, i) => (
            <li key={s.key} className={i <= active ? "is-on" : ""}>
              <span aria-hidden="true" />
              {ntlText(t, s.head)}
            </li>
          ))}
        </ul>
      </div>
      <p className="npt-side__note">{ntlText(t, "NTL_PROGRESS_DRAFT")}</p>
    </section>
  );
};

const TIP_KEYS = ["NTL_TIP_1", "NTL_TIP_2", "NTL_TIP_3"];

const NTLDocsList = ({ t }) => {
  const docs = useNTLDocuments();
  if (docs.isLoading) {
    return (
      <div className="npt-modal__skel" aria-busy="true">
        <i /><i /><i />
      </div>
    );
  }
  if (docs.isError || docs.list.length === 0) return <p className="npt-modal__note">{ntlText(t, "NTL_DOCS_FAILED")}</p>;
  return (
    <React.Fragment>
      <ul className="npt-modal__docs">
        {docs.list.map((d) => (
          <li key={d.id || d.documentName}>
            <span className="npt-modal__file"><NTLIcon name="list" size={16} /></span>
            <span className="npt-modal__docname">{d.documentName}</span>
            <em className={d.required ? "" : "is-opt"}>{ntlText(t, d.required ? "NTL_DOCS_REQUIRED" : "NTL_DOCS_OPTIONAL")}</em>
          </li>
        ))}
      </ul>
      <p className="npt-modal__note">{ntlText(t, "NTL_DOCS_ONLY")}</p>
    </React.Fragment>
  );
};

// popup: tips + documents list, scrolls inside on small screens, closes on Esc / backdrop / button
export const NTLTipsModal = ({ t, onClose }) => {
  const closeRef = React.useRef(null);
  React.useEffect(() => {
    const prev = document.activeElement;
    closeRef.current && closeRef.current.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev && prev.focus && prev.focus();
    };
  }, []);
  return (
    <div className="npt-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="npt-modal__card" role="dialog" aria-modal="true" aria-labelledby="npt-modal-title">
        <NTLTricolour />
        <header className="npt-modal__head">
          <span className="npt-modal__ico"><NTLIcon name="shield" size={24} /></span>
          <h2 id="npt-modal-title">{ntlText(t, "NTL_TIPS_TITLE")}</h2>
          <button type="button" ref={closeRef} className="npt-modal__close" onClick={onClose} aria-label={ntlText(t, "NTL_CLOSE")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <div className="npt-modal__body">
          <ul className="npt-modal__tips">
            {TIP_KEYS.map((k) => (
              <li key={k}><span><NTLIcon name="check" size={16} /></span>{ntlText(t, k)}</li>
            ))}
          </ul>
          <h3>{ntlText(t, "NTL_DOCS_TITLE")}</h3>
          <NTLDocsList t={t} />
        </div>
        <footer className="npt-modal__foot">
          <NTLBtn kind="primary" onClick={onClose}>{ntlText(t, "NTL_GOT_IT")}</NTLBtn>
        </footer>
      </div>
    </div>
  );
};

export const NTLHelpCard = ({ t }) => (
  <section className="npt-side npt-help">
    <span className="npt-help__ico"><NTLIcon name="phone" size={22} /></span>
    <div>
      <strong>{ntlText(t, "NTL_HELP_TITLE")}</strong>
      <p>{ntlText(t, "NTL_HELP_LINE")}</p>
    </div>
  </section>
);

// two-column page: main content + (desktop) side cards
export const NTLPage = ({ children, aside }) => (
  <div className="npt-page">
    <div className="npt-page__main">{children}</div>
    {aside ? <aside className="npt-page__aside">{aside}</aside> : null}
  </div>
);

export const NTLActions = ({ left, right, note }) => (
  <div className="npt-actions">
    <div className="npt-actions__left">{left}</div>
    {note ? <span className="npt-actions__note"><NTLIcon name="check" size={18} /> {note}</span> : null}
    <div className="npt-actions__right">{right}</div>
  </div>
);

export const NTLBtn = ({ kind = "primary", icon, children, ...rest }) => (
  <button type="button" className={`npt-btn npt-btn--${kind}`} {...rest}>
    {icon ? <NTLIcon name={icon} size={18} /> : null}
    <span>{children}</span>
  </button>
);

// compact header widgets: progress, "before you apply" (expands), help line
export const NTLInfoBar = ({ t, steps, active, total, showTips = true, autoOpen = false }) => {
  const [open, setOpen] = React.useState(false);
  // open the "Before you apply" popup when the applicant enters the flow from outside (once per visit)
  React.useEffect(() => {
    if (!autoOpen || !showTips) return;
    try {
      if (sessionStorage.getItem("ntl_tips_seen") === "1") return;
      sessionStorage.setItem("ntl_tips_seen", "1");
    } catch (e) {}
    setOpen(true);
    return undefined;
  }, []);
  const pct = Math.round(((active + 1) / total) * 100);
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <React.Fragment>
      <section className="npt-mini npt-mini--progress" aria-label={ntlText(t, "NTL_PROGRESS_TITLE")}>
        <svg width="52" height="52" viewBox="0 0 52 52" role="img" aria-label={`${pct}%`}>
          <circle cx="26" cy="26" r={r} fill="none" stroke="#e3eaf6" strokeWidth="6" />
          <circle cx="26" cy="26" r={r} fill="none" stroke="#e8730c" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 26 26)" />
          <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="#16203f">{pct}%</text>
        </svg>
        <div>
          <strong>{ntlText(t, "NTL_PROGRESS_TITLE")}</strong>
          <small>{ntlText(t, "NTL_STEP_OF", { current: active + 1, total })}</small>
          <small>{ntlText(t, "NTL_PROGRESS_DRAFT")}</small>
        </div>
      </section>

      {showTips ? (
        <div className="npt-mini npt-mini--tips">
          <button type="button" className="npt-mini__btn" aria-haspopup="dialog" onClick={() => setOpen(true)}>
            <NTLIcon name="shield" size={22} />
            <span>{ntlText(t, "NTL_TIPS_TITLE")}</span>
            <NTLIcon name="chev" size={18} />
          </button>
        </div>
      ) : null}
      {open ? <NTLTipsModal t={t} onClose={() => setOpen(false)} /> : null}

      <section className="npt-mini npt-mini--help">
        <span className="npt-help__ico"><NTLIcon name="phone" size={22} /></span>
        <div>
          <strong>{ntlText(t, "NTL_HELP_TITLE")}</strong>
          <small>{ntlText(t, "NTL_HELP_LINE")}</small>
        </div>
      </section>
    </React.Fragment>
  );
};

// "?" help bubble next to a label: opens on hover/focus/tap, closes on Esc/blur
export const NTLHelp = ({ text, id }) => {
  const [open, setOpen] = React.useState(false);
  if (!text) return null;
  return (
    <span className="npt-help-tip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="npt-help-tip__btn"
        aria-label={text}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        ?
      </button>
      {open ? <span role="tooltip" id={id} className="npt-help-tip__bubble">{text}</span> : null}
    </span>
  );
};
