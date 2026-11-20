import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, Redirect, useParams } from "react-router-dom";
import { wrkText } from "../../config/hpworkMessages";
import SearchSelect from "../../pageComponents/SearchSelect";
import { WRKIcon, WRKPageHead, WRKBack } from "../../pageComponents/WorkLayout";
import { BILL_SERVICES, arrearTotal, billServicesFor, createArrears, fetchFinancialYearsFull, searchArrearAccounts } from "../../utils/bills";
import { apiErrorMessage, defaultTenant, ulbName, workTenants } from "../../utils/work";

const month = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const newRow = () => ({ fy: "", from: "", to: "", tax: "", arrear: "", penalty: "", interest: "", description: "" });
const money = (n) => `₹ ${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
// no minus / exponent in amount boxes
const amountKey = (e) => { if (["-", "+", "e", "E"].indexOf(e.key) >= 0) e.preventDefault(); };

const Arrears = () => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const { service } = useParams();
  const allowed = billServicesFor();
  const cfg = BILL_SERVICES[service];
  const ppt = service === "ppt";

  const [tenantId, setTenantId] = useState(defaultTenant());
  const [by, setBy] = useState("ID");
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [found, setFound] = useState({ rows: null, busy: false, error: "" });
  const [account, setAccount] = useState(null);
  const [rows, setRows] = useState([newRow()]);
  const [rowErr, setRowErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const tenants = workTenants();

  const fyQ = useQuery(["WRK_ARR_FY"], fetchFinancialYearsFull, { enabled: ppt && !!account, refetchOnWindowFocus: false, retry: 0 });

  if (!cfg || allowed.indexOf(service) < 0) return <Redirect to={allowed.length ? `/digit-ui/employee/hpwork/bills/arrears/${allowed[0]}` : "/digit-ui/employee/hpwork/inbox"} />;

  const modes = ppt ? [["ID", "WRK_BILL_BY_PTID"], ["OLD_ID", "WRK_ARR_BY_OLDID"], ["OLD_CUST", "WRK_ARR_BY_OLDCUST"]] : [["ID", "WRK_BILL_BY_GBID"], ["MOBILE", "WRK_BILL_BY_MOBILE"]];

  const search = async (e) => {
    e.preventDefault();
    setResult(null);
    const v = value.trim();
    if (!v) return setErr(tt("WRK_ARR_E_VALUE"));
    if (by === "MOBILE" && !/^\d{10}$/.test(v)) return setErr(tt("WRK_BILL_E_MOBILE"));
    setErr("");
    setAccount(null);
    setFound({ rows: null, busy: true, error: "" });
    try {
      setFound({ rows: await searchArrearAccounts({ service, tenantId, by, value }), busy: false, error: "" });
    } catch (x) {
      setFound({ rows: null, busy: false, error: apiErrorMessage(x, tt("WRK_ARR_SEARCH_FAILED")) });
    }
  };

  const pick = (a) => { setAccount(a); setRows([newRow()]); setRowErr({}); setResult(null); };
  const setRow = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const grand = rows.reduce((s, r) => s + arrearTotal(r), 0);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    rows.forEach((r, i) => {
      const x = {};
      if (ppt && !r.fy) x.fy = tt("WRK_BILL_E_FY");
      if (!ppt) {
        if (!r.from) x.from = tt("WRK_BILL_E_FROM");
        if (!r.to) x.to = tt("WRK_BILL_E_TO");
        else if (r.from && r.to < r.from) x.to = tt("WRK_BILL_E_RANGE");
      }
      if (arrearTotal(r) <= 0) x.total = tt("WRK_ARR_E_AMOUNT");
      if (Object.keys(x).length) errs[i] = x;
    });
    setRowErr(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const res = await createArrears(service, account, rows);
      const ok = /^succe/i.test(((res || {}).ResponseInfo || {}).status || "") || Array.isArray((res || {}).Demands);
      if (!ok) throw new Error((res && res.message) || "");
      setResult({ ok: true, message: tt("WRK_ARR_DONE", { code: account.code }) });
      setAccount(null);
      setFound({ rows: null, busy: false, error: "" });
      setValue("");
    } catch (x) {
      setResult({ ok: false, message: apiErrorMessage(x, tt("WRK_ARR_FAILED")) });
    } finally {
      setBusy(false);
    }
  };

  const amountField = (i, key, label) => (
    <div className="wrk-bf"><label><span>{label}</span>
      <input type="number" inputMode="decimal" min="0" step="0.01" value={rows[i][key]} onKeyDown={amountKey} onChange={(e) => setRow(i, { [key]: e.target.value })} /></label></div>
  );

  return (
    <div className="npt-wrap wrk-bills wrk-erp">
      <nav className="npt-crumbs" aria-label="Breadcrumb"><WRKBack />
        <a href="/digit-ui/employee">{tt("WRK_CRUMB_HOME")}</a><span>›</span><strong aria-current="page">{tt("WRK_ARR_TITLE")}</strong>
      </nav>
      <WRKPageHead title={tt("WRK_ARR_TITLE")} sub={tt("WRK_ARR_SUB")} />

      <div className="erp-toolbar" role="toolbar" aria-label={tt("WRK_ARR_TITLE")}>
        <span className="erp-toolbar__ctx">{tt(cfg.labelKey)} · {ulbName(tenantId)}</span>
        {allowed.filter((k) => k !== service).map((k) => (
          <Link key={k} className="erp-tb" to={`/digit-ui/employee/hpwork/bills/arrears/${k}`}><WRKIcon name={BILL_SERVICES[k].icon} size={16} /><span>{tt(BILL_SERVICES[k].labelKey)}</span></Link>
        ))}
        <Link className="erp-tb" to={`/digit-ui/employee/hpwork/bills/generate/${service}`}><WRKIcon name="file" size={16} /><span>{tt("WRK_BILL_TITLE")}</span></Link>
        <Link className="erp-tb" to={`/digit-ui/employee/hpwork/bills/cheque/${service}`}><WRKIcon name="clock" size={16} /><span>{tt("WRK_CHQ_TITLE")}</span></Link>
        <Link className="erp-tb" to={`/digit-ui/employee/hpwork/bills/search/${service}`}><WRKIcon name="search" size={16} /><span>{tt("WRK_BILLS_TITLE")}</span></Link>
      </div>

      <form className="wrk-erp-search" onSubmit={search} noValidate>
        <fieldset className="erp-fs">
        <legend>{tt("WRK_ARR_FIND")}</legend>
        <div className="wrk-billgrid wrk-billgrid--find">
          {tenants.length > 1 ? (
            <div className="wrk-bf"><label><span>{tt("WRK_ULB")}</span>
              <SearchSelect value={tenantId} options={tenants.map((x) => ({ value: x, label: ulbName(x) }))} onChange={(x) => { setTenantId(x || defaultTenant()); setAccount(null); }} allLabel={ulbName(defaultTenant())} searchPlaceholder={tt("WRK_SS_SEARCH")} emptyLabel={tt("WRK_SS_NONE")} ariaLabel={tt("WRK_ULB")} /></label></div>
          ) : null}
          <div className="wrk-bf"><label><span>{tt("WRK_BILL_SEARCH_BY")}</span></label>
            <div className="wrk-seg" role="radiogroup" aria-label={tt("WRK_BILL_SEARCH_BY")}>
              {modes.map(([k, key]) => <button key={k} type="button" role="radio" aria-checked={by === k} className={by === k ? "is-on" : ""} onClick={() => { setBy(k); setValue(""); setErr(""); }}>{tt(key)}</button>)}
            </div>
          </div>
          <div className={`wrk-bf${err ? " has-error" : ""}`}><label><span>{tt(modes.find((m) => m[0] === by)[1])}</span>
            <input type={by === "MOBILE" ? "tel" : "text"} inputMode={by === "MOBILE" ? "numeric" : undefined} maxLength={by === "MOBILE" ? 10 : undefined} autoComplete="off" value={value} onChange={(e) => setValue(by === "MOBILE" ? e.target.value.replace(/\D/g, "") : e.target.value.replace(/\s/g, ""))} /></label>
            {err ? <small role="alert">{err}</small> : null}</div>
          <div className="wrk-bf wrk-bf--go"><button type="submit" className="npt-btn npt-btn--primary" disabled={found.busy}><span>{tt("WRK_SEARCH_BTN")}</span></button></div>
        </div>
        </fieldset>
      </form>

      {result ? <div className={`wrk-billresult ${result.ok ? "is-ok" : "is-bad"}`} role={result.ok ? "status" : "alert"}><WRKIcon name={result.ok ? "check" : "alert"} size={20} /><span>{result.message}</span></div> : null}
      {found.error ? <div className="npt-lookup-error" role="alert"><span>{found.error}</span></div> : null}
      {found.rows && !found.rows.length ? <div className="npt-empty"><WRKIcon name="search" size={40} /><strong>{tt("WRK_ARR_EMPTY")}</strong><p>{tt("WRK_ARR_EMPTY_SUB")}</p></div> : null}

      {found.rows && found.rows.length && !account ? (
        <div className="erp-tablewrap" aria-live="polite">
          <table className="erp-table">
            <thead><tr>
              <th scope="col">{tt(modes[0][1])}</th><th scope="col">{tt("WRK_BILLS_COL_NAME")}</th><th scope="col">{tt("WRK_BILL_MOBILE")}</th><th scope="col">{tt("WRK_STATUS")}</th>
              <th scope="col"><span className="sr-only">{tt("WRK_BILLS_COL_ACTIONS")}</span></th>
            </tr></thead>
            <tbody>
              {found.rows.map((a) => (
                <tr key={a.code}>
                  <td data-label={tt(modes[0][1])}><strong>{a.code}</strong><small>{ulbName(a.tenantId)}</small></td>
                  <td data-label={tt("WRK_BILLS_COL_NAME")}>{a.name || "-"}</td>
                  <td data-label={tt("WRK_BILL_MOBILE")}>{a.mobile || "-"}</td>
                  <td data-label={tt("WRK_STATUS")}>{a.status || "-"}</td>
                  <td className="erp-table__acts"><div className="wrk-bill__acts"><button type="button" className="erp-act" onClick={() => pick(a)}>{tt("WRK_ARR_ADD")}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {account ? (
        <form className="wrk-gen wrk-erp" onSubmit={submit} noValidate>
          <div className="erp-body">
          <fieldset className="erp-fs">
          <legend>{tt("WRK_ARR_INFO")}</legend>
          <p className="wrk-arr__who"><strong>{account.code}</strong> · {[account.name, account.mobile].filter(Boolean).join(" · ")}</p>
          {fyQ.isError ? <div className="npt-lookup-error" role="alert"><span>{apiErrorMessage(fyQ.error, tt("WRK_ARR_FY_FAILED"))}</span><button type="button" className="npt-link" onClick={() => fyQ.refetch()}>{tt("WRK_RETRY")}</button></div> : null}
          {rows.map((r, i) => {
            const e = rowErr[i] || {};
            return (
              <fieldset key={i} className="erp-fs wrk-arr__row">
                <legend>{tt("WRK_ARR_ROW", { n: i + 1 })}</legend>
                <div className="wrk-billgrid wrk-billgrid--4">
                  {ppt ? (
                    <div className={`wrk-bf${e.fy ? " has-error" : ""}`}><label><span>{tt("WRK_BILL_FY")}</span>
                      <select value={r.fy} disabled={fyQ.isLoading} onChange={(x) => setRow(i, { fy: x.target.value })}>
                        <option value="">{fyQ.isLoading ? tt("WRK_LOADING") : tt("WRK_BILL_PICK")}</option>
                        {(fyQ.data || []).map((y) => <option key={y} value={y}>{account.conservancy && y === "2022-2023" ? tt("WRK_ARR_CONSERVANCY") : y}</option>)}
                      </select></label>{e.fy ? <small role="alert">{e.fy}</small> : null}</div>
                  ) : (
                    <React.Fragment>
                      <div className={`wrk-bf${e.from ? " has-error" : ""}`}><label><span>{tt("WRK_BILL_FROM")}</span><input type="month" max={month()} value={r.from} onChange={(x) => setRow(i, { from: x.target.value })} /></label>{e.from ? <small role="alert">{e.from}</small> : null}</div>
                      <div className={`wrk-bf${e.to ? " has-error" : ""}`}><label><span>{tt("WRK_BILL_TO")}</span><input type="month" min={r.from} max={month()} value={r.to} onChange={(x) => setRow(i, { to: x.target.value })} /></label>{e.to ? <small role="alert">{e.to}</small> : null}</div>
                    </React.Fragment>
                  )}
                  {amountField(i, "tax", tt(ppt ? "WRK_ARR_TAX" : "WRK_ARR_FEE"))}
                  {amountField(i, "arrear", tt("WRK_ARR_ARREAR"))}
                  {amountField(i, "penalty", tt("WRK_ARR_PENALTY"))}
                  {amountField(i, "interest", tt("WRK_ARR_INTEREST"))}
                  <div className="wrk-bf wrk-bf--wide"><label><span>{tt("WRK_F_description")}</span><input type="text" maxLength={200} value={r.description} onChange={(x) => setRow(i, { description: x.target.value })} /></label></div>
                </div>
                {e.total ? <small className="wrk-arr__err" role="alert">{e.total}</small> : null}
                <div className="wrk-arr__foot">
                  <strong>{tt("WRK_BILLS_TOTAL")}: {money(arrearTotal(r))}</strong>
                  {rows.length > 1 ? <button type="button" className="npt-btn wrk-btn--danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}><span>{tt("WRK_ARR_REMOVE")}</span></button> : null}
                </div>
              </fieldset>
            );
          })}
          </fieldset>
          </div>
          <div className="erp-bar">
            <button type="button" className="npt-btn npt-btn--ghost" onClick={() => setRows(rows.concat(newRow()))}><span>{tt("WRK_ARR_MORE")}</span></button>
            <strong className="erp-bar__sum wrk-arr__grand">{tt("WRK_ARR_GRAND")}: {money(grand)}</strong>
            <button type="button" className="npt-btn npt-btn--ghost" onClick={() => setAccount(null)}><span>{tt("WRK_CANCEL")}</span></button>
            <button type="submit" className="npt-btn npt-btn--primary" disabled={busy || grand <= 0}><span>{tt("WRK_ARR_SAVE")}</span></button>
          </div>
        </form>
      ) : null}

      {found.busy || busy ? <SevaLoader fullScreen message={tt("WRK_LOADING")} /> : null}
    </div>
  );
};

export default Arrears;
