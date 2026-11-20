import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Redirect, useParams } from "react-router-dom";
import { wrkText } from "../../config/hpworkMessages";
import { WRKIcon, WRKPageHead, WRKBack } from "../../pageComponents/WorkLayout";
import { BILL_SERVICES, billServicesFor, searchBills, settleCheque } from "../../utils/bills";
import { apiErrorMessage, defaultTenant, fmtDate, ulbName, workTenants } from "../../utils/work";
import SearchSelect from "../../pageComponents/SearchSelect";

const PAGE = 10;
const money = (n) => `₹ ${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* Cheque / DD settlement: bills whose payment is waiting for bank clearance (isProcessing) -> mark cleared or bounced. */
const ChequeSettlement = () => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const { service } = useParams();
  const allowed = billServicesFor();
  const cfg = BILL_SERVICES[service];
  const [tenantId, setTenantId] = useState(defaultTenant());
  const [by, setBy] = useState("ID");
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [state, setState] = useState({ rows: null, page: 0, busy: false, error: "" });
  const [pick, setPick] = useState(null);
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const last = useRef({ tenantId, by: "ID", value: "" });
  const tenants = workTenants();

  const run = async (page, q) => {
    const query = q || last.current;
    last.current = query;
    setState((s) => ({ ...s, busy: true, error: "" }));
    try {
      const rows = await searchBills({ ...query, service, status: "", processing: true, limit: PAGE, offset: page * PAGE });
      setState({ rows: rows.filter((b) => b.processing), page, busy: false, error: "" });
    } catch (e) {
      setState({ rows: null, page, busy: false, error: apiErrorMessage(e, tt("WRK_BILLS_SEARCH_FAILED")) });
    }
  };
  useEffect(() => { if (cfg) run(0, { tenantId, by: "ID", value: "" }); }, [service]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cfg || allowed.indexOf(service) < 0) return <Redirect to={allowed.length ? `/digit-ui/employee/hpwork/bills/cheque/${allowed[0]}` : "/digit-ui/employee/hpwork/inbox"} />;

  const submit = (e) => {
    e.preventDefault();
    if (by === "MOBILE" && value.trim() && !/^\d{10}$/.test(value.trim())) return setErr(tt("WRK_BILL_E_MOBILE"));
    setErr("");
    run(0, { tenantId, by, value });
  };

  const settle = async (action) => {
    setBusy(true);
    try {
      await settleCheque(pick, action);
      setNote({ ok: true, message: tt(action === "SUCCESS" ? "WRK_CHQ_OK" : "WRK_CHQ_BOUNCED") });
      setPick(null);
      await run(state.page);
    } catch (e) {
      setNote({ ok: false, message: apiErrorMessage(e, tt("WRK_CHQ_FAILED")) });
      setPick(null);
    } finally {
      setBusy(false);
    }
  };

  const rows = state.rows || [];
  const idLabel = tt(service === "grbg" ? "WRK_BILL_GBID" : "WRK_BILL_PTID");
  return (
    <div className="npt-wrap wrk-bills wrk-erp">
      <nav className="npt-crumbs" aria-label="Breadcrumb"><WRKBack />
        <a href="/digit-ui/employee">{tt("WRK_CRUMB_HOME")}</a><span>›</span><strong aria-current="page">{tt("WRK_CHQ_TITLE")}</strong>
      </nav>
      <WRKPageHead title={tt("WRK_CHQ_TITLE")} sub={tt("WRK_CHQ_SUB")} />

      <div className="erp-toolbar" role="toolbar" aria-label={tt("WRK_CHQ_TITLE")}>
        <span className="erp-toolbar__ctx">{tt(cfg.labelKey)} · {ulbName(tenantId)}</span>
        {allowed.filter((k) => k !== service).map((k) => (
          <Link key={k} className="erp-tb" to={`/digit-ui/employee/hpwork/bills/cheque/${k}`}><WRKIcon name={BILL_SERVICES[k].icon} size={16} /><span>{tt(BILL_SERVICES[k].labelKey)}</span></Link>
        ))}
        <Link className="erp-tb" to={`/digit-ui/employee/hpwork/bills/search/${service}`}><WRKIcon name="search" size={16} /><span>{tt("WRK_BILLS_TITLE")}</span></Link>
      </div>

      <form className="wrk-erp-search wrk-erp" onSubmit={submit} noValidate>
        <fieldset className="erp-fs">
          <legend>{tt(cfg.labelKey)}</legend>
          {tenants.length > 1 ? (
            <div className="wrk-billgrid wrk-billgrid--4">
              <div className="wrk-bf"><label><span>{tt("WRK_ULB")}</span>
                <SearchSelect value={tenantId} options={tenants.map((x) => ({ value: x, label: ulbName(x) }))} onChange={(x) => setTenantId(x || defaultTenant())} allLabel={ulbName(defaultTenant())} searchPlaceholder={tt("WRK_SS_SEARCH")} emptyLabel={tt("WRK_SS_NONE")} ariaLabel={tt("WRK_ULB")} /></label></div>
            </div>
          ) : null}
          <div className="wrk-billgrid wrk-billgrid--lookup" style={tenants.length > 1 ? undefined : { borderTop: 0 }}>
            <div className="wrk-bf"><label><span>{tt("WRK_BILL_SEARCH_BY")}</span></label>
              <div className="wrk-seg" role="radiogroup" aria-label={tt("WRK_BILL_SEARCH_BY")}>
                {[["ID", tt(service === "grbg" ? "WRK_BILL_BY_GBID" : "WRK_BILL_BY_PTID")], ["MOBILE", tt("WRK_BILL_BY_MOBILE")]].map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={by === k} className={by === k ? "is-on" : ""} onClick={() => { setBy(k); setValue(""); setErr(""); }}>{l}</button>)}
              </div>
            </div>
            <div className={`wrk-bf${err ? " has-error" : ""}`}><label><span>{by === "MOBILE" ? tt("WRK_BILL_MOBILE") : idLabel}</span>
              <input type={by === "MOBILE" ? "tel" : "text"} inputMode={by === "MOBILE" ? "numeric" : undefined} maxLength={by === "MOBILE" ? 10 : undefined} autoComplete="off" value={value} onChange={(e) => setValue(by === "MOBILE" ? e.target.value.replace(/\D/g, "") : e.target.value)} /></label>
              {err ? <small role="alert">{err}</small> : null}</div>
            <div className="wrk-bf wrk-bf--go"><button type="submit" className="npt-btn npt-btn--primary" disabled={state.busy}><span>{tt("WRK_SEARCH_BTN")}</span></button></div>
          </div>
        </fieldset>
      </form>

      {note ? <div className={`wrk-billresult ${note.ok ? "is-ok" : "is-bad"}`} role={note.ok ? "status" : "alert"}><WRKIcon name={note.ok ? "check" : "alert"} size={20} /><span>{note.message}</span></div> : null}
      {state.error ? <div className="npt-lookup-error" role="alert"><span>{state.error}</span><button type="button" className="npt-link" onClick={() => run(state.page)}>{tt("WRK_RETRY")}</button></div> : null}
      {state.rows && !rows.length ? <div className="npt-empty"><WRKIcon name="check" size={40} /><strong>{tt("WRK_CHQ_EMPTY")}</strong><p>{tt("WRK_CHQ_EMPTY_SUB")}</p></div> : null}

      {rows.length ? (
        <div className="erp-tablewrap" aria-live="polite">
          <table className="erp-table">
            <thead><tr>
              <th scope="col">{idLabel}</th><th scope="col">{tt("WRK_BILLS_COL_NAME")}</th><th scope="col">{tt("WRK_BILLS_COL_PERIOD")}</th>
              <th scope="col" className="is-num">{tt("WRK_BILLS_TOTAL")}</th><th scope="col" className="is-num">{tt("WRK_CHQ_AMOUNT")}</th><th scope="col">{tt("WRK_STATUS")}</th>
              <th scope="col"><span className="sr-only">{tt("WRK_BILLS_COL_ACTIONS")}</span></th>
            </tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td data-label={idLabel} className="erp-table__id">{b.consumerCode}{b.billDate ? <small>{fmtDate(b.billDate)}</small> : null}</td>
                  <td data-label={tt("WRK_BILLS_COL_NAME")}>{b.payer || "-"}{b.mobile ? <small>{b.mobile}</small> : null}</td>
                  <td data-label={tt("WRK_BILLS_COL_PERIOD")}>{b.period || "-"}</td>
                  <td data-label={tt("WRK_BILLS_TOTAL")} className="is-num">{money(b.total)}</td>
                  <td data-label={tt("WRK_CHQ_AMOUNT")} className="is-num">{money(b.raw.processingAmount)}</td>
                  <td data-label={tt("WRK_STATUS")}><span className="npt-badge npt-badge--wait">{tt("WRK_BILLS_CLEARANCE")}</span></td>
                  <td className="erp-table__acts"><div className="wrk-bill__acts"><button type="button" className="erp-act" onClick={() => setPick(b)}>{tt("WRK_CHQ_SETTLE")}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {state.rows && (state.page > 0 || rows.length === PAGE) ? (
        <div className="wrk-pager">
          <button type="button" className="npt-btn npt-btn--ghost" disabled={state.page === 0 || state.busy} onClick={() => run(state.page - 1)}><span>{tt("WRK_PREV")}</span></button>
          <span>{tt("WRK_BILLS_PAGE", { n: state.page + 1 })}</span>
          <button type="button" className="npt-btn npt-btn--ghost" disabled={rows.length < PAGE || state.busy} onClick={() => run(state.page + 1)}><span>{tt("WRK_NEXT")}</span></button>
        </div>
      ) : null}

      {pick ? (
        <div className="wrk-modal wrk-modal--top" role="dialog" aria-modal="true" aria-label={tt("WRK_CHQ_SETTLE")}>
          <div className="wrk-modal__box">
            <h2>{tt("WRK_CHQ_SETTLE")}</h2>
            <p>{tt("WRK_CHQ_ASK", { code: pick.consumerCode, amount: money(pick.raw.processingAmount) })}</p>
            <div className="wrk-billactions">
              <button type="button" className="npt-btn wrk-btn--danger" onClick={() => settle("FAILURE")} disabled={busy}><span>{tt("WRK_CHQ_FAIL")}</span></button>
              <button type="button" className="npt-btn npt-btn--primary" onClick={() => settle("SUCCESS")} disabled={busy}><span>{tt("WRK_CHQ_PASS")}</span></button>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => setPick(null)} disabled={busy}><span>{tt("WRK_CLOSE")}</span></button>
            </div>
          </div>
        </div>
      ) : null}
      {state.busy || busy ? <SevaLoader fullScreen message={tt("WRK_LOADING")} /> : null}
    </div>
  );
};

export default ChequeSettlement;
