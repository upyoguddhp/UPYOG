import { SevaLoader, Toast, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { RQS_DMS, RQS_PAGES } from "../../config/reqsvcConfig";
import { rqsText } from "../../config/reqsvcMessages";
import { RQSFee } from "../../pageComponents/ReqsvcParts";
import ReqsvcShell from "../../pageComponents/ReqsvcShell";
import { useRQSLookups } from "../../pageComponents/useRQSLookups";
import { RequestApi, apiErrorMessage, buildCreatePayload, buildPendingPayload, feeOf, fmtDate } from "../../utils/reqsvc";

const ReqsvcCheckPage = ({ t, params, setParams, basePath }) => {
  const history = useHistory();
  const tt = (k, p) => rqsText(t, k, p);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);
  const lookups = useRQSLookups({});

  // a refreshed or deep-linked review page with nothing filled in goes back to the start
  const complete = RQS_PAGES.every((p) => params && params[p.key]);
  if (!complete) return <Redirect to={`${basePath}/request`} />;

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
    if (lookups.categories.isLoading || !lookups.rawCategories.length) {
      setError(tt("RQS_LOOKUP_FAILED"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let rec = params._result;
      if (!(rec && rec.challanNo)) {
        const res = await RequestApi.create(buildCreatePayload(params, lookups.rawCategories));
        rec = res && res.challans && res.challans[0];
        if (!(rec && rec.challanNo)) throw new Error(tt("RQS_SUBMIT_FAILED"));
        save({ _result: rec }); // kept so a retry never creates a second request
      }
      if (!params._docsSent) {
        const toSend = ((params.documents || {}).list || []).filter((d) => serviceDocumentStore.get(RQS_DMS, d.id));
        if (toSend.length) {
          const { failed } = await uploadServiceDocuments({ serviceName: RQS_DMS, objectId: rec.challanNo, list: toSend, description: "request-service-application" });
          if (failed.length) throw new Error(tt("RQS_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
        }
        save({ _docsSent: true });
      }
      if (!params._pending) {
        // move into "pending for payment" (the citizen pays next)
        const upd = await RequestApi.update(buildPendingPayload(rec, lookups.rawCategories));
        save({ _result: (upd && upd.challans && upd.challans[0]) || rec, _pending: true });
      }
      serviceDocumentStore.clear(RQS_DMS);
      history.replace(`${basePath}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("RQS_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (submitting) return <SevaLoader fullScreen message={tt("RQS_SUBMITTING")} />;

  const sections = RQS_PAGES.filter((p) => !p.custom);
  const docs = (((params.documents || {}).chosen) || []).filter((d) => serviceDocumentStore.get(RQS_DMS, d.id));
  const show = (field, v) => {
    if (v === undefined || v === null || v === "") return tt("RQS_NOT_PROVIDED");
    return field.type === "date" ? fmtDate(v) : String(v);
  };

  return (
    <ReqsvcShell t={t} pageKey="review" onNext={submit} nextLabel={tt("RQS_BTN_SUBMIT")} nextIcon="check" onBack={() => history.push(`${basePath}/documents`)}>
      <p className="npt-card__hint">{tt("RQS_REVIEW_HINT")}</p>
      {sections.map((p) => (
        <div className="npt-review-block" key={p.key}>
          <div className="npt-review-head">
            <h3>{tt(p.head)}</h3>
            <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/${p.route}`)}>{tt("RQS_BTN_EDIT")}</button>
          </div>
          <dl className="npt-review-grid">
            {p.fields.map((f) => (
              <div key={f.name}>
                <dt>{tt(`RQS_F_${f.name}`)}</dt>
                <dd>{show(f, params[p.key][f.name])}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <RQSFee t={t} fee={feeOf(lookups.rawCategories, (params.request || {}).category)} />
      <div className="npt-review-block">
        <div className="npt-review-head">
          <h3>{tt("RQS_STEP_DOCUMENTS")}</h3>
          <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/documents`)}>{tt("RQS_BTN_EDIT")}</button>
        </div>
        <ul className="npt-review-docs">
          {docs.length === 0 ? <li>{tt("RQS_NOT_PROVIDED")}</li> : docs.map((d) => <li key={d.id}><strong>{d.documentName}</strong><span>{d.name}</span></li>)}
        </ul>
      </div>
      <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
        <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
        <span>{tt("RQS_DECLARATION")}</span>
      </label>
      {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("RQS_DECLARE_REQUIRED")}</p> : null}
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </ReqsvcShell>
  );
};

export default ReqsvcCheckPage;
