import { CardLabel, CardLabelError, Dropdown, SevaLoader, TextArea, TextInput, Toast } from "@upyog/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { NEW_PET_STEPS, NPR_PAGES } from "../../config/newPetConfig";
import { nprText } from "../../config/newPetMessages";
import { initialValuesForStep, isFieldVisible, validateStep } from "../../utils/newPet";
import { NPRActions, NPRBtn, NPRCrumbs, NPRHelp, NPRInfoBar, NPRPage, NPRPageHead, NPRStepper, NPRTricolour } from "./NPRLayout";
import { useNPRLookups } from "./useNPRLookups";

// step pages live at <module>/new-registration/<route>
const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

/**
 * One generic form step, driven by NEW_PET_STEPS. `formData` is the session store;
 * `config.key` picks the step.
 */
const NPRStep = ({ t, config, onSelect, onDraft, formData = {}, goBack }) => {
  const history = useHistory();
  const page = NPR_PAGES.find((p) => p.key === config.key);
  const sections = page.sections;
  // field names are unique across sections, so one flat value set drives the whole page
  const step = { key: page.key, head: page.head, hint: page.hint, fields: sections.reduce((all, sec) => all.concat(sec.fields), []) };
  const steps = NPR_PAGES;
  const index = Math.max(0, steps.findIndex((s) => s.key === config.key));
  const loadValues = () => sections.reduce((all, sec) => ({ ...all, ...initialValuesForStep(sec, formData[sec.key]) }), {});
  const splitBySection = (vals) =>
    sections.reduce((all, sec) => ({ ...all, [sec.key]: sec.fields.reduce((o, f) => [f.name].concat(f.carry || []).reduce((oo, n) => (n in vals ? { ...oo, [n]: vals[n] } : oo), o), {}) }), {});
  const tt = (key, params) => nprText(t, key, params);

  const [values, setValues] = useState(loadValues);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const lookups = useNPRLookups(values);

  useEffect(() => {
    setValues(loadValues());
    setErrors({});
  }, [config.key]);

  const failed = step.fields.filter((f) => f.optionsFrom && lookups[f.optionsFrom] && lookups[f.optionsFrom].isError);
  const loading = step.fields.some((f) => f.optionsFrom && !f.dependsOn && lookups[f.optionsFrom] && lookups[f.optionsFrom].isLoading);

  const setField = (field, value, extra) => {
    setValues((prev) => {
      const next = { ...prev, [field.name]: value };
      (field.resets || []).forEach((r) => {
        const resetField = step.fields.find((f) => f.name === r);
        next[r] = resetField && resetField.type === "multiselect" ? [] : "";
      });
      return { ...next, ...(extra || {}) };
    });
    setErrors((prev) => ({ ...prev, [field.name]: undefined }));
  };

  const optionsFor = (field) => {
    if (field.optionsFrom) return ((lookups[field.optionsFrom] || {}).options || []).map((o) => ({ ...o, label: o.name }));
    return (field.options || []).map((o) => ({ ...o, label: o.i18nKey }));
  };

  const bannedBreed = !!values._isBanned && !!values.breedType;

  const onNext = () => {
    const found = sections.reduce((all, sec) => ({ ...all, ...validateStep(sec, values) }), {});
    setErrors(found);
    if (Object.keys(found).length) {
      setToast({ error: true, label: tt("NPR_FIX_ERRORS") });
      return;
    }
    onSelect(step.key, null, splitBySection(values));
  };

  const onBack = () => (goBack ? goBack() : history.goBack());

  const control = (field) => {
    const value = values[field.name];
    const lk = field.optionsFrom ? lookups[field.optionsFrom] : null;
    const blocked = field.dependsOn && (Array.isArray(values[field.dependsOn]) ? values[field.dependsOn].length === 0 : !values[field.dependsOn]);
    if (field.type === "text") {
      return (
        <TextInput
          name={field.name}
          value={value || ""}
          maxlength={field.maxLength}
          onChange={(e) => {
            let v = e.target.value;
            if (field.digitsOnly) v = v.replace(/\D/g, "");
            if (field.upper) v = v.toUpperCase();
            setField(field, v);
          }}
        />
      );
    }
    if (field.type === "textarea") return <TextArea name={field.name} value={value || ""} maxLength={field.maxLength} onChange={(e) => setField(field, e.target.value)} />;
    if (field.type === "date") {
      return <TextInput name={field.name} type="date" value={value || ""} max={field.maxToday ? new Date().toISOString().slice(0, 10) : undefined} onChange={(e) => setField(field, e.target.value)} />;
    }
    if (field.type === "readonly") return <TextInput name={field.name} value={value || tt("NPR_NOT_PROVIDED")} disable={true} />;
    if (field.type === "select") {
      const options = optionsFor(field);
      return (
        <Dropdown
          option={options}
          optionKey="label"
          selected={options.find((o) => o.code === value)}
          disable={!!blocked || !!(lk && lk.isLoading)}
          select={(o) => setField(field, o.code, field.name === "breedType" ? { _isBanned: !!o.isBannedPet } : field.name === "ulbName" ? { _ulbType: o.ulbType || "" } : undefined)}
          t={(k) => tt(k)}
          placeholder={blocked ? tt("NPR_SELECT_FIRST", { parent: tt(field.parentLabel) }) : lk && !lk.isLoading && options.length === 0 ? tt("NPR_NO_OPTIONS") : tt("NPR_SELECT")}
        />
      );
    }
    return null;
  };

  const renderField = (field) => {
    if (!isFieldVisible(field, values)) return null;
    const err = errors[field.name];
    const wide = field.type === "textarea";
    return (
      <div className={`npt-field${wide ? " npt-field--wide" : ""}${err ? " has-error" : ""}`} key={field.name}>
        <CardLabel>
          {tt(`NPR_F_${field.name}`)}
          {field.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
          {field.help ? <NPRHelp id={`npr-h-${field.name}`} text={tt(`NPR_H_${field.name}`)} /> : null}
        </CardLabel>
        {control(field)}
        {err ? <CardLabelError>{tt(err)}</CardLabelError> : null}
      </div>
    );
  };

  if (loading) return <SevaLoader />;

  const navSteps = [...steps, { key: "review", route: "check", head: "NPR_STEP_REVIEW" }];
  const nextStep = navSteps[index + 1];
  const goTo = (s) => history.push(`${basePathOf(history)}/${s.route}`);
  const saveDraft = () => {
    onDraft && onDraft(step.key, null, splitBySection(values));
    setToast({ error: false, label: tt("NPR_DRAFT_SAVED") });
  };

  return (
    <div className="npt-wrap">
      <NPRCrumbs t={t} />
      <NPRPageHead title={tt("NPR_MENU_NEW_REGISTRATION")} sub={tt("NPR_PAGE_SUB")}>
        <NPRInfoBar t={t} steps={navSteps} active={index} total={navSteps.length} autoOpen={false} />
      </NPRPageHead>
      <NPRStepper t={t} steps={navSteps} active={index} onGo={goTo} />
      <NPRPage>
        <section className="npt-card">
          <NPRTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(step.head)}</h2>
            <p className="npt-card__hint">{tt(step.hint)}</p>
            {failed.map((f) => (
              <div className="npt-lookup-error" role="alert" key={f.name}>
                <span>{tt("NPR_LOOKUP_FAILED", { what: tt(`NPR_F_${f.name}`) })}</span>
                <button type="button" className="npt-link" onClick={() => lookups[f.optionsFrom].refetch && lookups[f.optionsFrom].refetch()}>
                  {tt("NPR_RETRY")}
                </button>
              </div>
            ))}
            {sections.map((sec) => (
            <React.Fragment key={sec.key}>
            {sections.length > 1 ? <h3 className="npt-section__title">{tt(sec.head)}</h3> : null}
            <div
              className={`npt-grid${sections.length > 1 ? " npt-grid--3" : ""}`}
              onFocusCapture={(e) => {
                const box = e.target.closest && e.target.closest(".select, .select-active");
                if (box) setTimeout(() => { const f = box.closest(".npt-field"); f && f.scrollIntoView({ block: "start", behavior: "smooth" }); }, 60);
              }}
            >
              {sec.fields.map(renderField)}
            </div>
            </React.Fragment>
            ))}
            {bannedBreed ? <div className="npt-lookup-error" role="alert">{tt("NPR_W_BANNED_BREED")}</div> : null}
          </div>
        </section>
      </NPRPage>
      <NPRActions
        left={
          <React.Fragment>
            {index > 0 ? <NPRBtn kind="ghost" onClick={onBack}>{tt("NPR_BTN_BACK")}</NPRBtn> : null}
            {onDraft ? <NPRBtn kind="link" onClick={saveDraft}>{tt("NPR_BTN_SAVE_DRAFT")}</NPRBtn> : null}
          </React.Fragment>
        }
        note={nextStep ? tt("NPR_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={<NPRBtn kind="primary" icon="arrow" onClick={onNext}>{tt("NPR_BTN_NEXT")}</NPRBtn>}
      />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default NPRStep;
