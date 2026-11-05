import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { otsText } from "../../config/otsMessages";
import { OTSBtn, OTSCrumbs, OTSIcon } from "../../pageComponents/OTSLayout";
import { OTS_ANY_OTHER } from "../../config/otsConfig";
import { fmtDate, inr } from "../../utils/ots";

const EMBLEM = "/digit-ui/images/brand/CitizenSevaEmblem.png";
const NEXT = [1, 2, 3, 4];

const Row = ({ label, value }) => (value ? (
  <div className="npt-rcpt__row"><dt>{label}</dt><dd>{value}</dd></div>
) : null);

const OTSAcknowledgement = ({ t, params, clearParams, root }) => {
  const tt = (k, p) => otsText(t, k, p);
  const [copied, setCopied] = useState(false);
  const appNo = params && params._applicationId;
  const base = root.replace(/\/new$/, ""); // .../ots
  const info = (Digit.UserService.getUser() || {}).info || {};

  // refresh after the session was cleared: nothing to acknowledge
  if (!appNo) return <Redirect to={`${root}/applicant`} />;

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

  const a = params.applicant || {};
  const sh = params.shop || {};
  const loans = (params.loans || {}).list || [];
  const docs = (params.documents && params.documents.chosen) || [];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="npt-wrap">
      <OTSCrumbs t={t} current={tt("OTS_ACK_SUCCESS")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><OTSIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("OTS_ACK_SUCCESS")}</h1>
            <p>{tt("OTS_ACK_BANNER_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("OTS_ACK_APP_NO")}</small>
            <strong>{appNo}</strong>
            <button type="button" onClick={copy} aria-live="polite">
              <OTSIcon name="copy" size={16} /> {copied ? tt("OTS_COPIED") : tt("OTS_COPY_ID")}
            </button>
          </div>
        </div>

        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{tt("OTS_ACK_WHERE")}</h2>
            <ol className="npt-track">
              {NEXT.map((n, i) => (
                <li key={n} className={i === 0 ? "is-done" : i === 1 ? "is-now" : ""}>
                  <span className="npt-track__dot">{i === 0 ? <OTSIcon name="check" size={14} /> : n}</span>
                  <div>
                    <strong>{tt(`OTS_NEXT_${n}`)}</strong>
                    {i === 1 ? <em>{tt("OTS_ACK_PENDING")}</em> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="npt-side">
            <h2>{tt("OTS_ACK_NEXT_TITLE")}</h2>
            <div className="npt-ack__btns">
              <Link to={`${base}/my-applications`} onClick={clearParams} className="npt-btn npt-btn--primary">
                <OTSIcon name="list" size={18} /><span>{tt("OTS_ACK_GO_APPS")}</span>
              </Link>
              <OTSBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("OTS_PRINT")}</OTSBtn>
              <Link to="/digit-ui/citizen/dashboard" onClick={clearParams} className="npt-btn npt-btn--ghost">
                <span>{tt("OTS_ACK_GO_HOME")}</span>
              </Link>
            </div>
            <p className="npt-side__note">{tt("OTS_ACK_HINT")}</p>
          </section>
        </div>
      </section>

      <article className="npt-rcpt" aria-hidden="true">
        <header className="npt-rcpt__head">
          <img src={EMBLEM} alt="" />
          <div>
            <strong>{tt("OTS_RCPT_GOV")}</strong>
            <span>{tt("OTS_RCPT_DEPT")}</span>
          </div>
        </header>
        <div className="npt-rcpt__bar" />
        <h1>{tt("OTS_RCPT_TITLE")}</h1>
        <p className="npt-rcpt__svc">{tt("OTS_RCPT_SERVICE")}</p>
        <div className="npt-rcpt__key">
          <div><small>{tt("OTS_ACK_APP_NO")}</small><strong>{appNo}</strong></div>
          <div><small>{tt("OTS_RCPT_DATE")}</small><strong>{today}</strong></div>
          <div><small>{tt("OTS_RCPT_STATUS")}</small><strong>{tt("OTS_RCPT_STATUS_V")}</strong></div>
        </div>
        <h2>{tt("OTS_RCPT_APPLICANT")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("OTS_F_applicantName")} value={a.applicantName || info.name} />
          <Row label={tt("OTS_F_fatherName")} value={a.fatherName} />
          <Row label={tt("OTS_F_mobileNumber")} value={a.mobileNumber || info.mobileNumber} />
          <Row label={tt("OTS_F_dateOfBirth")} value={fmtDate(a.dateOfBirth)} />
        </dl>
        <h2>{tt("OTS_RCPT_SHOP")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("OTS_F_ulbName")} value={sh.ulbName} />
          <Row label={tt("OTS_F_shopAddress")} value={[sh.shopAddress, sh.ward, sh.pincode].filter(Boolean).join(", ")} />
          <Row label={tt("OTS_F_shopType")} value={sh.shopType === OTS_ANY_OTHER ? sh.shopTypeOther : sh.shopType} />
          <Row label={tt("OTS_F_annualTurnover")} value={inr(sh.annualTurnover)} />
        </dl>
        {loans.length ? (
          <React.Fragment>
            <h2>{tt("OTS_RCPT_LOANS")}</h2>
            <ul className="npt-rcpt__docs">{loans.map((l, i) => <li key={i}>{`${l.bankName} - ${l.branchName}: ${inr(l.amountAvailed)}`}</li>)}</ul>
          </React.Fragment>
        ) : null}
        {docs.length ? (
          <React.Fragment>
            <h2>{tt("OTS_RCPT_DOCS")}</h2>
            <ul className="npt-rcpt__docs">{docs.map((d) => <li key={d.id}>{d.documentName}</li>)}</ul>
          </React.Fragment>
        ) : null}
        <footer>
          <p>{tt("OTS_RCPT_NOTE")}</p>
          <p>{tt("OTS_RCPT_HELP")}</p>
        </footer>
      </article>
    </div>
  );
};

export default OTSAcknowledgement;
