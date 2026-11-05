import { CardLabel, CardLabelError, Dropdown, TextInput, Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { RQS_PAGES } from "../config/reqsvcConfig";
import { rqsText } from "../config/reqsvcMessages";
import { feeOf, getUserDefaults, todayYmd, validatePage } from "../utils/reqsvc";
import { RQSFee, RQSLoading, RQSLookupError } from "./ReqsvcParts";
import ReqsvcShell from "./ReqsvcShell";
import { useRQSLookups } from "./useRQSLookups";

// Generic form step (request, location, applicant) driven by RQS_PAGES.
const ReqsvcStep = ({ t, pageKey, onSelect, formData = {} }) => {
  const tt = (k, p) => rqsText(t, k, p);
  const page = RQS_PAGES.find((p) => p.key === pageKey);
  const saved = formData[pageKey] || {};
  const [values, setValues] = useState(() => {
    if (pageKey === "request") return { issueDate: todayYmd(), ...saved };
    if (pageKey !== "applicant") return { ...saved };
    const d = getUserDefaults();
    return { ...d, ...Object.keys(saved).reduce((o, k) => (saved[k] ? { ...o, [k]: saved[k] } : o), {}) };
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const lookups = useRQSLookups(values);

  const setField = (field, value) => {
    setValues((v) => {
      const next = { ...v, [field.name]: value };
      (field.resets || []).forEach((r) => { next[r] = ""; });
      return next;
    });
    setErrors((e) => ({ ...e, [field.name]: undefined }));
  };

  const onNext = () => {
    const found = validatePage(page, values);
    setErrors(found);
    if (Object.keys(found).length) {
      setToast({ error: true, label: tt("RQS_FIX_ERRORS") });
      return;
    }
    onSelect(pageKey, values);
  };

  const control = (field) => {
    const value = values[field.name];
    if (field.type === "date") {
      return <TextInput name={field.name} type="date" value={value || ""} min={todayYmd()} onChange={(e) => setField(field, e.target.value)} />;
    }
    if (field.type === "select") {
      const lk = field.optionsFrom ? lookups[field.optionsFrom] : null;
      const options = lk ? lk.options : [];
      const blocked = field.dependsOn && !values[field.dependsOn];
      return (
        <Dropdown
          option={options}
          optionKey="label"
          selected={options.find((o) => o.code === value)}
          disable={!!(blocked || (lk && lk.isLoading))}
          select={(o) => setField(field, o.code)}
          t={(k) => tt(k)}
          placeholder={blocked ? tt("RQS_SELECT_FIRST", { field: tt(field.parentLabel) }) : lk && !lk.isLoading && options.length === 0 ? tt("RQS_NO_OPTIONS") : tt("RQS_SELECT")}
        />
      );
    }
    return (
      <TextInput
        name={field.name}
        value={value || ""}
        maxlength={field.maxLength}
        onChange={(e) => setField(field, field.digitsOnly ? e.target.value.replace(/\D/g, "") : e.target.value)}
      />
    );
  };

  const failed = page.fields.map((f) => (f.optionsFrom ? lookups[f.optionsFrom] : null)).filter((l) => l && l.isError);
  const loading = page.fields.some((f) => f.optionsFrom && lookups[f.optionsFrom] && lookups[f.optionsFrom].isLoading);

  return (
    <ReqsvcShell t={t} pageKey={pageKey} onNext={onNext}>
      {loading ? <RQSLoading t={t} message={tt("RQS_LOADING_OPTIONS")} /> : null}
      {failed.length ? <RQSLookupError t={t} message={tt("RQS_LOOKUP_FAILED")} onRetry={() => failed.forEach((l) => l.refetch())} /> : null}
      <div className="npt-grid npt-grid--3">
        {page.fields.map((field) => {
          const err = errors[field.name];
          return (
            <div className={`npt-field${err ? " has-error" : ""}`} key={field.name}>
              <CardLabel>
                {tt(`RQS_F_${field.name}`)}
                {field.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
              </CardLabel>
              {control(field)}
              {err ? <CardLabelError>{tt(err)}</CardLabelError> : null}
            </div>
          );
        })}
      </div>
      {pageKey === "request" ? <RQSFee t={t} fee={feeOf(lookups.rawCategories, values.category)} /> : null}
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </ReqsvcShell>
  );
};

export default ReqsvcStep;
