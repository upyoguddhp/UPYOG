import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { HNC_FILTERS, NOC_TYPE_KEYS, hncStageOf } from "../../config/hpnocConfig";
import { rqsText } from "../../config/hpnocMessages";
import { HNCCrumbs, HNCIcon, HNCPageHead } from "../../pageComponents/HpnocLayout";
import { statusText } from "../../pageComponents/HpnocParts";
import { NocApi, apiErrorMessage, appNoOf, createdOf, detailsOf, fmtTime, nocsOf, payPath, statusOf } from "../../utils/hpnoc";

// The signed-in citizen's requests, newest first, with stage filters and a search box.
const MyRequests = () => {
  const { t } = useTranslation();
  const tt = (k, p) => rqsText(t, k, p);
  const match = useRouteMatch();
  const root = match.url.replace(/\/my-requests$/, ""); // .../hpnoc
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery(["HNC_MINE"], NocApi.searchMine, { refetchOnWindowFocus: false, retry: 1 });
  const all = useMemo(() => [...nocsOf(data)].sort((a, b) => createdOf(b) - createdOf(a)), [data]);
  const stageOf = (c) => hncStageOf(statusOf(c));
  const counts = useMemo(() => all.reduce((c, r) => ({ ...c, [stageOf(r)]: (c[stageOf(r)] || 0) + 1 }), { ALL: all.length }), [all]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((c) => (filter === "ALL" || stageOf(c) === filter) && (!term || [appNoOf(c), detailsOf(c).typeOfNoc, detailsOf(c).reason].join(" ").toLowerCase().includes(term)));
  }, [all, filter, q]);

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("HNC_LOADING")} /></div>;

  return (
    <div className="npt-wrap">
      <HNCCrumbs t={t} current={tt("HNC_LIST_TITLE")} />
      <div className="npt-listhead">
        <HNCPageHead title={tt("HNC_LIST_TITLE")} sub={tt("HNC_LIST_SUB")} />
        <Link to={`${root}/new/noc`} className="npt-btn npt-btn--primary">
          <HNCIcon name="plus" size={18} /><span>{tt("HNC_NEW")}</span>
        </Link>
      </div>

      {isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(error, tt("HNC_LIST_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => refetch()}>{tt("HNC_RETRY")}</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="npt-filters">
            <div className="npt-chips" role="tablist">
              {HNC_FILTERS.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} className={`npt-chip${filter === f ? " is-on" : ""}`} onClick={() => setFilter(f)}>
                  {tt(`HNC_FILTER_${f}`)} <b>{counts[f] || 0}</b>
                </button>
              ))}
            </div>
            <label className="npt-search">
              <HNCIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("HNC_SEARCH_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("HNC_SEARCH_PH")} />
            </label>
          </div>

          {all.length === 0 ? (
            <div className="npt-empty">
              <HNCIcon name="list" size={40} />
              <strong>{tt("HNC_LIST_EMPTY")}</strong>
              <p>{tt("HNC_START_HINT")}</p>
              <Link to={`${root}/new/noc`} className="npt-btn npt-btn--primary"><span>{tt("HNC_NEW")}</span></Link>
            </div>
          ) : shown.length === 0 ? (
            <div className="npt-empty">
              <HNCIcon name="search" size={40} />
              <strong>{tt("HNC_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setFilter("ALL"); }}><span>{tt("HNC_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {shown.map((c) => {
                const stage = stageOf(c).toLowerCase();
                const status = statusOf(c);
                return (
                  <li className={`npt-prop is-${stage}`} key={c.applicationNo || c.id}>
                    <span className="npt-prop__ico"><HNCIcon name="list" size={22} /></span>
                    <div className="npt-prop__main">
                      <strong>{appNoOf(c)}</strong>
                      <span>{detailsOf(c).typeOfNoc ? tt(NOC_TYPE_KEYS[detailsOf(c).typeOfNoc] || "HNC_TITLE_NOC") : "-"}</span>
                      <small>{[(detailsOf(c).propertyDetail || {}).ulbName, fmtTime(createdOf(c))].filter(Boolean).join(" · ")}</small>
                    </div>
                    <span className={`npt-badge npt-badge--${stage}`}>{statusText(t, status)}</span>
                    <Link className="npt-btn npt-btn--ghost" to={`${root}/application/${encodeURIComponent(appNoOf(c))}`}><span>{tt("HNC_VIEW_OPEN")}</span></Link>
                    {status === "PENDINGFORPAYMENT" ? (
                      <Link className="npt-btn npt-btn--primary" to={{ pathname: payPath(c), state: { tenantId: c.tenantId, applicationNumber: appNoOf(c) } }}>
                        <span>{tt("HNC_PAY_NOW")}</span>
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

export default MyRequests;
