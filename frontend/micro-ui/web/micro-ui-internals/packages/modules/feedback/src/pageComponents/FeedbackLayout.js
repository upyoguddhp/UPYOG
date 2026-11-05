import React from "react";
import { Link } from "react-router-dom";
import { fdbText } from "../config/feedbackMessages";

const Ico = ({ d, size = 20 }) => (
  <svg className="npt-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
export const FDB_ICONS = {
  check: "M5 13l4 4L19 7",
  plus: "M12 5v14M5 12h14",
  copy: "M8 8h11v13H8zM5 16V3h11",
  print: "M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  chat: "M4 5h16v11H9l-5 4z",
  alert: "M12 3l10 18H2zM12 10v5M12 18v.5",
};
export const FDBIcon = ({ name, size }) => <Ico d={FDB_ICONS[name]} size={size} />;

export const FDBCrumbs = ({ t, current, list }) => (
  <nav className="npt-crumbs" aria-label="Breadcrumb">
    <Link to="/digit-ui/citizen">{fdbText(t, "FDB_CRUMB_HOME")}</Link>
    <span>›</span>
    {list ? <Link to="/digit-ui/citizen/feedback/my-feedback">{fdbText(t, "FDB_CRUMB_FEEDBACK")}</Link> : <strong aria-current="page">{fdbText(t, "FDB_CRUMB_FEEDBACK")}</strong>}
    {list ? <span>›</span> : null}
    {list ? <strong aria-current="page">{current}</strong> : null}
  </nav>
);

export const FDBPageHead = ({ title, sub, children }) => (
  <div className="npt-pagehead">
    <div className="npt-pagehead__text">
      <h1>{title}</h1>
      {sub ? <p>{sub}</p> : null}
    </div>
    {children ? <div className="npt-pagehead__info">{children}</div> : null}
  </div>
);

// 5-star control (radio group): tap/click or arrow keys. value 0 = nothing chosen.
export const FDBStars = ({ t, value = 0, onChange, name, describedBy }) => (
  <div className="fdb-stars" role="radiogroup" aria-describedby={describedBy}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        aria-label={`${fdbText(t, "FDB_STAR", { n })} - ${fdbText(t, `FDB_RATING_${n}`)}`}
        className={`fdb-star${n <= value ? " is-on" : ""}`}
        onClick={() => onChange(n)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(5, (value || 0) + 1));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(1, (value || 2) - 1));
        }}
        data-name={name}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      </button>
    ))}
    {value ? <span className="fdb-stars__label">{fdbText(t, `FDB_RATING_${value}`)}</span> : null}
  </div>
);
