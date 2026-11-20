import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Redirect, useLocation, useParams } from "react-router-dom";
import { wrkText } from "../../config/hpworkMessages";
import PayModal from "../../pageComponents/PayModal";
import PdfViewer from "../../pageComponents/PdfViewer";
import SearchSelect from "../../pageComponents/SearchSelect";
import { WRKIcon, WRKPageHead, WRKBack } from "../../pageComponents/WorkLayout";
import { BILL_SERVICES, CANCELLABLE, PAYABLE, billHistory, billServicesFor, cancelBill, downloadBillPdf, resendBillSms, searchBills } from "../../utils/bills";
import { apiErrorMessage, defaultTenant, fmtDate, ulbName, workTenants } from "../../utils/work";

const PAGE = 10;
const STATUSES = ["ACTIVE", "PAID", "PARTIALLY_PAID", "EXPIRED", "CANCELLED"];
const money = (n) => `₹ ${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const tone = (s) => (s === "PAID" || s === "ADVANCE_PAID" ? "done" : s === "CANCELLED" || s === "EXPIRED" ? "stop" : "wait");

const SearchBills = () => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const { service } = useParams();
  const allowed = billServicesFor();
  const cfg = BILL_SERVICES[service];

  const [tenantId, setTenantId] = useState(defaultTenant());
  const [by, setBy] = useState("ID");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");
  const [state, setState] = useState({ rows: null, page: 0, busy: false, error: "" });
  const [note, setNote] = useState(null);
  const [history, setHistory] = useState(null); // all bills of one account
  const [cancelling, setCancelling] = useState(null); // bill being cancelled
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const [paying, setPaying] = useState(null); // bill being paid at the counter
  const [pdf, setPdf] = useState(null); // { blob, name } bill being viewed
  const last = useRef(null);

  // arriving from "Generate bills" with the account just billed: fill the form and show its bills
  const urlq = new URLSearchParams(useLocation().search);
  useEffect(() => {
    const by0 = urlq.get("by"), value0 = urlq.get("value"), tenant0 = urlq.get("tenant");
    if (tenant0) setTenantId(tenant0);
    if (!by0 || !value0 || !BILL_SERVICES[service]) return;
    setBy(by0); setValue(value0);
    if (urlq.get("auto") !== "1") return;
    const q = { tenantId: tenant0 || defaultTenant(), by: by0, value: value0, status: "" };
    last.current = q;
    setState((x) => ({ ...x, busy: true, error: "" }));
    searchBills({ ...q, service, limit: PAGE, offset: 0 })
      .then((rows) => setState({ rows, page: 0, busy: false, error: "" }))
      .catch((e) => setState({ rows: null, page: 0, busy: false, error: apiErrorMessage(e, tt("WRK_BILLS_SEARCH_FAILED")) }));
  }, [service]); // eslint-disable-line react-hooks/exhaustive-deps

  const tenants = workTenants();
  if (!cfg || allowed.indexOf(service) < 0) return <Redirect to={allowed.length ? `/digit-ui/employee/hpwork/bills/search/${allowed[0]}` : "/digit-ui/employee/hpwork/inbox"} />;

  const run = async (page, q) => {
    const query = q || last.current;
    last.current = query;
    setState((s) => ({ ...s, busy: true, error: "" }));
    try {
      const rows = await searchBills({ ...query, service, limit: PAGE, offset: page * PAGE });
      setState({ rows, page, busy: false, error: "" });
    } catch (e) {
      setState({ rows: null, page, busy: false, error: apiErrorMessage(e, tt("WRK_BILLS_SEARCH_FAILED")) });
    }
  };

  const submit = (e) => {
    e.preventDefault();
    setNote(null);
    if (!value.trim()) return setErr(tt(by === "MOBILE" ? "WRK_BILL_E_MOBILE" : service === "grbg" ? "WRK_BILL_E_GBID" : "WRK_BILL_E_PTID"));
    if (by === "MOBILE" && !/^\d{10}$/.test(value.trim())) return setErr(tt("WRK_BILL_E_MOBILE"));
    setErr("");
    run(0, { tenantId, by, value, status });
  };

  const download = async (b) => {
    setWorking(true);
    try {
      const blob = await downloadBillPdf(service, b);
      setPdf({ blob, name: `${String(b.consumerCode || "Bill").replace(/[\\/]+/g, "-")}.pdf` });
    } catch (e) {
      setNote({ ok: false, message: tt("WRK_BILLS_DOWNLOAD_FAILED") });
    } finally {
      setWorking(false);
    }
  };

  const resendSms = async (b) => {
    setWorking(true);
    try {
      const r = await resendBillSms(b);
      setNote(r.limit ? { ok: false, message: tt("WRK_SMS_LIMIT") } : { ok: true, message: r.message || tt("WRK_SMS_SENT") });
    } catch (e) {
      setNote({ ok: false, message: apiErrorMessage(e, tt("WRK_SMS_FAILED")) });
    } finally {
      setWorking(false);
    }
  };

  const confirmCancel = async () => {
    const b = cancelling;
    setWorking(true);
    try {
      await cancelBill(service, b, reason.trim());
      setNote({ ok: true, message: tt("WRK_BILLS_CANCELLED") });
      setCancelling(null);
      setReason("");
      setHistory(null);
      await run(state.page);
    } catch (e) {
      setNote({ ok: false, message: apiErrorMessage(e, tt("WRK_BILLS_CANCEL_FAILED")) });
      setCancelling(null);
    } finally {
      setWorking(false);
    }
  };

  const openHistory = async (b) => {
    setWorking(true);
    try {
      const rows = await billHistory(service, b.tenantId || tenantId, b.consumerCode);
      setHistory({ code: b.consumerCode, rows: rows.length ? rows : [b] });
    } catch (e) {
      setNote({ ok: false, message: apiErrorMessage(e, tt("WRK_BILLS_HISTORY_FAILED")) });
    } finally {
      setWorking(false);
    }
  };
  const rows = state.rows || [];
  const idLabel = tt(service === "grbg" ? "WRK_BILL_GBID" : "WRK_BILL_PTID");

  // one icon per action (label in the tooltip and for screen readers) so the column stays on one line
  const Ico = ({ icon, label, onClick, cls = "" }) => (
    <button type="button" className={`erp-act erp-act--ico ${cls}`} onClick={onClick} title={label} aria-label={label}>
      <WRKIcon name={icon} size={18} /><span className="sr-only">{label}</span>
    </button>
  );
  const Actions = ({ b }) => (
    <div className="wrk-bill__acts">
      {PAYABLE.indexOf(b.status) >= 0 && b.due > 0 && !b.processing ? <Ico icon="rupee" cls="erp-act--pay" label={tt("WRK_PAY_BTN")} onClick={() => setPaying(b)} /> : null}
      <Ico icon="eye" label={tt("WRK_BILLS_VIEW")} onClick={() => download(b)} />
      <Ico icon="history" label={tt("WRK_BILLS_HISTORY")} onClick={() => openHistory(b)} />
      {b.status === "ACTIVE" ? <Ico icon="sms" label={tt("WRK_SMS_BTN")} onClick={() => resendSms(b)} /> : null}
      {CANCELLABLE.indexOf(b.status) >= 0 ? <Ico icon="ban" cls="erp-act--danger" label={tt("WRK_BILLS_CANCEL")} onClick={() => { setCancelling(b); setReason(""); }} /> : null}
    </div>
  );


  return (
    <div className="npt-wrap wrk-bills wrk-erp">
      <nav className="npt-crumbs" aria-label="Breadcrumb"><WRKBack />
        <a href="/digit-ui/employee">{tt("WRK_CRUMB_HOME")}</a><span>›</span><strong aria-current="page">{tt("WRK_BILLS_TITLE")}</strong>
      </nav>
      <WRKPageHead title={tt("WRK_BILLS_TITLE")} sub={tt("WRK_BILLS_SUB")} />

      <div className="erp-toolbar" role="toolbar" aria-label={tt("WRK_BILLS_TITLE")}>
        <span className="erp-toolbar__ctx">{tt(cfg.labelKey)} · {ulbName(tenantId)}</span>
        {allowed.length > 1 ? allowed.filter((k) => k !== service).map((k) => (
          <Link key={k} className="erp-tb" to={`/digit-ui/employee/hpwork/bills/search/${k}`}><WRKIcon name={BILL_SERVICES[k].icon} size={16} /><span>{tt(BILL_SERVICES[k].labelKey)}</span></Link>
        )) : null}
        <Link className="erp-tb" to={`/digit-ui/employee/hpwork/bills/cheque/${service}`}><WRKIcon name="clock" size={16} /><span>{tt("WRK_CHQ_TITLE")}</span></Link>
        <Link className="erp-tb" to={`/digit-ui/employee/hpwork/bills/generate/${service}`}><WRKIcon name="file" size={16} /><span>{tt("WRK_BILL_TITLE")}</span></Link>
      </div>

      <form className="wrk-erp-search" onSubmit={submit} noValidate>
        <fieldset className="erp-fs">
          <legend>{tt("WRK_BILLS_FIND")}</legend>
          <div className="wrk-billgrid wrk-billgrid--find">
            {tenants.length > 1 ? (
              <div className="wrk-bf"><label><span>{tt("WRK_ULB")}</span>
                <SearchSelect value={tenantId} options={tenants.map((x) => ({ value: x, label: ulbName(x) }))} onChange={(x) => setTenantId(x || defaultTenant())} allLabel={ulbName(defaultTenant())} searchPlaceholder={tt("WRK_SS_SEARCH")} emptyLabel={tt("WRK_SS_NONE")} ariaLabel={tt("WRK_ULB")} /></label></div>
            ) : null}
            <div className="wrk-bf"><label><span>{tt("WRK_BILL_SEARCH_BY")}</span></label>
              <div className="wrk-seg" role="radiogroup" aria-label={tt("WRK_BILL_SEARCH_BY")}>
                {[["ID", tt(service === "grbg" ? "WRK_BILL_BY_GBID" : "WRK_BILL_BY_PTID")], ["MOBILE", tt("WRK_BILL_BY_MOBILE")]].map(([k, l]) => (
                  <button key={k} type="button" role="radio" aria-checked={by === k} className={by === k ? "is-on" : ""} onClick={() => { setBy(k); setValue(""); setErr(""); }}>{l}</button>
                ))}
              </div>
            </div>
            <div className={`wrk-bf${err ? " has-error" : ""}`}><label><span>{by === "MOBILE" ? tt("WRK_BILL_MOBILE") : idLabel}</span>
              <input type={by === "MOBILE" ? "tel" : "text"} inputMode={by === "MOBILE" ? "numeric" : undefined} maxLength={by === "MOBILE" ? 10 : undefined} autoComplete="off" value={value} onChange={(e) => setValue(by === "MOBILE" ? e.target.value.replace(/\D/g, "") : e.target.value)} /></label>
              {err ? <small role="alert">{err}</small> : null}
            </div>
            <div className="wrk-bf"><label><span>{tt("WRK_STATUS")}</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">{tt("WRK_BILLS_ANY_STATUS")}</option>
                {STATUSES.map((s) => <option key={s} value={s}>{tt(`WRK_BILLS_S_${s}`)}</option>)}
              </select></label></div>
            <div className="wrk-bf wrk-bf--go"><button type="submit" className="npt-btn npt-btn--primary" disabled={state.busy}><span>{tt("WRK_SEARCH_BTN")}</span></button></div>
          </div>
        </fieldset>
      </form>

      {note ? <div className={`wrk-billresult ${note.ok ? "is-ok" : "is-bad"}`} role={note.ok ? "status" : "alert"}><WRKIcon name={note.ok ? "check" : "alert"} size={20} /><span>{note.message}</span></div> : null}
      {state.error ? (
        <div className="npt-lookup-error" role="alert"><span>{state.error}</span><button type="button" className="npt-link" onClick={() => run(state.page)}>{tt("WRK_RETRY")}</button></div>
      ) : null}
      {state.rows && !rows.length ? (
        <div className="npt-empty"><WRKIcon name="search" size={40} /><strong>{tt("WRK_BILLS_EMPTY")}</strong><p>{tt("WRK_BILLS_EMPTY_SUB")}</p></div>
      ) : null}

      {rows.length ? (
        <div className="erp-tablewrap" aria-live="polite">
          <table className="erp-table">
            <thead>
              <tr>
                <th scope="col">{idLabel}</th><th scope="col">{tt("WRK_BILLS_COL_NAME")}</th><th scope="col">{tt("WRK_BILLS_COL_PERIOD")}</th>
                <th scope="col" className="is-num">{tt("WRK_BILLS_TOTAL")}</th><th scope="col" className="is-num">{tt("WRK_BILLS_PAID")}</th><th scope="col" className="is-num">{tt("WRK_BILLS_DUE")}</th>
                <th scope="col">{tt("WRK_STATUS")}</th><th scope="col"><span className="sr-only">{tt("WRK_BILLS_COL_ACTIONS")}</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td data-label={idLabel} className="erp-table__id">{b.consumerCode}{b.billDate ? <small>{fmtDate(b.billDate)}</small> : null}</td>
                  <td data-label={tt("WRK_BILLS_COL_NAME")}>{b.payer || "-"}{b.mobile ? <small>{b.mobile}</small> : null}</td>
                  <td data-label={tt("WRK_BILLS_COL_PERIOD")}>{b.period || "-"}</td>
                  <td data-label={tt("WRK_BILLS_TOTAL")} className="is-num">{money(b.total)}</td>
                  <td data-label={tt("WRK_BILLS_PAID")} className="is-num">{money(b.paid)}</td>
                  <td data-label={tt("WRK_BILLS_DUE")} className="is-num">{money(b.due)}</td>
                  <td data-label={tt("WRK_STATUS")}><span className={`npt-badge npt-badge--${tone(b.status)}`}>{tt(`WRK_BILLS_S_${b.status}`, { defaultValue: b.status })}{b.processing ? ` (${tt("WRK_BILLS_CLEARANCE")})` : ""}</span></td>
                  <td className="erp-table__acts"><Actions b={b} /></td>
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

      {history ? (
        <div className="wrk-modal wrk-modal--pv" role="dialog" aria-modal="true" aria-labelledby="wrk-hist-title" onMouseDown={(e) => { if (e.target === e.currentTarget) setHistory(null); }}>
          <div className="wrk-pv">
            <header className="wrk-pv__head">
              <div><h2 id="wrk-hist-title">{tt("WRK_BILLS_HISTORY")}</h2><p>{history.code}</p></div>
              <button type="button" className="wrk-pv__x" onClick={() => setHistory(null)} aria-label={tt("WRK_CLOSE")} autoFocus>×</button>
            </header>
            <div className="wrk-pv__body">
              <div className="erp-tablewrap">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th scope="col">{tt("WRK_BILLS_COL_PERIOD")}</th><th scope="col" className="is-num">{tt("WRK_BILLS_TOTAL")}</th><th scope="col" className="is-num">{tt("WRK_BILLS_PAID")}</th>
                      <th scope="col" className="is-num">{tt("WRK_BILLS_DUE")}</th><th scope="col">{tt("WRK_STATUS")}</th><th scope="col"><span className="sr-only">{tt("WRK_BILLS_COL_ACTIONS")}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.rows.map((b) => (
                      <tr key={b.id}>
                        <td data-label={tt("WRK_BILLS_COL_PERIOD")}>{b.period || "-"}{b.billDate ? <small>{fmtDate(b.billDate)}</small> : null}</td>
                        <td data-label={tt("WRK_BILLS_TOTAL")} className="is-num">{money(b.total)}</td>
                        <td data-label={tt("WRK_BILLS_PAID")} className="is-num">{money(b.paid)}</td>
                        <td data-label={tt("WRK_BILLS_DUE")} className="is-num">{money(b.due)}</td>
                        <td data-label={tt("WRK_STATUS")}><span className={`npt-badge npt-badge--${tone(b.status)}`}>{tt(`WRK_BILLS_S_${b.status}`, { defaultValue: b.status })}</span></td>
                        <td className="erp-table__acts"><div className="wrk-bill__acts"><Ico icon="eye" label={tt("WRK_BILLS_VIEW")} onClick={() => download(b)} /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <footer className="wrk-pv__foot"><button type="button" className="npt-btn npt-btn--ghost" onClick={() => setHistory(null)}><span>{tt("WRK_CLOSE")}</span></button></footer>
          </div>
        </div>
      ) : null}

      {cancelling ? (
        <div className="wrk-modal wrk-modal--top" role="dialog" aria-modal="true" aria-label={tt("WRK_BILLS_CANCEL")}>
          <div className="wrk-modal__box">
            <h2>{tt("WRK_BILLS_CANCEL_TITLE")}</h2>
            <p>{tt("WRK_BILLS_CANCEL_WARN", { code: cancelling.consumerCode, period: cancelling.period })}</p>
            <div className={`wrk-bf${reason.trim() ? "" : " has-error"}`}><label><span>{tt("WRK_BILLS_REASON")}</span>
              <input type="text" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} autoFocus /></label></div>
            <div className="wrk-billactions">
              <button type="button" className="npt-btn wrk-btn--danger" disabled={!reason.trim() || working} onClick={confirmCancel}><span>{tt("WRK_BILLS_CONFIRM_CANCEL")}</span></button>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => setCancelling(null)}><span>{tt("WRK_BILLS_KEEP")}</span></button>
            </div>
          </div>
        </div>
      ) : null}

      {paying ? <PayModal bill={paying} service={service} onClose={() => setPaying(null)} onDone={async (message) => { setPaying(null); setHistory(null); setNote({ ok: true, message }); await run(state.page); }} /> : null}
      {pdf ? <PdfViewer blob={pdf.blob} fileName={pdf.name} onClose={() => setPdf(null)} /> : null}

      {state.busy || working ? <SevaLoader fullScreen message={tt("WRK_LOADING")} /> : null}
    </div>
  );
};

export default SearchBills;
