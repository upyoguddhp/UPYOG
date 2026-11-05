import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { grvText } from "../../config/grievanceMessages";
import { GRVBtn, GRVCrumbs, GRVIcon } from "../../pageComponents/GrievanceLayout";
import { defNameOf, humanise } from "../../utils/grievance";
import { useServiceDefs } from "../../pageComponents/useGRVLookups";

const EMBLEM = "/digit-ui/images/brand/CitizenSevaEmblem.png";

const Row = ({ label, value }) => (value ? (
  <div className="npt-rcpt__row"><dt>{label}</dt><dd>{value}</dd></div>
) : null);

const GrievanceAcknowledgement = ({ t, params, clearParams, root }) => {
  const tt = (k, p) => grvText(t, k, p);
  const [copied, setCopied] = useState(false);
  const result = params && params._result;
  const appNo = result && result.serviceRequestId;
  const base = root.replace(/\/new$/, ""); // .../grievance
  const info = (Digit.UserService.getUser() || {}).info || {};

  // refresh after the session was cleared: nothing to acknowledge
  if (!appNo) return <Redirect to={`${root}/grievance`} />;

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

  const g = params.grievance || {};
  const { defs } = useServiceDefs();
  const a = params.applicant || {};
  const docs = (params.documents && params.documents.chosen) || [];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="npt-wrap">
      <GRVCrumbs t={t} current={tt("GRV_ACK_SUCCESS")} />
      <section className="npt-ack">
        <div className="npt-ack__banner">
          <span className="npt-ack__tick"><GRVIcon name="check" size={30} /></span>
          <div>
            <h1>{tt("GRV_ACK_SUCCESS")}</h1>
            <p>{tt("GRV_ACK_BANNER_SUB")}</p>
          </div>
          <div className="npt-ack__id">
            <small>{tt("GRV_ACK_APP_NO")}</small>
            <strong>{appNo}</strong>
            <button type="button" onClick={copy} aria-live="polite">
              <GRVIcon name="copy" size={16} /> {copied ? tt("GRV_COPIED") : tt("GRV_COPY_ID")}
            </button>
          </div>
        </div>

        <div className="npt-ack__grid">
          <section className="npt-side">
            <h2>{tt("GRV_ACK_NEXT_TITLE")}</h2>
            <div className="npt-ack__btns">
              <Link to={`${base}/my-grievances`} onClick={clearParams} className="npt-btn npt-btn--ghost">
                <GRVIcon name="list" size={18} /><span>{tt("GRV_ACK_GO_APPS")}</span>
              </Link>
              <GRVBtn kind="ghost" icon="print" onClick={() => window.print()}>{tt("GRV_PRINT")}</GRVBtn>
              <Link to="/digit-ui/citizen/dashboard" onClick={clearParams} className="npt-btn npt-btn--ghost">
                <span>{tt("GRV_ACK_GO_HOME")}</span>
              </Link>
            </div>
            <p className="npt-side__note">{tt("GRV_ACK_HINT")}</p>
          </section>
        </div>
      </section>

      <article className="npt-rcpt" aria-hidden="true">
        <header className="npt-rcpt__head">
          <img src={EMBLEM} alt="" />
          <div>
            <strong>{tt("GRV_RCPT_GOV")}</strong>
            <span>{tt("GRV_RCPT_DEPT")}</span>
          </div>
        </header>
        <div className="npt-rcpt__bar" />
        <h1>{tt("GRV_RCPT_TITLE")}</h1>
        <p className="npt-rcpt__svc">{defNameOf(defs, g.grievanceSubType)}</p>
        <div className="npt-rcpt__key">
          <div><small>{tt("GRV_ACK_APP_NO")}</small><strong>{appNo}</strong></div>
          <div><small>{tt("GRV_RCPT_DATE")}</small><strong>{today}</strong></div>
          <div><small>{tt("GRV_RCPT_STATUS")}</small><strong>{tt("GRV_RCPT_STATUS_V")}</strong></div>
        </div>
        <h2>{tt("GRV_RCPT_APPLICANT")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("GRV_F_name")} value={a.name || info.name} />
          <Row label={tt("GRV_F_fatherName")} value={a.fatherName} />
          <Row label={tt("GRV_F_mobileNumber")} value={a.mobileNumber || info.mobileNumber} />
          <Row label={tt("GRV_F_emailId")} value={a.emailId} />
        </dl>
        <h2>{tt("GRV_STEP_GRIEVANCE")}</h2>
        <dl className="npt-rcpt__grid">
          <Row label={tt("GRV_F_grievanceType")} value={humanise(g.grievanceType)} />
          <Row label={tt("GRV_F_grievanceSubType")} value={defNameOf(defs, g.grievanceSubType)} />
          <Row label={tt("GRV_F_districtName")} value={g.districtName} />
          <Row label={tt("GRV_F_ulbName")} value={g.ulbName} />
          <Row label={tt("GRV_F_ward")} value={g.ward} />
          <Row label={tt("GRV_F_address")} value={g.address} />
          <Row label={tt("GRV_F_description")} value={g.description} />
        </dl>
        {docs.length ? (
          <React.Fragment>
            <h2>{tt("GRV_RCPT_DOCS")}</h2>
            <ul className="npt-rcpt__docs">{docs.map((d) => <li key={d.id}>{d.documentName}</li>)}</ul>
          </React.Fragment>
        ) : null}
        <footer>
          <p>{tt("GRV_RCPT_NOTE")}</p>
          <p>{tt("GRV_RCPT_HELP")}</p>
        </footer>
      </article>
    </div>
  );
};

export default GrievanceAcknowledgement;
