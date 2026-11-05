import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueries, useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { ADAPTERS, adapterByCode } from "../../adapters";
import { wrkText } from "../../config/hpworkMessages";
import SearchSelect from "../../pageComponents/SearchSelect";
import { WRKCrumbs, WRKIcon, WRKPageHead } from "../../pageComponents/WorkLayout";
import { actionableStatuses, allStatuses, apiErrorMessage, canWork, defaultTenant, fetchWfDef, fmtDate, isDraft, stageOf, statusText, ulbName, workTenants } from "../../utils/work";

const PAGE = 10;

// every adapter x ULB: workflow definition, the statuses this employee can act on, and how many applications wait
// a service's own count when it has one; otherwise (or if that call is refused) the size of a search
const countOf = async (ad, tenantId, mine) => {
  if (ad.count) {
    try { return await ad.count({ tenantId, statuses: mine }); } catch (e) { /* fall back to a search */ }
  }
  return (await ad.search({ tenantId, statuses: mine, q: "", limit: 1, offset: 0 })).total;
};

const loadPer = async (ad, tenantId) => {
  try {
    const def = await fetchWfDef(ad.businessService, tenantId);
    const mine = actionableStatuses(def);
    let count = 0;
    if (mine.length) count = await countOf(ad, tenantId, mine);
    return { tenantId, def, mine, count, eligible: canWork(def) };
  } catch (e) {
    return { tenantId, def: null, mine: [], count: 0, eligible: false, error: apiErrorMessage(e, "") };
  }
};

// one service card: its workflow, how many applications wait for this employee, and whether the employee can work on it at all.
// Covers only the employee's current ULB (every ULB x every service made the inbox hang); other ULBs load when picked.
const loadCard = async (ad) => {
  const per = [await loadPer(ad, defaultTenant())];
  return { code: ad.code, per, eligible: per.some((p) => p.eligible), count: per.reduce((n, p) => n + p.count, 0), failed: per.some((p) => p.error) && !per.some((p) => p.eligible) };
};

