import React, { useState } from "react";
import { Link, Redirect, useLocation, useRouteMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fdbText } from "../../config/feedbackMessages";
import { FDBCrumbs, FDBIcon } from "../../pageComponents/FeedbackLayout";

const FeedbackAcknowledgement = () => {
  const { t } = useTranslation();
  const tt = (k, p) => fdbText(t, k, p);
  const { state } = useLocation();
  const match = useRouteMatch();
  const root = match.path.replace(/\/acknowledgement$/, "");
  const [copied, setCopied] = useState(false);
  const info = (Digit.UserService.getUser() || {}).info || {};

  // opened directly or refreshed: nothing to acknowledge
  if (!state || !state.applicationNo) return <Redirect to={`${root}/new`} />;
  const { applicationNo, serviceName, rating } = state;

  const copy = () => {
    try {
      navigator.clipboard && navigator.clipboard.writeText(applicationNo).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (e) {
      setCopied(false);
    }
  };

  return (
    <div className="npt-wrap">
      <FDBCrumbs t={t} current={tt("FDB_ACK_TITLE")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><FDBIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("FDB_ACK_TITLE")}</h1>
            <p>{tt("FDB_ACK_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("FDB_ACK_NUMBER")}</small>
            <strong>{applicationNo}</strong>
            <button type="button" onClick={copy} aria-live="polite">
              <FDBIcon name="copy" size={16} /> {copied ? tt("FDB_ACK_COPIED") : tt("FDB_ACK_COPY")}
            </button>
          </div>
        </div>
        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{serviceName}</h2>
            {rating ? <p className="fdb-ack__rating">{tt("FDB_VIEW_RATING")}: <strong>{tt("FDB_STAR", { n: rating })}</strong></p> : null}
            <p className="npt-side__note">{[info.name, info.mobileNumber].filter(Boolean).join(" · ")}</p>
            <p className="npt-side__note">{tt("FDB_ACK_NOTE")}</p>
          </section>
          <section className="npt-side">
            <div className="npt-ack__btns">
              <Link to={`${root}/my-feedback`} className="npt-btn npt-btn--primary"><span>{tt("FDB_ACK_MINE")}</span></Link>
              <Link to={`${root}/new`} className="npt-btn npt-btn--ghost"><span>{tt("FDB_ACK_AGAIN")}</span></Link>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => window.print()}>
                <FDBIcon name="print" size={18} /><span>{tt("FDB_ACK_PRINT")}</span>
              </button>
              <Link to="/digit-ui/citizen/dashboard" className="npt-btn npt-btn--ghost"><span>{tt("FDB_ACK_HOME")}</span></Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

export default FeedbackAcknowledgement;
