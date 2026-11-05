import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { GRV_FILTERS, grvStageOf } from "../../config/grievanceConfig";
import { grvText } from "../../config/grievanceMessages";
import { GRVCrumbs, GRVIcon, GRVPageHead } from "../../pageComponents/GrievanceLayout";
import { statusText } from "../../pageComponents/GrievanceParts";
import { useServiceDefs } from "../../pageComponents/useGRVLookups";
import { GrievanceApi, apiErrorMessage, createdOf, defNameOf, fmtTime, humanise, servicesOf, statusOf } from "../../utils/grievance";

// The signed-in citizen's requests, newest first, with stage filters and a search box.
const MyGrievances = () => {
  const { t } = useTranslation();
  const tt = (k, p) => grvText(t, k, p);
  const match = useRouteMatch();
  const root = match.url.replace(/\/my-grievances$/, ""); // .../grievance
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery(["GRV_MINE"], GrievanceApi.searchMine, { refetchOnWindowFocus: false, retry: 1 });
  const { defs } = useServiceDefs();
  const all = useMemo(() => [...servicesOf(data)].sort((a, b) => createdOf(b) - createdOf(a)), [data]);
  const stageOf = (c) => grvStageOf(statusOf(c));
  const counts = useMemo(() => all.reduce((c, r) => ({ ...c, [stageOf(r)]: (c[stageOf(r)] || 0) + 1 }), { ALL: all.length }), [all]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((c) => (filter === "ALL" || stageOf(c) === filter) && (!term || [c.serviceRequestId, c.description, defNameOf(defs, c.serviceCode), (c.additionalDetail || {}).grievanceType].join(" ").toLowerCase().includes(term)));
  }, [all, filter, q, defs]);

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("GRV_LOADING")} /></div>;

  return (
    <div className="npt-wrap">
      <GRVCrumbs t={t} current={tt("GRV_LIST_TITLE")} />
      <div className="npt-listhead">
        <GRVPageHead title={tt("GRV_LIST_TITLE")} sub={tt("GRV_LIST_SUB")} />
        <Link to={`${root}/new/grievance`} className="npt-btn npt-btn--primary">
          <GRVIcon name="plus" size={18} /><span>{tt("GRV_NEW")}</span>
        </Link>
      </div>

      {isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(error, tt("GRV_LIST_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => refetch()}>{tt("GRV_RETRY")}</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="npt-filters">
            <div className="npt-chips" role="tablist">
              {GRV_FILTERS.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} className={`npt-chip${filter === f ? " is-on" : ""}`} onClick={() => setFilter(f)}>
                  {tt(`GRV_FILTER_${f}`)} <b>{counts[f] || 0}</b>
                </button>
              ))}
            </div>
            <label className="npt-search">
              <GRVIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("GRV_SEARCH_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("GRV_SEARCH_PH")} />
            </label>
          </div>

          {all.length === 0 ? (
            <div className="npt-empty">
              <GRVIcon name="list" size={40} />
              <strong>{tt("GRV_LIST_EMPTY")}</strong>
              <p>{tt("GRV_START_HINT")}</p>
              <Link to={`${root}/new/grievance`} className="npt-btn npt-btn--primary"><span>{tt("GRV_NEW")}</span></Link>
            </div>
          ) : shown.length === 0 ? (
            <div className="npt-empty">
              <GRVIcon name="search" size={40} />
              <strong>{tt("GRV_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setFilter("ALL"); }}><span>{tt("GRV_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {shown.map((c) => {
                const stage = stageOf(c).toLowerCase();
                const status = statusOf(c);
                return (
                  <li className={`npt-prop is-${stage}`} key={c.serviceRequestId || c.id}>
                    <span className="npt-prop__ico"><GRVIcon name="list" size={22} /></span>
                    <div className="npt-prop__main">
                      <strong>{c.serviceRequestId}</strong>
                      <span>{[humanise((c.additionalDetail || {}).grievanceType), defNameOf(defs, c.serviceCode)].filter(Boolean).join(" · ")}</span>
                      <small>{[(c.address || {}).city, fmtTime(createdOf(c))].filter(Boolean).join(" · ")}</small>
                    </div>
                    <span className={`npt-badge npt-badge--${stage}`}>{statusText(t, status)}</span>
                    <Link className="npt-btn npt-btn--ghost" to={`${root}/application/${encodeURIComponent(c.serviceRequestId)}?tenantId=${encodeURIComponent(c.tenantId || "")}`}><span>{tt("GRV_VIEW_OPEN")}</span></Link>
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

export default MyGrievances;
