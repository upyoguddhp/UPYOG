import { SevaLoader } from "@upyog/digit-ui-react-components";
import React from "react";
import { rqsText } from "../config/reqsvcMessages";
import { humanise, inr } from "../utils/reqsvc";

// "label: value" grid used by review and application view
export const RQSGrid = ({ rows }) => (
  <dl className="npt-grid npt-grid--3 bkg-grid">
    {rows.map(([k, v]) => (
      <div key={k}>
        <dt>{k}</dt>
        <dd>{v === undefined || v === null || v === "" ? "-" : v}</dd>
      </div>
    ))}
  </dl>
);

// fee of the chosen category, shown as soon as it is picked
export const RQSFee = ({ t, fee }) => {
  if (!fee) return null;
  return (
    <div className="bkg-estimate" role="status">
      <h3 className="npt-section__title">{rqsText(t, "RQS_FEE_TITLE")}</h3>
      <dl>
        <div className="is-total"><dt>{rqsText(t, "RQS_FEE_AMOUNT")}</dt><dd>{inr(fee)}</dd></div>
      </dl>
      <small>{rqsText(t, "RQS_FEE_NOTE")}</small>
    </div>
  );
};

export const RQSLookupError = ({ t, message, onRetry }) => (
  <div className="npt-lookup-error" role="alert">
    <span>{message}</span>
    {onRetry ? <button type="button" className="npt-link" onClick={onRetry}>{rqsText(t, "RQS_RETRY")}</button> : null}
  </div>
);

export const RQSLoading = ({ t, message }) => <SevaLoader message={message || rqsText(t, "RQS_LOADING")} />;

// status as readable text (localization key first, humanised raw status when it has none)
export const statusText = (t, status) => { const k = `RQS_ST_${status}`; const v = rqsText(t, k); return v === k ? humanise(status) : v; };
