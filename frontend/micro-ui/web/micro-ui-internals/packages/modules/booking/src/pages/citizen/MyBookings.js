import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useParams, useRouteMatch } from "react-router-dom";
import { BKG_FILTERS, BKG_SERVICES, bkgStageOf } from "../../config/bookingConfig";
import { bkgText } from "../../config/bookingMessages";
import { BKGCrumbs, BKGIcon, BKGPageHead } from "../../pageComponents/BookingLayout";
import { statusText } from "../../pageComponents/BookingParts";
import { AssetApi, SiteApi, apiErrorMessage, applicationNoOf, createdOf, rowOf, statusOf } from "../../utils/booking";

// The signed-in citizen's bookings of one kind, newest first, with stage filters and a search box.
const MyBookings = () => {
  const { t } = useTranslation();
  const { svc } = useParams();
  const cfg = BKG_SERVICES[svc];
  const tt = (k, p) => bkgText(t, k, p);
  const match = useRouteMatch();
  const root = match.url.replace(/\/my-bookings$/, ""); // .../booking/<svc>
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery(["BKG_MINE", svc], svc === "site" ? SiteApi.searchMine : AssetApi.searchMine, { refetchOnWindowFocus: false, retry: 1 });
  const all = useMemo(() => {
    const recs = svc === "site" ? (data || {}).SiteBookings : (data || {}).hallsBookingApplication;
    return [...(recs || [])].sort((a, b) => createdOf(b) - createdOf(a));
  }, [data, svc]);
  const stageOf = (r) => bkgStageOf(statusOf(svc, r));
  const counts = useMemo(() => all.reduce((c, r) => ({ ...c, [stageOf(r)]: (c[stageOf(r)] || 0) + 1 }), { ALL: all.length }), [all]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((r) => {
      const row = rowOf(svc, r);
      return (filter === "ALL" || stageOf(r) === filter) && (!term || [row.id, row.title, row.line].join(" ").toLowerCase().includes(term));
    });
  }, [all, filter, q]);

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("BKG_LOADING")} /></div>;

  return (
    <div className="npt-wrap">
      <BKGCrumbs t={t} svc={svc} current={tt(cfg.listTitle)} />
      <div className="npt-listhead">
        <BKGPageHead title={tt(cfg.listTitle)} sub={tt(cfg.listSub)} />
        <Link to={`${root}/new/select`} className="npt-btn npt-btn--primary">
          <BKGIcon name="plus" size={18} /><span>{tt(svc === "site" ? "BKG_NEW_SITE" : "BKG_NEW_ASSET")}</span>
        </Link>
      </div>

      {isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(error, tt("BKG_LIST_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => refetch()}>{tt("BKG_RETRY")}</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="npt-filters">
            <div className="npt-chips" role="tablist">
              {BKG_FILTERS.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} className={`npt-chip${filter === f ? " is-on" : ""}`} onClick={() => setFilter(f)}>
                  {tt(`BKG_FILTER_${f}`)} <b>{counts[f] || 0}</b>
                </button>
              ))}
            </div>
            <label className="npt-search">
              <BKGIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("BKG_SEARCH_APPS_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("BKG_SEARCH_APPS_PH")} />
            </label>
          </div>

          {all.length === 0 ? (
            <div className="npt-empty">
              <BKGIcon name="building" size={40} />
              <strong>{tt("BKG_LIST_EMPTY")}</strong>
              <p>{tt(svc === "site" ? "BKG_START_HINT_SITE" : "BKG_START_HINT_ASSET")}</p>
              <Link to={`${root}/new/select`} className="npt-btn npt-btn--primary"><span>{tt(svc === "site" ? "BKG_NEW_SITE" : "BKG_NEW_ASSET")}</span></Link>
            </div>
          ) : shown.length === 0 ? (
            <div className="npt-empty">
              <BKGIcon name="search" size={40} />
              <strong>{tt("BKG_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setFilter("ALL"); }}><span>{tt("BKG_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {shown.map((r) => {
                const row = rowOf(svc, r);
                const stage = stageOf(r).toLowerCase();
                const appNo = applicationNoOf(svc, r);
                return (
                  <li className={`npt-prop is-${stage}`} key={appNo || r.uuid || r.bookingId}>
                    <span className="npt-prop__ico"><BKGIcon name={svc === "site" ? "map" : "building"} size={22} /></span>
                    <div className="npt-prop__main">
                      <strong>{appNo}</strong>
                      <span>{row.title || "-"}</span>
                      <small>{[row.line, row.period].filter(Boolean).join(" · ")}</small>
                    </div>
                    <span className={`npt-badge npt-badge--${stage}`}>{statusText(t, row.status)}</span>
                    {row.status === "INITIATED" ? null : (
                      <Link className="npt-btn npt-btn--ghost" to={`${root}/application/${encodeURIComponent(appNo)}`}><span>{tt("BKG_VIEW_OPEN")}</span></Link>
                    )}
                    {row.status === "PENDINGFORPAYMENT" ? (
                      <Link className="npt-btn npt-btn--primary" to={{ pathname: `/digit-ui/citizen/payment/my-bills/${cfg.businessService}/${appNo}`, state: { tenantId: row.tenantId, applicationNumber: appNo } }}>
                        <span>{tt("BKG_PAY_NOW")}</span>
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default MyBookings;
