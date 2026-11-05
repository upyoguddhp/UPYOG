import { SevaLoader } from "@upyog/digit-ui-react-components";
import React from "react";
import { rqsText } from "../config/hpnocMessages";
import { humanise } from "../utils/hpnoc";

// "label: value" grid used by review and application view
export const HNCGrid = ({ rows }) => (
  <dl className="npt-grid npt-grid--3 bkg-grid">
    {rows.map(([k, v]) => (
      <div key={k}>
        <dt>{k}</dt>
        <dd>{v === undefined || v === null || v === "" ? "-" : v}</dd>
      </div>
    ))}
  </dl>
);

export const HNCLookupError = ({ t, message, onRetry }) => (
  <div className="npt-lookup-error" role="alert">
    <span>{message}</span>
    {onRetry ? <button type="button" className="npt-link" onClick={onRetry}>{rqsText(t, "HNC_RETRY")}</button> : null}
  </div>
);

export const HNCLoading = ({ t, message }) => <SevaLoader message={message || rqsText(t, "HNC_LOADING")} />;

// status as readable text (localization key first, humanised raw status when it has none)
export const statusText = (t, status) => { const k = `HNC_ST_${status}`; const v = rqsText(t, k); return v === k ? humanise(status) : v; };
