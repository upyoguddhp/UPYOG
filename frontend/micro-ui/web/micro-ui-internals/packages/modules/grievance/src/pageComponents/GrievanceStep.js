import { CardLabel, CardLabelError, Dropdown, TextArea, TextInput, Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { GRV_PAGES } from "../config/grievanceConfig";
import { grvText } from "../config/grievanceMessages";
import { getUserDefaults, validatePage } from "../utils/grievance";
import { GRVLoading, GRVLookupError } from "./GrievanceParts";
import GrievanceShell from "./GrievanceShell";
import { useGRVLookups } from "./useGRVLookups";

// Generic form step (request, location, applicant) driven by GRV_PAGES.
const GrievanceStep = ({ t, pageKey, onSelect, formData = {} }) => {
  const tt = (k, p) => grvText(t, k, p);
  const page = GRV_PAGES.find((p) => p.key === pageKey);
  const saved = formData[pageKey] || {};
  const [values, setValues] = useState(() => {
    if (pageKey !== "applicant") return { ...saved };
    const d = getUserDefaults();
    return { ...d, ...Object.keys(saved).reduce((o, k) => (saved[k] ? { ...o, [k]: saved[k] } : o), {}) };
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const lookups = useGRVLookups(values);
  const defaults = getUserDefaults();

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
      setToast({ error: true, label: tt("GRV_FIX_ERRORS") });
      return;
    }
    onSelect(pageKey, values);
  };

  const control = (field) => {
    const value = values[field.name];
    if (field.type === "textarea") {
      return <TextArea name={field.name} value={value || ""} maxLength={field.maxLength} onChange={(e) => setField(field, e.target.value)} />;
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
          placeholder={blocked ? tt("GRV_SELECT_FIRST", { field: tt(field.parentLabel) }) : lk && !lk.isLoading && options.length === 0 ? tt("GRV_NO_OPTIONS") : tt("GRV_SELECT")}
        />
      );
    }
    return (
      <TextInput
        name={field.name}
        value={value || ""}
        maxlength={field.maxLength}
        disable={!!(field.lock && defaults[field.name])}
        onChange={(e) => setField(field, field.digitsOnly ? e.target.value.replace(/\D/g, "") : e.target.value)}
      />
    );
  };

  const failed = page.fields.map((f) => (f.optionsFrom ? lookups[f.optionsFrom] : null)).filter((l) => l && l.isError);
  const loading = page.fields.some((f) => f.optionsFrom && lookups[f.optionsFrom] && lookups[f.optionsFrom].isLoading);

  return (
    <GrievanceShell t={t} pageKey={pageKey} onNext={onNext}>
      {loading ? <GRVLoading t={t} message={tt("GRV_LOADING_OPTIONS")} /> : null}
      {failed.length ? <GRVLookupError t={t} message={tt("GRV_LOOKUP_FAILED")} onRetry={() => failed.forEach((l) => l.refetch())} /> : null}
      <div className="npt-grid npt-grid--3">
        {page.fields.map((field) => {
          const err = errors[field.name];
          return (
            <div className={`npt-field${err ? " has-error" : ""}${field.wide ? " npt-field--wide" : field.span ? ` npt-field--span${field.span}` : ""}`} key={field.name}>
              <CardLabel>
                {tt(`GRV_F_${field.name}`)}
                {field.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
              </CardLabel>
              {control(field)}
              {err ? <CardLabelError>{tt(err)}</CardLabelError> : null}
            </div>
          );
        })}
      </div>
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </GrievanceShell>
  );
};

export default GrievanceStep;
