import { SevaLoader } from "@upyog/digit-ui-react-components";
import React from "react";
import { grvText } from "../config/grievanceMessages";
import { humanise } from "../utils/grievance";

// "label: value" grid used by review and application view
export const GRVGrid = ({ rows }) => (
  <dl className="npt-grid npt-grid--3 bkg-grid">
    {rows.map(([k, v]) => (
      <div key={k}>
        <dt>{k}</dt>
        <dd>{v === undefined || v === null || v === "" ? "-" : v}</dd>
      </div>
    ))}
  </dl>
);

export const GRVLookupError = ({ t, message, onRetry }) => (
  <div className="npt-lookup-error" role="alert">
    <span>{message}</span>
    {onRetry ? <button type="button" className="npt-link" onClick={onRetry}>{grvText(t, "GRV_RETRY")}</button> : null}
  </div>
);

export const GRVLoading = ({ t, message }) => <SevaLoader message={message || grvText(t, "GRV_LOADING")} />;

// status as readable text (localization key first, humanised raw status when it has none)
export const statusText = (t, status) => { const k = `GRV_ST_${status}`; const v = grvText(t, k); return v === k ? humanise(status) : v; };
