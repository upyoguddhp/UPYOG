import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { rqsText } from "../../config/reqsvcMessages";
import { RQSBtn, RQSCrumbs, RQSIcon } from "../../pageComponents/ReqsvcLayout";
import { amountOf, fmtDate, inr, payPath } from "../../utils/reqsvc";

const EMBLEM = "/digit-ui/images/brand/CitizenSevaEmblem.png";

const Row = ({ label, value }) => (value ? (
  <div className="npt-rcpt__row"><dt>{label}</dt><dd>{value}</dd></div>
) : null);

const ReqsvcAcknowledgement = ({ t, params, clearParams, root }) => {
  const tt = (k, p) => rqsText(t, k, p);
  const [copied, setCopied] = useState(false);
  const result = params && params._result;
  const appNo = result && result.challanNo;
  const base = root.replace(/\/new$/, ""); // .../reqsvc
  const info = (Digit.UserService.getUser() || {}).info || {};

  // refresh after the session was cleared: nothing to acknowledge
  if (!appNo) return <Redirect to={`${root}/request`} />;

  const copy = () => {
    try {
      navigator.clipboard && navigator.clipboard.writeText(appNo).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (e) {
      setCopied(false);
    }
  };

  const r = params.request || {};
  const l = params.location || {};
  const a = params.applicant || {};
  const docs = (params.documents && params.documents.chosen) || [];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fee = amountOf(result);

  return (
    <div className="npt-wrap">
      <RQSCrumbs t={t} current={tt("RQS_ACK_SUCCESS")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><RQSIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("RQS_ACK_SUCCESS")}</h1>
            <p>{tt("RQS_ACK_BANNER_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("RQS_ACK_APP_NO")}</small>
            <strong>{appNo}</strong>
            <button type="button" onClick={copy} aria-live="polite">
              <RQSIcon name="copy" size={16} /> {copied ? tt("RQS_COPIED") : tt("RQS_COPY_ID")}
            </button>
          </div>
        </div>

        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{tt("RQS_ACK_PAY_TITLE")}</h2>
            <p className="npt-side__note">{tt("RQS_ACK_PAY_HINT", { amount: inr(fee) })}</p>
            <div className="npt-ack__btns">
              <Link to={{ pathname: payPath(result), state: { tenantId: result.tenantId, applicationNumber: appNo } }} onClick={clearParams} className="npt-btn npt-btn--primary">
                <RQSIcon name="arrow" size={18} /><span>{tt("RQS_PAY_NOW")}</span>
              </Link>
            </div>
          </section>

          <section className="npt-side">
            <h2>{tt("RQS_ACK_NEXT_TITLE")}</h2>
            <div className="npt-ack__btns">
              <Link to={`${base}/my-requests`} onClick={clearParams} className="npt-btn npt-btn--ghost">
                <RQSIcon name="list" size={18} /><span>{tt("RQS_ACK_GO_APPS")}</span>
              </Link>
              <RQSBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("RQS_PRINT")}</RQSBtn>
              <Link to="/digit-ui/citizen/dashboard" onClick={clearParams} className="npt-btn npt-btn--ghost">
                <span>{tt("RQS_ACK_GO_HOME")}</span>
              </Link>
            </div>
            <p className="npt-side__note">{tt("RQS_ACK_HINT")}</p>
          </section>
        </div>
      </section>

      <article className="npt-rcpt" aria-hidden="true">
        <header className="npt-rcpt__head">
          <img src={EMBLEM} alt="" />
          <div>
            <strong>{tt("RQS_RCPT_GOV")}</strong>
            <span>{tt("RQS_RCPT_DEPT")}</span>
          </div>
        </header>
        <div className="npt-rcpt__bar" />
        <h1>{tt("RQS_RCPT_TITLE")}</h1>
        <p className="npt-rcpt__svc">{r.category}</p>
        <div className="npt-rcpt__key">
          <div><small>{tt("RQS_ACK_APP_NO")}</small><strong>{appNo}</strong></div>
          <div><small>{tt("RQS_RCPT_DATE")}</small><strong>{today}</strong></div>
          <div><small>{tt("RQS_RCPT_STATUS")}</small><strong>{tt("RQS_RCPT_STATUS_V")}</strong></div>
        </div>
        <h2>{tt("RQS_RCPT_APPLICANT")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("RQS_F_name")} value={a.name || info.name} />
          <Row label={tt("RQS_F_fatherName")} value={a.fatherName} />
          <Row label={tt("RQS_F_mobileNumber")} value={a.mobileNumber || info.mobileNumber} />
          <Row label={tt("RQS_F_emailId")} value={a.emailId} />
        </dl>
        <h2>{tt("RQS_STEP_REQUEST")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("RQS_F_category")} value={r.category} />
          <Row label={tt("RQS_F_issueDate")} value={fmtDate(r.issueDate)} />
          <Row label={tt("RQS_F_ulbName")} value={l.ulbName} />
          <Row label={tt("RQS_F_street")} value={[l.street, l.landmark].filter(Boolean).join(", ")} />
          <Row label={tt("RQS_FEE_AMOUNT")} value={inr(fee)} />
        </dl>
        {docs.length ? (
          <React.Fragment>
            <h2>{tt("RQS_RCPT_DOCS")}</h2>
            <ul className="npt-rcpt__docs">{docs.map((d) => <li key={d.id}>{d.documentName}</li>)}</ul>
          </React.Fragment>
        ) : null}
        <footer>
          <p>{tt("RQS_RCPT_NOTE")}</p>
          <p>{tt("RQS_RCPT_HELP")}</p>
        </footer>
      </article>
    </div>
  );
};

export default ReqsvcAcknowledgement;
