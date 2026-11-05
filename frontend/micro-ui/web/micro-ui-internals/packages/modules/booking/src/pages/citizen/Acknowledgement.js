import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { bkgText } from "../../config/bookingMessages";
import { BKGBtn, BKGCrumbs, BKGIcon } from "../../pageComponents/BookingLayout";
import { applicationNoOf, fmtDate, niceName } from "../../utils/booking";

const EMBLEM = "/digit-ui/images/brand/CitizenSevaEmblem.png";
const NEXT = [1, 2, 3, 4];

const Row = ({ label, value }) => (value ? (
  <div className="npt-rcpt__row"><dt>{label}</dt><dd>{value}</dd></div>
) : null);

const BookingAcknowledgement = ({ t, svc, params, clearParams, root }) => {
  const tt = (k, p) => bkgText(t, k, p);
  const [copied, setCopied] = useState(false);
  const result = params && params._result;
  const appNo = applicationNoOf(svc, result);
  const base = root.replace(/\/new$/, ""); // .../booking/<svc>
  const info = (Digit.UserService.getUser() || {}).info || {};

  // refresh after the session was cleared: nothing to acknowledge
  if (!result) return <Redirect to={`${root}/select`} />;

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

  const sel = ((params.select || {})[svc]) || {};
  const b = params.booking || {};
  const a = params.applicant || {};
  const ad = params.address || {};
  const docs = (params.documents && params.documents.chosen) || [];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const period = b.fromDate ? `${fmtDate(b.fromDate)} - ${fmtDate(b.toDate)}` : "";

  return (
    <div className="npt-wrap">
      <BKGCrumbs t={t} svc={svc} current={tt("BKG_ACK_SUCCESS")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><BKGIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("BKG_ACK_SUCCESS")}</h1>
            <p>{tt("BKG_ACK_BANNER_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("BKG_ACK_APP_NO")}</small>
            <strong>{appNo}</strong>
            <button type="button" onClick={copy} aria-live="polite">
              <BKGIcon name="copy" size={16} /> {copied ? tt("BKG_COPIED") : tt("BKG_COPY_ID")}
            </button>
          </div>
        </div>

        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{tt("BKG_ACK_WHERE")}</h2>
            <ol className="npt-track">
              {NEXT.map((n, i) => (
                <li key={n} className={i === 0 ? "is-done" : i === 1 ? "is-now" : ""}>
                  <span className="npt-track__dot">{i === 0 ? <BKGIcon name="check" size={14} /> : n}</span>
                  <div>
                    <strong>{tt(`BKG_NEXT_${n}`)}</strong>
                    {i === 1 ? <em>{tt("BKG_ACK_PENDING")}</em> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="npt-side">
            <h2>{tt("BKG_ACK_NEXT_TITLE")}</h2>
            <div className="npt-ack__btns">
              <Link to={`${base}/my-bookings`} onClick={clearParams} className="npt-btn npt-btn--primary">
                <BKGIcon name="list" size={18} /><span>{tt("BKG_ACK_GO_APPS")}</span>
              </Link>
              <BKGBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("BKG_PRINT")}</BKGBtn>
              <Link to="/digit-ui/citizen/dashboard" onClick={clearParams} className="npt-btn npt-btn--ghost">
                <span>{tt("BKG_ACK_GO_HOME")}</span>
              </Link>
            </div>
            <p className="npt-side__note">{tt("BKG_ACK_HINT")}</p>
          </section>
        </div>
      </section>

      <article className="npt-rcpt" aria-hidden="true">
        <header className="npt-rcpt__head">
          <img src={EMBLEM} alt="" />
          <div>
            <strong>{tt("BKG_RCPT_GOV")}</strong>
            <span>{tt("BKG_RCPT_DEPT")}</span>
          </div>
        </header>
        <div className="npt-rcpt__bar" />
        <h1>{tt("BKG_RCPT_TITLE")}</h1>
        <p className="npt-rcpt__svc">{tt(svc === "site" ? "BKG_RCPT_SERVICE_SITE" : "BKG_RCPT_SERVICE_ASSET")}</p>
        <div className="npt-rcpt__key">
          <div><small>{tt("BKG_ACK_APP_NO")}</small><strong>{appNo}</strong></div>
          <div><small>{tt("BKG_RCPT_DATE")}</small><strong>{today}</strong></div>
          <div><small>{tt("BKG_RCPT_STATUS")}</small><strong>{tt("BKG_RCPT_STATUS_V")}</strong></div>
        </div>
        <h2>{tt("BKG_RCPT_APPLICANT")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("BKG_F_applicantName")} value={a.applicantName || info.name} />
          <Row label={tt("BKG_F_applicantFatherName")} value={a.applicantFatherName} />
          <Row label={tt("BKG_F_mobileNumber")} value={a.mobileNumber || info.mobileNumber} />
          <Row label={tt("BKG_F_emailId")} value={a.emailId} />
        </dl>
        <h2>{tt(svc === "site" ? "BKG_SEL_SITE" : "BKG_SEL_ASSET")}</h2>
        <dl className="npt-rcpt__grid">
          {svc === "site" ? (
            <React.Fragment>
              <Row label={tt("BKG_F_siteID")} value={sel.siteID} />
              <Row label={tt("BKG_F_siteName")} value={niceName(sel.siteName)} />
              <Row label={tt("BKG_F_siteAddress")} value={sel.siteAddress} />
              <Row label={tt("BKG_F_ulbName")} value={sel.ulbName} />
              <Row label={tt("BKG_F_hoardingType")} value={b.hoardingType} />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Row label={tt("BKG_F_assetName")} value={sel.assetName} />
              <Row label={tt("BKG_F_ulbName")} value={sel.ulbName} />
              <Row label={tt("BKG_F_purpose")} value={b.purpose} />
              <Row label={tt("BKG_F_addressLine1")} value={[ad.addressLine1, ad.locality, ad.city, ad.pincode].filter(Boolean).join(", ")} />
            </React.Fragment>
          )}
          <Row label={tt("BKG_RCPT_PERIOD")} value={period} />
        </dl>
        {docs.length ? (
          <React.Fragment>
            <h2>{tt("BKG_RCPT_DOCS")}</h2>
            <ul className="npt-rcpt__docs">{docs.map((d) => <li key={d.id}>{d.documentName}</li>)}</ul>
          </React.Fragment>
        ) : null}
        <footer>
          <p>{tt("BKG_RCPT_NOTE")}</p>
          <p>{tt("BKG_RCPT_HELP")}</p>
        </footer>
      </article>
    </div>
  );
};

export default BookingAcknowledgement;
