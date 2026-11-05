import { SevaLoader, Toast, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { HNC_DMS, HNC_PAGES } from "../../config/hpnocConfig";
import { rqsText } from "../../config/hpnocMessages";
import HpnocShell from "../../pageComponents/HpnocShell";
import { NocApi, apiErrorMessage, buildCreatePayload, buildSubmitPayload, fmtDate } from "../../utils/hpnoc";

const HpnocCheckPage = ({ t, params, setParams, basePath }) => {
  const history = useHistory();
  const tt = (k, p) => rqsText(t, k, p);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);

  // a refreshed or deep-linked review page with nothing filled in goes back to the start
  const complete = HNC_PAGES.every((p) => params && params[p.key]);
  if (!complete) return <Redirect to={`${basePath}/noc`} />;

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
      if (!(rec && rec.applicationNo)) {
        const res = await NocApi.create(buildCreatePayload(params));
        rec = res && res.Noc && res.Noc[0];
        if (!(rec && rec.applicationNo)) throw new Error(tt("HNC_SUBMIT_FAILED"));
        save({ _result: rec }); // kept so a retry never creates a second application
      }
      if (!params._docsSent) {
        // documents are keyed by the application number, like every other HP module
        const toSend = ((params.documents || {}).list || []).filter((d) => serviceDocumentStore.get(HNC_DMS, d.id));
        if (toSend.length) {
          const { failed } = await uploadServiceDocuments({ serviceName: HNC_DMS, objectId: rec.applicationNo, list: toSend, description: "noc-application" });
          if (failed.length) throw new Error(tt("HNC_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
        }
        save({ _docsSent: true });
      }
      if (!params._forwarded) {
        // hand the application to the verifier
        const upd = await NocApi.update(buildSubmitPayload(rec));
        save({ _result: (upd && upd.Noc && upd.Noc[0]) || rec, _forwarded: true });
      }
      serviceDocumentStore.clear(HNC_DMS);
      history.replace(`${basePath}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("HNC_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (submitting) return <SevaLoader fullScreen message={tt("HNC_SUBMITTING")} />;

  const sections = HNC_PAGES.filter((p) => !p.custom);
  const docs = (((params.documents || {}).chosen) || []).filter((d) => serviceDocumentStore.get(HNC_DMS, d.id));
  const show = (field, v) => {
    if (v === undefined || v === null || v === "") return tt("HNC_NOT_PROVIDED");
    if (field.type === "date") return fmtDate(v);
    const o = (field.options || []).find((x) => x.code === v);
    return o ? tt(o.label) : String(v);
  };

  return (
    <HpnocShell t={t} pageKey="review" onNext={submit} nextLabel={tt("HNC_BTN_SUBMIT")} nextIcon="check" onBack={() => history.push(`${basePath}/documents`)}>
      <p className="npt-card__hint">{tt("HNC_REVIEW_HINT")}</p>
      {sections.map((p) => (
        <div className="npt-review-block" key={p.key}>
          <div className="npt-review-head">
            <h3>{tt(p.head)}</h3>
            <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/${p.route}`)}>{tt("HNC_BTN_EDIT")}</button>
          </div>
          <dl className="npt-review-grid">
            {p.fields.map((f) => (
              <div key={f.name}>
                <dt>{tt(`HNC_F_${f.name}`)}</dt>
                <dd>{show(f, params[p.key][f.name])}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
            <div className="npt-review-block">
        <div className="npt-review-head">
          <h3>{tt("HNC_STEP_DOCUMENTS")}</h3>
          <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/documents`)}>{tt("HNC_BTN_EDIT")}</button>
        </div>
        <ul className="npt-review-docs">
          {docs.length === 0 ? <li>{tt("HNC_NOT_PROVIDED")}</li> : docs.map((d) => <li key={d.id}><strong>{d.documentName}</strong><span>{d.name}</span></li>)}
        </ul>
      </div>
      <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
        <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
        <span>{tt("HNC_DECLARATION")}</span>
      </label>
      {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("HNC_DECLARE_REQUIRED")}</p> : null}
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </HpnocShell>
  );
};

export default HpnocCheckPage;
