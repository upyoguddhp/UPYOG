import { CardLabel, CardLabelError, Dropdown, SevaLoader, ServiceDocuments, TextInput, Toast, missingServiceDocuments, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, Redirect, Route, Switch, useHistory, useLocation, useParams, useRouteMatch } from "react-router-dom";
import { NEW_PET_STEPS } from "../../../config/newPetConfig";
import { nprText } from "../../../config/newPetMessages";
import { NPRActions, NPRBtn, NPRCrumbs, NPRIcon, NPRInfoBar, NPRPage, NPRPageHead, NPRStepper, NPRTricolour } from "../../../pageComponents/NewPet/NPRLayout";
import { docLabels } from "../../../pageComponents/NewPet/NPRDocuments";
import { NPR_DMS_SERVICE } from "../../../pageComponents/NewPet/useNPRDocuments";
import { apiErrorMessage, buildRenewalInitPayload, buildRenewalSubmitPayload, isFieldVisible, newestRowOf, validateStep } from "../../../utils/newPet";

const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());

// what the citizen may change when renewing (same set as OldTheme's PetRenewal): age + fresh vaccination details
const petStep = NEW_PET_STEPS.find((s) => s.key === "petDetails");
const vacStep = NEW_PET_STEPS.find((s) => s.key === "vaccination");
const EDIT_FIELDS = [petStep.fields.find((f) => f.name === "petAge"), ...vacStep.fields];
const LOCKED = ["petName", "petType", "breedType", "petGender", "petStrelization", "petPurchaseSource", "applicantName", "fatherName", "mobileNumber"];

const STEPS = [
  { key: "confirm", route: "", head: "NPR_RN_STEP_CONFIRM" },
  { key: "update", route: "update", head: "NPR_RN_STEP_UPDATE" },
  { key: "documents", route: "documents", head: "NPR_STEP_DOCUMENTS" },
  { key: "review", route: "check", head: "NPR_STEP_REVIEW" },
];

// values the form starts with: age and vaccination status as registered, fresh vaccination proof left blank (as OldTheme)
const initialValues = (rec) => ({
  petAge: (rec.petDetails || {}).petAge || "",
  vaccinationStatus: (rec.additionalDetail || {}).vaccinationStatus || "",
  vaccinationNumber: "",
  lastVaccineDate: "",
  clinicName: "",
  doctorName: "",
  doctorRegistrationNumber: "",
});

const lockedValue = (name, rec) => {
  const pd = rec.petDetails || {};
  const ad = rec.additionalDetail || {};
  return { petName: pd.petName, petType: pd.petType, breedType: pd.breedType, petGender: pd.petGender, petStrelization: ad.petStrelization, petPurchaseSource: ad.petPurchaseSource, applicantName: rec.applicantName, fatherName: rec.fatherName, mobileNumber: rec.mobileNumber }[name];
};

const Shell = ({ t, tt, title, hint, active, children, actions, crumb, history, base }) => (
  <div className="npt-wrap">
    <NPRCrumbs t={t} current={crumb || tt("NPR_RN_TITLE")} />
    <NPRPageHead title={tt("NPR_RN_TITLE")} sub={tt("NPR_RN_SUB")}>
      <NPRInfoBar t={t} steps={STEPS} active={active} total={STEPS.length} showTips={false} />
    </NPRPageHead>
    <NPRStepper t={t} steps={STEPS} active={active} onGo={(s) => history.push(`${base}${s.route ? `/${s.route}` : ""}`)} />
    <NPRPage>
      <section className="npt-card">
        <NPRTricolour />
        <div className="npt-card__body">
          {title ? <h2 className="npt-card__title">{title}</h2> : null}
          {hint ? <p className="npt-card__hint">{hint}</p> : null}
          {children}
        </div>
      </section>
    </NPRPage>
    {actions}
  </div>
);

const Facts = ({ rows }) => (
  <dl className="npt-review-grid">
    {rows.map(([k, v]) => (
      <div key={k}><dt>{k}</dt><dd>{v === undefined || v === null || v === "" ? "-" : v}</dd></div>
    ))}
  </dl>
);

