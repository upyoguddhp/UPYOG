import { CardLabel, CardLabelError, Dropdown, SevaLoader, TextArea, TextInput, Toast } from "@upyog/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { nptText } from "../../config/newPTMessages";
import { blankItem, initialValuesForStep, isVisible, stepsFor, validateStep } from "../../utils/newPT";
import { NEW_PT_STEPS } from "../../config/newPTConfig";
import { useNPTLookups } from "./useNPTLookups";
import { NPTActions, NPTBtn, NPTCrumbs, NPTHelp, NPTInfoBar, NPTPage, NPTPageHead, NPTStepper, NPTTricolour } from "./NPTLayout";

export const NPTProgress = ({ index, total, t }) => (
  <div className="npt-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1}>
    <div className="npt-progress__label">{nptText(t, "NPT_STEP_OF", { current: index + 1, total })}</div>
    <div className="npt-progress__track">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`npt-progress__seg${i <= index ? " is-on" : ""}`} />
      ))}
    </div>
  </div>
);

/**
 * One generic form step, driven by NEW_PT_STEPS. `formData` is the session store;
 * `config.key` picks the step. Supports repeatable groups (khasra, building units).
 */
// step pages live at <module>/new-registration/<route>
const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

const NPTStep = ({ t, config, onSelect, onDraft, formData = {}, goBack }) => {
  const history = useHistory();
  const step = NEW_PT_STEPS.find((s) => s.key === config.key);
  const steps = stepsFor(formData);
  const index = Math.max(0, steps.findIndex((s) => s.key === config.key));
  const tt = (key, params) => nptText(t, key, params);

  const [values, setValues] = useState(() => initialValuesForStep(step, formData[step.key]));
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const lookups = useNPTLookups(values, formData.locationDetails?.ulbName);

  useEffect(() => {
    setValues(initialValuesForStep(step, formData[step.key]));
    setErrors({});
  }, [config.key]);

  // auto-fill the property coordinates from the device location (once, only if still empty)
  useEffect(() => {
    if (step.key !== "locationDetails" || values.gpsLocation || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setValues((prev) => (prev.gpsLocation ? prev : { ...prev, gpsLocation: `${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}` })),
      () => {},
      { timeout: 8000, maximumAge: 300000 }
    );
  }, [config.key]);

  const allFields = step.fields.flatMap((f) => (f.type === "repeater" ? f.item : [f]));
  const failed = allFields.filter((f) => f.optionsFrom && lookups[f.optionsFrom]?.isError);
  const loading = step.key === "locationDetails" && lookups.districts.isLoading;

  const setField = (field, value, extra = {}) => {
    setValues((prev) => {
      const next = { ...prev, [field.name]: value };
      (field.resets || []).forEach((r) => (next[r] = ""));
      return { ...next, ...extra };
    });
    setErrors((prev) => ({ ...prev, [field.name]: undefined }));
  };

  const setItem = (rep, i, field, value) => {
    setValues((prev) => ({ ...prev, [rep.name]: prev[rep.name].map((row, r) => (r === i ? { ...row, [field.name]: value } : row)) }));
    setErrors((prev) => {
      if (!prev[rep.name]) return prev;
      const rows = prev[rep.name].map((e, r) => (r === i ? { ...e, [field.name]: undefined } : e));
      return { ...prev, [rep.name]: rows };
    });
  };

  const addItem = (rep) => setValues((prev) => ({ ...prev, [rep.name]: [...prev[rep.name], blankItem(rep.item)] }));
  const removeItem = (rep, i) => {
    setValues((prev) => ({ ...prev, [rep.name]: prev[rep.name].filter((_, r) => r !== i) }));
    setErrors((prev) => ({ ...prev, [rep.name]: undefined }));
  };

  const optionsFor = (field) => {
    if (field.optionsFrom) return (lookups[field.optionsFrom]?.options || []).map((o) => ({ ...o, label: o.name }));
    return (field.options || []).map((o) => ({ ...o, label: o.i18nKey }));
  };

  const onNext = () => {
    const found = validateStep(step, values);
    setErrors(found);
    if (Object.keys(found).length) {
      setToast({ error: true, label: tt("NPT_FIX_ERRORS") });
      return;
    }
    onSelect(step.key, values);
  };

  const onBack = () => (goBack ? goBack() : history.goBack());

  // one input (shared by plain fields and repeater rows)
  const control = (field, value, onChange, scope) => {
    if (field.type === "checkbox") {
      return (
        <label className="npt-check">
          <input type="checkbox" checked={value === true || value === "Yes"} onChange={(e) => onChange(e.target.checked)} />
          <span>{value === true || value === "Yes" ? tt("NPT_O_YES") : tt("NPT_O_NO")}</span>
        </label>
      );
    }
    if (field.type === "radio") {
      return (
        <div className="npt-radios" role="radiogroup">
          {(field.options || []).map((o) => (
            <label key={o.code} className={`npt-radio${value === o.code ? " is-on" : ""}`}>
              <input type="radio" name={field.name} checked={value === o.code} onChange={() => onChange(o.code)} />
              <span>{tt(o.i18nKey)}</span>
            </label>
          ))}
        </div>
      );
    }
    if (field.type === "text" || field.type === "number") {
      return (
        <TextInput
          name={field.name}
          type={field.type === "number" ? "number" : "text"}
          value={value === undefined || value === null ? "" : value}
          maxlength={field.maxLength}
          onChange={(e) => {
            let v = e.target.value;
            if (field.digitsOnly) v = v.replace(/\D/g, "");
            onChange(v);
          }}
        />
      );
    }
    if (field.type === "textarea") return <TextArea name={field.name} value={value || ""} maxLength={field.maxLength} onChange={(e) => onChange(e.target.value)} />;
    if (field.type === "readonly") return <TextInput name={field.name} value={value || tt("NPT_NOT_PROVIDED")} disable={true} />;
    if (field.type === "select") {
      const options = optionsFor(field);
      const lk = field.optionsFrom ? lookups[field.optionsFrom] : null;
      const blocked = field.dependsOn && !values[field.dependsOn];
      return (
        <Dropdown
          option={options}
          optionKey="label"
          selected={options.find((o) => o.code === value)}
          disable={!!blocked || !!(lk && lk.isLoading)}
          select={(o) => onChange(o.code, field.name === "ulbName" ? { ulbType: o.ulbType || "" } : {})}
          t={(k) => tt(k)}
          placeholder={blocked ? tt("NPT_SELECT_FIRST", { parent: tt(field.parentLabel) }) : lk && !lk.isLoading && options.length === 0 ? tt("NPT_NO_OPTIONS") : tt("NPT_SELECT")}
        />
      );
    }
    return null;
  };

  const renderField = (field) => {
    if (!isVisible(field, values)) return null;
    const err = errors[field.name];

    if (field.type === "repeater") {
      const rows = values[field.name] || [];
      return (
        <div className="npt-repeater npt-field--wide" key={field.name}>
          <CardLabel>
            {tt(`NPT_F_${field.name}`)}
            {field.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
          </CardLabel>
          {rows.map((row, i) => (
            <div className="npt-repeater__row" key={i}>
              <div className="npt-repeater__head">
                <strong>{tt(field.itemLabel, { n: i + 1 })}</strong>
                {rows.length > 1 ? (
                  <button type="button" className="npt-link" onClick={() => removeItem(field, i)}>
                    {tt("NPT_BTN_REMOVE")}
                  </button>
                ) : null}
              </div>
              <div className="npt-grid">
                {field.item.filter((it) => isVisible(it, row)).map((it) => {
                  const itemErr = err?.[i]?.[it.name];
                  return (
                    <div className={`npt-field${itemErr ? " has-error" : ""}`} key={it.name}>
                      <CardLabel>
                        {tt(`NPT_FI_${it.name}`)}
                        {it.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
                        {it.help ? <NPTHelp id={`npt-h-${it.name}-${i}`} text={tt(`NPT_H_${it.name}`)} /> : null}
                      </CardLabel>
                      {control(it, row[it.name], (v) => setItem(field, i, it, v))}
                      {itemErr ? <CardLabelError>{tt(itemErr)}</CardLabelError> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <button type="button" className="npt-add" onClick={() => addItem(field)}>
            + {tt(field.addLabel)}
          </button>
        </div>
      );
    }

    const wide = field.type === "textarea" && !field.span;
    return (
      <div className={`npt-field${wide ? " npt-field--wide" : ""}${field.span === 2 ? " npt-field--span2" : ""}${err ? " has-error" : ""}`} key={field.name}>
        <CardLabel>
          {tt(`NPT_F_${field.name}`)}
          {field.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
          {field.help ? <NPTHelp id={`npt-h-${field.name}`} text={tt(`NPT_H_${field.name}`)} /> : null}
        </CardLabel>
        {control(field, values[field.name], (v, extra) => setField(field, v, extra))}
        {err ? <CardLabelError>{tt(err)}</CardLabelError> : null}
      </div>
    );
  };

  if (loading) return <SevaLoader />;

  const navSteps = [...steps, { key: "review", route: "check", head: "NPT_STEP_REVIEW" }];
  const nextStep = navSteps[index + 1];
  const goTo = (s) => history.push(`${basePathOf(history)}/${s.route}`);
  const saveDraft = (exit) => {
    onDraft && onDraft(step.key, values);
    if (exit) history.push("/digit-ui/citizen/dashboard");
    else setToast({ error: false, label: tt("NPT_DRAFT_SAVED") });
  };

  return (
    <div className="npt-wrap">
      <NPTCrumbs t={t} />
      <NPTPageHead title={tt("NPT_MENU_NEW_REGISTRATION")} sub={tt("NPT_PAGE_SUB")}>
        <NPTInfoBar t={t} steps={navSteps} active={index} total={navSteps.length} autoOpen={index === 0} />
      </NPTPageHead>
      <NPTStepper t={t} steps={navSteps} active={index} onGo={goTo} />
      <NPTPage>
        <section className="npt-card">
          <NPTTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(step.head)}</h2>
            <p className="npt-card__hint">{tt(step.hint)}</p>
            {failed.map((f) => (
              <div className="npt-lookup-error" role="alert" key={f.name}>
                <span>{tt("NPT_LOOKUP_FAILED", { what: tt(`NPT_F_${f.name}`, { defaultValue: tt(`NPT_FI_${f.name}`) }) })}</span>
                <button type="button" className="npt-link" onClick={() => lookups[f.optionsFrom]?.refetch?.()}>
                  {tt("NPT_RETRY")}
                </button>
              </div>
            ))}
            <div
              className="npt-grid"
              onFocusCapture={(e) => {
                // bring a dropdown to the upper part of the screen so its option list is fully visible on short screens
                const box = e.target.closest && e.target.closest(".select, .select-active");
                if (box) setTimeout(() => box.closest(".npt-field")?.scrollIntoView({ block: "start", behavior: "smooth" }), 60);
              }}
            >
              {step.fields.map(renderField)}
            </div>
          </div>
        </section>
      </NPTPage>
      <NPTActions
        left={
          <React.Fragment>
            {index > 0 ? <NPTBtn kind="ghost" onClick={onBack}>{tt("NPT_BTN_BACK")}</NPTBtn> : null}
            {onDraft ? <NPTBtn kind="link" onClick={() => saveDraft(false)}>{tt("NPT_BTN_SAVE_DRAFT")}</NPTBtn> : null}
          </React.Fragment>
        }
        note={nextStep ? tt("NPT_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={<NPTBtn kind="primary" icon="arrow" onClick={onNext}>{tt("NPT_BTN_NEXT")}</NPTBtn>}
      />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default NPTStep;
