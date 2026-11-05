import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { RQS_FILTERS, rqsStageOf } from "../../config/reqsvcConfig";
import { rqsText } from "../../config/reqsvcMessages";
import { RQSCrumbs, RQSIcon, RQSPageHead } from "../../pageComponents/ReqsvcLayout";
import { statusText } from "../../pageComponents/ReqsvcParts";
import { RequestApi, amountOf, apiErrorMessage, challansOf, createdOf, fmtTime, inr, payPath, statusOf } from "../../utils/reqsvc";

// The signed-in citizen's requests, newest first, with stage filters and a search box.
const MyRequests = () => {
  const { t } = useTranslation();
  const tt = (k, p) => rqsText(t, k, p);
  const match = useRouteMatch();
  const root = match.url.replace(/\/my-requests$/, ""); // .../reqsvc
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery(["RQS_MINE"], RequestApi.searchMine, { refetchOnWindowFocus: false, retry: 1 });
  const all = useMemo(() => [...challansOf(data)].sort((a, b) => createdOf(b) - createdOf(a)), [data]);
  const stageOf = (c) => rqsStageOf(statusOf(c));
  const counts = useMemo(() => all.reduce((c, r) => ({ ...c, [stageOf(r)]: (c[stageOf(r)] || 0) + 1 }), { ALL: all.length }), [all]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((c) => (filter === "ALL" || stageOf(c) === filter) && (!term || [c.challanNo, c.description].join(" ").toLowerCase().includes(term)));
  }, [all, filter, q]);

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("RQS_LOADING")} /></div>;

  return (
    <div className="npt-wrap">
      <RQSCrumbs t={t} current={tt("RQS_LIST_TITLE")} />
      <div className="npt-listhead">
        <RQSPageHead title={tt("RQS_LIST_TITLE")} sub={tt("RQS_LIST_SUB")} />
        <Link to={`${root}/new/request`} className="npt-btn npt-btn--primary">
          <RQSIcon name="plus" size={18} /><span>{tt("RQS_NEW")}</span>
        </Link>
      </div>

      {isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(error, tt("RQS_LIST_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => refetch()}>{tt("RQS_RETRY")}</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="npt-filters">
            <div className="npt-chips" role="tablist">
              {RQS_FILTERS.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} className={`npt-chip${filter === f ? " is-on" : ""}`} onClick={() => setFilter(f)}>
                  {tt(`RQS_FILTER_${f}`)} <b>{counts[f] || 0}</b>
                </button>
              ))}
            </div>
            <label className="npt-search">
              <RQSIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("RQS_SEARCH_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("RQS_SEARCH_PH")} />
            </label>
          </div>

          {all.length === 0 ? (
            <div className="npt-empty">
              <RQSIcon name="list" size={40} />
              <strong>{tt("RQS_LIST_EMPTY")}</strong>
              <p>{tt("RQS_START_HINT")}</p>
              <Link to={`${root}/new/request`} className="npt-btn npt-btn--primary"><span>{tt("RQS_NEW")}</span></Link>
            </div>
          ) : shown.length === 0 ? (
            <div className="npt-empty">
              <RQSIcon name="search" size={40} />
              <strong>{tt("RQS_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setFilter("ALL"); }}><span>{tt("RQS_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {shown.map((c) => {
                const stage = stageOf(c).toLowerCase();
                const status = statusOf(c);
                return (
                  <li className={`npt-prop is-${stage}`} key={c.challanNo || c.id}>
                    <span className="npt-prop__ico"><RQSIcon name="list" size={22} /></span>
                    <div className="npt-prop__main">
                      <strong>{c.challanNo}</strong>
                      <span>{c.description || "-"}</span>
                      <small>{[inr(amountOf(c)), fmtTime(createdOf(c))].filter(Boolean).join(" · ")}</small>
                    </div>
                    <span className={`npt-badge npt-badge--${stage}`}>{statusText(t, status)}</span>
                    <Link className="npt-btn npt-btn--ghost" to={`${root}/application/${encodeURIComponent(c.challanNo)}`}><span>{tt("RQS_VIEW_OPEN")}</span></Link>
                    {status === "ACTIVE" ? (
                      <Link className="npt-btn npt-btn--primary" to={{ pathname: payPath(c), state: { tenantId: c.tenantId, applicationNumber: c.challanNo } }}>
                        <span>{tt("RQS_PAY_NOW")}</span>
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
