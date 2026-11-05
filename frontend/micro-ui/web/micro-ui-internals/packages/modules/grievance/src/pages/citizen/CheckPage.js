import { SevaLoader, Toast, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { GRV_DMS, GRV_PAGES } from "../../config/grievanceConfig";
import { grvText } from "../../config/grievanceMessages";
import GrievanceShell from "../../pageComponents/GrievanceShell";
import { useGRVLookups } from "../../pageComponents/useGRVLookups";
import { GrievanceApi, apiErrorMessage, buildCreatePayload, defNameOf, humanise } from "../../utils/grievance";

const GrievanceCheckPage = ({ t, params, setParams, basePath }) => {
  const history = useHistory();
  const tt = (k, p) => grvText(t, k, p);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);
  const lookups = useGRVLookups({});

  // a refreshed or deep-linked review page with nothing filled in goes back to the start
  const complete = (params && params.grievance) && (params.applicant);
  if (!complete) return <Redirect to={`${basePath}/grievance`} />;

  let state = params;
  const save = (patch) => {
    state = { ...state, ...patch };
    setParams(state);
  };

  const submit = async () => {
    if (!declared) {
      setDeclareError(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let rec = params._result;
      if (!(rec && rec.serviceRequestId)) {
        const { service, workflow } = buildCreatePayload(params);
        const res = await GrievanceApi.create(service, workflow);
        rec = res && res.ServiceWrappers && res.ServiceWrappers[0] && res.ServiceWrappers[0].service;
        if (!(rec && rec.serviceRequestId)) throw new Error(tt("GRV_SUBMIT_FAILED"));
        save({ _result: rec }); // kept so a retry never creates a second grievance
      }
      if (!params._docsSent) {
        const toSend = ((params.documents || {}).list || []).filter((d) => serviceDocumentStore.get(GRV_DMS, d.id));
        if (toSend.length) {
          const { failed } = await uploadServiceDocuments({ serviceName: GRV_DMS, objectId: rec.serviceRequestId, list: toSend, description: "Grievance-Document" });
          if (failed.length) throw new Error(tt("GRV_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
        }
        save({ _docsSent: true });
      }
      serviceDocumentStore.clear(GRV_DMS);
      history.replace(`${basePath}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("GRV_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (submitting) return <SevaLoader fullScreen message={tt("GRV_SUBMITTING")} />;

  const sections = GRV_PAGES.filter((p) => !p.custom);
  const docs = (((params.documents || {}).chosen) || []).filter((d) => serviceDocumentStore.get(GRV_DMS, d.id));
  const show = (field, v) => {
    if (v === undefined || v === null || v === "") return tt("GRV_NOT_PROVIDED");
    if (field.name === "grievanceType") return humanise(v);
    if (field.name === "grievanceSubType") return defNameOf(lookups.defs, v);
    return String(v);
  };

  return (
    <GrievanceShell t={t} pageKey="review" onNext={submit} nextLabel={tt("GRV_BTN_SUBMIT")} nextIcon="check" onBack={() => history.push(`${basePath}/documents`)}>
      <p className="npt-card__hint">{tt("GRV_REVIEW_HINT")}</p>
      {sections.map((p) => (
        <div className="npt-review-block" key={p.key}>
          <div className="npt-review-head">
            <h3>{tt(p.head)}</h3>
            <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/${p.route}`)}>{tt("GRV_BTN_EDIT")}</button>
          </div>
          <dl className="npt-review-grid">
            {p.fields.map((f) => (
              <div key={f.name}>
                <dt>{tt(`GRV_F_${f.name}`)}</dt>
                <dd>{show(f, params[p.key][f.name])}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <div className="npt-review-block">
        <div className="npt-review-head">
          <h3>{tt("GRV_STEP_DOCUMENTS")}</h3>
          <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/documents`)}>{tt("GRV_BTN_EDIT")}</button>
        </div>
        <ul className="npt-review-docs">
          {docs.length === 0 ? <li>{tt("GRV_NOT_PROVIDED")}</li> : docs.map((d) => <li key={d.id}><strong>{d.documentName}</strong><span>{d.name}</span></li>)}
        </ul>
      </div>
      <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
        <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
        <span>{tt("GRV_DECLARATION")}</span>
      </label>
      {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("GRV_DECLARE_REQUIRED")}</p> : null}
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </GrievanceShell>
  );
};

export default GrievanceCheckPage;
