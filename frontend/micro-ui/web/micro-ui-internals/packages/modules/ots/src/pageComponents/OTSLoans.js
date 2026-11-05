import { Toast } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { OTS_LOAN_FIELDS } from "../config/otsConfig";
import { otsText } from "../config/otsMessages";
import { OtsApi, apiErrorMessage, bankOf, fmtDate, inr, loanTotal, todayYmd, validateLoans, validateRow } from "../utils/ots";
import { OTSField } from "./OTSFields";
import { OTSBtn } from "./OTSLayout";
import { OTSLoading } from "./OTSParts";
import OTSShell from "./OTSShell";

const blank = () => OTS_LOAN_FIELDS.reduce((o, f) => ({ ...o, [f.name]: "" }), {});

// Loans step: a list of NPA loans (added one by one) and the total repayment so far.
const OTSLoans = ({ t, onSelect, formData = {} }) => {
  const tt = (k, p) => otsText(t, k, p);
  const saved = formData.loans || {};
  const [list, setList] = useState(saved.list || []);
  const [totalRepayment, setTotalRepayment] = useState(saved.totalRepayment || "");
  const [row, setRow] = useState(blank());
  const [rowErrors, setRowErrors] = useState({});
  const [errors, setErrors] = useState({});
  const [lookup, setLookup] = useState({ busy: false, msg: null, error: false });
  const [toast, setToast] = useState(null);

  const setRowField = (f, v) => {
    setRow((r) => ({ ...r, [f.name]: v }));
    setRowErrors((e) => ({ ...e, [f.name]: undefined }));
    if (f.name === "ifsc") setLookup({ busy: false, msg: null, error: false });
  };

  // bank + branch come from the OTS bank master when the IFSC is known; they stay editable otherwise
  const lookupBank = async () => {
    const ifsc = (row.ifsc || "").trim();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return;
    setLookup({ busy: true, msg: null, error: false });
    try {
      const bank = bankOf(await OtsApi.bankByIfsc(ifsc));
      if (bank) {
        setRow((r) => ({ ...r, bankName: bank.bankName, branchName: bank.branchName }));
        setRowErrors((e) => ({ ...e, bankName: undefined, branchName: undefined }));
        setLookup({ busy: false, msg: tt("OTS_BANK_FOUND"), error: false });
      } else {
        setLookup({ busy: false, msg: tt("OTS_BANK_NOT_FOUND"), error: true });
      }
    } catch (e) {
      setLookup({ busy: false, msg: apiErrorMessage(e, tt("OTS_BANK_NOT_FOUND")), error: true });
    }
  };

  const addLoan = () => {
    const found = validateRow(OTS_LOAN_FIELDS, row);
    setRowErrors(found);
    if (Object.keys(found).length) {
      setToast({ error: true, label: tt("OTS_E_ROW_FIX") });
      return;
    }
    setList((l) => [...l, row]);
    setRow(blank());
    setErrors((e) => ({ ...e, list: undefined }));
    setLookup({ busy: false, msg: null, error: false });
  };

  const onNext = () => {
    const found = validateLoans(list, totalRepayment);
    setErrors(found);
    if (Object.keys(found).length) {
      setToast({ error: true, label: found.list ? tt(found.list) : tt("OTS_FIX_ERRORS") });
      return;
    }
    onSelect("loans", { list, totalRepayment });
  };

  const grand = list.reduce((n, l) => n + loanTotal(l), 0);
  const total = loanTotal(row);

  return (
    <OTSShell t={t} pageKey="loans" onNext={onNext}>
      <h3 className="npt-section__title">{tt("OTS_LOAN_ADD_TITLE")}</h3>
      <div className="npt-grid npt-grid--3">
        {OTS_LOAN_FIELDS.map((f) => (
          <OTSField
            key={f.name}
            t={t}
            field={f}
            value={row[f.name]}
            error={rowErrors[f.name]}
            max={f.maxToday ? todayYmd() : undefined}
            min={f.minFrom ? row[f.minFrom] || undefined : undefined}
            onChange={(v) => setRowField(f, v)}
            onBlur={f.name === "ifsc" ? lookupBank : undefined}
          />
        ))}
        <div className="npt-field">
          <span className="npt-field__static">{tt("OTS_F_total")}</span>
          <strong>{inr(total)}</strong>
        </div>
      </div>
      {lookup.busy ? <OTSLoading t={t} message={tt("OTS_BANK_LOOKUP")} /> : null}
      {lookup.msg ? <p className={lookup.error ? "ots-note ots-note--warn" : "ots-note"} role="status">{lookup.msg}</p> : null}
      <div className="ots-add"><OTSBtn kind="primary" icon="plus" onClick={addLoan}>{tt("OTS_LOAN_ADD")}</OTSBtn></div>

      <h3 className="npt-section__title">{tt("OTS_LOAN_LIST_TITLE")}</h3>
      {list.length === 0 ? (
        <p className={errors.list ? "ots-note ots-note--warn" : "ots-note"} role={errors.list ? "alert" : undefined}>{errors.list ? tt(errors.list) : tt("OTS_LOAN_EMPTY")}</p>
      ) : (
        <ul className="ots-rows">
          {list.map((l, i) => (
            <li key={i}>
              <div>
                <strong>{tt("OTS_LOAN_N", { n: i + 1 })} · {l.bankName}</strong>
                <span>{[l.branchName, l.ifsc].filter(Boolean).join(" · ")}</span>
                <small>{`${tt("OTS_F_amountAvailed")}: ${inr(l.amountAvailed)} · ${tt("OTS_F_total")}: ${inr(loanTotal(l))} · ${tt("OTS_F_loanTakenDate")}: ${fmtDate(l.loanTakenDate)} · ${tt("OTS_F_npaDeclaredDate")}: ${fmtDate(l.npaDeclaredDate)}`}</small>
              </div>
              <button type="button" className="npt-link" onClick={() => setList((x) => x.filter((_, j) => j !== i))}>{tt("OTS_LOAN_REMOVE")}</button>
            </li>
          ))}
          <li className="is-total"><strong>{tt("OTS_LOAN_TOTAL")}</strong><strong>{inr(grand)}</strong></li>
        </ul>
      )}

      <div className="npt-grid npt-grid--3">
        <OTSField
          t={t}
          field={{ name: "totalRepayment", type: "text", required: true, maxLength: 12, money: true }}
          value={totalRepayment}
          error={errors.totalRepayment}
          onChange={(v) => { setTotalRepayment(v); setErrors((e) => ({ ...e, totalRepayment: undefined })); }}
        />
      </div>
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}
    </OTSShell>
  );
};

export default OTSLoans;
