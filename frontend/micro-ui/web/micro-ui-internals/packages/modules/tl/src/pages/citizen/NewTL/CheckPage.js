import { SevaLoader, Toast, fetchServiceDocumentList, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { NEW_TL_STEPS, NTL_PAGES } from "../../../config/newTLConfig";
import { ntlText } from "../../../config/newTLMessages";
import { NTLActions, NTLBtn, NTLCrumbs, NTLInfoBar, NTLPage, NTLPageHead, NTLStepper, NTLTricolour } from "../../../pageComponents/NewTL/NTLLayout";
import { NTL_DMS_SERVICE } from "../../../pageComponents/NewTL/useNTLDocuments";
import { apiErrorMessage, buildNewTLPayload, buildSubmitPayload } from "../../../utils/newTL";

const display = (field, value, tt) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : tt("NTL_NOT_PROVIDED");
  if (value === undefined || value === null || value === "") return tt("NTL_NOT_PROVIDED");
  const opt = (field.options || []).find((o) => o.code === value);
  return opt ? tt(opt.i18nKey) : String(value);
};

const NTLCheckPage = ({ params, setParams, t, basePath }) => {
  const history = useHistory();
  const tt = (k, p) => ntlText(t, k, p);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);
  const steps = NEW_TL_STEPS;

  // a refreshed or deep-linked review page with nothing filled in goes back to the start
  const complete = steps.every((s) => params && params[s.key]);
  if (!complete) return <Redirect to={`${basePath}/${steps[0].route}`} />;

  const navSteps = [...NTL_PAGES, { key: "review", route: "check", head: "NTL_STEP_REVIEW" }];
  const docsOf = (vals) => (vals.chosen || []).filter((d) => serviceDocumentStore.get(NTL_DMS_SERVICE, d.id));

  const submit = async () => {
    if (!declared) {
      setDeclareError(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const info = (Digit.UserService.getUser() || {}).info || {};
      let lic = params._result;
      if (!lic || !lic.applicationNumber) {
        const payload = buildNewTLPayload(params, { stateTenant: Digit.ULBService.getStateId(), roles: info.roles || [] });
        const res = await Digit.TLService.newTLCreate(payload, "NewTL");
        lic = res && res.Licenses && res.Licenses[0];
        if (!lic || !lic.applicationNumber) throw new Error(tt("NTL_SUBMIT_FAILED"));
        setParams({ ...params, _result: lic }); // keep the whole record: the workflow update needs it on a retry
      }
      // documents need the application number, so they go to DMS right after it exists
      const docs = params.documents || {};
      const toSend = (docs.list || []).filter((d) => serviceDocumentStore.get(NTL_DMS_SERVICE, d.id));
      {
        const { failed } = await uploadServiceDocuments({ serviceName: NTL_DMS_SERVICE, objectId: lic.applicationNumber, list: toSend, description: "trade-licence-application" });
        if (failed.length) throw new Error(tt("NTL_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
      }
      // whatever DMS now holds for this application (new uploads, replaced versions, files from an earlier try)
      // is what gets attached to the licence
      let held = [];
      try {
        held = (await fetchServiceDocumentList(NTL_DMS_SERVICE, lic.applicationNumber)).filter((d) => d.attachment && d.attachment.url);
      } catch (e) {
        throw new Error(tt("NTL_DOC_UPLOAD_FAILED", { docs: "" }));
      }
      // move into the workflow (applicant -> ULB)
      await Digit.TLService.newTLUpdate(buildSubmitPayload(lic, "FORWARD_TO_VERIFIER", held), "NewTL");
      serviceDocumentStore.clear(NTL_DMS_SERVICE);
      history.replace(`${basePath}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("NTL_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (submitting) return <SevaLoader fullScreen message={tt("NTL_SUBMITTING")} />;

  return (
    <div className="npt-wrap">
      <NTLCrumbs t={t} current={tt("NTL_STEP_REVIEW")} />
      <NTLPageHead title={tt("NTL_STEP_REVIEW")} sub={tt("NTL_REVIEW_SUB")}>
        <NTLInfoBar t={t} steps={navSteps} active={navSteps.length - 1} total={navSteps.length} showTips={false} />
      </NTLPageHead>
      <NTLStepper t={t} steps={navSteps} active={navSteps.length - 1} onGo={(s) => history.push(`${basePath}/${s.route}`)} />
      <NTLPage>
        <section className="npt-card">
          <NTLTricolour />
          <div className="npt-card__body">
            <p className="npt-card__hint">{tt("NTL_REVIEW_HINT")}</p>
            {steps.map((step) => {
              const vals = params[step.key] || {};
              const docs = step.custom === "documents" ? docsOf(vals) : [];
              return (
                <div className="npt-review-block" key={step.key}>
                  <div className="npt-review-head">
                    <h3>{tt(step.head)}</h3>
                    {step.key !== "applicantDetails" ? (
                      <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/${(NTL_PAGES.find((pg) => pg.key === (step.page || step.key)) || step).route}`)}>{tt("NTL_BTN_EDIT")}</button>
                    ) : null}
                  </div>
                  {step.custom === "documents" ? (
                    <ul className="npt-review-docs">
                      {docs.length === 0 ? <li>{tt("NTL_NOT_PROVIDED")}</li> : docs.map((d) => <li key={d.id}><strong>{d.documentName}</strong><span>{d.name}</span></li>)}
                    </ul>
                  ) : null}
                  <dl className="npt-review-grid">
                    {step.fields.map((f) => (
                      <div key={f.name}>
                        <dt>{tt(`NTL_F_${f.name}`)}</dt>
                        <dd>{display(f, vals[f.name], tt)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
            <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
              <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
              <span>{tt("NTL_DECLARATION")}</span>
            </label>
            {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("NTL_DECLARE_REQUIRED")}</p> : null}
          </div>
        </section>
      </NTLPage>
      <NTLActions
        left={<NTLBtn kind="ghost" onClick={() => history.push(`${basePath}/${NTL_PAGES[NTL_PAGES.length - 1].route}`)}>{tt("NTL_BTN_BACK")}</NTLBtn>}
        right={<NTLBtn kind="primary" icon="check" onClick={submit}>{tt("NTL_BTN_SUBMIT")}</NTLBtn>}
      />
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </div>
  );
};

export default NTLCheckPage;
