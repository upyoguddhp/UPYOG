import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useHistory, useRouteMatch } from "react-router-dom";
import { payText } from "../../config/payMessages";
import { PAYBtn, PAYBusy, PAYCrumbs, PAYError, PAYIcon, PAYPageHead, PAYTabs } from "../../pageComponents/PayLayout";
import SearchSelect from "../../pageComponents/SearchSelect";
import { usePay } from "../../pageComponents/usePay";
import { PAY_SERVICES, asArray, apiErrorMessage, fetchBillsFor, fmtDate, getUser, inr, roundToTwo, serviceOf, ulbOf } from "../../utils/pay";

// Every pending bill of the signed-in citizen, grouped by service, with multi-select and Pay now.
const Dues = () => {
  const { t } = useTranslation();
  const tt = (k, p) => payText(t, k, p);
  const history = useHistory();
  const root = useRouteMatch().url.replace(/\/dues\/?$/, "");
  const user = useMemo(getUser, []);
  const [service, setService] = useState("");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState({});
  const [note, setNote] = useState(null);

  const dues = useQuery(
    ["PAY_DUES", user.mobileNumber],
    async () => {
      const results = await Promise.all(PAY_SERVICES.map((s) => fetchBillsFor(s, user).then((rows) => ({ s, rows }), (error) => ({ s, rows: [], error }))));
      return {
        rows: results.flatMap((r) => r.rows),
        failed: results.filter((r) => r.error).map((r) => (r.s.key ? tt(r.s.key) : r.s.label)),
        allFailed: results.every((r) => r.error) ? results[0].error : null,
      };
    },
    { refetchOnWindowFocus: false, retry: 0 }
  );
  const { pay, busy } = usePay({ t, user, root, history });

  const all = (dues.data && dues.data.rows) || [];
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((r) => (!service || r.code === service) && (!term || [r.consumerCode, r.billNumber, ulbOf(r.tenantId), serviceOf(r.code).label].join(" ").toLowerCase().includes(term)));
  }, [all, service, q]);
  const groups = useMemo(() => PAY_SERVICES.map((s) => ({ s, rows: shown.filter((r) => r.code === s.code) })).filter((g) => g.rows.length), [shown]);
  const chosen = all.filter((r) => picked[r.key]);
  const total = roundToTwo(chosen.reduce((s, r) => s + r.amount, 0));
  const toggle = (r) => { setNote(null); setPicked((p) => ({ ...p, [r.key]: !p[r.key] })); };
  const setMany = (rows, on) => { setNote(null); setPicked((p) => rows.reduce((a, r) => ({ ...a, [r.key]: on }), { ...p })); };
  const serviceOptions = PAY_SERVICES.filter((s) => all.some((r) => r.code === s.code)).map((s) => ({ value: s.code, label: tt(s.key) }));

  const submit = () => {
    if (!chosen.length) return setNote(tt("PAY_PICK_ONE"));
    if (new Set(chosen.map((r) => r.tenantId)).size > 1) return setNote(tt("PAY_MULTI_ULB"));
    setNote(null);
    pay(chosen);
  };

  if (dues.isLoading) return <div className="npt-wrap"><SevaLoader message={tt("PAY_LOADING_DUES")} /></div>;

  return (
    <div className="npt-wrap pay-wrap">
      <PAYCrumbs t={t} current={tt("PAY_CRUMB_DUES")} />
      <PAYPageHead title={tt("PAY_DUES_TITLE")} sub={tt("PAY_DUES_SUB")} />
      <PAYTabs t={t} active="dues" root={root} />

      {dues.isError || (dues.data && dues.data.allFailed) ? (
        <PAYError t={t} message={apiErrorMessage(dues.error || dues.data.allFailed, tt("PAY_DUES_FAILED"))} onRetry={() => dues.refetch()} />
      ) : (
        <React.Fragment>
          {dues.data && dues.data.failed.length ? <PAYError t={t} message={tt("PAY_DUES_PARTIAL", { names: dues.data.failed.join(", ") })} onRetry={() => dues.refetch()} /> : null}

          {all.length === 0 ? (
            <div className="npt-empty">
              <PAYIcon name="check" size={40} />
              <strong>{tt("PAY_DUES_EMPTY")}</strong>
              <p>{tt("PAY_DUES_EMPTY_SUB")}</p>
            </div>
          ) : (
            <React.Fragment>
              <div className="bkg-filters">
                <div className="bkg-field">
                  <span>{tt("PAY_FILTER_SERVICE")}</span>
                  <SearchSelect value={service} options={serviceOptions} onChange={setService} allLabel={tt("PAY_ALL")} searchPlaceholder={tt("PAY_SEARCH_LIST")} emptyLabel={tt("PAY_NO_RESULTS")} ariaLabel={tt("PAY_FILTER_SERVICE")} />
                </div>
                <label className="npt-search bkg-filters__search">
                  <PAYIcon name="search" size={18} />
                  <input type="search" value={q} placeholder={tt("PAY_SEARCH_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("PAY_SEARCH_PH")} />
                </label>
              </div>

              {groups.length === 0 ? (
                <div className="npt-empty">
                  <PAYIcon name="search" size={40} />
                  <strong>{tt("PAY_NO_RESULTS")}</strong>
                  <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setService(""); }}><span>{tt("PAY_CLEAR_FILTERS")}</span></button>
                </div>
              ) : groups.map(({ s, rows }) => {
                const allOn = rows.every((r) => picked[r.key]);
                return (
                  <section className="npt-card pay-group" key={s.code}>
                    <header className="pay-group__head">
                      <h3>{s.key ? tt(s.key) : s.label}</h3>
                      <button type="button" className="npt-link" onClick={() => setMany(rows, !allOn)}>{tt(allOn ? "PAY_SELECT_NONE" : "PAY_SELECT_ALL")}</button>
                    </header>
                    <ul className="pay-bills">
                      {rows.map((r) => {
                        const overdue = r.dueMs && r.dueMs < Date.now();
                        return (
                          <li key={r.key} className={picked[r.key] ? "is-on" : ""}>
                            <label className="pay-bill">
                              <input type="checkbox" checked={!!picked[r.key]} onChange={() => toggle(r)} />
                              <span className="pay-bill__main">
                                <strong>{r.consumerCode}</strong>
                                <small>{[ulbOf(r.tenantId), r.billNumber ? `${tt("PAY_BILL_NO")} ${r.billNumber}` : ""].filter(Boolean).join(" · ")}</small>
                                <small>{[r.from && r.to ? `${tt("PAY_PERIOD")}: ${fmtDate(r.from)} - ${fmtDate(r.to)}` : "", r.dueMs ? `${tt("PAY_DUE_DATE")} ${fmtDate(r.dueMs)}` : ""].filter(Boolean).join(" · ")}</small>
                              </span>
                              {overdue ? <span className="npt-badge npt-badge--action">{tt("PAY_OVERDUE")}</span> : null}
                              <span className="pay-bill__amt">{inr(r.amount)}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}

              <p className="npt-card__hint"><PAYIcon name="shield" size={16} /> {tt("PAY_SECURE_NOTE")}</p>
              <div className="pay-bar" role="region" aria-live="polite">
                <div className="pay-bar__sum">
                  <small>{tt("PAY_SELECTED", { count: chosen.length })}</small>
                  <strong>{tt("PAY_TOTAL")}: {inr(total)}</strong>
                  {note ? <span className="pay-bar__note" role="alert">{note}</span> : null}
                </div>
                <PAYBtn kind="primary" icon="rupee" onClick={submit} disabled={!!busy}>{tt("PAY_NOW")}</PAYBtn>
              </div>
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      {busy ? <PAYBusy message={busy} /> : null}
    </div>
  );
};

export default Dues;
