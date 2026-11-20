import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, Redirect, useHistory, useParams } from "react-router-dom";
import { wrkText } from "../../config/hpworkMessages";
import SearchSelect from "../../pageComponents/SearchSelect";
import { WRKIcon, WRKPageHead, WRKBack } from "../../pageComponents/WorkLayout";
import { BILL_SERVICES, MONTHS, billServicesFor, createdCount, createdIds, fetchFinancialYears, fetchWards, generateOf, previewOf } from "../../utils/bills";
import { apiErrorMessage, defaultTenant, ulbName, workTenants } from "../../utils/work";

// garbage "Multiple" (ward-wise) generation is heavy on the server: it opens from 3 PM daily
const MULTIPLE_OPEN_HOUR = 15;
const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const money = (n) => (n === undefined || n === null || n === "" ? "-" : `₹ ${Math.round(Number(n) || 0).toLocaleString("en-IN")}`);

const money2 = (n) => (n === undefined || n === null || n === "" ? "-" : `₹ ${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);
const monthLabel = (ym) => { const [y, m] = String(ym || "").split("-").map(Number); return y && m ? new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" }) : "-"; };

/* Garbage bill preview: a bill-like summary - payable amount first, then who/when, then the working. */
const GarbagePreview = ({ rows, v, tt, onConfirm, onCancel }) => {
  const okRows = rows.filter((r) => !(r.finalBillAmount == null && r.garbageBillWithoutRebate == null));
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const period = v.basis === "PERIOD" ? `${monthLabel(v.from)} → ${monthLabel(v.to)}` : monthLabel(v.month);
  return (
    <div className="wrk-modal wrk-modal--pv" role="dialog" aria-modal="true" aria-labelledby="wrk-pv-title" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="wrk-pv">
        <header className="wrk-pv__head">
          <div>
            <h2 id="wrk-pv-title">{tt("WRK_BILL_PV_TITLE")}</h2>
            <p>{tt("WRK_BILL_PV_SUB")}</p>
          </div>
          <button type="button" className="wrk-pv__x" onClick={onCancel} aria-label={tt("WRK_CANCEL")}>×</button>
        </header>
        <div className="wrk-pv__body">
          {rows.map((r, i) => {
            const c = r.calculationDetails || {};
            const bad = r.finalBillAmount == null && r.garbageBillWithoutRebate == null;
            const rebatePct = c.rebatePercentage != null ? c.rebatePercentage : r.rebatePercentage;
            const info = [
              ["WRK_BILL_PV_APPNO", r.applicationNo || r.grbgApplicationNo],
              ["WRK_BILL_PV_OWNER", r.ownerName],
              ["WRK_BILL_PV_MOBILE", r.mobileNumber],
              ["WRK_BILL_PV_ULB", ulbName(r.tenantId || v.tenantId)],
              ["WRK_BILL_PV_CATEGORY", c.subcategorytype],
              ["WRK_BILL_PV_PERIOD", period],
            ];
            return (
              <section key={i} className={`wrk-pv__bill${bad ? " is-bad" : ""}`} aria-label={rows.length > 1 ? tt("WRK_BILL_PV_N", { i: i + 1, n: rows.length }) : undefined}>
                {rows.length > 1 ? <h3 className="wrk-pv__n">{tt("WRK_BILL_PV_N", { i: i + 1, n: rows.length })}</h3> : null}
                {bad ? (
                  <p className="wrk-prev__bad" role="alert"><strong>{r.applicationNo}</strong><br />{tt("WRK_BILL_P_NOAMOUNT")}</p>
                ) : (
                  <React.Fragment>
                    <div className="wrk-pv__pay">
                      <span>{tt("WRK_BILL_PV_PAYABLE")}</span>
                      <strong>{money2(r.finalBillAmount)}</strong>
                    </div>
                    <dl className="wrk-pv__info">
                      {info.map(([k, val]) => <div key={k}><dt>{tt(k)}</dt><dd>{val || "-"}</dd></div>)}
                    </dl>
                    <h4 className="wrk-pv__h">{tt("WRK_BILL_PV_CALC")}</h4>
                    <table className="wrk-pv__calc">
                      <tbody>
                        <tr><th scope="row">{tt("WRK_BILL_PV_FEE")}</th><td>{money2(c.fee != null ? c.fee : r.monthlyAmount)}</td></tr>
                        <tr><th scope="row">{tt("WRK_BILL_PV_MONTHS")}</th><td>× {c.monthCount != null ? c.monthCount : r.monthCount}</td></tr>
                        <tr><th scope="row">{tt("WRK_BILL_PV_BASE")}</th><td>{money2(c.baseAmount != null ? c.baseAmount : r.garbageBillWithoutRebate)}</td></tr>
                        <tr><th scope="row">{tt("WRK_BILL_PV_REBATE", { p: Number(rebatePct || 0) })}</th><td>− {money2(c.rebateAmount != null ? c.rebateAmount : r.rebateAmount)}</td></tr>
                      </tbody>
                      <tfoot><tr><th scope="row">{tt("WRK_BILL_P_FINAL")}</th><td>{money2(c.finalAmount != null ? c.finalAmount : r.finalBillAmount)}</td></tr></tfoot>
                    </table>
                  </React.Fragment>
                )}
              </section>
            );
          })}
        </div>
        <footer className="wrk-pv__foot">
          <button type="button" className="npt-btn npt-btn--ghost" onClick={onCancel}><span>{tt("WRK_CANCEL")}</span></button>
          <button type="button" className="npt-btn npt-btn--primary" onClick={onConfirm} disabled={!okRows.length} autoFocus><span>{tt("WRK_BILL_PV_CONFIRM")}</span></button>
        </footer>
      </div>
    </div>
  );
};

const blank = (service) => ({
  service,
  tenantId: defaultTenant(),
  billingType: "INDIVIDUAL",
  criteria: "ID",
  id: "",
  mobile: "",
  wards: [],
  basis: service === "grbg" ? "MONTHLY" : "YEARLY",
  month: thisMonth(),
  from: thisMonth(),
  to: thisMonth(),
  rebate: false,
  fy: "",
});

const Seg = ({ value, options, onChange, label }) => (
  <div className="wrk-seg" role="radiogroup" aria-label={label}>
    {options.map((o) => (
      <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={o.disabled} className={value === o.value ? "is-on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
    ))}
  </div>
);

const Field = ({ label, error, children, wide }) => (
  <div className={`wrk-bf${wide ? " wrk-bf--wide" : ""}${error ? " has-error" : ""}`}>
    <label>
      <span>{label}</span>
      {children}
    </label>
    {error ? <small role="alert">{error}</small> : null}
  </div>
);

const GenerateBills = () => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const history = useHistory();
  const { service } = useParams();
  const allowed = billServicesFor();
  const cfg = BILL_SERVICES[service];

  const [v, setV] = useState(() => blank(service));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [multipleLocked] = useState(() => service === "grbg" && new Date().getHours() < MULTIPLE_OPEN_HOUR);

  useEffect(() => { setV(blank(service)); setErrors({}); setPreview(null); setResult(null); }, [service]);
  const set = (patch) => { setV((x) => ({ ...x, ...patch })); setResult(null); };

  const tenants = workTenants();
  const wardsQ = useQuery(["WRK_BILL_WARDS", v.tenantId], () => fetchWards(v.tenantId), { enabled: v.billingType === "MULTIPLE", refetchOnWindowFocus: false, retry: 0 });
  const fyQ = useQuery(["WRK_BILL_FY"], fetchFinancialYears, { enabled: service === "ppt", refetchOnWindowFocus: false, retry: 0 });
  const years = fyQ.data || [];
  useEffect(() => { if (service === "ppt" && !v.fy && years.length) setV((x) => ({ ...x, fy: years[0] })); }, [years.length, service]);

  const tenantOptions = useMemo(() => tenants.map((x) => ({ value: x, label: ulbName(x) })), [tenants.join(",")]);

  if (!cfg || allowed.indexOf(service) < 0) return <Redirect to={allowed.length ? `/digit-ui/employee/hpwork/bills/generate/${allowed[0]}` : "/digit-ui/employee/hpwork/inbox"} />;

  const validate = () => {
    const e = {};
    if (!v.tenantId) e.tenantId = tt("WRK_BILL_E_ULB");
    if (v.billingType === "MULTIPLE") {
      if (!v.wards.length) e.wards = tt("WRK_BILL_E_WARD");
    } else if (v.criteria === "MOBILE") {
      if (!/^\d{10}$/.test(v.mobile.trim())) e.mobile = tt("WRK_BILL_E_MOBILE");
    } else if (!v.id.trim()) e.id = tt(service === "grbg" ? "WRK_BILL_E_GBID" : "WRK_BILL_E_PTID");
    if (v.basis === "MONTHLY" && !v.month) e.month = tt("WRK_BILL_E_MONTH");
    if (v.basis === "YEARLY" && !v.fy) e.fy = tt("WRK_BILL_E_FY");
    if (v.basis === "PERIOD") {
      if (!v.from) e.from = tt("WRK_BILL_E_FROM");
      if (!v.to) e.to = tt("WRK_BILL_E_TO");
      else if (v.from && v.to < v.from) e.to = tt("WRK_BILL_E_RANGE");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // the action stays disabled until every required selection is made
  const ready = !!v.tenantId && (v.billingType === "MULTIPLE" ? v.wards.length > 0 : v.criteria === "MOBILE" ? /^\d{10}$/.test(v.mobile.trim()) : !!v.id.trim())
    && (v.basis === "MONTHLY" ? !!v.month : v.basis === "YEARLY" ? !!v.fy : !!v.from && !!v.to && v.to >= v.from);

  const run = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setResult(null);
    // one bill is previewed first; ward-wise runs go straight to a confirmation
    if (v.billingType === "MULTIPLE") return setPreview({ many: true });
    setBusy(true);
    try {
      const rows = await previewOf(v);
      if (!rows.length) setResult({ ok: false, message: tt("WRK_BILL_NONE") });
      else setPreview({ rows });
    } catch (err) {
      setResult({ ok: false, message: apiErrorMessage(err, tt("WRK_BILL_PREVIEW_FAILED")) });
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setPreview(null);
    setBusy(true);
    try {
      const res = await generateOf(v);
      const n = createdCount(service, res);
      setResult(n ? { ok: true, message: (res && res.message) || tt("WRK_BILL_DONE", { n }), n, ids: (() => { const ids = createdIds(service, res); return ids.length ? ids : (v.billingType === "INDIVIDUAL" && v.criteria === "ID" && v.id.trim() ? [v.id.trim()] : []); })(), view: v.billingType === "INDIVIDUAL" ? { by: v.criteria, value: v.criteria === "MOBILE" ? v.mobile.trim() : v.id.trim(), tenant: v.tenantId } : { tenant: v.tenantId } } : { ok: false, message: (res && (res.message || (res.Errors && res.Errors[0] && res.Errors[0].message))) || tt("WRK_BILL_NOT_GENERATED") });
    } catch (err) {
      setResult({ ok: false, message: apiErrorMessage(err, tt("WRK_BILL_FAILED")) });
    } finally {
      setBusy(false);
    }
  };

  // the scheduler returns a bare row (no amounts) when the owner is not mapped to a user or no fee is configured
  const uncalculable = (r) => service === "grbg" && r.finalBillAmount == null && r.garbageBillWithoutRebate == null;

  const previewRows = (rows) => rows.map((r, i) =>
    service === "grbg" ? (
      <li key={i} className={uncalculable(r) ? "is-bad" : ""}>
        <strong>{r.grbgApplicationNo || r.applicationNo || r.name || tt("WRK_BILL_BILL_N", { n: i + 1 })}</strong>
        {uncalculable(r) ? (
          <p className="wrk-prev__bad" role="alert">{tt("WRK_BILL_P_NOAMOUNT")}</p>
        ) : (
          <dl>
            {[["WRK_BILL_P_MONTHLY", r.monthlyAmount != null ? r.monthlyAmount : r.monthlyamount], ["WRK_BILL_P_GROSS", r.garbageBillWithoutRebate], ["WRK_BILL_P_REBATE", r.rebateAmount], ["WRK_BILL_P_FINAL", r.finalBillAmount]].map(([k, val]) => (
              <div key={k}><dt>{tt(k)}</dt><dd>{money(val)}</dd></div>
            ))}
          </dl>
        )}
      </li>
    ) : (
      <li key={i}>
        <strong>{r.propertyId || r.propertyid || tt("WRK_BILL_BILL_N", { n: i + 1 })}</strong>
        <dl>
          {Object.keys(r).filter((k) => typeof r[k] === "number" || /^\d+(\.\d+)?$/.test(String(r[k]))).slice(0, 8).map((k) => (
            <div key={k}><dt>{k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</dt><dd>{money(r[k])}</dd></div>
          ))}
        </dl>
      </li>
    )
  );

  return (
    <div className="npt-wrap wrk-bills">
      <nav className="npt-crumbs" aria-label="Breadcrumb"><WRKBack />
        <a href="/digit-ui/employee">{tt("WRK_CRUMB_HOME")}</a><span>›</span><strong aria-current="page">{tt("WRK_BILL_TITLE")}</strong>
      </nav>
      <WRKPageHead title={tt("WRK_BILL_TITLE")} sub={tt("WRK_BILL_SUB")} />

      {allowed.length > 1 ? (
        <div className="wrk-cards" role="tablist">
          {allowed.map((k) => (
            <button key={k} type="button" role="tab" aria-selected={service === k} className={`wrk-card${service === k ? " is-on" : ""}`} onClick={() => history.push(`/digit-ui/employee/hpwork/bills/generate/${k}`)}>
              <span className="wrk-card__ico"><WRKIcon name={BILL_SERVICES[k].icon} size={22} /></span>
              <span className="wrk-card__label">{tt(BILL_SERVICES[k].labelKey)}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="erp-toolbar" role="toolbar" aria-label={tt("WRK_BILL_TITLE")}>
        <span className="erp-toolbar__ctx">{tt(cfg.labelKey)} · {ulbName(v.tenantId)}</span>
        <Link className="erp-tb" to={`/digit-ui/employee/hpwork/bills/search/${service}`}><WRKIcon name="search" size={16} /><span>{tt("WRK_BILLS_TITLE")}</span></Link>
        <Link className="erp-tb" to={`/digit-ui/employee/hpwork/bills/arrears/${service}`}><WRKIcon name="clock" size={16} /><span>{tt("WRK_ARR_TITLE")}</span></Link>
      </div>

      <form className="wrk-gen wrk-erp" onSubmit={run} noValidate>
        <div className="erp-body">
        <fieldset className="erp-fs">
          <legend>{tt(cfg.labelKey)}</legend>
          {service === "grbg" ? <p className="erp-note erp-note--red" role="note"><strong>{tt("WRK_BILL_NOTE_LABEL")}</strong> {tt("WRK_BILL_NOTE_BULK", { hour: MULTIPLE_OPEN_HOUR })}</p> : null}
          <div className="wrk-billgrid wrk-billgrid--4">
            <Field label={tt("WRK_ULB")} error={errors.tenantId}>
              <SearchSelect value={v.tenantId} options={tenantOptions} onChange={(x) => set({ tenantId: x || defaultTenant(), wards: [] })} allLabel={ulbName(defaultTenant())} searchPlaceholder={tt("WRK_SS_SEARCH")} emptyLabel={tt("WRK_SS_NONE")} ariaLabel={tt("WRK_ULB")} />
            </Field>

            <Field label={tt("WRK_BILL_TYPE")}>
              <Seg value={v.billingType} label={tt("WRK_BILL_TYPE")} onChange={(x) => set({ billingType: x })} options={[
                { value: "INDIVIDUAL", label: tt("WRK_BILL_INDIVIDUAL") },
                { value: "MULTIPLE", label: tt("WRK_BILL_MULTIPLE"), disabled: multipleLocked },
              ]} />
              {multipleLocked ? <small className="wrk-bf__note">{tt("WRK_BILL_MULTIPLE_LOCKED", { hour: MULTIPLE_OPEN_HOUR })}</small> : null}
            </Field>

            <Field label={tt("WRK_BILL_FOR")}>
              <Seg value={v.basis} label={tt("WRK_BILL_FOR")} onChange={(x) => set({ basis: x })} options={(service === "grbg" ? [{ value: "MONTHLY", label: tt("WRK_BILL_MONTHLY") }] : [{ value: "YEARLY", label: tt("WRK_BILL_YEARLY") }]).concat({ value: "PERIOD", label: tt("WRK_BILL_PERIOD") })} />
            </Field>

            {v.basis === "MONTHLY" ? (
              <Field label={tt("WRK_BILL_MONTH")} error={errors.month}>
                <input type="month" value={v.month} max={thisMonth()} onChange={(e) => set({ month: e.target.value })} />
              </Field>
            ) : null}
            {v.basis === "YEARLY" ? (
              <Field label={tt("WRK_BILL_FY")} error={errors.fy}>
                <select value={v.fy} onChange={(e) => set({ fy: e.target.value })} disabled={fyQ.isLoading}>
                  <option value="">{fyQ.isLoading ? tt("WRK_LOADING") : tt("WRK_BILL_PICK")}</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
            ) : null}
            {v.basis === "PERIOD" ? (
              <React.Fragment>
                <Field label={tt("WRK_BILL_FROM")} error={errors.from}>
                  <input type={service === "grbg" ? "month" : "date"} value={v.from} onChange={(e) => set({ from: e.target.value })} />
                </Field>
                <Field label={tt("WRK_BILL_TO")} error={errors.to}>
                  <input type={service === "grbg" ? "month" : "date"} value={v.to} min={v.from} onChange={(e) => set({ to: e.target.value })} />
                </Field>
              </React.Fragment>
            ) : null}
            {service === "grbg" && v.basis === "PERIOD" ? (
              <label className="wrk-check wrk-bf--wide"><input type="checkbox" checked={v.rebate} onChange={(e) => set({ rebate: e.target.checked })} /><span>{tt("WRK_BILL_REBATE")}</span></label>
            ) : null}
          </div>

          <div className="wrk-billgrid wrk-billgrid--lookup">
            {v.billingType === "INDIVIDUAL" ? (
              <React.Fragment>
                <Field label={tt("WRK_BILL_SEARCH_BY")}>
                  <Seg value={v.criteria} label={tt("WRK_BILL_SEARCH_BY")} onChange={(x) => set({ criteria: x })} options={[
                    { value: "ID", label: tt(service === "grbg" ? "WRK_BILL_BY_GBID" : "WRK_BILL_BY_PTID") },
                    { value: "MOBILE", label: tt("WRK_BILL_BY_MOBILE") },
                  ]} />
                </Field>
                {v.criteria === "MOBILE" ? (
                  <Field label={tt("WRK_BILL_MOBILE")} error={errors.mobile}>
                    <input type="tel" inputMode="numeric" autoComplete="off" autoFocus maxLength={10} placeholder="9XXXXXXXXX" value={v.mobile} onChange={(e) => set({ mobile: e.target.value.replace(/\D/g, "") })} />
                  </Field>
                ) : (
                  <Field label={tt(service === "grbg" ? "WRK_BILL_GBID" : "WRK_BILL_PTID")} error={errors.id}>
                    <input type="text" autoComplete="off" autoFocus value={v.id} onChange={(e) => set({ id: e.target.value })} />
                  </Field>
                )}
              </React.Fragment>
            ) : (
              <Field label={tt("WRK_BILL_WARDS")} error={errors.wards} wide>
                {wardsQ.isLoading ? <SevaLoader message={tt("WRK_LOADING")} /> : null}
                {wardsQ.isError ? <span className="npt-lookup-error" role="alert">{apiErrorMessage(wardsQ.error, tt("WRK_BILL_WARDS_FAILED"))} <button type="button" className="npt-link" onClick={() => wardsQ.refetch()}>{tt("WRK_RETRY")}</button></span> : null}
                {wardsQ.data ? (
                  <div className="wrk-chips" role="group" aria-label={tt("WRK_BILL_WARDS")}>
                    <button type="button" className="wrk-chip wrk-chip--all" onClick={() => set({ wards: v.wards.length === wardsQ.data.length ? [] : wardsQ.data.slice() })}>{v.wards.length === wardsQ.data.length ? tt("WRK_BILL_NONE_WARDS") : tt("WRK_BILL_ALL_WARDS")}</button>
                    {wardsQ.data.map((w) => (
                      <button key={w} type="button" aria-pressed={v.wards.indexOf(w) >= 0} className={`wrk-chip${v.wards.indexOf(w) >= 0 ? " is-on" : ""}`} onClick={() => set({ wards: v.wards.indexOf(w) >= 0 ? v.wards.filter((x) => x !== w) : v.wards.concat(w) })}>{w}</button>
                    ))}
                  </div>
                ) : null}
              </Field>
            )}
          </div>
        </fieldset>
        <aside className="erp-instr" aria-label={tt("WRK_BILL_INS_TITLE")}>
          <h3>{tt("WRK_BILL_INS_TITLE")}</h3>
          <p>{tt("WRK_BILL_INS_1")}</p>
          <p className="erp-instr__warn">{tt("WRK_BILL_INS_2")}</p>
          <p>{tt("WRK_BILL_INS_3")}</p>
        </aside>
        </div>

        <div className="erp-bar">
          <span className="erp-bar__sum" aria-live="polite">
            {ulbName(v.tenantId)} · {v.billingType === "MULTIPLE" ? `${v.wards.length} ${tt("WRK_BILL_WARDS")}` : (v.criteria === "MOBILE" ? v.mobile : v.id) || "-"} · {v.basis === "MONTHLY" ? v.month : v.basis === "YEARLY" ? v.fy : v.from && v.to ? `${v.from} → ${v.to}` : "-"}
          </span>
          <button type="button" className="npt-btn npt-btn--ghost" disabled={busy} onClick={() => { setV(blank(service)); setErrors({}); setResult(null); }}><span>{tt("WRK_CLEAR")}</span></button>
          <button type="submit" className="npt-btn npt-btn--primary" disabled={busy || !ready} aria-disabled={busy || !ready} title={ready ? undefined : tt("WRK_BILL_SELECT_FIRST")}><span>{v.billingType === "MULTIPLE" ? tt("WRK_BILL_GENERATE") : tt("WRK_BILL_PREVIEW")}</span></button>
        </div>
      </form>

      {result ? (
        <div className={`wrk-billresult ${result.ok ? "is-ok" : "is-bad"}`} role={result.ok ? "status" : "alert"}>
          <WRKIcon name={result.ok ? "check" : "alert"} size={20} />
          <span>{result.message}</span>
          {result.ok && result.ids && result.ids.length ? (
            <ul className="wrk-billresult__ids" aria-label={tt("WRK_BILL_IDS")}>
              {result.ids.slice(0, 10).map((id) => <li key={id}><Link to={`/digit-ui/employee/hpwork/bills/search/${service}?${new URLSearchParams({ by: "ID", value: id, tenant: result.view.tenant, auto: "1" }).toString()}`}>{id}</Link></li>)}
              {result.ids.length > 10 ? <li className="is-more">{tt("WRK_BILL_IDS_MORE", { n: result.ids.length - 10 })}</li> : null}
            </ul>
          ) : null}
          {result.ok && result.view ? (
            <Link className="npt-btn npt-btn--primary wrk-billresult__go" to={`/digit-ui/employee/hpwork/bills/search/${service}?${new URLSearchParams(result.view.by ? { by: result.view.by, value: result.view.value, tenant: result.view.tenant, auto: "1" } : { tenant: result.view.tenant }).toString()}`}><span>{tt("WRK_BILL_VIEW")}</span></Link>
          ) : null}
        </div>
      ) : null}

      {preview && service === "grbg" && !preview.many ? (
        <GarbagePreview rows={preview.rows} v={v} tt={tt} onConfirm={confirm} onCancel={() => setPreview(null)} />
      ) : preview ? (
        <div className="wrk-modal" role="dialog" aria-modal="true" aria-label={tt("WRK_BILL_CONFIRM_TITLE")}>
          <div className="wrk-modal__box">
            <h2>{tt("WRK_BILL_CONFIRM_TITLE")}</h2>
            {preview.many ? <p>{tt("WRK_BILL_CONFIRM_MANY", { n: v.wards.length, ulb: ulbName(v.tenantId) })}</p> : <ul className="wrk-previews">{previewRows(preview.rows)}</ul>}
            <div className="wrk-billactions">
              <button type="button" className="npt-btn npt-btn--primary" onClick={confirm} disabled={!preview.many && !(preview.rows || []).some((r) => !uncalculable(r))}><span>{tt("WRK_BILL_CONFIRM")}</span></button>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => setPreview(null)}><span>{tt("WRK_CANCEL")}</span></button>
            </div>
          </div>
        </div>
      ) : null}

      {busy ? <SevaLoader fullScreen message={tt("WRK_BILL_WORKING")} /> : null}
    </div>
  );
};

export default GenerateBills;
