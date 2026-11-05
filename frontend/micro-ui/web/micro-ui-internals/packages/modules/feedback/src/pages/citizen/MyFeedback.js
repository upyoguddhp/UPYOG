import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { fdbText } from "../../config/feedbackMessages";
import { FDBCrumbs, FDBIcon, FDBPageHead } from "../../pageComponents/FeedbackLayout";
import { FDB_FILTERS, FeedbackApi, apiErrorMessage, fdbStageOf, getUserInfo, humanise, servicesOf, statusKey } from "../../utils/feedback";

// The signed-in citizen's feedback (feedback-service /submission/_search by mobile number), newest first.
const MyFeedback = () => {
  const { t } = useTranslation();
  const tt = (k, p) => fdbText(t, k, p);
  const match = useRouteMatch();
  const root = match.path.replace(/\/my-feedback$/, "");
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const mobile = getUserInfo().mobileNumber;

  const mine = useQuery(["FDB_MINE", mobile], () => FeedbackApi.searchMine(mobile), { refetchOnWindowFocus: false, retry: 1, enabled: !!mobile });
  const svcQ = useQuery(["FDB_SERVICES"], FeedbackApi.services, { refetchOnWindowFocus: false, retry: 0 });
  const nameOf = (code) => {
    if (code === "GENERAL") return tt("FDB_GENERAL_SERVICE");
    const s = servicesOf(svcQ.data).find((x) => x.serviceCode === code);
    return s ? s.serviceName : humanise(code);
  };

  const all = useMemo(() => [...(Array.isArray(mine.data) ? mine.data : [])].sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0)), [mine.data]);
  const counts = useMemo(() => all.reduce((c, r) => ({ ...c, [fdbStageOf(r.status)]: (c[fdbStageOf(r.status)] || 0) + 1 }), { ALL: all.length }), [all]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((r) => (filter === "ALL" || fdbStageOf(r.status) === filter) && (!term || [r.applicationNo, nameOf(r.serviceId)].join(" ").toLowerCase().includes(term)));
  }, [all, filter, q, svcQ.data, t]);

  if (mine.isLoading && mobile) return <div className="npt-wrap"><SevaLoader message={tt("FDB_LOADING")} /></div>;

  return (
    <div className="npt-wrap">
      <FDBCrumbs t={t} current={tt("FDB_LIST_TITLE")} />
      <div className="npt-listhead">
        <FDBPageHead title={tt("FDB_LIST_TITLE")} sub={tt("FDB_LIST_SUB")} />
        <Link to={`${root}/new`} className="npt-btn npt-btn--primary"><FDBIcon name="plus" size={18} /><span>{tt("FDB_NEW_BTN")}</span></Link>
      </div>

      {mine.isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(mine.error, tt("FDB_LIST_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => mine.refetch()}>{tt("FDB_RETRY")}</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="npt-filters">
            <div className="npt-chips" role="tablist">
              {FDB_FILTERS.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} className={`npt-chip${filter === f ? " is-on" : ""}`} onClick={() => setFilter(f)}>
                  {tt(`FDB_FILTER_${f}`)} <b>{counts[f] || 0}</b>
                </button>
              ))}
            </div>
            <label className="npt-search">
              <FDBIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("FDB_SEARCH_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("FDB_SEARCH_PH")} />
            </label>
          </div>

          {all.length === 0 ? (
            <div className="npt-empty">
              <FDBIcon name="chat" size={40} />
              <strong>{tt("FDB_LIST_EMPTY")}</strong>
              <p>{tt("FDB_LIST_EMPTY_HINT")}</p>
              <Link to={`${root}/new`} className="npt-btn npt-btn--primary"><span>{tt("FDB_NEW_BTN")}</span></Link>
            </div>
          ) : shown.length === 0 ? (
            <div className="npt-empty">
              <FDBIcon name="search" size={40} />
              <strong>{tt("FDB_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setFilter("ALL"); }}><span>{tt("FDB_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {shown.map((r) => {
                const stage = fdbStageOf(r.status).toLowerCase();
                return (
                  <li className={`npt-prop is-${stage}`} key={r.applicationNo || r.id}>
                    <span className="npt-prop__ico"><FDBIcon name="chat" size={22} /></span>
                    <div className="npt-prop__main">
                      <strong>{r.applicationNo}</strong>
                      <span>{nameOf(r.serviceId)}</span>
                      <small>{r.rating ? tt("FDB_STAR", { n: r.rating }) : ""}</small>
                    </div>
                    <span className={`npt-badge npt-badge--${stage}`}>{t(statusKey(r.status), { defaultValue: humanise(r.status) })}</span>
                    <Link className="npt-btn npt-btn--ghost" to={`${root}/application/${encodeURIComponent(r.applicationNo)}`}><span>{tt("FDB_VIEW_OPEN")}</span></Link>
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

export default MyFeedback;
