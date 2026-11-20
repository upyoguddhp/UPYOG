import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { wrkText } from "../config/hpworkMessages";
import { BANK_MODES, ONLINE_MODES, PAY_MODES, canPayPartly, collectPayment, fetchBanks, loadRazorpay, openRazorpay, pollPaytmPos, razorpayKey } from "../utils/bills";
import { apiErrorMessage } from "../utils/work";

const money = (n) => `₹ ${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split("T")[0];
const noSign = (e) => { if (["-", "+", "e", "E"].indexOf(e.key) >= 0) e.preventDefault(); };

/* Collect the payment of one bill at the counter (offline modes), as the old "Bill collection" screen:
   full / partial / advance payment, mode, receipt details and bank for cheque, DD, NEFT and RTGS. */
const PayModal = ({ bill, service, onClose, onDone }) => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const due = bill.due;
  const partly = canPayPartly(service, bill);
  const types = [["FULL", "WRK_PAY_FULL"]].concat(partly ? [["PARTIAL", "WRK_PAY_PARTIAL"]] : [], [["ADVANCE", "WRK_PAY_ADVANCE"]]);
  const [kind, setKind] = useState("FULL");
  const [amount, setAmount] = useState(String(due));
  const [gateway, setGateway] = useState("OFFLINE");
  const [mode, setMode] = useState("CASH");
  const [waiting, setWaiting] = useState(false); // Paytm POS: waiting for the terminal
  const [receipt, setReceipt] = useState("");
  const [bank, setBank] = useState("");
  const [date, setDate] = useState(today());
  const [banks, setBanks] = useState([]);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState("");
  const [bankDown, setBankDown] = useState(false); // bank list unavailable: type the bank name instead
  const online = gateway === "ONLINE";
  const modes = online ? ONLINE_MODES : PAY_MODES;
  const needsBank = !online && BANK_MODES.indexOf(mode) >= 0;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);
  useEffect(() => { if (needsBank && !banks.length) fetchBanks().then((b) => { setBanks(b); setBankDown(!b.length); }).catch(() => setBankDown(true)); }, [needsBank]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (k) => { setKind(k); setErrs({}); setAmount(k === "FULL" ? String(due) : ""); };

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    const n = Number(amount);
    if (kind === "FULL") { /* amount fixed */ }
    else if (!n || n <= 0) x.amount = tt("WRK_PAY_E_AMOUNT");
    else if (kind === "PARTIAL" && n > due) x.amount = tt("WRK_PAY_E_MAX", { due: money(due) });
    else if (kind === "ADVANCE" && (service === "grbg" ? n <= due : n < due)) x.amount = tt("WRK_PAY_E_ADV", { due: money(due) });
    if (!online && mode !== "CASH" && !receipt.trim()) x.receipt = tt("WRK_PAY_E_RECEIPT");
    if (!online && mode !== "CASH" && !date) x.date = tt("WRK_PAY_E_DATE");
    if (needsBank && !bank) x.bank = tt("WRK_PAY_E_BANK");
    setErrs(x);
    if (Object.keys(x).length) return;
    setBusy(true);
    setFail("");
    try {
      const paid = kind === "FULL" ? due : n;
      if (mode === "RAZORPAY") {
        if (!razorpayKey()) throw new Error(tt("WRK_PAY_NO_KEY"));
        if (!(await loadRazorpay())) throw new Error(tt("WRK_PAY_GATEWAY_DOWN"));
      }
      const res = await collectPayment(bill, { amount: paid, mode, receipt: receipt.trim(), bank, date, online });
      if (!res || !(res.Transactions || []).length) throw new Error("");
      if (mode === "RAZORPAY") {
        openRazorpay(res, {
          onPaid: () => onDone(tt("WRK_PAY_DONE")),
          onFailed: () => { setFail(tt("WRK_PAY_FAILED")); setBusy(false); },
          onDismiss: () => { setFail(tt("WRK_PAY_CANCELLED")); setBusy(false); },
        });
        return;
      }
      if (mode === "PAYTMPOS") {
        setWaiting(true);
        const st = await pollPaytmPos(res.Transactions[0].txnId, bill.tenantId);
        setWaiting(false);
        if (st === "SUCCESS") return onDone(tt("WRK_PAY_DONE"));
        setFail(tt(st === "FAILURE" ? "WRK_PAY_FAILED" : "WRK_PAY_POS_PENDING"));
        setBusy(false);
        return;
      }
      onDone(mode === "CHEQUE" ? tt("WRK_PAY_DONE_CHEQUE") : tt("WRK_PAY_DONE"));
    } catch (err) {
      setWaiting(false);
      setFail(apiErrorMessage(err, tt("WRK_PAY_FAILED")));
      setBusy(false);
    }
  };

  return (
    <div className="wrk-modal wrk-modal--pv" role="dialog" aria-modal="true" aria-labelledby="wrk-pay-title" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <form className="wrk-pv wrk-pay" onSubmit={submit} noValidate>
        <header className="wrk-pv__head">
          <div><h2 id="wrk-pay-title">{tt("WRK_PAY_TITLE")}</h2><p>{bill.consumerCode}{bill.period ? ` · ${bill.period}` : ""}</p></div>
          <button type="button" className="wrk-pv__x" onClick={onClose} disabled={busy} aria-label={tt("WRK_CLOSE")}>×</button>
        </header>
        <div className="wrk-pv__body">
          <dl className="wrk-pay__sum">
            <div><dt>{tt("WRK_BILLS_TOTAL")}</dt><dd>{money(bill.total)}</dd></div>
            <div><dt>{tt("WRK_BILLS_PAID")}</dt><dd>{money(bill.paid)}</dd></div>
            <div className="is-due"><dt>{tt("WRK_BILLS_DUE")}</dt><dd>{money(due)}</dd></div>
          </dl>
          <div className="wrk-billgrid">
            <div className="wrk-bf wrk-bf--wide"><label><span>{tt("WRK_PAY_TYPE")}</span></label>
              <div className="wrk-seg" role="radiogroup" aria-label={tt("WRK_PAY_TYPE")}>
                {types.map(([k, key]) => <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? "is-on" : ""} onClick={() => pick(k)}>{tt(key)}</button>)}
              </div>
            </div>
            <div className={`wrk-bf${errs.amount ? " has-error" : ""}`}><label><span>{tt("WRK_PAY_AMOUNT")}</span>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={amount} readOnly={kind === "FULL"} onKeyDown={noSign} onChange={(e) => setAmount(e.target.value)} /></label>
              {errs.amount ? <small role="alert">{errs.amount}</small> : null}</div>
            <div className="wrk-bf"><label><span>{tt("WRK_PAY_WITH")}</span></label>
              <div className="wrk-seg" role="radiogroup" aria-label={tt("WRK_PAY_WITH")}>
                {[["OFFLINE", "WRK_PAY_OFFLINE"], ["ONLINE", "WRK_PAY_ONLINE"]].map(([k, key]) => <button key={k} type="button" role="radio" aria-checked={gateway === k} className={gateway === k ? "is-on" : ""} onClick={() => { setGateway(k); setMode(k === "ONLINE" ? "RAZORPAY" : "CASH"); setErrs({}); setFail(""); }}>{tt(key)}</button>)}
              </div>
            </div>
            <div className="wrk-bf"><label><span>{tt("WRK_PAY_MODE")}</span>
              <select value={mode} onChange={(e) => { setMode(e.target.value); setErrs({}); }}>
                {modes.map(([k, key]) => <option key={k} value={k}>{tt(key)}</option>)}
              </select></label></div>
            {!online && mode !== "CASH" ? (
              <React.Fragment>
                <div className={`wrk-bf${errs.receipt ? " has-error" : ""}`}><label><span>{tt("WRK_PAY_RECEIPT")}</span>
                  <input type="text" maxLength={50} autoComplete="off" value={receipt} onChange={(e) => setReceipt(e.target.value)} /></label>{errs.receipt ? <small role="alert">{errs.receipt}</small> : null}</div>
                <div className={`wrk-bf${errs.date ? " has-error" : ""}`}><label><span>{tt("WRK_PAY_DATE")}</span>
                  <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} /></label>{errs.date ? <small role="alert">{errs.date}</small> : null}</div>
              </React.Fragment>
            ) : null}
            {needsBank ? (
              <div className={`wrk-bf${errs.bank ? " has-error" : ""}`}><label><span>{tt("WRK_PAY_BANK")}</span>
{bankDown ? <input type="text" maxLength={80} autoComplete="off" value={bank} onChange={(e) => setBank(e.target.value)} /> : (
                  <select value={bank} onChange={(e) => setBank(e.target.value)}>
                    <option value="">{banks.length ? tt("WRK_BILL_PICK") : tt("WRK_LOADING")}</option>
                    {banks.map((b) => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
                  </select>)}</label>{errs.bank ? <small role="alert">{errs.bank}</small> : null}</div>
            ) : null}
          </div>
          {mode === "CHEQUE" ? <p className="erp-note" role="note">{tt("WRK_PAY_CHEQUE_NOTE")}</p> : null}
          {waiting ? <p className="erp-note" role="status">{tt("WRK_PAY_POS_WAIT")}</p> : null}
          {fail ? <p className="wrk-prev__bad" role="alert">{fail}</p> : null}
        </div>
        <footer className="wrk-pv__foot">
          <button type="button" className="npt-btn npt-btn--ghost" onClick={onClose} disabled={busy}><span>{tt("WRK_CANCEL")}</span></button>
          <button type="submit" className="npt-btn npt-btn--primary" disabled={busy}><span>{busy ? tt("WRK_LOADING") : tt("WRK_PAY_NOW", { amount: money(kind === "FULL" ? due : Number(amount) || 0) })}</span></button>
        </footer>
      </form>
    </div>
  );
};

export default PayModal;
