import { CardLabel, CardLabelError, Dropdown, SevaLoader, TextInput, Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { GRB_PAGES, NEW_GRB_STEPS, GRB_SINGLE_TYPES, grbPagesFor, grbTitleKey } from "../../config/newGRBConfig";
import { grbText } from "../../config/newGRBMessages";
import { emptyUnit, initialUnits, unitFlags, validateFields } from "../../utils/newGRB";
import { GRBActions, GRBBtn, GRBCrumbs, GRBHelp, GRBIcon, GRBInfoBar, GRBPage, GRBPageHead, GRBStepper, GRBTricolour } from "./GRBLayout";
import { unitOptions, useGRBCategories } from "./useGRBLookups";

const MAX_UNITS = 10;

const basePathOf = (history) => history.location.pathname.replace(/\/[^/]+\/?$/, "");

const SPEC = NEW_GRB_STEPS.find((s) => s.key === "specifications");
const UNITS = NEW_GRB_STEPS.find((s) => s.key === "units");

/**
 * Details page: the specification (type of collection, old id) and one card per collection unit.
 * The first unit is the account holder; extra units are only offered for multi-collection types.
 */
const GRBDetails = ({ t, onSelect, onDraft, formData = {}, goBack }) => {
  const history = useHistory();
  const tt = (k, p) => grbText(t, k, p);
  const page = GRB_PAGES.find((p) => p.key === "details");
  const pages = grbPagesFor(formData);
  const index = pages.findIndex((p) => p.key === "details");
  const navSteps = [...pages, { key: "review", route: "check", head: "GRB_STEP_REVIEW" }];
  const prop = formData.propertyDetails || {};

  const [spec, setSpec] = useState(() => ({ ...(formData.specifications || {}) }));
  const [units, setUnits] = useState(() => initialUnits(formData.units));
  const [errors, setErrors] = useState({ spec: {}, units: [] });
  const [toast, setToast] = useState(null);
  const cats = useGRBCategories(prop.ulbName);

  const single = GRB_SINGLE_TYPES.includes(spec.typeOfCollection);

  const onSpec = (field, value) => {
    const next = { ...spec, [field.name]: value };
    setSpec(next);
    setErrors((e) => ({ ...e, spec: { ...e.spec, [field.name]: undefined } }));
    if (field.name === "typeOfCollection") {
      // the allowed categories depend on the type, so earlier picks are cleared (and single types keep one unit)
      setUnits((list) => (GRB_SINGLE_TYPES.includes(value) ? list.slice(0, 1) : list).map((u) => ({ ...u, category: "", subCategory: "", subCategoryType: "", calcType: "", no_of_units: "" })));
    }
  };

  const onUnit = (i, field, value) => {
    setUnits((list) =>
      list.map((u, k) => {
        if (k !== i) return u;
        const next = { ...u, [field.name]: value };
        (field.resets || []).forEach((r) => { next[r] = ""; });
        // calculation choices only exist for sub category types with an additional cost
        if (field.name === "subCategoryType" || field.name === "category" || field.name === "subCategory") { next.calcType = ""; next.no_of_units = ""; }
        if (field.name === "calcType" && value !== "Variable") next.no_of_units = "";
        return next;
      })
    );
    setErrors((e) => {
      const rows = [...(e.units || [])];
      rows[i] = { ...(rows[i] || {}), [field.name]: undefined };
      return { ...e, units: rows };
    });
  };

  const addUnit = () => setUnits((list) => (list.length < MAX_UNITS ? [...list, emptyUnit()] : list));
  const removeUnit = (i) => {
    setUnits((list) => list.filter((_, k) => k !== i));
    setErrors((e) => ({ ...e, units: (e.units || []).filter((_, k) => k !== i) }));
  };

  const validate = () => {
    const specErrors = validateFields(SPEC.fields, spec);
    const unitErrors = units.map((u) => {
      const fl = unitFlags(u, cats.rows);
      return validateFields(UNITS.fields, u, fl);
    });
    setErrors({ spec: specErrors, units: unitErrors });
    return !Object.keys(specErrors).length && !unitErrors.some((x) => Object.keys(x).length);
  };

  const onNext = () => {
    if (!validate()) {
      setToast({ error: true, label: tt("GRB_FIX_ERRORS") });
      return;
    }
    onSelect(page.key, null, { specifications: spec, units: { list: units } });
  };

  const saveDraft = () => {
    onDraft && onDraft(page.key, null, { specifications: spec, units: { list: units } });
    setToast({ error: false, label: tt("GRB_DRAFT_SAVED") });
  };

  const optionsFor = (field, unit) => {
    if (field.optionsFrom) return unitOptions(cats.rows, unit, spec.typeOfCollection, prop.ulbName)[field.optionsFrom] || [];
    return (field.options || []).map((o) => ({ ...o, label: o.i18nKey }));
  };

  // one control, generic over the spec object and the unit objects
  const control = (field, values, err, onChange, unit) => {
    const value = values[field.name];
    if (field.type === "text") {
      return (
        <TextInput
          name={field.name}
          value={value || ""}
          maxlength={field.maxLength}
          onChange={(e) => onChange(field.digitsOnly ? e.target.value.replace(/\D/g, "") : e.target.value)}
        />
      );
    }
    if (field.type === "checkbox") {
      return (
        <label className="grb-check">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{tt(`GRB_F_${field.name}`)}</span>
        </label>
      );
    }
    if (field.type === "select") {
      const options = optionsFor(field, unit || {});
      const blocked = field.dependsOn && !(unit || {})[field.dependsOn];
      const loading = field.optionsFrom && cats.isLoading;
      return (
        <Dropdown
          option={options}
          optionKey="label"
          selected={options.find((o) => o.code === value)}
          disable={!!blocked || !!loading}
          select={(o) => onChange(o.code)}
          t={(k) => tt(k)}
          placeholder={blocked ? tt("GRB_SELECT_FIRST", { parent: tt(field.parentLabel) }) : field.optionsFrom && !loading && options.length === 0 ? tt("GRB_NO_OPTIONS") : tt("GRB_SELECT")}
        />
      );
    }
    return null;
  };

  const renderField = (field, values, errs, onChange, unit, keyPrefix) => {
    const err = errs && errs[field.name];
    const wide = field.type === "checkbox";
    return (
      <div className={`npt-field${wide ? " npt-field--check" : ""}${err ? " has-error" : ""}`} key={`${keyPrefix}${field.name}`}>
        {field.type === "checkbox" ? null : (
          <CardLabel>
            {tt(`GRB_F_${field.name}`)}
            {field.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
            {field.help ? <GRBHelp id={`grb-h-${keyPrefix}${field.name}`} text={tt(`GRB_H_${field.name}`)} /> : null}
          </CardLabel>
        )}
        {control(field, values, err, onChange, unit)}
        {field.type === "checkbox" && field.help ? <small className="grb-check__hint">{tt(`GRB_H_${field.name}`)}</small> : null}
        {err ? <CardLabelError>{tt(err)}</CardLabelError> : null}
      </div>
    );
  };

  if (cats.isLoading && units.every((u) => !u.category)) return <SevaLoader message={tt("GRB_LOADING")} />;

  const goTo = (s) => history.push(`${basePathOf(history)}/${s.route}`);
  const nextStep = navSteps[index + 1];

  return (
    <div className="npt-wrap">
      <GRBCrumbs t={t} />
      <GRBPageHead title={tt(grbTitleKey(formData))} sub={tt("GRB_PAGE_SUB")}>
        <GRBInfoBar t={t} steps={navSteps} active={index} total={navSteps.length} autoOpen={false} />
      </GRBPageHead>
      <GRBStepper t={t} steps={navSteps} active={index} onGo={goTo} />
      <GRBPage>
        <section className="npt-card">
          <GRBTricolour />
          <div className="npt-card__body">
            <h2 className="npt-card__title">{tt(page.head)}</h2>
            <p className="npt-card__hint">{tt(page.hint)}</p>
            {cats.isError ? (
              <div className="npt-lookup-error" role="alert">
                <span>{tt("GRB_LOOKUP_FAILED", { what: tt("GRB_F_category") })}</span>
                <button type="button" className="npt-link" onClick={() => cats.refetch && cats.refetch()}>{tt("GRB_RETRY")}</button>
              </div>
            ) : null}

            <h3 className="npt-section__title">{tt(SPEC.head)}</h3>
            <div className="npt-grid npt-grid--3">
              {SPEC.fields.map((f) => renderField(f, spec, errors.spec, (v) => onSpec(f, v), null, "s-"))}
            </div>

            <h3 className="npt-section__title">{tt(UNITS.head)}</h3>
            {!spec.typeOfCollection ? <p className="grb-hint">{tt("GRB_PICK_TYPE_FIRST")}</p> : null}
            {units.map((u, i) => {
              const fl = unitFlags(u, cats.rows);
              const rowErrs = (errors.units || [])[i] || {};
              return (
                <div className="grb-unit" key={i}>
                  <div className="grb-unit__head">
                    <strong><GRBIcon name={i === 0 ? "user" : "users"} size={16} /> {tt(i === 0 ? "GRB_UNIT_FIRST" : "GRB_UNIT_N", { n: i + 1 })}</strong>
                    {i > 0 ? (
                      <button type="button" className="npt-link" onClick={() => removeUnit(i)}>{tt("GRB_BTN_REMOVE_UNIT")}</button>
                    ) : null}
                  </div>
                  <div className="npt-grid npt-grid--3">
                    {UNITS.fields
                      .filter((f) => !f.showIf || fl[f.showIf])
                      .map((f) => renderField(f, u, rowErrs, (v) => onUnit(i, f, v), u, `u${i}-`))}
                  </div>
                </div>
              );
            })}
            {!single && spec.typeOfCollection && units.length < MAX_UNITS ? (
              <GRBBtn kind="ghost" icon="plus" onClick={addUnit}>{tt("GRB_BTN_ADD_UNIT")}</GRBBtn>
            ) : null}
          </div>
        </section>
      </GRBPage>
      <GRBActions
        left={
          <React.Fragment>
            <GRBBtn kind="ghost" onClick={() => (goBack ? goBack() : history.goBack())}>{tt("GRB_BTN_BACK")}</GRBBtn>
            {onDraft ? <GRBBtn kind="link" onClick={saveDraft}>{tt("GRB_BTN_SAVE_DRAFT")}</GRBBtn> : null}
          </React.Fragment>
        }
        note={nextStep ? tt("GRB_NEXT_STEP", { step: tt(nextStep.head) }) : null}
        right={<GRBBtn kind="primary" icon="arrow" onClick={onNext}>{tt("GRB_BTN_NEXT")}</GRBBtn>}
      />
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default GRBDetails;
