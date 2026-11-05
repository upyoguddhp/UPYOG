import { SevaLoader } from "@upyog/digit-ui-react-components";
import React from "react";
import { bkgText } from "../config/bookingMessages";
import { estimate, fmtDate, humanise, inr, niceName, secondsToYmd } from "../utils/booking";

// "label: value" grid used by the step side notes, review and application view
export const BKGGrid = ({ rows }) => (
  <dl className="npt-grid npt-grid--3 bkg-grid">
    {rows.map(([k, v]) => (
      <div key={k}>
        <dt>{k}</dt>
        <dd>{v === undefined || v === null || v === "" ? "-" : v}</dd>
      </div>
    ))}
  </dl>
);

// what the chosen site / hall is, shown above the dates so the citizen always sees what is being booked
export const selectionRows = (t, svc, sel) => {
  const tt = (k, p) => bkgText(t, k, p);
  if (svc === "site") {
    return [
      [tt("BKG_F_siteID"), sel.siteID],
      [tt("BKG_F_siteName"), niceName(sel.siteName)],
      [tt("BKG_F_siteType"), sel.siteType],
      [tt("BKG_F_siteAddress"), sel.siteAddress],
      [tt("BKG_F_ulbName"), sel.ulbName],
      [tt("BKG_F_districtName"), sel.districtName],
      [tt("BKG_F_size"), sel.sizeLength && sel.sizeWidth ? `${sel.sizeLength} x ${sel.sizeWidth}` : ""],
      [tt("BKG_F_siteCost"), sel.siteCost ? inr(sel.siteCost) : ""],
      [tt("BKG_F_bookablePeriod"), sel.bookingPeriodStartDate ? `${fmtDate(secondsToYmd(sel.bookingPeriodStartDate))} - ${fmtDate(secondsToYmd(sel.bookingPeriodEndDate))}` : ""],
    ];
  }
  return [
    [tt("BKG_F_assetName"), sel.assetName],
    [tt("BKG_F_applicationNo"), sel.applicationNo],
    [tt("BKG_F_assetParentCategory"), sel.assetParentCategory],
    [tt("BKG_F_ulbName"), sel.ulbName],
    [tt("BKG_F_street"), sel.street],
  ];
};

export const BKGSelection = ({ t, svc, sel }) => (
  <div className="bkg-selected">
    <h3 className="npt-section__title">{bkgText(t, svc === "site" ? "BKG_SEL_SITE" : "BKG_SEL_ASSET")}</h3>
    <BKGGrid rows={selectionRows(t, svc, sel)} />
  </div>
);

// indicative cost; shown once both dates are valid
export const BKGEstimate = ({ t, svc, sel, booking, category }) => {
  const tt = (k, p) => bkgText(t, k, p);
  const e = estimate(svc, sel, booking, category);
  if (!e.days) return null;
  return (
    <div className="bkg-estimate" role="status">
      <h3 className="npt-section__title">{tt("BKG_EST_TITLE")}</h3>
      <dl>
        <div><dt>{tt("BKG_EST_DAYS")}</dt><dd>{e.days}</dd></div>
        <div><dt>{tt("BKG_EST_RATE")}</dt><dd>{inr(e.rate)}</dd></div>
        <div><dt>{tt("BKG_EST_RENT")}</dt><dd>{inr(e.rent)}</dd></div>
        <div><dt>{tt("BKG_EST_GST", { pct: e.pct })}</dt><dd>{inr(e.gst)}</dd></div>
        <div><dt>{tt("BKG_EST_SECURITY")}</dt><dd>{inr(e.security)}</dd></div>
        <div className="is-total"><dt>{tt("BKG_EST_TOTAL")}</dt><dd>{inr(e.total)}</dd></div>
      </dl>
      <small>{tt("BKG_EST_NOTE")}</small>
    </div>
  );
};

export const BKGLookupError = ({ t, message, onRetry }) => (
  <div className="npt-lookup-error" role="alert">
    <span>{message}</span>
    {onRetry ? <button type="button" className="npt-link" onClick={onRetry}>{bkgText(t, "BKG_RETRY")}</button> : null}
  </div>
);

export const BKGLoading = ({ t, message }) => <SevaLoader message={message || bkgText(t, "BKG_LOADING")} />;

// workflow status as readable text (localization key first, humanised raw status when it has none)
export const statusText = (t, status) => { const k = `BKG_ST_${status}`; const v = bkgText(t, k); return v === k ? humanise(status) : v; };
