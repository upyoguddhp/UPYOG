import React, { useState } from "react";
import { Link, Redirect, useRouteMatch } from "react-router-dom";
import { NTL_PAGES } from "../../../config/newTLConfig";
import { ntlText } from "../../../config/newTLMessages";
import { NTLBtn, NTLCrumbs, NTLIcon } from "../../../pageComponents/NewTL/NTLLayout";

const NEXT = [1, 2, 3, 4];
const EMBLEM = "/digit-ui/images/brand/CitizenSevaEmblem.png";

const Row = ({ label, value }) => (value ? (
  <div className="npt-rcpt__row"><dt>{label}</dt><dd>{value}</dd></div>
) : null);

const NTLAcknowledgement = ({ params, clearParams, t }) => {
  const match = useRouteMatch();
  const tt = (k, p) => ntlText(t, k, p);
  const [copied, setCopied] = useState(false);
  const result = params?._result;
  const root = match.path.replace(/\/acknowledgement$/, ""); // .../newtl/new-registration
  const base = root.replace(/\/new-registration$/, ""); // .../newtl
  const isEmployee = Digit.UserService.getUser()?.info?.type === "EMPLOYEE";

  // refresh after the session was cleared: nothing to acknowledge
  if (!result) return <Redirect to={`${root}/${NTL_PAGES[0].route}`} />;

  const copy = () => {
    try {
      navigator.clipboard?.writeText(result.applicationNumber).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (e) {
      setCopied(false);
    }
  };

  const loc = (params && params.tradeLocationDetails) || {};
  const trade = (params && params.tradeDetails) || {};
  const spec = (params && params.tradeSpecifications) || {};
  const owner = (params && params.tradeOwnerDetails) || {};
  const applicant = (params && params.applicantDetails) || {};
  const docs = (params && params.documents && params.documents.chosen) || [];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="npt-wrap">
      <NTLCrumbs t={t} current={tt("NTL_ACK_SUCCESS")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><NTLIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("NTL_ACK_SUCCESS")}</h1>
            <p>{tt("NTL_ACK_BANNER_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("NTL_ACK_APP_NO")}</small>
            <strong>{result.applicationNumber}</strong>
            <button type="button" onClick={copy} aria-live="polite">
              <NTLIcon name="copy" size={16} /> {copied ? tt("NTL_COPIED") : tt("NTL_COPY_ID")}
            </button>
          </div>
        </div>

        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{tt("NTL_ACK_WHERE")}</h2>
            <ol className="npt-track">
              {NEXT.map((n, i) => (
                <li key={n} className={i === 0 ? "is-done" : i === 1 ? "is-now" : ""}>
                  <span className="npt-track__dot">{i === 0 ? <NTLIcon name="check" size={14} /> : n}</span>
                  <div>
                    <strong>{tt(`NTL_NEXT_${n}`)}</strong>
                    {tt(`NTL_NEXT_${n}_D`) !== `NTL_NEXT_${n}_D` && n < 4 ? <small>{tt(`NTL_NEXT_${n}_D`)}</small> : null}
                    {i === 1 ? <em>{tt("NTL_ACK_PENDING")}</em> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="npt-side">
            <h2>{tt("NTL_ACK_NEXT_TITLE")}</h2>
            <div className="npt-ack__btns">
              <Link to={`${base}/my-registrations`} onClick={clearParams} className="npt-btn npt-btn--primary">
                <NTLIcon name="list" size={18} /><span>{tt("NTL_ACK_GO_APPS")}</span>
              </Link>
              <NTLBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("NTL_PRINT")}</NTLBtn>
              <Link to={isEmployee ? "/digit-ui/employee" : "/digit-ui/citizen/dashboard"} onClick={clearParams} className="npt-btn npt-btn--ghost">
                <span>{tt("NTL_ACK_GO_HOME")}</span>
              </Link>
            </div>
            <p className="npt-side__note">{tt("NTL_ACK_HINT")}</p>
          </section>
        </div>
      </section>

      <article className="npt-rcpt" aria-hidden="true">
        <header className="npt-rcpt__head">
          <img src={EMBLEM} alt="" />
          <div>
            <strong>{tt("NTL_RCPT_GOV")}</strong>
            <span>{tt("NTL_RCPT_DEPT")}</span>
          </div>
        </header>
        <div className="npt-rcpt__bar" />
        <h1>{tt("NTL_RCPT_TITLE")}</h1>
        <p className="npt-rcpt__svc">{tt("NTL_RCPT_SERVICE")}</p>
        <div className="npt-rcpt__key">
          <div><small>{tt("NTL_ACK_APP_NO")}</small><strong>{result.applicationNumber}</strong></div>
          <div><small>{tt("NTL_RCPT_DATE")}</small><strong>{today}</strong></div>
          <div><small>{tt("NTL_RCPT_STATUS")}</small><strong>{tt("NTL_RCPT_STATUS_V")}</strong></div>
        </div>
        <h2>{tt("NTL_RCPT_OWNER")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("NTL_F_applicantName")} value={applicant.applicantName} />
          <Row label={tt("NTL_F_applicantMobileNumber")} value={applicant.applicantMobileNumber} />
          <Row label={tt("NTL_F_tradeOwnerName")} value={owner.tradeOwnerName} />
          <Row label={tt("NTL_F_tradeOwnerMobileNumber")} value={owner.tradeOwnerMobileNumber} />
        </dl>
        <h2>{tt("NTL_RCPT_TRADE")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("NTL_F_businessName")} value={trade.businessName} />
          <Row label={tt("NTL_F_licenseCategory")} value={spec.licenseCategory} />
          <Row label={tt("NTL_F_licenseTrade")} value={(spec.licenseTrade || []).join(", ")} />
          <Row label={tt("NTL_F_licensePeriod")} value={spec.licensePeriod} />
        </dl>
        <h2>{tt("NTL_RCPT_PROPERTY")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("NTL_F_propertyId")} value={loc.propertyId} />
          <Row label={tt("NTL_F_propertyOwnerName")} value={loc.propertyOwnerName} />
          <Row label={tt("NTL_F_districtName")} value={loc.districtName} />
          <Row label={tt("NTL_F_ulbName")} value={loc.ulbName} />
          <Row label={tt("NTL_F_wardNumber")} value={loc.wardNumber} />
          <Row label={tt("NTL_F_zone")} value={loc.zone} />
          <Row label={tt("NTL_F_propertyPinCode")} value={loc.propertyPinCode} />
          <Row label={tt("NTL_F_propertyAddress")} value={loc.propertyAddress} />
        </dl>
        {docs.length ? (
          <React.Fragment>
            <h2>{tt("NTL_RCPT_DOCS")}</h2>
            <ul className="npt-rcpt__docs">{docs.map((d) => <li key={d.id}>{d.documentName}</li>)}</ul>
          </React.Fragment>
        ) : null}
        <footer>
          <p>{tt("NTL_RCPT_NOTE")}</p>
          <p>{tt("NTL_RCPT_HELP")}</p>
        </footer>
      </article>
    </div>
  );
};

export default NTLAcknowledgement;
