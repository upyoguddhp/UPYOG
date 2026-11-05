import React, { useState } from "react";
import { Link, Redirect, useRouteMatch } from "react-router-dom";
import { NEW_PT_STEPS } from "../../../config/newPTConfig";
import { nptText } from "../../../config/newPTMessages";
import { NPTBtn, NPTCrumbs, NPTIcon } from "../../../pageComponents/NewPT/NPTLayout";

const NEXT = [1, 2, 3, 4];
const EMBLEM = "/digit-ui/images/brand/CitizenSevaEmblem.png";

const Row = ({ label, value }) => (value ? (
  <div className="npt-rcpt__row"><dt>{label}</dt><dd>{value}</dd></div>
) : null);

const NPTAcknowledgement = ({ params, clearParams, t }) => {
  const match = useRouteMatch();
  const tt = (k, p) => nptText(t, k, p);
  const [copied, setCopied] = useState(false);
  const result = params?._result;
  const root = match.path.replace(/\/acknowledgement$/, ""); // .../property/new-registration
  const base = root.replace(/\/new-registration$/, ""); // .../property
  const isEmployee = Digit.UserService.getUser()?.info?.type === "EMPLOYEE";

  // refresh after the session was cleared: nothing to acknowledge
  if (!result) return <Redirect to={`${root}/${NEW_PT_STEPS[0].route}`} />;

  const copy = () => {
    try {
      navigator.clipboard?.writeText(result.propertyId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (e) {
      setCopied(false);
    }
  };

  const loc = params?.locationDetails || {};
  const spec = params?.specificationDetails || {};
  const owner = params?.ownerDetails || {};
  const docs = (params?.documents?.list || []).filter((d) => d.attachment || params?.documents?.chosen?.[d.id]);
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="npt-wrap">
      <NPTCrumbs t={t} current={tt("NPT_ACK_SUCCESS")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><NPTIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("NPT_ACK_SUCCESS")}</h1>
            <p>{tt("NPT_ACK_BANNER_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("NPT_ACK_APP_NO")}</small>
            <strong>{result.propertyId}</strong>
            <button type="button" onClick={copy} aria-live="polite">
              <NPTIcon name="copy" size={16} /> {copied ? tt("NPT_COPIED") : tt("NPT_COPY_ID")}
            </button>
          </div>
        </div>

        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{tt("NPT_ACK_WHERE")}</h2>
            <ol className="npt-track">
              {NEXT.map((n, i) => (
                <li key={n} className={i === 0 ? "is-done" : i === 1 ? "is-now" : ""}>
                  <span className="npt-track__dot">{i === 0 ? <NPTIcon name="check" size={14} /> : n}</span>
                  <div>
                    <strong>{tt(`NPT_NEXT_${n}`)}</strong>
                    {tt(`NPT_NEXT_${n}_D`) !== `NPT_NEXT_${n}_D` && n < 4 ? <small>{tt(`NPT_NEXT_${n}_D`)}</small> : null}
                    {i === 1 ? <em>{tt("NPT_ACK_PENDING")}</em> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="npt-side">
            <h2>{tt("NPT_ACK_NEXT_TITLE")}</h2>
            <div className="npt-ack__btns">
              <Link to={`${base}/my-properties`} onClick={clearParams} className="npt-btn npt-btn--primary">
                <NPTIcon name="list" size={18} /><span>{tt("NPT_ACK_GO_APPS")}</span>
              </Link>
              <NPTBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("NPT_PRINT")}</NPTBtn>
              <Link to={isEmployee ? "/digit-ui/employee" : "/digit-ui/citizen/dashboard"} onClick={clearParams} className="npt-btn npt-btn--ghost">
                <span>{tt("NPT_ACK_GO_HOME")}</span>
              </Link>
            </div>
            <p className="npt-side__note">{tt("NPT_ACK_HINT")}</p>
          </section>
        </div>
      </section>

      <article className="npt-rcpt" aria-hidden="true">
        <header className="npt-rcpt__head">
          <img src={EMBLEM} alt="" />
          <div>
            <strong>{tt("NPT_RCPT_GOV")}</strong>
            <span>{tt("NPT_RCPT_DEPT")}</span>
          </div>
        </header>
        <div className="npt-rcpt__bar" />
        <h1>{tt("NPT_RCPT_TITLE")}</h1>
        <p className="npt-rcpt__svc">{tt("NPT_RCPT_SERVICE")}</p>
        <div className="npt-rcpt__key">
          <div><small>{tt("NPT_ACK_APP_NO")}</small><strong>{result.propertyId}</strong></div>
          <div><small>{tt("NPT_RCPT_DATE")}</small><strong>{today}</strong></div>
          <div><small>{tt("NPT_RCPT_STATUS")}</small><strong>{tt("NPT_RCPT_STATUS_V")}</strong></div>
        </div>
        <h2>{tt("NPT_RCPT_OWNER")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("NPT_F_ownerName")} value={owner.ownerName} />
          <Row label={tt("NPT_F_ownerMobileNumber")} value={owner.ownerMobileNumber} />
        </dl>
        <h2>{tt("NPT_RCPT_PROPERTY")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("NPT_F_districtName")} value={loc.districtName} />
          <Row label={tt("NPT_F_ulbName")} value={loc.ulbName} />
          <Row label={tt("NPT_F_wardNumber")} value={loc.wardNumber} />
          <Row label={tt("NPT_F_zone")} value={loc.zone} />
          <Row label={tt("NPT_F_propertyPinCode")} value={loc.propertyPinCode} />
          <Row label={tt("NPT_F_propertyType")} value={spec.propertyType ? tt(spec.propertyType === "VACANT" ? "NPT_O_FOR_LAND" : "NPT_O_FOR_BUILDING") : ""} />
          <Row label={tt("NPT_F_propertyAddress")} value={loc.propertyAddress} />
        </dl>
        {docs.length ? (
          <React.Fragment>
            <h2>{tt("NPT_RCPT_DOCS")}</h2>
            <ul className="npt-rcpt__docs">{docs.map((d) => <li key={d.id}>{d.documentName}</li>)}</ul>
          </React.Fragment>
        ) : null}
        <footer>
          <p>{tt("NPT_RCPT_NOTE")}</p>
          <p>{tt("NPT_RCPT_HELP")}</p>
        </footer>
      </article>
    </div>
  );
};

export default NPTAcknowledgement;