const Inbox = () => {
  const { t } = useTranslation();
  const tt = (k, p) => wrkText(t, k, p);
  const { url } = useRouteMatch();
  const root = url.replace(/\/inbox\/?$/, "");
  const tenants = workTenants();

  const [svc, setSvc] = useState("");
  const [tenant, setTenant] = useState(defaultTenant());
  const [status, setStatus] = useState("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  // each service loads on its own so a slow one never holds the others back
  const cardQs = useQueries(ADAPTERS.map((ad) => ({ queryKey: ["WRK_OV", ad.code], queryFn: () => loadCard(ad), refetchOnWindowFocus: false, retry: 0 })));
  const cards = ADAPTERS.map((ad, i) => cardQs[i].data || { code: ad.code, per: [], eligible: false, count: 0, failed: !!cardQs[i].isError, loading: cardQs[i].isLoading });
  const ov = { isLoading: cardQs.every((q) => q.isLoading), isError: false };
  const anyLoading = cardQs.some((q) => q.isLoading);
  const active = svc || ((cards.find((c) => c.eligible) || {}).code || "");
  const adapter = adapterByCode(active);
  const activeCard = cards.find((c) => c.code === active);
  const basePer = activeCard ? activeCard.per[0] : null;
  const otherQ = useQuery(["WRK_PER", active, tenant], () => loadPer(adapter, tenant), { enabled: !!adapter && !!basePer && tenant !== defaultTenant(), refetchOnWindowFocus: false, retry: 0 });
  const per = tenant !== defaultTenant() && otherQ.data ? otherQ.data : basePer;
  const effTenant = per ? per.tenantId : tenant;
  const statuses = status ? [status] : per ? per.mine : [];

  const list = useQuery(
    ["WRK_LIST", active, effTenant, statuses.join(","), q, page],
    () => adapter.search({ tenantId: effTenant, statuses: q ? (status ? [status] : []) : statuses, q, limit: PAGE, offset: page * PAGE }),
    { enabled: !!adapter && !!per && (statuses.length > 0 || !!q), refetchOnWindowFocus: false, retry: 0, keepPreviousData: true }
  );

  const reset = () => setPage(0);
  const pick = (code) => { setSvc(code); setStatus(""); setQ(""); setQInput(""); reset(); };
  const search = (e) => { e.preventDefault(); setQ(qInput.trim()); reset(); };
  const clear = () => { setQ(""); setQInput(""); setStatus(""); reset(); };

  if (ov.isLoading) return <div className="npt-wrap"><SevaLoader message={tt("WRK_LOADING")} /></div>;

  const eligible = cards.filter((c) => c.eligible);
  const rows = ((list.data && list.data.rows) || []).filter((r) => !isDraft(r.status));
  const total = (list.data && list.data.total) || 0;
  const statusOptions = per ? allStatuses(per.def).map((s) => ({ value: s, label: statusText(t, s) })) : [];
  const tenantOptions = tenants.filter((x) => x !== defaultTenant()).map((x) => ({ value: x, label: ulbName(x) }));
  const hasFilters = !!(q || status);

  return (
    <div className="npt-wrap wrk-inbox">
      <WRKCrumbs t={t} />
      <WRKPageHead title={tt("WRK_TITLE")} sub={tt("WRK_SUB")} />

      {ov.isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(ov.error, tt("WRK_LIST_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => ov.refetch()}>{tt("WRK_RETRY")}</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="wrk-cards" role="tablist">
            {cards.map((c) => {
              const ad = adapterByCode(c.code);
              return (
                <button key={c.code} type="button" role="tab" aria-selected={active === c.code} disabled={!c.eligible} aria-busy={!!c.loading} className={`wrk-card${active === c.code ? " is-on" : ""}`} onClick={() => pick(c.code)}>
                  <span className="wrk-card__ico"><WRKIcon name={ad.icon} size={22} /></span>
                  <span className="wrk-card__label">{tt(ad.labelKey)}</span>
                  <b className="wrk-card__n">{c.loading ? "…" : c.eligible ? c.count : c.failed ? "!" : "–"}</b>
                  <small>{c.eligible ? tt("WRK_PENDING_N", { n: c.count }) : c.failed ? tt("WRK_COUNTS_FAILED") : ""}</small>
                </button>
              );
            })}
          </div>

          {eligible.length === 0 && anyLoading ? (
            <SevaLoader message={tt("WRK_LOADING")} />
          ) : eligible.length === 0 ? (
            <div className="npt-empty">
              <WRKIcon name="list" size={40} />
              <strong>{tt("WRK_NO_SERVICES")}</strong>
              <p>{tt("WRK_NO_SERVICES_SUB")}</p>
            </div>
          ) : (
            <React.Fragment>
              <form className="wrk-filters" onSubmit={search}>
                <label className="npt-search wrk-filters__q">
                  <WRKIcon name="search" size={18} />
                  <input type="search" value={qInput} placeholder={tt(active === "tl" ? "WRK_SEARCH_PH_TL" : "WRK_SEARCH_PH")} onChange={(e) => setQInput(e.target.value)} aria-label={tt("WRK_SEARCH_PH")} />
                </label>
                {tenants.length > 1 ? (
                  <div className="wrk-filters__s">
                    <SearchSelect value={tenant === defaultTenant() ? "" : tenant} options={tenantOptions} onChange={(v) => { setTenant(v || defaultTenant()); setStatus(""); reset(); }} allLabel={ulbName(defaultTenant())} searchPlaceholder={tt("WRK_SS_SEARCH")} emptyLabel={tt("WRK_SS_NONE")} ariaLabel={tt("WRK_ULB")} />
                  </div>
                ) : null}
                <div className="wrk-filters__s">
                  <SearchSelect value={status} options={statusOptions} onChange={(v) => { setStatus(v); reset(); }} allLabel={tt("WRK_STATUS_MINE")} searchPlaceholder={tt("WRK_SS_SEARCH")} emptyLabel={tt("WRK_SS_NONE")} ariaLabel={tt("WRK_STATUS")} />
                </div>
                <button type="submit" className="npt-btn npt-btn--primary"><span>{tt("WRK_SEARCH_BTN")}</span></button>
                {hasFilters ? <button type="button" className="npt-btn npt-btn--ghost" onClick={clear}><span>{tt("WRK_CLEAR")}</span></button> : null}
              </form>

              {list.isFetching || otherQ.isFetching ? <SevaLoader fullScreen message={tt("WRK_LOADING")} /> : null}
              {list.isError ? (
                <div className="npt-lookup-error" role="alert">
                  <span>{apiErrorMessage(list.error, tt("WRK_LIST_FAILED"))}</span>
                  <button type="button" className="npt-link" onClick={() => list.refetch()}>{tt("WRK_RETRY")}</button>
                </div>
              ) : null}
              {!list.isLoading && !list.isError && rows.length === 0 ? (
                <div className="npt-empty">
                  <WRKIcon name="search" size={40} />
                  <strong>{tt("WRK_LIST_EMPTY")}</strong>
                  <p>{tt("WRK_LIST_EMPTY_SUB")}</p>
                </div>
              ) : null}
              {rows.length ? (
                <ul className="npt-prop-list wrk-list">
                  {rows.map((r) => {
                    const stage = stageOf(r.status);
                    return (
                      <li className={`npt-prop is-${stage}`} key={`${r.tenantId}-${r.id}`}>
                        <span className="npt-prop__ico"><WRKIcon name={adapter.icon} size={22} /></span>
                        <div className="npt-prop__main">
                          <strong>{r.id}</strong>
                          <span>{[r.title, r.applicant].filter(Boolean).join(" · ")}</span>
                          <small>{[tt("WRK_APPLIED_ON") + " " + fmtDate(r.appliedOn), ulbName(r.tenantId)].join(" · ")}</small>
                        </div>
                        <span className={`npt-badge npt-badge--${stage}`}>{statusText(t, r.status)}</span>
                        <Link className="npt-btn npt-btn--ghost" to={`${root}/application/${active}/${encodeURIComponent(r.id)}?tenantId=${encodeURIComponent(r.tenantId)}`}><span>{tt("WRK_OPEN")}</span></Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {total > PAGE ? (
                <div className="wrk-pager">
                  <button type="button" className="npt-btn npt-btn--ghost" disabled={page === 0} onClick={() => setPage(page - 1)}><span>{tt("WRK_PREV")}</span></button>
                  <span>{tt("WRK_SHOWING", { from: page * PAGE + 1, to: Math.min(total, (page + 1) * PAGE), total })}</span>
                  <button type="button" className="npt-btn npt-btn--ghost" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(page + 1)}><span>{tt("WRK_NEXT")}</span></button>
                </div>
              ) : null}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default Inbox;
