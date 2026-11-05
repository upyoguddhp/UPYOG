import React, { useState } from "react";
import { Link, Redirect, useRouteMatch } from "react-router-dom";
import { NPR_PAGES } from "../../../config/newPetConfig";
import { nprText } from "../../../config/newPetMessages";
import { NPRBtn, NPRCrumbs, NPRIcon } from "../../../pageComponents/NewPet/NPRLayout";

const NEXT = [1, 2, 3, 4];
const EMBLEM = "/digit-ui/images/brand/CitizenSevaEmblem.png";

const Row = ({ label, value }) => (value ? (
  <div className="npt-rcpt__row"><dt>{label}</dt><dd>{value}</dd></div>
) : null);

const NPRAcknowledgement = ({ params, clearParams, t }) => {
  const match = useRouteMatch();
  const tt = (k, p) => nprText(t, k, p);
  const [copied, setCopied] = useState(false);
  const result = params?._result;
  const root = match.path.replace(/\/acknowledgement$/, ""); // .../petservice/new-registration
  const base = root.replace(/\/new-registration$/, ""); // .../petservice
  const isEmployee = Digit.UserService.getUser()?.info?.type === "EMPLOYEE";

  // refresh after the session was cleared: nothing to acknowledge
  if (!result) return <Redirect to={`${root}/${NPR_PAGES[0].route}`} />;

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

  const pet = (params && params.petDetails) || {};
  const vac = (params && params.vaccination) || {};
  const owner = (params && params.ownerDetails) || {};
  const addr = (params && params.propertyDetails) || {};
  const docs = (params && params.documents && params.documents.chosen) || [];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="npt-wrap">
      <NPRCrumbs t={t} current={tt("NPR_ACK_SUCCESS")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><NPRIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("NPR_ACK_SUCCESS")}</h1>
            <p>{tt("NPR_ACK_BANNER_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("NPR_ACK_APP_NO")}</small>
            <strong>{result.applicationNumber}</strong>
            <button type="button" onClick={copy} aria-live="polite">
              <NPRIcon name="copy" size={16} /> {copied ? tt("NPR_COPIED") : tt("NPR_COPY_ID")}
            </button>
          </div>
        </div>

        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{tt("NPR_ACK_WHERE")}</h2>
            <ol className="npt-track">
              {NEXT.map((n, i) => (
                <li key={n} className={i === 0 ? "is-done" : i === 1 ? "is-now" : ""}>
                  <span className="npt-track__dot">{i === 0 ? <NPRIcon name="check" size={14} /> : n}</span>
                  <div>
                    <strong>{tt(`NPR_NEXT_${n}`)}</strong>
                    {tt(`NPR_NEXT_${n}_D`) !== `NPR_NEXT_${n}_D` && n < 4 ? <small>{tt(`NPR_NEXT_${n}_D`)}</small> : null}
                    {i === 1 ? <em>{tt("NPR_ACK_PENDING")}</em> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="npt-side">
            <h2>{tt("NPR_ACK_NEXT_TITLE")}</h2>
            <div className="npt-ack__btns">
              <Link to={`${base}/my-registrations`} onClick={clearParams} className="npt-btn npt-btn--primary">
                <NPRIcon name="list" size={18} /><span>{tt("NPR_ACK_GO_APPS")}</span>
              </Link>
              <NPRBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("NPR_PRINT")}</NPRBtn>
              <Link to={isEmployee ? "/digit-ui/employee" : "/digit-ui/citizen/dashboard"} onClick={clearParams} className="npt-btn npt-btn--ghost">
                <span>{tt("NPR_ACK_GO_HOME")}</span>
              </Link>
            </div>
            <p className="npt-side__note">{tt("NPR_ACK_HINT")}</p>
          </section>
        </div>
      </section>

      <article className="npt-rcpt" aria-hidden="true">
        <header className="npt-rcpt__head">
          <img src={EMBLEM} alt="" />
          <div>
            <strong>{tt("NPR_RCPT_GOV")}</strong>
            <span>{tt("NPR_RCPT_DEPT")}</span>
          </div>
        </header>
        <div className="npt-rcpt__bar" />
        <h1>{tt("NPR_RCPT_TITLE")}</h1>
        <p className="npt-rcpt__svc">{tt("NPR_RCPT_SERVICE")}</p>
        <div className="npt-rcpt__key">
          <div><small>{tt("NPR_ACK_APP_NO")}</small><strong>{result.applicationNumber}</strong></div>
          <div><small>{tt("NPR_RCPT_DATE")}</small><strong>{today}</strong></div>
          <div><small>{tt("NPR_RCPT_STATUS")}</small><strong>{tt("NPR_RCPT_STATUS_V")}</strong></div>
        </div>
        <h2>{tt("NPR_RCPT_OWNER")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("NPR_F_applicantName")} value={owner.applicantName} />
          <Row label={tt("NPR_F_fatherName")} value={owner.fatherName} />
          <Row label={tt("NPR_F_mobileNumber")} value={owner.mobileNumber} />
          <Row label={tt("NPR_F_emailId")} value={owner.emailId} />
        </dl>
        <h2>{tt("NPR_RCPT_PET")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("NPR_F_petName")} value={pet.petName} />
          <Row label={tt("NPR_F_petType")} value={pet.petType} />
          <Row label={tt("NPR_F_breedType")} value={pet.breedType} />
          <Row label={tt("NPR_F_petGender")} value={pet.petGender} />
          <Row label={tt("NPR_F_petAge")} value={pet.petAge} />
          <Row label={tt("NPR_F_vaccinationStatus")} value={vac.vaccinationStatus} />
          <Row label={tt("NPR_F_lastVaccineDate")} value={vac.lastVaccineDate} />
        </dl>
        <h2>{tt("NPR_RCPT_ADDRESS")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("NPR_F_propertyId")} value={addr.propertyId} />
          <Row label={tt("NPR_F_districtName")} value={addr.districtName} />
          <Row label={tt("NPR_F_ulbName")} value={addr.ulbName} />
          <Row label={tt("NPR_F_wardNumber")} value={addr.wardNumber} />
          <Row label={tt("NPR_F_propertyPinCode")} value={addr.propertyPinCode} />
          <Row label={tt("NPR_F_propertyAddress")} value={addr.propertyAddress} />
        </dl>
        {docs.length ? (
          <React.Fragment>
            <h2>{tt("NPR_RCPT_DOCS")}</h2>
            <ul className="npt-rcpt__docs">{docs.map((d) => <li key={d.id}>{d.documentName}</li>)}</ul>
          </React.Fragment>
        ) : null}
        <footer>
          <p>{tt("NPR_RCPT_NOTE")}</p>
          <p>{tt("NPR_RCPT_HELP")}</p>
        </footer>
      </article>
    </div>
  );
};

export default NPRAcknowledgement;
