import { SevaLoader, Toast, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { nptText } from "../../../config/newPTMessages";
import { NPTActions, NPTBtn, NPTCrumbs, NPTInfoBar, NPTPage, NPTPageHead, NPTStepper, NPTTricolour } from "../../../pageComponents/NewPT/NPTLayout";
import { NPT_DMS_SERVICE } from "../../../pageComponents/NewPT/NPTDocuments";
import { apiErrorMessage, buildNewPTPayload, buildSubmitPayload, getUserType, isVisible, stepsFor } from "../../../utils/newPT";

const display = (field, value, tt) => {
  if (typeof value === "boolean") return tt(value ? "NPT_O_YES" : "NPT_O_NO");
  if (value === undefined || value === null || value === "") return tt("NPT_NOT_PROVIDED");
  const opt = (field.options || []).find((o) => o.code === value);
  return opt ? tt(opt.i18nKey) : String(value);
};

const NPTCheckPage = ({ params, setParams, t, basePath }) => {
  const history = useHistory();
  const tt = (k, p) => nptText(t, k, p);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);
  const steps = stepsFor(params);

  // a refreshed or deep-linked review page with nothing filled in goes back to the start
  const complete = steps.every((s) => params?.[s.key]);
  if (!complete) return <Redirect to={`${basePath}/${steps[0].route}`} />;

  const navSteps = [...steps, { key: "review", route: "check", head: "NPT_STEP_REVIEW" }];

  const submit = async () => {
    if (!declared) {
      setDeclareError(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    const stateTenant = Digit.ULBService.getStateId();
    try {
      let result = params._result;
      let prop = result && { ...result };
      if (!prop?.propertyId) {
        const created = await Digit.PTService.create(buildNewPTPayload(params, { stateTenant }), stateTenant);
        prop = created?.Properties?.[0];
        if (!prop?.propertyId) throw new Error(tt("NPT_SUBMIT_FAILED"));
        setParams({ ...params, _result: prop }); // keep the whole record: the workflow update needs it on a retry
      }
      // a retry after an earlier partial save only has ids: reload the full record for the update
      if (!prop.owners || !prop.address) {
        const found = await Digit.PTService.search({ tenantId: prop.tenantId, filters: { propertyIds: prop.propertyId } });
        prop = found?.Properties?.[0];
        if (!prop?.propertyId) throw new Error(tt("NPT_SUBMIT_FAILED"));
        setParams({ ...params, _result: prop });
      }
      // documents need the property id, so they go to DMS right after it exists
      const docs = params.documents || {};
      const toSend = (docs.list || []).filter((d) => serviceDocumentStore.get(NPT_DMS_SERVICE, d.id));
      {
        const { failed } = await uploadServiceDocuments({ serviceName: NPT_DMS_SERVICE, objectId: prop.propertyId, list: toSend, description: "property-registration" });
        if (failed.length) throw new Error(tt("NPT_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
      }
      // move into the verification workflow (citizen -> verifier, employee verifies)
      await Digit.PTService.update(buildSubmitPayload(prop, getUserType()), prop.tenantId);
      serviceDocumentStore.clear(NPT_DMS_SERVICE);
      history.replace(`${basePath}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("NPT_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (submitting) return <SevaLoader fullScreen message={tt("NPT_SUBMITTING")} />;

  return (
    <div className="npt-wrap">
      <NPTCrumbs t={t} current={tt("NPT_STEP_REVIEW")} />
      <NPTPageHead title={tt("NPT_STEP_REVIEW")} sub={tt("NPT_REVIEW_SUB")}>
        <NPTInfoBar t={t} steps={navSteps} active={navSteps.length - 1} total={navSteps.length} showTips={false} />
      </NPTPageHead>
      <NPTStepper t={t} steps={navSteps} active={navSteps.length - 1} onGo={(s) => history.push(`${basePath}/${s.route}`)} />
      <NPTPage>
        <section className="npt-card">
          <NPTTricolour />
          <div className="npt-card__body">
            <p className="npt-card__hint">{tt("NPT_REVIEW_HINT")}</p>
            {steps.map((step) => {
              const vals = params?.[step.key] || {};
              return (
                <div className="npt-review-block" key={step.key}>
                  <div className="npt-review-head">
                    <h3>{tt(step.head)}</h3>
                    <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/${step.route}`)}>
                      {tt("NPT_BTN_EDIT")}
                    </button>
                  </div>
                  {step.custom === "documents" ? (
                    <ul className="npt-review-docs">
                      {(vals.chosen || []).filter((d) => serviceDocumentStore.get(NPT_DMS_SERVICE, d.id)).length === 0 ? <li>{tt("NPT_NOT_PROVIDED")}</li> : (vals.chosen || []).filter((d) => serviceDocumentStore.get(NPT_DMS_SERVICE, d.id)).map((d) => <li key={d.id}><strong>{d.documentName}</strong><span>{d.name}</span></li>)}
                    </ul>
                  ) : null}
                  <dl className="npt-review-grid">
                    {step.fields
                      .filter((f) => isVisible(f, vals) && f.type !== "repeater")
                      .map((f) => (
                        <div key={f.name}>
                          <dt>{tt(`NPT_F_${f.name}`)}</dt>
                          <dd>{display(f, vals[f.name], tt)}</dd>
                        </div>
                      ))}
                  </dl>
                  {step.fields
                    .filter((f) => f.type === "repeater" && isVisible(f, vals))
                    .map((rep) =>
                      (vals[rep.name] || []).map((row, i) => (
                        <div className="npt-review-row" key={`${rep.name}${i}`}>
                          <strong>{tt(rep.itemLabel, { n: i + 1 })}</strong>
                          <dl className="npt-review-grid">
                            {rep.item.filter((it) => isVisible(it, row)).map((it) => (
                              <div key={it.name}>
                                <dt>{tt(`NPT_FI_${it.name}`)}</dt>
                                <dd>{display(it, row[it.name], tt)}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ))
                    )}
                </div>
              );
            })}
            <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
              <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
              <span>{tt("NPT_DECLARATION")}</span>
            </label>
            {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("NPT_DECLARE_REQUIRED")}</p> : null}
          </div>
        </section>
      </NPTPage>
      <NPTActions
        left={<NPTBtn kind="ghost" onClick={() => history.push(`${basePath}/${steps[steps.length - 1].route}`)}>{tt("NPT_BTN_BACK")}</NPTBtn>}
        note={tt("NPT_SMS_NOTE")}
        right={<NPTBtn kind="primary" icon="check" onClick={submit}>{tt("NPT_BTN_SUBMIT")}</NPTBtn>}
      />
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </div>
  );
};

export default NPTCheckPage;
