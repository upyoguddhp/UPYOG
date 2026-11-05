import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { grbText } from "../../../config/newGRBMessages";
import { GRBCrumbs, GRBIcon, GRBPageHead } from "../../../pageComponents/NewGRB/GRBLayout";
import { GarbageApi, apiErrorMessage, applicationNoOf } from "../../../utils/newGRB";

// application status -> list stage
const stageOf = (status) => (status === "APPROVED" ? "APPROVED" : status === "INITIATED" ? "DRAFT" : "PROGRESS");
const statusOf = (a) => (a.grbgApplication && a.grbgApplication.status) || a.status;
const FILTERS = ["ALL", "DRAFT", "PROGRESS", "APPROVED"];
const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());

// The signed-in citizen's garbage collection applications (garbage-service /garbage-accounts/_search), newest first.
const MyRegistrations = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const tt = (k, p) => grbText(t, k, p);
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const info = (Digit.UserService.getUser() || {}).info || {};
  const root = match.path.replace(/\/my-registrations$/, "");

  const { data, isLoading, isError, error, refetch } = useQuery(
    ["GRB_MY_REGISTRATIONS", info.mobileNumber],
    () => GarbageApi.searchMine(info.mobileNumber),
    { refetchOnWindowFocus: false, retry: 1 }
  );

  const createdOf = (a) => (a.auditDetails || {}).createdTime || (a.auditDetails || {}).createdDate || 0;
  const all = useMemo(() => [...((data && data.garbageAccounts) || [])].sort((a, b) => createdOf(b) - createdOf(a)), [data]);
  const counts = useMemo(() => all.reduce((c, l) => ({ ...c, [stageOf(statusOf(l))]: (c[stageOf(statusOf(l))] || 0) + 1 }), { ALL: all.length }), [all]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((l) => (filter === "ALL" || stageOf(statusOf(l)) === filter) && (!term || [applicationNoOf(l), l.name, l.systemPropertyId, l.propertyId].join(" ").toLowerCase().includes(term)));
  }, [all, filter, q]);

  if (isLoading) return <div className="npt-wrap"><SevaLoader /></div>;

  return (
    <div className="npt-wrap">
      <GRBCrumbs t={t} current={tt("GRB_MY_APPS_TITLE")} />
      <div className="npt-listhead">
        <GRBPageHead title={tt("GRB_MY_APPS_TITLE")} sub={tt("GRB_MY_APPS_SUB")} />
        <Link to={`${root}/new-registration`} className="npt-btn npt-btn--primary">
          <GRBIcon name="plus" size={18} /><span>{tt("GRB_MY_APPS_NEW")}</span>
        </Link>
      </div>

      {isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(error, tt("GRB_MY_APPS_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => refetch()}>{tt("GRB_RETRY")}</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="npt-filters">
            <div className="npt-chips" role="tablist">
              {FILTERS.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} className={`npt-chip${filter === f ? " is-on" : ""}`} onClick={() => setFilter(f)}>
                  {tt(`GRB_FILTER_${f}`)} <b>{counts[f] || 0}</b>
                </button>
              ))}
            </div>
            <label className="npt-search">
              <GRBIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("GRB_SEARCH_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("GRB_SEARCH_PH")} />
            </label>
          </div>

          {all.length === 0 ? (
            <div className="npt-empty">
              <GRBIcon name="building" size={40} />
              <strong>{tt("GRB_MY_APPS_EMPTY")}</strong>
              <p>{tt("GRB_START_HINT")}</p>
              <Link to={`${root}/new-registration`} className="npt-btn npt-btn--primary"><span>{tt("GRB_MY_APPS_NEW")}</span></Link>
            </div>
          ) : shown.length === 0 ? (
            <div className="npt-empty">
              <GRBIcon name="search" size={40} />
              <strong>{tt("GRB_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setFilter("ALL"); }}><span>{tt("GRB_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {shown.map((l) => {
                const stage = stageOf(statusOf(l));
                const addr = (l.addresses || [])[0] || {};
                const unit = (l.grbgCollectionUnits || [])[0] || {};
                const pid = l.systemPropertyId || l.propertyId;
                return (
                  <li className={`npt-prop is-${stage.toLowerCase()}`} key={applicationNoOf(l) || l.id}>
                    <span className="npt-prop__ico"><GRBIcon name="building" size={22} /></span>
                    <div className="npt-prop__main">
                      <strong>{applicationNoOf(l)}</strong>
                      <span>{[l.name, unit.category].filter(Boolean).join(" · ") || "-"}</span>
                      <small>{[pid && `${tt("GRB_F_propertyId")}: ${pid}`, addr.ulbName && `${tt("GRB_COL_ULB")}: ${addr.ulbName}`].filter(Boolean).join(" · ")}</small>
                    </div>
                    <span className={`npt-badge npt-badge--${stage.toLowerCase()}`}>{t(`WF_GB_${statusOf(l)}`, { defaultValue: humanise(statusOf(l)) })}</span>
                    {statusOf(l) === "PENDINGFORMODIFICATION" ? <span className="npt-badge npt-badge--draft">{tt("GRB_LC_BADGE_MODIFICATION")}</span> : null}
                    {statusOf(l) === "CLOSED" ? <span className="npt-badge npt-badge--draft">{tt("GRB_LC_BADGE_CLOSED")}</span> : null}
                    {statusOf(l) !== "INITIATED" ? (
                      <Link className="npt-btn npt-btn--ghost" to={`${root}/application/${encodeURIComponent(applicationNoOf(l))}`}><span>{tt("GRB_VIEW_OPEN")}</span></Link>
                    ) : null}
                    {statusOf(l) === "APPROVED" ? (
                      <Link className="npt-btn npt-btn--ghost" to={`${root}/modify/${encodeURIComponent(applicationNoOf(l))}`}><span>{tt("GRB_LC_MODIFY")}</span></Link>
                    ) : null}
                    {statusOf(l) === "PENDINGFORMODIFICATION" ? (
                      <Link className="npt-btn npt-btn--ghost" to={`${root}/modify/${encodeURIComponent(applicationNoOf(l))}`}><span>{tt("GRB_LC_CONTINUE_MODIFY")}</span></Link>
                    ) : null}
                    {statusOf(l) === "APPROVED" && l.businessService === "GB_CITIZEN" ? (
                      <Link className="npt-btn npt-btn--ghost" to={`${root}/close/${encodeURIComponent(applicationNoOf(l))}`}><span>{tt("GRB_LC_CLOSE")}</span></Link>
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

export default MyRegistrations;
