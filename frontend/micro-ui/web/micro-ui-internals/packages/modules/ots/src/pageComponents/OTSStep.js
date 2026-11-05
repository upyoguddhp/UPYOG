import { Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { OTS_ANY_OTHER, otsPageOf } from "../config/otsConfig";
import { otsText } from "../config/otsMessages";
import { OtsApi, apiErrorMessage, categoriesOf, getUserDefaults, todayYmd, ulbsOf, validatePage, wardsOf } from "../utils/ots";
import { OTSField } from "./OTSFields";
import { OTSLoading, OTSLookupError } from "./OTSParts";
import OTSShell from "./OTSShell";

const staticOptions = (field) => (field.options || []).map((o) => ({ code: o.code, label: o.i18nKey }));

// Generic form step (applicant, shop) driven by OTS_PAGES.
const OTSStep = ({ t, pageKey, onSelect, formData = {} }) => {
  const tt = (k, p) => otsText(t, k, p);
  const page = otsPageOf(pageKey);
  const saved = formData[pageKey] || {};
  const defaults = pageKey === "applicant" ? getUserDefaults() : {};
  const [values, setValues] = useState(() => ({ ...defaults, ...Object.keys(saved).reduce((o, k) => (saved[k] ? { ...o, [k]: saved[k] } : o), {}) }));
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const isShop = pageKey === "shop";
  const q = { refetchOnWindowFocus: false, retry: 1 };
  const ulbs = useQuery(["OTS_ULBS"], OtsApi.ulbs, { enabled: isShop, staleTime: 30 * 60 * 1000, ...q });
  const wards = useQuery(["OTS_WARDS", values.ulbName], () => OtsApi.wards(values.ulbName), { enabled: isShop && !!values.ulbName, staleTime: 30 * 60 * 1000, ...q });
  const cats = useQuery(["OTS_CATEGORIES"], OtsApi.categories, { enabled: isShop, staleTime: 30 * 60 * 1000, ...q });

  const setField = (field, value) => {
    setValues((v) => {
      const next = { ...v, [field.name]: value };
      (field.resets || []).forEach((r) => { next[r] = ""; });
      return next;
    });
    setErrors((e) => ({ ...e, [field.name]: undefined }));
  };

  const optionsFor = (field) => {
    if (field.optionsFrom === "ulbs") return ulbsOf(ulbs.data);
    if (field.optionsFrom === "wards") return values.ulbName ? wardsOf(wards.data) : [];
    if (field.optionsFrom === "categories") return [...categoriesOf(cats.data), { code: OTS_ANY_OTHER, label: "OTS_O_ANY_OTHER" }];
    return staticOptions(field);
  };
  const loadingFor = (field) =>
    (field.optionsFrom === "ulbs" && ulbs.isLoading) || (field.optionsFrom === "wards" && !!values.ulbName && wards.isLoading) || (field.optionsFrom === "categories" && cats.isLoading);

  const visible = page.fields.filter((f) => !f.showWhen || values[f.showWhen.field] === f.showWhen.equals);

  const onNext = () => {
    const found = validatePage(page, values);
    setErrors(found);
    if (Object.keys(found).length) {
      setToast({ error: true, label: tt("OTS_FIX_ERRORS") });
      return;
    }
    onSelect(pageKey, values);
  };

  return (
    <OTSShell t={t} pageKey={pageKey} onNext={onNext} autoOpen={pageKey === "applicant"}>
      {isShop && (ulbs.isLoading || cats.isLoading || (!!values.ulbName && wards.isLoading)) ? <OTSLoading t={t} message={tt("OTS_LOADING_LOOKUPS")} /> : null}
      {isShop && ulbs.isError ? <OTSLookupError t={t} message={apiErrorMessage(ulbs.error, tt("OTS_ULBS_FAILED"))} onRetry={() => ulbs.refetch()} /> : null}
      {isShop && wards.isError ? <OTSLookupError t={t} message={apiErrorMessage(wards.error, tt("OTS_WARDS_FAILED"))} onRetry={() => wards.refetch()} /> : null}
      {isShop && cats.isError ? <OTSLookupError t={t} message={apiErrorMessage(cats.error, tt("OTS_CATEGORIES_FAILED"))} onRetry={() => cats.refetch()} /> : null}
      <div className="npt-grid npt-grid--3">
        {visible.map((field) => (
          <OTSField
            key={field.name}
            t={t}
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            options={field.type === "select" ? optionsFor(field) : []}
            loading={loadingFor(field)}
            disabled={!!(field.lockedFromLogin && defaults[field.name])}
            max={field.maxToday ? todayYmd() : undefined}
            onChange={(v) => setField(field, v)}
          />
        ))}
      </div>
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </OTSShell>
  );
};

export default OTSStep;