// Renewal of an approved pet registration: confirm -> update age/vaccination -> documents -> review -> acknowledgement.
const PetRenewal = () => {
  const { t } = useTranslation();
  const tt = (k, p) => nprText(t, k, p);
  const match = useRouteMatch();
  const history = useHistory();
  const { search } = useLocation();
  const { applicationNumber: raw } = useParams();
  const applicationNumber = decodeURIComponent(raw || "");
  const urlTenant = new URLSearchParams(search).get("tenantId") || undefined;
  const base = match.url.replace(/\/$/, "").replace(/\/(update|documents|check|acknowledgement)$/, "");
  const root = base.replace(/\/renew\/.*$/, "");
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(`PTR_RENEWAL_${applicationNumber}`, {});
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);
  const [docList, setDocList] = useState([]);
  const [docErrors, setDocErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, isError, error: loadError, refetch } = useQuery(
    ["NPR_RENEWAL_SOURCE", applicationNumber, urlTenant],
    () => Digit.PTRService.search({ tenantId: urlTenant, filters: { applicationNumber, limit: 10, offset: 0 } }),
    { refetchOnWindowFocus: false, retry: 1 }
  );

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("NPR_RN_LOADING")} /></div>;
  const rows = (data && data.PetRegistrationApplications) || [];
  const newest = newestRowOf(rows, applicationNumber);
  const crumbs = <NPRCrumbs t={t} current={tt("NPR_RN_TITLE")} />;

  if (isError || !newest) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <NPRPageHead title={tt("NPR_RN_TITLE")} sub={applicationNumber} />
        <div className="npt-lookup-error" role="alert">
          <span>{isError ? apiErrorMessage(loadError, tt("NPR_RN_LOAD_FAILED")) : tt("NPR_RN_NOT_FOUND")}</span>
          {isError ? <button type="button" className="npt-link" onClick={() => refetch()}>{tt("NPR_RETRY")}</button> : null}
        </div>
      </div>
    );
  }

  const statusText = (s) => t(`WF_PTR_${s}`, { defaultValue: humanise(s) });
  // a renewal row already waiting for the citizen (PENDINGFORMODIFICATION) is resumed instead of starting a second one
  const resumable = newest.applicationType === "RENEWAL" && newest.status === "PENDINGFORMODIFICATION";
  const rec = params.rec || (resumable ? newest : null);
  const eligible = newest.status === "APPROVED";

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await Digit.PTRService.renewal(buildRenewalInitPayload(newest));
      const created = res && res.PetRegistrationApplications && res.PetRegistrationApplications[0];
      if (!created || !created.applicationNumber) throw new Error(tt("NPR_RN_START_FAILED"));
      setParams({ rec: created, values: initialValues(created) });
      history.push(`${base}/update`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("NPR_RN_START_FAILED")));
    }
    setStarting(false);
  };

  const values = params.values || (rec ? initialValues(rec) : {});
  const setValue = (field, v) => {
    setParams({ ...params, rec, values: { ...values, [field.name]: v } });
    setErrors((p) => ({ ...p, [field.name]: undefined }));
  };
  const validate = () => {
    const found = validateStep({ fields: EDIT_FIELDS }, values);
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const control = (field) => {
    const value = values[field.name];
    if (field.type === "select") {
      const options = (field.options || []).map((o) => ({ ...o, label: o.i18nKey }));
      return <Dropdown option={options} optionKey="label" selected={options.find((o) => o.code === value)} select={(o) => setValue(field, o.code)} t={(k) => tt(k)} placeholder={tt("NPR_SELECT")} />;
    }
    if (field.type === "date") return <TextInput name={field.name} type="date" value={value || ""} max={field.maxToday ? new Date().toISOString().slice(0, 10) : undefined} onChange={(e) => setValue(field, e.target.value)} />;
    return <TextInput name={field.name} value={value || ""} maxlength={field.maxLength} onChange={(e) => setValue(field, field.digitsOnly ? e.target.value.replace(/\D/g, "") : e.target.value)} />;
  };

  const optionText = (field, v) => {
    const o = (field.options || []).find((x) => x.code === v);
    return o ? tt(o.i18nKey) : v;
  };

  const submit = async () => {
    if (!declared) return setDeclareError(true);
    setSubmitting(true);
    setError(null);
    try {
      const toSend = docList.filter((d) => serviceDocumentStore.get(NPR_DMS_SERVICE, d.id));
      if (toSend.length) {
        // same objectId as the original registration: earlier uploads stay, a replaced file becomes a new version
        const { failed } = await uploadServiceDocuments({ serviceName: NPR_DMS_SERVICE, objectId: applicationNumber, list: toSend, description: "pet-renewal-application" });
        if (failed.length) throw new Error(tt("NPR_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
      }
      const res = await Digit.PTRService.update(buildRenewalSubmitPayload(rec, values));
      const done = (res && res.PetRegistrationApplications && res.PetRegistrationApplications[0]) || rec;
      serviceDocumentStore.clear(NPR_DMS_SERVICE);
      setParams({ ...params, submitted: done });
      history.replace(`${base}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("NPR_RN_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  const shell = { t, tt, history, base };
  const viewHref = `${root}/registration/${encodeURIComponent(applicationNumber)}${newest.tenantId ? `?tenantId=${newest.tenantId}` : ""}`;

  return (
    <React.Fragment>
      {submitting ? <SevaLoader fullScreen message={tt("NPR_RN_SUBMITTING")} /> : null}
      {starting ? <SevaLoader fullScreen message={tt("NPR_RN_STARTING")} /> : null}
      <Switch>
        <Route path={`${base}/acknowledgement`}>
          {params.submitted ? (
            <div className="npt-wrap">
              <NPRCrumbs t={t} current={tt("NPR_RN_ACK_TITLE")} />
              <section className="npt-ack">
                <div className="npt-ack__banner">
                  <span className="npt-ack__tick"><NPRIcon name="check" size={30} /></span>
                  <div>
                    <h1>{tt("NPR_RN_ACK_TITLE")}</h1>
                    <p>{tt("NPR_RN_ACK_SUB")}</p>
                  </div>
                  <div className="npt-ack__id">
                    <small>{tt("NPR_ACK_APP_NO")}</small>
                    <strong>{params.submitted.applicationNumber}</strong>
                  </div>
                </div>
                <div className="npt-ack__actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
                  <Link to={`${root}/my-registrations`} onClick={clearParams} className="npt-btn npt-btn--primary"><span>{tt("NPR_VIEW_BACK")}</span></Link>
                  <Link to={viewHref} onClick={clearParams} className="npt-btn npt-btn--ghost"><span>{tt("NPR_RN_VIEW")}</span></Link>
                </div>
              </section>
            </div>
          ) : <Redirect to={base} />}
        </Route>

        <Route path={`${base}/update`}>
          {!rec ? <Redirect to={base} /> : (
            <Shell {...shell} active={1} title={tt("NPR_RN_EDIT_TITLE")} hint={tt("NPR_RN_EDIT_HINT")}
              actions={(
                <NPRActions
                  left={<NPRBtn kind="ghost" onClick={() => history.push(base)}>{tt("NPR_BTN_BACK")}</NPRBtn>}
                  right={<NPRBtn kind="primary" icon="arrow" onClick={() => (validate() ? history.push(`${base}/documents`) : setError(tt("NPR_FIX_ERRORS")))}>{tt("NPR_BTN_NEXT")}</NPRBtn>}
                />
              )}>
              <h3 className="npt-section__title">{tt("NPR_RN_LOCKED_TITLE")}</h3>
              <Facts rows={[[tt("NPR_F_propertyId"), (rec.additionalDetail || {}).propertyId], [tt("NPR_F_propertyAddress"), (rec.address || {}).addressLine1]].concat(LOCKED.map((n) => {
                const f = [].concat(petStep.fields, NEW_PET_STEPS.find((s) => s.key === "ownerDetails").fields).find((x) => x.name === n) || {};
                return [tt(`NPR_F_${n}`), optionText(f, lockedValue(n, rec))];
              }))} />
              <h3 className="npt-section__title" style={{ marginTop: 18 }}>{tt("NPR_RN_EDIT_TITLE")}</h3>
              <div className="npt-grid">
                {EDIT_FIELDS.filter((f) => isFieldVisible(f, values)).map((f) => (
                  <div className={`npt-field${errors[f.name] ? " has-error" : ""}`} key={f.name}>
                    <CardLabel>{tt(`NPR_F_${f.name}`)}{f.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}</CardLabel>
                    {control(f)}
                    {errors[f.name] ? <CardLabelError>{tt(errors[f.name])}</CardLabelError> : null}
                  </div>
                ))}
              </div>
            </Shell>
          )}
        </Route>

        <Route path={`${base}/documents`}>
          {!rec ? <Redirect to={base} /> : (
            <Shell {...shell} active={2} title={tt("NPR_STEP_DOCUMENTS")} hint={tt("NPR_STEP_HINT_DOCUMENTS")}
              actions={(
                <NPRActions
                  left={<NPRBtn kind="ghost" onClick={() => history.push(`${base}/update`)}>{tt("NPR_BTN_BACK")}</NPRBtn>}
                  right={(
                    <NPRBtn kind="primary" icon="arrow" onClick={() => {
                      const missing = missingServiceDocuments(NPR_DMS_SERVICE, docList);
                      if (missing.length) {
                        setDocErrors(missing.reduce((o, d) => ({ ...o, [d.id]: true }), {}));
                        return setError(tt("NPR_DOC_REQUIRED_TOAST"));
                      }
                      history.push(`${base}/check`);
                    }}>{tt("NPR_BTN_NEXT")}</NPRBtn>
                  )}
                />
              )}>
              <ServiceDocuments serviceName={NPR_DMS_SERVICE} objectId={applicationNumber} labels={docLabels(tt)} errors={docErrors} onLoaded={setDocList} onChange={() => setDocErrors({})} />
            </Shell>
          )}
        </Route>

        <Route path={`${base}/check`}>
          {!rec ? <Redirect to={base} /> : (
            <Shell {...shell} active={3} title={tt("NPR_STEP_REVIEW")} hint={tt("NPR_RN_REVIEW_HINT")}
              actions={(
                <NPRActions
                  left={<NPRBtn kind="ghost" onClick={() => history.push(`${base}/documents`)}>{tt("NPR_BTN_BACK")}</NPRBtn>}
                  right={<NPRBtn kind="primary" icon="check" onClick={submit}>{tt("NPR_RN_SUBMIT")}</NPRBtn>}
                />
              )}>
              <div className="npt-review-block">
                <div className="npt-review-head">
                  <h3>{tt("NPR_RN_EDIT_TITLE")}</h3>
                  <button type="button" className="npt-link" onClick={() => history.push(`${base}/update`)}>{tt("NPR_BTN_EDIT")}</button>
                </div>
                <Facts rows={EDIT_FIELDS.filter((f) => isFieldVisible(f, values)).map((f) => [tt(`NPR_F_${f.name}`), optionText(f, values[f.name]) || tt("NPR_NOT_PROVIDED")])} />
              </div>
              <ul className="npt-review-docs">
                {docList.filter((d) => serviceDocumentStore.get(NPR_DMS_SERVICE, d.id) || d.attachment).map((d) => (
                  <li key={d.id}><strong>{d.documentName}</strong><span>{serviceDocumentStore.get(NPR_DMS_SERVICE, d.id) ? serviceDocumentStore.get(NPR_DMS_SERVICE, d.id).name : tt("NPR_DOC_UPLOADED")}</span></li>
                ))}
              </ul>
              <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
                <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
                <span>{tt("NPR_RN_DECLARATION")}</span>
              </label>
              {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("NPR_DECLARE_REQUIRED")}</p> : null}
            </Shell>
          )}
        </Route>

        <Route>
          {resumable && rec && !params.rec ? <Redirect to={`${base}/update`} /> : (
            <Shell {...shell} active={0} title={tt("NPR_RN_CONFIRM_TITLE", { no: applicationNumber })} hint={tt("NPR_RN_CONFIRM_HINT")}
              actions={(
                <NPRActions
                  left={<Link to={viewHref} className="npt-btn npt-btn--ghost"><span>{tt("NPR_RN_VIEW")}</span></Link>}
                  right={eligible || params.rec ? <NPRBtn kind="primary" icon="arrow" onClick={() => (params.rec ? history.push(`${base}/update`) : start())}>{tt("NPR_RN_START")}</NPRBtn> : null}
                />
              )}>
              <Facts rows={[
                [tt("NPR_F_petName"), (newest.petDetails || {}).petName],
                [tt("NPR_F_petType"), (newest.petDetails || {}).petType],
                [tt("NPR_F_breedType"), (newest.petDetails || {}).breedType],
                [tt("NPR_F_applicantName"), newest.applicantName],
                [tt("NPR_TYPE_LABEL"), tt(newest.applicationType === "RENEWAL" ? "NPR_TYPE_RENEWAL" : "NPR_TYPE_NEW")],
                [tt("NPR_VIEW_STATUS"), statusText(newest.status)],
              ]} />
              {eligible || params.rec ? (
                <ul className="npt-review-docs" style={{ marginTop: 14 }}>
                  {["NPR_RN_P1", "NPR_RN_P2", "NPR_RN_P3", "NPR_RN_P4"].map((k) => <li key={k}><span>{tt(k)}</span></li>)}
                </ul>
              ) : (
                <div className="npt-lookup-error" role="alert">
                  <span>{tt(newest.applicationType === "RENEWAL" ? "NPR_RN_IN_PROGRESS" : "NPR_RN_NOT_ELIGIBLE", { status: statusText(newest.status) })}</span>
                </div>
              )}
            </Shell>
          )}
        </Route>
      </Switch>
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </React.Fragment>
  );
};

export default PetRenewal;
