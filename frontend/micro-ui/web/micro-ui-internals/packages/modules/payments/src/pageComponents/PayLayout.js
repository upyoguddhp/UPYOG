import { SevaLoader } from "@upyog/digit-ui-react-components";
import React from "react";
import { Link } from "react-router-dom";
import { payText } from "../config/payMessages";

const Ico = ({ d, size = 20 }) => (
  <svg className="npt-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
export const PAY_ICONS = {
  check: "M5 13l4 4L19 7",
  rupee: "M7 5h10M7 9h10M7 5c5 0 7 2 7 4s-2 4-7 4H7l8 7",
  print: "M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  alert: "M12 3l10 18H2zM12 10v5M12 18v.5",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2",
  x: "M6 6l12 12M18 6L6 18",
  shield: "M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5zM9 12l2 2 4-4",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
};
export const PAYIcon = ({ name, size }) => <Ico d={PAY_ICONS[name]} size={size} />;

export const PAYTricolour = () => (
  <span className="npt-tri" aria-hidden="true">
    <i /><i /><i />
  </span>
);

export const PAYCrumbs = ({ t, current, middle }) => (
  <nav className="npt-crumbs" aria-label="Breadcrumb">
    <Link to="/digit-ui/citizen">{payText(t, "PAY_CRUMB_HOME")}</Link>
    <span>›</span>
    {middle ? (
      <React.Fragment>
        <Link to={middle.to}>{middle.label}</Link>
        <span>›</span>
      </React.Fragment>
    ) : null}
    <strong aria-current="page">{current}</strong>
  </nav>
);

export const PAYPageHead = ({ title, sub, children }) => (
  <div className="npt-pagehead">
    <div className="npt-pagehead__text">
      <h1>{title}</h1>
      {sub ? <p>{sub}</p> : null}
    </div>
    {children ? <div className="npt-pagehead__info">{children}</div> : null}
  </div>
);

export const PAYBtn = ({ kind = "primary", icon, children, ...rest }) => (
  <button type="button" className={`npt-btn npt-btn--${kind}`} {...rest}>
    {icon ? <PAYIcon name={icon} size={18} /> : null}
    <span>{children}</span>
  </button>
);

export const PAYTabs = ({ t, active, root }) => (
  <div className="pay-tabs" role="tablist">
    <Link role="tab" aria-selected={active === "dues"} className={`pay-tab${active === "dues" ? " is-on" : ""}`} to={`${root}/dues`}>{payText(t, "PAY_TAB_DUES")}</Link>
    <Link role="tab" aria-selected={active === "history"} className={`pay-tab${active === "history" ? " is-on" : ""}`} to={`${root}/history`}>{payText(t, "PAY_TAB_HISTORY")}</Link>
  </div>
);

export const PAYLoading = ({ t, message }) => <SevaLoader message={message} />;
// full-screen loader for button-triggered calls (pay, confirm)
export const PAYBusy = ({ message }) => <SevaLoader message={message} fullScreen />;

export const PAYError = ({ t, message, onRetry }) => (
  <div className="npt-lookup-error" role="alert">
    <span>{message}</span>
    {onRetry ? <button type="button" className="npt-link" onClick={onRetry}>{payText(t, "PAY_RETRY")}</button> : null}
  </div>
);

export const PAYGrid = ({ rows }) => (
  <dl className="npt-grid npt-grid--3 bkg-grid">
    {rows.map(([k, v]) => (
      <div key={k}>
        <dt>{k}</dt>
        <dd>{v === undefined || v === null || v === "" ? "-" : v}</dd>
      </div>
    ))}
  </dl>
);
