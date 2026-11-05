import { CardLabel, CardLabelError, Dropdown, MultiSelectDropdown, SevaLoader, TextArea, TextInput, Toast } from "@upyog/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { NEW_TL_STEPS, NTL_PAGES } from "../../config/newTLConfig";
import { ntlText } from "../../config/newTLMessages";
import { initialValuesForStep, validateStep } from "../../utils/newTL";
import { NTLActions, NTLBtn, NTLCrumbs, NTLHelp, NTLInfoBar, NTLPage, NTLPageHead, NTLStepper, NTLTricolour } from "./NTLLayout";
import { useNTLLookups } from "./useNTLLookups";

// step pages live at <module>/new-registration/<route>
const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

/**
 * One generic form step, driven by NEW_TL_STEPS. `formData` is the session store;
 * `config.key` picks the step.
 */
const NTLStep = ({ t, config, onSelect, onDraft, formData = {}, goBack, lc }) => {
  const history = useHistory();
  // lc = renewal / modification context: { pages, title, lock(field) }
  const pageList = lc ? lc.pages : NTL_PAGES;
  const page = pageList.find((p) => p.key === config.key);
  const sections = page.sections;
  // field names are unique across sections, so one flat value set drives the whole page
  const step = { key: page.key, head: page.head, hint: page.hint, fields: sections.reduce((all, sec) => all.concat(sec.fields), []) };
  const steps = pageList;
  const index = Math.max(0, steps.findIndex((s) => s.key === config.key));
  const loadValues = () => sections.reduce((all, sec) => ({ ...all, ...initialValuesForStep(sec, formData[sec.key]) }), {});
  const splitBySection = (vals) =>
    sections.reduce((all, sec) => ({ ...all, [sec.key]: sec.fields.reduce((o, f) => (f.name in vals ? { ...o, [f.name]: vals[f.name] } : o), {}) }), {});
  const tt = (key, params) => ntlText(t, key, params);

  const [values, setValues] = useState(loadValues);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const lookups = useNTLLookups(values);

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

  const mapBlocked = values.mapApproved === "No";

  const onNext = () => {
    const found = sections.reduce((all, sec) => ({ ...all, ...validateStep(sec, values) }), {});
    setErrors(found);
    if (Object.keys(found).length) {
      setToast({ error: true, label: tt("NTL_FIX_ERRORS") });
      return;
    }
    onSelect(step.key, null, splitBySection(values));
  };

  const onBack = () => (goBack ? goBack() : history.goBack());

  const control = (field) => {
    const value = values[field.name];
    if (lc && lc.lock && lc.lock(field)) {
      const o = (field.options || []).find((x) => x.code === value);
      const shown = Array.isArray(value) ? value.join(", ") : o ? tt(o.i18nKey) : value;
      return <TextInput name={field.name} value={shown || tt("NTL_NOT_PROVIDED")} disable={true} />;
    }
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
      return <TextInput name={field.name} type="date" value={value || ""} min={field.minFrom ? values[field.minFrom] || undefined : undefined} onChange={(e) => setField(field, e.target.value)} />;
    }
    if (field.type === "readonly") return <TextInput name={field.name} value={value || tt("NTL_NOT_PROVIDED")} disable={true} />;
    if (field.type === "select") {
      const options = optionsFor(field);
      return (
        <Dropdown
          option={options}
          optionKey="label"
          selected={options.find((o) => o.code === value)}
          disable={!!blocked || !!(lk && lk.isLoading)}
          select={(o) => setField(field, o.code)}
          t={(k) => tt(k)}
          placeholder={blocked ? tt("NTL_SELECT_FIRST", { parent: tt(field.parentLabel) }) : lk && !lk.isLoading && options.length === 0 ? tt("NTL_NO_OPTIONS") : tt("NTL_SELECT")}
        />
      );
    }
    if (field.type === "multiselect") {
      const options = optionsFor(field);
      const chosen = Array.isArray(value) ? value : [];
      return blocked ? (
        <TextInput name={field.name} value="" disable={true} placeholder={tt("NTL_SELECT_FIRST", { parent: tt(field.parentLabel) })} />
      ) : (
        <MultiSelectDropdown
          options={options}
          optionsKey="label"
          selected={options.filter((o) => chosen.includes(o.code))}
          onSelect={(list) => setField(field, (list || []).map((x) => ((x && x[1]) || x || {}).code).filter(Boolean))}
          defaultLabel={tt("NTL_SELECT")}
          defaultUnit={tt(`NTL_F_${field.name}`)}
        />
      );
    }
    return null;
  };

  const renderField = (field) => {
    const err = errors[field.name];
    const wide = field.type === "textarea";
    return (
      <div className={`npt-field${wide ? " npt-field--wide" : ""}${err ? " has-error" : ""}`} key={field.name}>
        <CardLabel>
          {tt(`NTL_F_${field.name}`)}
          {field.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
          {field.help ? <NTLHelp id={`ntl-h-${field.name}`} text={tt(`NTL_H_${field.name}`)} /> : null}
        </CardLabel>
        {control(field)}
        {err ? <CardLabelError>{tt(err)}</CardLabelError> : null}
      </div>
    );
  };

  if (loading) return <SevaLoader />;

  const navSteps = [...steps, { key: "review", route: "check", head: "NTL_STEP_REVIEW" }];
  const nextStep = navSteps[index + 1];
  const goTo = (s) => history.push(`${basePathOf(history)}/${s.route}`);
  const saveDraft = () => {
    onDraft && onDraft(step.key, null, splitBySection(values));
    setToast({ error: false, label: tt("NTL_DRAFT_SAVED") });
  };

  return (
    <div className="npt-wrap">
      <NTLCrumbs t={t} current={lc ? tt(lc.title) : undefined} />
      <NTLPageHead title={tt(lc ? lc.title : "NTL_MENU_NEW_REGISTRATION")} sub={tt("NTL_PAGE_SUB")}>
        <NTLInfoBar t={t} steps={navSteps} active={index} total={navSteps.length} autoOpen={false} />
      </NTLPageHead>
      <NTLStepper t={t} steps={navSteps} active={index} onGo={goTo} />
      <NTLPage>
        <section className="npt-card">
          <NTLTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(step.head)}</h2>
            <p className="npt-card__hint">{tt(step.hint)}</p>
            {failed.map((f) => (
              <div className="npt-lookup-error" role="alert" key={f.name}>
                <span>{tt("NTL_LOOKUP_FAILED", { what: tt(`NTL_F_${f.name}`) })}</span>
                <button type="button" className="npt-link" onClick={() => lookups[f.optionsFrom].refetch && lookups[f.optionsFrom].refetch()}>
                  {tt("NTL_RETRY")}
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
            {mapBlocked ? <div className="npt-lookup-error" role="alert">{tt("NTL_E_MAP_NOT_APPROVED")}</div> : null}
          </div>
        </section>
      </NTLPage>
      <NTLActions
        left={
          <React.Fragment>
            {index > 0 ? <NTLBtn kind="ghost" onClick={onBack}>{tt("NTL_BTN_BACK")}</NTLBtn> : null}
            {onDraft ? <NTLBtn kind="link" onClick={saveDraft}>{tt("NTL_BTN_SAVE_DRAFT")}</NTLBtn> : null}
          </React.Fragment>
        }
        note={nextStep ? tt("NTL_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={<NTLBtn kind="primary" icon="arrow" onClick={onNext} disabled={mapBlocked}>{tt("NTL_BTN_NEXT")}</NTLBtn>}
      />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default NTLStep;
