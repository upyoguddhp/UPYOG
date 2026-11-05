import { SevaLoader, Toast, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { GRB_PAGES, NEW_GRB_STEPS, grbPagesFor, grbTitleKey } from "../../../config/newGRBConfig";
import { grbText } from "../../../config/newGRBMessages";
import { GRBActions, GRBBtn, GRBCrumbs, GRBInfoBar, GRBPage, GRBPageHead, GRBStepper, GRBTricolour } from "../../../pageComponents/NewGRB/GRBLayout";
import { GRB_DMS_SERVICE } from "../../../pageComponents/NewGRB/useGRBDocuments";
import { GarbageApi, apiErrorMessage, applicationNoOf, buildGarbagePayload, buildModifyPayload, buildSubmitPayload, buildWorkflowPayload, unitFlags } from "../../../utils/newGRB";
import { useGRBCategories } from "../../../pageComponents/NewGRB/useGRBLookups";

const display = (field, value, tt) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : tt("GRB_NOT_PROVIDED");
  if (value === undefined || value === null || value === "") return tt("GRB_NOT_PROVIDED");
  const opt = (field.options || []).find((o) => o.code === value);
  return opt ? tt(opt.i18nKey) : String(value);
};

const GRBCheckPage = ({ params, setParams, t, basePath }) => {
  const history = useHistory();
  const tt = (k, p) => grbText(t, k, p);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);
  const cats = useGRBCategories(((params || {}).propertyDetails || {}).ulbName);
  const steps = NEW_GRB_STEPS;

  // a refreshed or deep-linked review page with nothing filled in goes back to the start
  const complete = steps.every((s) => params && params[s.key]);
  if (!complete) return <Redirect to={`${basePath}/${steps[0].route}`} />;

  const modifying = params._mode === "MODIFICATION";
  const pages = grbPagesFor(params);
  const navSteps = [...pages, { key: "review", route: "check", head: "GRB_STEP_REVIEW" }];
  const docsOf = (vals) => (vals.chosen || []).filter((d) => serviceDocumentStore.get(GRB_DMS_SERVICE, d.id));

  const submit = async () => {
    if (!declared) {
      setDeclareError(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let acc = params._result;
      if (modifying) {
        // modification: save the edited account (ids kept), send documents, then forward the same application to the verifier
        const appNo = params._appNo;
        if (!params._saved) {
          await GarbageApi.update(buildModifyPayload(params, { categories: cats.rows }));
          setParams({ ...params, _saved: true, _result: params._acc });
        }
        const toSend = ((params.documents || {}).list || []).filter((d) => serviceDocumentStore.get(GRB_DMS_SERVICE, d.id));
        const { failed } = await uploadServiceDocuments({ serviceName: GRB_DMS_SERVICE, objectId: appNo, list: toSend, description: "garbage-collection-modification" });
        if (failed.length) throw new Error(tt("GRB_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
        await GarbageApi.update(buildWorkflowPayload(appNo, params._businessService, "FORWARD_TO_VERIFIER", "Modification forwarded to verifier"));
        serviceDocumentStore.clear(GRB_DMS_SERVICE);
        history.replace(`${basePath}/acknowledgement`);
        return;
      }
      if (!applicationNoOf(acc)) {
        const payload = buildGarbagePayload(params, { stateTenant: Digit.ULBService.getStateId(), categories: cats.rows });
        const res = await GarbageApi.create(payload);
        acc = res && res.garbageAccounts && res.garbageAccounts[0];
        if (!applicationNoOf(acc)) throw new Error(tt("GRB_SUBMIT_FAILED"));
        setParams({ ...params, _result: acc }); // keep the whole record: the workflow call needs it on a retry
      }
      const appNo = applicationNoOf(acc);
      // documents need the application number, so they go to DMS right after it exists
      const docs = params.documents || {};
      const toSend = (docs.list || []).filter((d) => serviceDocumentStore.get(GRB_DMS_SERVICE, d.id));
      {
        const { failed } = await uploadServiceDocuments({ serviceName: GRB_DMS_SERVICE, objectId: appNo, list: toSend, description: "garbage-collection-application" });
        if (failed.length) throw new Error(tt("GRB_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
      }
      // move into the workflow (applicant -> ULB verifier)
      await GarbageApi.update(buildSubmitPayload(acc));
      serviceDocumentStore.clear(GRB_DMS_SERVICE);
      history.replace(`${basePath}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("GRB_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (submitting) return <SevaLoader fullScreen message={tt("GRB_SUBMITTING")} />;

  return (
    <div className="npt-wrap">
      <GRBCrumbs t={t} current={tt("GRB_STEP_REVIEW")} />
      <GRBPageHead title={tt(modifying ? "GRB_LC_MODIFY_TITLE" : "GRB_STEP_REVIEW")} sub={tt("GRB_REVIEW_SUB")}>
        <GRBInfoBar t={t} steps={navSteps} active={navSteps.length - 1} total={navSteps.length} showTips={false} />
      </GRBPageHead>
      <GRBStepper t={t} steps={navSteps} active={navSteps.length - 1} onGo={(s) => history.push(`${basePath}/${s.route}`)} />
      <GRBPage>
        <section className="npt-card">
          <GRBTricolour />
          <div className="npt-card__body">
            <p className="npt-card__hint">{tt("GRB_REVIEW_HINT")}</p>
            {steps.map((step) => {
              const vals = params[step.key] || {};
              const docs = step.custom === "documents" ? docsOf(vals) : [];
              const editTo = `${basePath}/${(GRB_PAGES.find((pg) => pg.key === (step.page || step.key)) || step).route}`;
              const editBtn = modifying && step.custom === "property" ? null : <button type="button" className="npt-link" onClick={() => history.push(editTo)}>{tt("GRB_BTN_EDIT")}</button>;
              if (step.repeat) {
                return ((vals.list || []).map((u, i) => (
                  <div className="npt-review-block" key={`${step.key}${i}`}>
                    <div className="npt-review-head">
                      <h3>{tt(i === 0 ? "GRB_UNIT_FIRST" : "GRB_UNIT_N", { n: i + 1 })}</h3>
                      {editBtn}
                    </div>
                    <dl className="npt-review-grid">
                      {step.fields.filter((f) => !f.showIf || unitFlags(u, cats.rows)[f.showIf]).map((f) => (
                        <div key={f.name}>
                          <dt>{tt(`GRB_F_${f.name}`)}</dt>
                          <dd>{f.type === "checkbox" ? tt(u[f.name] ? "GRB_O_YES" : "GRB_O_NO") : display(f, u[f.name], tt)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )));
              }
              return (
                <div className="npt-review-block" key={step.key}>
                  <div className="npt-review-head">
                    <h3>{tt(step.head)}</h3>
                    {editBtn}
                  </div>
                  {step.custom === "documents" ? (
                    <ul className="npt-review-docs">
                      {docs.length === 0 ? <li>{tt("GRB_NOT_PROVIDED")}</li> : docs.map((d) => <li key={d.id}><strong>{d.documentName}</strong><span>{d.name}</span></li>)}
                    </ul>
                  ) : null}
                  <dl className="npt-review-grid">
                    {step.fields.map((f) => (
                      <div key={f.name}>
                        <dt>{tt(`GRB_F_${f.name}`)}</dt>
                        <dd>{display(f, vals[f.name], tt)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
            <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
              <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
              <span>{tt("GRB_DECLARATION")}</span>
            </label>
            {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("GRB_DECLARE_REQUIRED")}</p> : null}
          </div>
        </section>
      </GRBPage>
      <GRBActions
        left={<GRBBtn kind="ghost" onClick={() => history.push(`${basePath}/${pages[pages.length - 1].route}`)}>{tt("GRB_BTN_BACK")}</GRBBtn>}
        right={<GRBBtn kind="primary" icon="check" onClick={submit}>{tt("GRB_BTN_SUBMIT")}</GRBBtn>}
      />
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </div>
  );
};

export default GRBCheckPage;
