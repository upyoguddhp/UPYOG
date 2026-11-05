import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { nptText } from "../../../config/newPTMessages";
import { NPTCrumbs, NPTIcon, NPTPageHead } from "../../../pageComponents/NewPT/NPTLayout";
import { apiErrorMessage } from "../../../utils/newPT";

// property status -> list stage
const stageOf = (status) => (status === "ACTIVE" ? "APPROVED" : status === "INITIATED" ? "DRAFT" : "PROGRESS");
const FILTERS = ["ALL", "DRAFT", "PROGRESS", "APPROVED"];

const addressOf = (p) => {
  const a = p.address || {};
  return [a.doorNo, a.street, a.locality?.name, a.city].filter(Boolean).join(", ");
};

// Properties of the signed-in user (citizen: by mobile number; employee: whole tenant), newest first.
const MyProperties = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const tt = (k, p) => nptText(t, k, p);
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const info = Digit.UserService.getUser()?.info || {};
  const isEmployee = info.type === "EMPLOYEE";
  const tenantId = info.tenantId || Digit.ULBService.getStateId();
  const root = match.path.replace(/\/my-properties$/, "");

  const { data, isLoading, isError, error, refetch } = useQuery(
    ["NPT_MY_PROPERTIES", tenantId, info.mobileNumber],
    () => Digit.PTService.search({ tenantId, filters: isEmployee ? {} : { mobileNumber: info.mobileNumber } }),
    { refetchOnWindowFocus: false, retry: 1 }
  );

  const all = useMemo(() => [...(data?.Properties || [])].sort((a, b) => (b?.auditDetails?.createdTime || 0) - (a?.auditDetails?.createdTime || 0)), [data]);
  const counts = useMemo(() => all.reduce((c, p) => ({ ...c, [stageOf(p.status)]: (c[stageOf(p.status)] || 0) + 1 }), { ALL: all.length }), [all]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((p) => (filter === "ALL" || stageOf(p.status) === filter) && (!term || [p.propertyId, p.owners?.map((o) => o.name).join(" "), addressOf(p)].join(" ").toLowerCase().includes(term)));
  }, [all, filter, q]);

  if (isLoading) return <div className="npt-wrap"><SevaLoader /></div>;

  return (
    <div className="npt-wrap">
      <NPTCrumbs t={t} current={tt("NPT_MY_PROPS_TITLE")} />
      <div className="npt-listhead">
        <NPTPageHead title={tt("NPT_MY_PROPS_TITLE")} sub={tt("NPT_MY_PROPS_SUB")} />
        <Link to={`${root}/new-registration`} className="npt-btn npt-btn--primary">
          <NPTIcon name="plus" size={18} /><span>{tt("NPT_MY_PROPS_NEW")}</span>
        </Link>
      </div>

      {isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(error, tt("NPT_MY_PROPS_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => refetch()}>{tt("NPT_RETRY")}</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="npt-filters">
            <div className="npt-chips" role="tablist">
              {FILTERS.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} className={`npt-chip${filter === f ? " is-on" : ""}`} onClick={() => setFilter(f)}>
                  {tt(`NPT_FILTER_${f}`)} <b>{counts[f] || 0}</b>
                </button>
              ))}
            </div>
            <label className="npt-search">
              <NPTIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("NPT_SEARCH_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("NPT_SEARCH_PH")} />
            </label>
          </div>

          {all.length === 0 ? (
            <div className="npt-empty">
              <NPTIcon name="building" size={40} />
              <strong>{tt("NPT_MY_PROPS_EMPTY")}</strong>
              <p>{tt("NPT_START_HINT")}</p>
              <Link to={`${root}/new-registration`} className="npt-btn npt-btn--primary"><span>{tt("NPT_MY_PROPS_NEW")}</span></Link>
            </div>
          ) : shown.length === 0 ? (
            <div className="npt-empty">
              <NPTIcon name="search" size={40} />
              <strong>{tt("NPT_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setFilter("ALL"); }}><span>{tt("NPT_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {shown.map((p) => {
                const stage = stageOf(p.status);
                return (
                  <li className={`npt-prop is-${stage.toLowerCase()}`} key={p.propertyId || p.id}>
                    <span className="npt-prop__ico"><NPTIcon name="building" size={22} /></span>
                    <div className="npt-prop__main">
                      <strong>{p.propertyId}</strong>
                      <span>{tt("NPT_LIST_KIND")} · {p.owners?.[0]?.name || "-"}</span>
                      {addressOf(p) ? <small>{addressOf(p)}</small> : null}
                    </div>
                    <span className={`npt-badge npt-badge--${stage.toLowerCase()}`}>{tt(`NPT_STAGE_${stage}`)}</span>
                    {stage !== "DRAFT" ? (
                      <Link className="npt-btn npt-btn--ghost npt-btn--sm" to={`${root}/application/${encodeURIComponent(p.propertyId)}?tenantId=${p.tenantId}`}><span>{tt("NPT_VIEW_OPEN")}</span></Link>
                    ) : null}
                    {stage === "APPROVED" ? (
                      <Link className="npt-btn npt-btn--ghost npt-btn--sm" to={`/digit-ui/citizen/pt/property/${p.propertyId}`}><span>{tt("NPT_PAY_TAX")}</span></Link>
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

export default MyProperties;
