import { SevaLoader, Toast, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { NEW_PET_STEPS, NPR_PAGES } from "../../../config/newPetConfig";
import { nprText } from "../../../config/newPetMessages";
import { NPRActions, NPRBtn, NPRCrumbs, NPRInfoBar, NPRPage, NPRPageHead, NPRStepper, NPRTricolour } from "../../../pageComponents/NewPet/NPRLayout";
import { NPR_DMS_SERVICE } from "../../../pageComponents/NewPet/useNPRDocuments";
import { apiErrorMessage, isFieldVisible, buildNewPetPayload, buildSubmitPayload } from "../../../utils/newPet";

const display = (field, value, tt) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : tt("NPR_NOT_PROVIDED");
  if (value === undefined || value === null || value === "") return tt("NPR_NOT_PROVIDED");
  const opt = (field.options || []).find((o) => o.code === value);
  return opt ? tt(opt.i18nKey) : String(value);
};

const NPRCheckPage = ({ params, setParams, t, basePath }) => {
  const history = useHistory();
  const tt = (k, p) => nprText(t, k, p);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);
  const steps = NEW_PET_STEPS;
  const pageRoute = (step) => (NPR_PAGES.find((pg) => pg.key === (step.page || step.key)) || step).route;

  // a refreshed or deep-linked review page with nothing filled in goes back to the start
  const complete = steps.every((s) => params && params[s.key]);
  if (!complete) return <Redirect to={`${basePath}/${NPR_PAGES[0].route}`} />;

  const navSteps = [...NPR_PAGES, { key: "review", route: "check", head: "NPR_STEP_REVIEW" }];
  const docsOf = (vals) => (vals.chosen || []).filter((d) => serviceDocumentStore.get(NPR_DMS_SERVICE, d.id));

  const submit = async () => {
    if (!declared) {
      setDeclareError(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let lic = params._result;
      if (!lic || !lic.applicationNumber) {
        const payload = buildNewPetPayload(params, { stateTenant: Digit.ULBService.getStateId() });
        const res = await Digit.PTRService.create(payload);
        lic = res && res.PetRegistrationApplications && res.PetRegistrationApplications[0];
        if (!lic || !lic.applicationNumber) throw new Error(tt("NPR_SUBMIT_FAILED"));
        setParams({ ...params, _result: lic }); // keep the whole record: the workflow update needs it on a retry
      }
      // documents need the application number, so they go to DMS right after it exists
      const docs = params.documents || {};
      const toSend = (docs.list || []).filter((d) => serviceDocumentStore.get(NPR_DMS_SERVICE, d.id));
      {
        const { failed } = await uploadServiceDocuments({ serviceName: NPR_DMS_SERVICE, objectId: lic.applicationNumber, list: toSend, description: "pet-registration-application" });
        if (failed.length) throw new Error(tt("NPR_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
      }
      // move into the workflow (applicant -> ULB)
      await Digit.PTRService.update(buildSubmitPayload(lic));
      serviceDocumentStore.clear(NPR_DMS_SERVICE);
      history.replace(`${basePath}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("NPR_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (submitting) return <SevaLoader fullScreen message={tt("NPR_SUBMITTING")} />;

  return (
    <div className="npt-wrap">
      <NPRCrumbs t={t} current={tt("NPR_STEP_REVIEW")} />
      <NPRPageHead title={tt("NPR_STEP_REVIEW")} sub={tt("NPR_REVIEW_SUB")}>
        <NPRInfoBar t={t} steps={navSteps} active={navSteps.length - 1} total={navSteps.length} showTips={false} />
      </NPRPageHead>
      <NPRStepper t={t} steps={navSteps} active={navSteps.length - 1} onGo={(s) => history.push(`${basePath}/${s.route}`)} />
      <NPRPage>
        <section className="npt-card">
          <NPRTricolour />
          <div className="npt-card__body">
            <p className="npt-card__hint">{tt("NPR_REVIEW_HINT")}</p>
            {steps.map((step) => {
              const vals = params[step.key] || {};
              const docs = step.custom === "documents" ? docsOf(vals) : [];
              return (
                <div className="npt-review-block" key={step.key}>
                  <div className="npt-review-head">
                    <h3>{tt(step.head)}</h3>
                    <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/${pageRoute(step)}`)}>{tt("NPR_BTN_EDIT")}</button>
                  </div>
                  {step.custom === "documents" ? (
                    <ul className="npt-review-docs">
                      {docs.length === 0 ? <li>{tt("NPR_NOT_PROVIDED")}</li> : docs.map((d) => <li key={d.id}><strong>{d.documentName}</strong><span>{d.name}</span></li>)}
                    </ul>
                  ) : null}
                  <dl className="npt-review-grid">
                    {step.fields.filter((f) => isFieldVisible(f, vals)).map((f) => (
                      <div key={f.name}>
                        <dt>{tt(`NPR_F_${f.name}`)}</dt>
                        <dd>{display(f, vals[f.name], tt)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
            <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
              <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
              <span>{tt("NPR_DECLARATION")}</span>
            </label>
            {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("NPR_DECLARE_REQUIRED")}</p> : null}
          </div>
        </section>
      </NPRPage>
      <NPRActions
        left={<NPRBtn kind="ghost" onClick={() => history.push(`${basePath}/${NPR_PAGES[NPR_PAGES.length - 1].route}`)}>{tt("NPR_BTN_BACK")}</NPRBtn>}
        right={<NPRBtn kind="primary" icon="check" onClick={submit}>{tt("NPR_BTN_SUBMIT")}</NPRBtn>}
      />
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </div>
  );
};

export default NPRCheckPage;
