import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { rqsText } from "../../config/hpnocMessages";
import { HNCBtn, HNCCrumbs, HNCIcon } from "../../pageComponents/HpnocLayout";
import { NOC_TYPE_KEYS } from "../../config/hpnocConfig";
import { fmtDate } from "../../utils/hpnoc";

const EMBLEM = "/digit-ui/images/brand/CitizenSevaEmblem.png";

const Row = ({ label, value }) => (value ? (
  <div className="npt-rcpt__row"><dt>{label}</dt><dd>{value}</dd></div>
) : null);

const HpnocAcknowledgement = ({ t, params, clearParams, root }) => {
  const tt = (k, p) => rqsText(t, k, p);
  const [copied, setCopied] = useState(false);
  const result = params && params._result;
  const appNo = result && result.applicationNo;
  const base = root.replace(/\/new$/, ""); // .../hpnoc
  const info = (Digit.UserService.getUser() || {}).info || {};

  // refresh after the session was cleared: nothing to acknowledge
  if (!appNo) return <Redirect to={`${root}/noc`} />;

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

  const n = params.noc || {};
  const l = params.property || {};
  const a = params.applicant || {};
  const docs = (params.documents && params.documents.chosen) || [];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="npt-wrap">
      <HNCCrumbs t={t} current={tt("HNC_ACK_SUCCESS")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><HNCIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("HNC_ACK_SUCCESS")}</h1>
            <p>{tt("HNC_ACK_BANNER_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("HNC_ACK_APP_NO")}</small>
            <strong>{appNo}</strong>
            <button type="button" onClick={copy} aria-live="polite">
              <HNCIcon name="copy" size={16} /> {copied ? tt("HNC_COPIED") : tt("HNC_COPY_ID")}
            </button>
          </div>
        </div>

        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{tt("HNC_ACK_VERIFY_TITLE")}</h2>
            <p className="npt-side__note">{tt("HNC_ACK_VERIFY_HINT")}</p>
            <div className="npt-ack__btns">
              <Link to={`${base}/application/${encodeURIComponent(appNo)}`} onClick={clearParams} className="npt-btn npt-btn--primary">
                <HNCIcon name="arrow" size={18} /><span>{tt("HNC_VIEW_OPEN")}</span>
              </Link>
            </div>
          </section>

          <section className="npt-side">
            <h2>{tt("HNC_ACK_NEXT_TITLE")}</h2>
            <div className="npt-ack__btns">
              <Link to={`${base}/my-requests`} onClick={clearParams} className="npt-btn npt-btn--ghost">
                <HNCIcon name="list" size={18} /><span>{tt("HNC_ACK_GO_APPS")}</span>
              </Link>
              <HNCBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("HNC_PRINT")}</HNCBtn>
              <Link to="/digit-ui/citizen/dashboard" onClick={clearParams} className="npt-btn npt-btn--ghost">
                <span>{tt("HNC_ACK_GO_HOME")}</span>
              </Link>
            </div>
            <p className="npt-side__note">{tt("HNC_ACK_HINT")}</p>
          </section>
        </div>
      </section>

      <article className="npt-rcpt" aria-hidden="true">
        <header className="npt-rcpt__head">
          <img src={EMBLEM} alt="" />
          <div>
            <strong>{tt("HNC_RCPT_GOV")}</strong>
            <span>{tt("HNC_RCPT_DEPT")}</span>
          </div>
        </header>
        <div className="npt-rcpt__bar" />
        <h1>{tt("HNC_RCPT_TITLE")}</h1>
        <p className="npt-rcpt__svc">{n.typeOfNoc ? tt(NOC_TYPE_KEYS[n.typeOfNoc] || n.typeOfNoc) : ""}</p>
        <div className="npt-rcpt__key">
          <div><small>{tt("HNC_ACK_APP_NO")}</small><strong>{appNo}</strong></div>
          <div><small>{tt("HNC_RCPT_DATE")}</small><strong>{today}</strong></div>
          <div><small>{tt("HNC_RCPT_STATUS")}</small><strong>{tt("HNC_RCPT_STATUS_V")}</strong></div>
        </div>
        <h2>{tt("HNC_RCPT_APPLICANT")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("HNC_F_applicantName")} value={a.applicantName || info.name} />
          <Row label={tt("HNC_F_fatherName")} value={a.fatherName} />
          <Row label={tt("HNC_F_mobile")} value={a.mobile || info.mobileNumber} />
          <Row label={tt("HNC_F_email")} value={a.email} />
          <Row label={tt("HNC_F_dob")} value={fmtDate(a.dob)} />
        </dl>
        <h2>{tt("HNC_STEP_NOC")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("HNC_F_typeOfNoc")} value={n.typeOfNoc} />
          <Row label={tt("HNC_F_connectionType")} value={n.connectionType} />
          <Row label={tt("HNC_F_nocReason")} value={n.nocReason} />
        </dl>
        <h2>{tt("HNC_STEP_PROPERTY")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("HNC_F_coOwnerName")} value={l.coOwnerName} />
          <Row label={tt("HNC_F_ulbName")} value={l.ulbName} />
          <Row label={tt("HNC_F_ward")} value={l.ward} />
          <Row label={tt("HNC_F_propertyAddress")} value={l.propertyAddress} />
        </dl>
        {docs.length ? (
          <React.Fragment>
            <h2>{tt("HNC_RCPT_DOCS")}</h2>
            <ul className="npt-rcpt__docs">{docs.map((d) => <li key={d.id}>{d.documentName}</li>)}</ul>
          </React.Fragment>
        ) : null}
        <footer>
          <p>{tt("HNC_RCPT_NOTE")}</p>
          <p>{tt("HNC_RCPT_HELP")}</p>
        </footer>
      </article>
    </div>
  );
};

export default HpnocAcknowledgement;
