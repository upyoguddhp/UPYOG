import React, { useState } from "react";
import { Link, Redirect, useRouteMatch } from "react-router-dom";
import { GRB_PAGES } from "../../../config/newGRBConfig";
import { grbText } from "../../../config/newGRBMessages";
import { applicationNoOf } from "../../../utils/newGRB";
import { GRBBtn, GRBCrumbs, GRBIcon } from "../../../pageComponents/NewGRB/GRBLayout";

const NEXT = [1, 2, 3, 4];
const EMBLEM = "/digit-ui/images/brand/CitizenSevaEmblem.png";

const Row = ({ label, value }) => (value ? (
  <div className="npt-rcpt__row"><dt>{label}</dt><dd>{value}</dd></div>
) : null);

const GRBAcknowledgement = ({ params, clearParams, t }) => {
  const match = useRouteMatch();
  const tt = (k, p) => grbText(t, k, p);
  const [copied, setCopied] = useState(false);
  const result = params?._result;
  const appNo = applicationNoOf(result);
  const root = match.path.replace(/\/acknowledgement$/, ""); // .../gb/new-registration
  const base = root.replace(/\/new-registration$/, ""); // .../gb
  const isEmployee = Digit.UserService.getUser()?.info?.type === "EMPLOYEE";

  // refresh after the session was cleared: nothing to acknowledge
  if (!result) return <Redirect to={`${root}/${GRB_PAGES[0].route}`} />;

  const copy = () => {
    try {
      navigator.clipboard?.writeText(appNo).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (e) {
      setCopied(false);
    }
  };

  const loc = (params && params.propertyDetails) || {};
  const spec = (params && params.specifications) || {};
  const units = (params && params.units && params.units.list) || [];
  const info = (Digit.UserService.getUser() || {}).info || {};
  const docs = (params && params.documents && params.documents.chosen) || [];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="npt-wrap">
      <GRBCrumbs t={t} current={tt("GRB_ACK_SUCCESS")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><GRBIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("GRB_ACK_SUCCESS")}</h1>
            <p>{tt("GRB_ACK_BANNER_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("GRB_ACK_APP_NO")}</small>
            <strong>{appNo}</strong>
            <button type="button" onClick={copy} aria-live="polite">
              <GRBIcon name="copy" size={16} /> {copied ? tt("GRB_COPIED") : tt("GRB_COPY_ID")}
            </button>
          </div>
        </div>

        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{tt("GRB_ACK_WHERE")}</h2>
            <ol className="npt-track">
              {NEXT.map((n, i) => (
                <li key={n} className={i === 0 ? "is-done" : i === 1 ? "is-now" : ""}>
                  <span className="npt-track__dot">{i === 0 ? <GRBIcon name="check" size={14} /> : n}</span>
                  <div>
                    <strong>{tt(`GRB_NEXT_${n}`)}</strong>
                    {tt(`GRB_NEXT_${n}_D`) !== `GRB_NEXT_${n}_D` && n < 4 ? <small>{tt(`GRB_NEXT_${n}_D`)}</small> : null}
                    {i === 1 ? <em>{tt("GRB_ACK_PENDING")}</em> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="npt-side">
            <h2>{tt("GRB_ACK_NEXT_TITLE")}</h2>
            <div className="npt-ack__btns">
              <Link to={`${base}/my-registrations`} onClick={clearParams} className="npt-btn npt-btn--primary">
                <GRBIcon name="list" size={18} /><span>{tt("GRB_ACK_GO_APPS")}</span>
              </Link>
              <GRBBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("GRB_PRINT")}</GRBBtn>
              <Link to={isEmployee ? "/digit-ui/employee" : "/digit-ui/citizen/dashboard"} onClick={clearParams} className="npt-btn npt-btn--ghost">
                <span>{tt("GRB_ACK_GO_HOME")}</span>
              </Link>
            </div>
            <p className="npt-side__note">{tt("GRB_ACK_HINT")}</p>
          </section>
        </div>
      </section>

      <article className="npt-rcpt" aria-hidden="true">
        <header className="npt-rcpt__head">
          <img src={EMBLEM} alt="" />
          <div>
            <strong>{tt("GRB_RCPT_GOV")}</strong>
            <span>{tt("GRB_RCPT_DEPT")}</span>
          </div>
        </header>
        <div className="npt-rcpt__bar" />
        <h1>{tt("GRB_RCPT_TITLE")}</h1>
        <p className="npt-rcpt__svc">{tt("GRB_RCPT_SERVICE")}</p>
        <div className="npt-rcpt__key">
          <div><small>{tt("GRB_ACK_APP_NO")}</small><strong>{appNo}</strong></div>
          <div><small>{tt("GRB_RCPT_DATE")}</small><strong>{today}</strong></div>
          <div><small>{tt("GRB_RCPT_STATUS")}</small><strong>{tt("GRB_RCPT_STATUS_V")}</strong></div>
        </div>
        <h2>{tt("GRB_RCPT_OWNER")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("GRB_F_applicantName")} value={info.name} />
          <Row label={tt("GRB_F_applicantMobileNumber")} value={info.mobileNumber} />
        </dl>
        <h2>{tt("GRB_RCPT_UNITS")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("GRB_F_typeOfCollection")} value={spec.typeOfCollection} />
          <Row label={tt("GRB_F_oldGarbageId")} value={spec.oldGarbageId} />
        </dl>
        {units.map((u, i) => (
          <dl className="npt-rcpt__grid" key={i}>
            <Row label={tt(i === 0 ? "GRB_UNIT_FIRST" : "GRB_UNIT_N", { n: i + 1 })} value={[u.name, u.phoneNumber].filter(Boolean).join(" · ")} />
            <Row label={tt("GRB_F_category")} value={[u.category, u.subCategory, u.subCategoryType].filter(Boolean).join(" › ")} />
          </dl>
        ))}
        <h2>{tt("GRB_RCPT_PROPERTY")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("GRB_F_propertyId")} value={loc.propertyId} />
          <Row label={tt("GRB_F_propertyOwnerName")} value={loc.propertyOwnerName} />
          <Row label={tt("GRB_F_districtName")} value={loc.districtName} />
          <Row label={tt("GRB_F_ulbName")} value={loc.ulbName} />
          <Row label={tt("GRB_F_wardNumber")} value={loc.wardNumber} />
          <Row label={tt("GRB_F_zone")} value={loc.zone} />
          <Row label={tt("GRB_F_propertyPinCode")} value={loc.propertyPinCode} />
          <Row label={tt("GRB_F_propertyAddress")} value={loc.propertyAddress} />
        </dl>
        {docs.length ? (
          <React.Fragment>
            <h2>{tt("GRB_RCPT_DOCS")}</h2>
            <ul className="npt-rcpt__docs">{docs.map((d) => <li key={d.id}>{d.documentName}</li>)}</ul>
          </React.Fragment>
        ) : null}
        <footer>
          <p>{tt("GRB_RCPT_NOTE")}</p>
          <p>{tt("GRB_RCPT_HELP")}</p>
        </footer>
      </article>
    </div>
  );
};

export default GRBAcknowledgement;
