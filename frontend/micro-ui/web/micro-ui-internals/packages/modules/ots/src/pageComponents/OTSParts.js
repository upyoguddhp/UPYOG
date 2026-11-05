import { SevaLoader } from "@upyog/digit-ui-react-components";
import React from "react";
import { otsText } from "../config/otsMessages";
import { humanise } from "../utils/ots";

// "label: value" grid used by review and application view
export const OTSGrid = ({ rows }) => (
  <dl className="npt-grid npt-grid--3 ots-grid">
    {rows.map(([k, v]) => (
      <div key={k}>
        <dt>{k}</dt>
        <dd>{v === undefined || v === null || v === "" ? "-" : v}</dd>
      </div>
    ))}
  </dl>
);

export const OTSLookupError = ({ t, message, onRetry }) => (
  <div className="npt-lookup-error" role="alert">
    <span>{message}</span>
    {onRetry ? <button type="button" className="npt-link" onClick={onRetry}>{otsText(t, "OTS_RETRY")}</button> : null}
  </div>
);

export const OTSLoading = ({ t, message }) => <SevaLoader message={message || otsText(t, "OTS_LOADING")} />;

// workflow status as readable text (localization key first, humanised raw status when it has none)
export const statusText = (t, status) => { const k = `OTS_ST_${status}`; const v = otsText(t, k); return v === k ? humanise(status) : v; };
