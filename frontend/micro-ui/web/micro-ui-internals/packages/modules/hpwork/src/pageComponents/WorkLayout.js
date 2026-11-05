import React from "react";
import { Link } from "react-router-dom";
import { wrkText } from "../config/hpworkMessages";

const Ico = ({ d, size = 20 }) => (
  <svg className="npt-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
export const WRK_ICONS = {
  briefcase: "M3 8h18v12H3zM8 8V5h8v3M3 13h18",
  paw: "M7 11a2 2 0 110-4 2 2 0 010 4zM17 11a2 2 0 110-4 2 2 0 010 4zM10 7a2 2 0 110-4 2 2 0 010 4zM14 7a2 2 0 110-4 2 2 0 010 4zM12 12c-3 0-5 3-5 5 0 2 2 2 5 2s5 0 5-2c0-2-2-5-5-5z",
  alert: "M12 3l10 18H2zM12 10v5M12 18v.5",
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  print: "M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z",
  check: "M5 13l4 4L19 7",
  close: "M6 6l12 12M18 6L6 18",
  file: "M6 3h8l4 4v14H6zM14 3v4h4",
  clock: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l3 2",
};
export const WRKIcon = ({ name, size }) => <Ico d={WRK_ICONS[name] || WRK_ICONS.file} size={size} />;

export const WRKCrumbs = ({ t, current }) => (
  <nav className="npt-crumbs" aria-label="Breadcrumb">
    <Link to="/digit-ui/employee">{wrkText(t, "WRK_CRUMB_HOME")}</Link>
    <span>›</span>
    {current ? <Link to="/digit-ui/employee/hpwork/inbox">{wrkText(t, "WRK_CRUMB_INBOX")}</Link> : <strong aria-current="page">{wrkText(t, "WRK_CRUMB_INBOX")}</strong>}
    {current ? <span>›</span> : null}
    {current ? <strong aria-current="page">{current}</strong> : null}
  </nav>
);

export const WRKPageHead = ({ title, sub }) => (
  <div className="npt-pagehead">
    <div className="npt-pagehead__text">
      <h1>{title}</h1>
      {sub ? <p>{sub}</p> : null}
    </div>
  </div>
);

// "label: value" grid; rows are [label, value]
export const WRKGrid = ({ rows }) => (
  <dl className="npt-grid npt-grid--3 bkg-grid">
    {rows.map(([k, v]) => (
      <div key={k}>
        <dt>{k}</dt>
        <dd>{v === undefined || v === null || v === "" ? "-" : v}</dd>
      </div>
    ))}
  </dl>
);
