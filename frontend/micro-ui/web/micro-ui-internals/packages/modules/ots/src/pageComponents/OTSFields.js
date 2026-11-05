import { CardLabel, CardLabelError, Dropdown, TextInput } from "@upyog/digit-ui-react-components";
import React from "react";
import { otsText } from "../config/otsMessages";
import { OTSHelp } from "./OTSLayout";

// Cleans what is typed into a field according to the field definition.
export const cleanInput = (field, value) => {
  if (field.digitsOnly) return value.replace(/\D/g, "");
  if (field.money) return value.replace(/[^\d.]/g, "").replace(/^(\d*\.\d{0,2}).*$/, "$1").replace(/(\..*)\./g, "$1");
  return field.upper ? value.toUpperCase() : value;
};

// One labelled control (text / date / select) driven by a field definition from otsConfig.
export const OTSField = ({ t, field, value, error, onChange, options = [], loading = false, min, max, disabled = false, onBlur }) => {
  const tt = (k, p) => otsText(t, k, p);
  let control;
  if (field.type === "date") {
    control = <TextInput name={field.name} type="date" value={value || ""} min={min} max={max} onChange={(e) => onChange(e.target.value)} />;
  } else if (field.type === "select") {
    control = (
      <Dropdown
        option={options}
        optionKey="label"
        selected={options.find((o) => o.code === value)}
        disable={loading || disabled}
        select={(o) => onChange(o.code)}
        t={(k) => tt(k)}
        placeholder={!loading && options.length === 0 ? tt("OTS_NO_OPTIONS") : tt("OTS_SELECT")}
      />
    );
  } else {
    control = (
      <TextInput
        name={field.name}
        value={value || ""}
        maxlength={field.maxLength}
        disable={disabled}
        onBlur={onBlur}
        onChange={(e) => onChange(cleanInput(field, e.target.value))}
      />
    );
  }
  return (
    <div className={`npt-field${error ? " has-error" : ""}`}>
      <CardLabel>
        {tt(`OTS_F_${field.name}`)}
        {field.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
        {field.help ? <OTSHelp id={`ots-h-${field.name}`} text={tt(`OTS_H_${field.name}`)} /> : null}
      </CardLabel>
      {control}
      {error ? <CardLabelError>{tt(error)}</CardLabelError> : null}
    </div>
  );
};

export const yesNoOptions = (t) => [
  { code: "YES", label: otsText(t, "OTS_O_YES") },
  { code: "NO", label: otsText(t, "OTS_O_NO") },
];
