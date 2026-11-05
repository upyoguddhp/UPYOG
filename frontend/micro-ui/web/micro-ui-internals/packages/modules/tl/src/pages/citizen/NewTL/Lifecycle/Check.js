import { SevaLoader, TextArea, Toast, fetchServiceDocumentList, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { NEW_TL_STEPS } from "../../../../config/newTLConfig";
import { ntlText } from "../../../../config/newTLMessages";
import { NTLActions, NTLBtn, NTLCrumbs, NTLInfoBar, NTLPage, NTLPageHead, NTLStepper, NTLTricolour } from "../../../../pageComponents/NewTL/NTLLayout";
import { NTL_DMS_SERVICE } from "../../../../pageComponents/NewTL/useNTLDocuments";
import { apiErrorMessage, buildSubmitPayload } from "../../../../utils/newTL";
import { buildClosurePayload, buildLifecyclePayload } from "../../../../utils/newTLLifecycle";

const display = (field, value, tt) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : tt("NTL_NOT_PROVIDED");
  if (value === undefined || value === null || value === "") return tt("NTL_NOT_PROVIDED");
  const opt = (field.options || []).find((o) => o.code === value);
  return opt ? tt(opt.i18nKey) : String(value);
};

// Review + declaration + the submit sequence of renew / modify / close.
const LifecycleCheck = ({ t, mode, cfg, row, params, setParams, pages, basePath }) => {
  const history = useHistory();
  const tt = (k, p) => ntlText(t, k, p);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);
  const [reason, setReason] = useState("");
  const M = mode.toUpperCase();
  const navSteps = [...pages, { key: "review", route: "check", head: "NTL_STEP_REVIEW" }];
  const chosen = ((params.documents || {}).chosen || []).filter((d) => serviceDocumentStore.get(NTL_DMS_SERVICE, d.id));

  const submit = async () => {
    if (!declared) {
      setDeclareError(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let cur = params._result;
      if (mode === "close") {
        await Digit.TLService.newTLUpdate(buildClosurePayload(row, reason), "NewTL");
        cur = { ...row, applicationType: "CLOSURE", status: "PENDINGFORVERIFICATION" };
      } else {
        if (!cur) {
          cur = row;
          // INITIATED rows go straight to the forward step; everything else first saves the edits
          // (APPROVED -> PENDINGFORMODIFICATION for a modification, PENDINGFORMODIFICATION -> itself otherwise)
          if (row.status !== "INITIATED") {
            const action = row.status === "APPROVED" ? "RETURN_TO_INITIATOR" : "PENDING_FOR_MODIFICATION";
            const res = await Digit.TLService.newTLUpdate(buildLifecyclePayload(row, params, { action, type: cfg.type }), "NewTL");
            const saved = res && res.Licenses && res.Licenses[0];
            if (!saved) throw new Error(tt("NTL_SUBMIT_FAILED"));
            cur = { ...row, ...saved, tradeLicenseDetail: { ...row.tradeLicenseDetail, ...saved.tradeLicenseDetail } };
          }
          setParams({ ...params, _result: cur }); // a retry must not repeat the state change
        }
        const list = ((params.documents || {}).list || []).filter((d) => serviceDocumentStore.get(NTL_DMS_SERVICE, d.id));
        const { failed } = await uploadServiceDocuments({ serviceName: NTL_DMS_SERVICE, objectId: row.applicationNumber, list, description: "trade-licence-application" });
        if (failed.length) throw new Error(tt("NTL_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
        let held = [];
        try {
          held = (await fetchServiceDocumentList(NTL_DMS_SERVICE, row.applicationNumber)).filter((d) => d.attachment && d.attachment.url);
        } catch (e) {
          throw new Error(tt("NTL_DOC_UPLOAD_FAILED", { docs: "" }));
        }
        const body = buildSubmitPayload(cur, "FORWARD_TO_VERIFIER", held);
        body.Licenses[0].applicationType = cfg.type;
        await Digit.TLService.newTLUpdate(body, "NewTL");
      }
      serviceDocumentStore.clear(NTL_DMS_SERVICE);
      setParams({ ...params, _result: cur, _done: true });
      history.replace(`${basePath}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("NTL_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (submitting) return <SevaLoader fullScreen message={tt("NTL_LC_SUBMITTING")} />;

  const sections = NEW_TL_STEPS.filter((s) => s.custom !== "documents");
  return (
    <div className="npt-wrap">
      <NTLCrumbs t={t} current={tt(cfg.title)} />
      <NTLPageHead title={tt(cfg.title)} sub={tt("NTL_REVIEW_SUB")}>
        <NTLInfoBar t={t} steps={navSteps} active={navSteps.length - 1} total={navSteps.length} showTips={false} />
      </NTLPageHead>
      {pages.length ? <NTLStepper t={t} steps={navSteps} active={navSteps.length - 1} onGo={(s) => history.push(`${basePath}/${s.route}`)} /> : null}
      <NTLPage>
        <section className="npt-card">
          <NTLTricolour />
          <div className="npt-card__body">
            <p className="npt-card__hint">{tt("NTL_REVIEW_HINT")}</p>
            {sections.map((step) => {
              const vals = params[step.key] || {};
              return (
                <div className="npt-review-block" key={step.key}>
                  <div className="npt-review-head"><h3>{tt(step.head)}</h3></div>
                  <dl className="npt-review-grid">
                    {step.fields.map((f) => (
                      <div key={f.name}><dt>{tt(`NTL_F_${f.name}`)}</dt><dd>{display(f, vals[f.name], tt)}</dd></div>
                    ))}
                  </dl>
                </div>
              );
            })}
            {mode !== "close" ? (
              <div className="npt-review-block">
                <div className="npt-review-head"><h3>{tt("NTL_STEP_DOCUMENTS")}</h3></div>
                <ul className="npt-review-docs">
                  {chosen.length === 0 ? <li>{tt("NTL_LC_DOCS_ON_FILE")}</li> : chosen.map((d) => <li key={d.id}><strong>{d.documentName}</strong><span>{d.name}</span></li>)}
                </ul>
              </div>
            ) : (
              <div className="npt-field npt-field--wide">
                <label htmlFor="ntl-lc-reason">{tt("NTL_LC_REASON")}</label>
                <TextArea name="reason" value={reason} maxLength={250} onChange={(e) => setReason(e.target.value)} />
              </div>
            )}
            <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
              <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
              <span>{tt("NTL_DECLARATION")}</span>
            </label>
            {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("NTL_DECLARE_REQUIRED")}</p> : null}
            {mode === "close" ? <div className="npt-lookup-error" role="alert">{tt("NTL_LC_CLOSE_WARN")}</div> : null}
          </div>
        </section>
      </NTLPage>
      <NTLActions
        left={<NTLBtn kind="ghost" onClick={() => (pages.length ? history.push(`${basePath}/${pages[pages.length - 1].route}`) : history.push(`${basePath}/start`))}>{tt("NTL_BTN_BACK")}</NTLBtn>}
        right={<NTLBtn kind="primary" icon="check" onClick={submit}>{mode === "close" ? tt("NTL_LC_CONFIRM_CLOSE") : tt("NTL_BTN_SUBMIT")}</NTLBtn>}
      />
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </div>
  );
};

export default LifecycleCheck;
