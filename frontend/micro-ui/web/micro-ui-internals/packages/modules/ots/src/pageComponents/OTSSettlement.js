import { CardLabel, CardLabelError, Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { OTS_DEFAULT_SCHEME, OTS_SETTLEMENT_FIELDS } from "../config/otsConfig";
import { otsText } from "../config/otsMessages";
import { inr, settlementYears, validateRow, validateSettlement } from "../utils/ots";
import { OTSField, yesNoOptions } from "./OTSFields";
import { OTSBtn } from "./OTSLayout";
import OTSShell from "./OTSShell";

const blank = () => ({ yearOfSettlement: "", amountSettled: "", paidInFull: "", schemeName: OTS_DEFAULT_SCHEME });

// Settlement step: earlier settlements (only when answered Yes) plus the two free-text answers.
const OTSSettlement = ({ t, onSelect, formData = {} }) => {
  const tt = (k, p) => otsText(t, k, p);
  const saved = formData.settlement || {};
  const [facility, setFacility] = useState(saved.hasLoanSettlementFacility || "");
  const [list, setList] = useState(saved.list || []);
  const [briefHistory, setBriefHistory] = useState(saved.briefHistory || "");
  const [nonPaymentReason, setNonPaymentReason] = useState(saved.nonPaymentReason || "");
  const [row, setRow] = useState(blank());
  const [rowErrors, setRowErrors] = useState({});
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const yesNo = yesNoOptions(t);
  const years = settlementYears().map((y) => ({ code: y, label: y }));

  const clear = (k) => setErrors((e) => ({ ...e, [k]: undefined }));
  const add = () => {
    const found = validateRow(OTS_SETTLEMENT_FIELDS, row);
    setRowErrors(found);
    if (Object.keys(found).length) {
      setToast({ error: true, label: tt("OTS_E_ROW_FIX") });
      return;
    }
    setList((l) => [...l, row]);
    setRow(blank());
    clear("list");
  };

  const onNext = () => {
    const data = { hasLoanSettlementFacility: facility, list: facility === "YES" ? list : [], briefHistory, nonPaymentReason };
    const found = validateSettlement(data);
    setErrors(found);
    if (Object.keys(found).length) {
      setToast({ error: true, label: found.list ? tt(found.list) : tt("OTS_FIX_ERRORS") });
      return;
    }
    onSelect("settlement", data);
  };

  const area = (name, value, set) => (
    <div className={`npt-field${errors[name] ? " has-error" : ""}`}>
      <CardLabel>{tt(`OTS_F_${name}`)}<span className="npt-req" aria-hidden="true"> *</span></CardLabel>
      <textarea className="ots-textarea" rows={4} maxLength={1000} value={value} onChange={(e) => { set(e.target.value); clear(name); }} />
      {errors[name] ? <CardLabelError>{tt(errors[name])}</CardLabelError> : null}
    </div>
  );

  return (
    <OTSShell t={t} pageKey="settlement" onNext={onNext}>
      <div className="npt-grid">
        <OTSField
          t={t}
          field={{ name: "hasLoanSettlementFacility", type: "select", required: true }}
          value={facility}
          error={errors.hasLoanSettlementFacility}
          options={yesNo}
          onChange={(v) => { setFacility(v); clear("hasLoanSettlementFacility"); clear("list"); }}
        />
      </div>

      {facility === "YES" ? (
        <React.Fragment>
          <h3 className="npt-section__title">{tt("OTS_SET_ADD_TITLE")}</h3>
          <div className="npt-grid npt-grid--3">
            {OTS_SETTLEMENT_FIELDS.map((f) => (
              <OTSField
                key={f.name}
                t={t}
                field={f}
                value={row[f.name]}
                error={rowErrors[f.name]}
                options={f.optionsFrom === "years" ? years : f.type === "select" ? yesNo : []}
                onChange={(v) => { setRow((r) => ({ ...r, [f.name]: v })); setRowErrors((e) => ({ ...e, [f.name]: undefined })); }}
              />
            ))}
          </div>
          <div className="ots-add"><OTSBtn kind="primary" icon="plus" onClick={add}>{tt("OTS_SET_ADD")}</OTSBtn></div>
          <h3 className="npt-section__title">{tt("OTS_SET_LIST_TITLE")}</h3>
          {list.length === 0 ? (
            <p className={errors.list ? "ots-note ots-note--warn" : "ots-note"} role={errors.list ? "alert" : undefined}>{errors.list ? tt(errors.list) : tt("OTS_SET_EMPTY")}</p>
          ) : (
            <ul className="ots-rows">
              {list.map((s, i) => (
                <li key={i}>
                  <div>
                    <strong>{tt("OTS_SET_N", { n: i + 1 })} · {s.yearOfSettlement}</strong>
                    <span>{s.schemeName}</span>
                    <small>{`${tt("OTS_F_amountSettled")}: ${inr(s.amountSettled)} · ${tt("OTS_F_paidInFull")}: ${tt(s.paidInFull === "YES" ? "OTS_O_YES" : "OTS_O_NO")}`}</small>
                  </div>
                  <button type="button" className="npt-link" onClick={() => setList((x) => x.filter((_, j) => j !== i))}>{tt("OTS_LOAN_REMOVE")}</button>
                </li>
              ))}
            </ul>
          )}
        </React.Fragment>
      ) : null}

      <h3 className="npt-section__title">{tt("OTS_SET_TEXT_TITLE")}</h3>
      <div className="npt-grid">
        {area("briefHistory", briefHistory, setBriefHistory)}
        {area("nonPaymentReason", nonPaymentReason, setNonPaymentReason)}
      </div>
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </OTSShell>
  );
};

export default OTSSettlement;
