import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { ntlText } from "../../../config/newTLMessages";
import { NTLCrumbs, NTLIcon, NTLPageHead } from "../../../pageComponents/NewTL/NTLLayout";
import { apiErrorMessage } from "../../../utils/newTL";
import { lifecycleActions, lifecycleLink } from "../../../utils/newTLLifecycle";
import { NTL_TYPE_KEYS } from "../../../config/newTLConfig";

// licence status -> list stage
const stageOf = (status) => (status === "APPROVED" ? "APPROVED" : status === "INITIATED" ? "DRAFT" : "PROGRESS");
const FILTERS = ["ALL", "DRAFT", "PROGRESS", "APPROVED"];
const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());

// The signed-in citizen's trade licence applications (tl-services /v1/NewTL/_search), newest first.
const MyRegistrations = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const tt = (k, p) => ntlText(t, k, p);
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const info = (Digit.UserService.getUser() || {}).info || {};
  const tenantId = info.tenantId || Digit.ULBService.getStateId();
  const root = match.path.replace(/\/my-registrations$/, "");

  const { data, isLoading, isError, error, refetch } = useQuery(
    ["NTL_MY_REGISTRATIONS", tenantId],
    () => Digit.TLService.newTLSearch({ tenantId }, "NewTL"),
    { refetchOnWindowFocus: false, retry: 1 }
  );

  const all = useMemo(() => [...((data && data.Licenses) || [])].sort((a, b) => ((b.auditDetails || {}).createdTime || 0) - ((a.auditDetails || {}).createdTime || 0)), [data]);
  const counts = useMemo(() => all.reduce((c, l) => ({ ...c, [stageOf(l.status)]: (c[stageOf(l.status)] || 0) + 1 }), { ALL: all.length }), [all]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((l) => (filter === "ALL" || stageOf(l.status) === filter) && (!term || [l.applicationNumber, l.tradeName, l.propertyId].join(" ").toLowerCase().includes(term)));
  }, [all, filter, q]);

  if (isLoading) return <div className="npt-wrap"><SevaLoader /></div>;

  return (
    <div className="npt-wrap">
      <NTLCrumbs t={t} current={tt("NTL_MY_APPS_TITLE")} />
      <div className="npt-listhead">
        <NTLPageHead title={tt("NTL_MY_APPS_TITLE")} sub={tt("NTL_MY_APPS_SUB")} />
        <Link to={`${root}/new-registration`} className="npt-btn npt-btn--primary">
          <NTLIcon name="plus" size={18} /><span>{tt("NTL_MY_APPS_NEW")}</span>
        </Link>
      </div>

      {isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(error, tt("NTL_MY_APPS_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => refetch()}>{tt("NTL_RETRY")}</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="npt-filters">
            <div className="npt-chips" role="tablist">
              {FILTERS.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} className={`npt-chip${filter === f ? " is-on" : ""}`} onClick={() => setFilter(f)}>
                  {tt(`NTL_FILTER_${f}`)} <b>{counts[f] || 0}</b>
                </button>
              ))}
            </div>
            <label className="npt-search">
              <NTLIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("NTL_SEARCH_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("NTL_SEARCH_PH")} />
            </label>
          </div>

          {all.length === 0 ? (
            <div className="npt-empty">
              <NTLIcon name="building" size={40} />
              <strong>{tt("NTL_MY_APPS_EMPTY")}</strong>
              <p>{tt("NTL_START_HINT")}</p>
              <Link to={`${root}/new-registration`} className="npt-btn npt-btn--primary"><span>{tt("NTL_MY_APPS_NEW")}</span></Link>
            </div>
          ) : shown.length === 0 ? (
            <div className="npt-empty">
              <NTLIcon name="search" size={40} />
              <strong>{tt("NTL_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setFilter("ALL"); }}><span>{tt("NTL_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {shown.map((l) => {
                const stage = stageOf(l.status);
                const ulb = ((l.tradeLicenseDetail || {}).address || {}).additionalDetail;
                return (
                  <li className={`npt-prop is-${stage.toLowerCase()}`} key={l.applicationNumber || l.id}>
                    <span className="npt-prop__ico"><NTLIcon name="building" size={22} /></span>
                    <div className="npt-prop__main">
                      <strong>{l.applicationNumber}</strong>
                      <span>{[l.tradeName || "-", tt(NTL_TYPE_KEYS[l.applicationType] || "NTL_TYPE_NEW")].join(" · ")}</span>
                      <small>{[l.propertyId && `${tt("NTL_F_propertyId")}: ${l.propertyId}`, ulb && ulb.ulbName && `${tt("NTL_COL_ULB")}: ${ulb.ulbName}`].filter(Boolean).join(" · ")}</small>
                    </div>
                    <span className={`npt-badge npt-badge--${stage.toLowerCase()}`}>{t(`WF_NEWTL_${l.status}`, { defaultValue: humanise(l.status) })}</span>
                    {l.status !== "INITIATED" ? (
                      <Link className="npt-btn npt-btn--ghost" to={`${root}/application/${encodeURIComponent(l.applicationNumber)}?tenantId=${l.tenantId}&id=${l.id}`}><span>{tt("NTL_VIEW_OPEN")}</span></Link>
                    ) : null}
                    {lifecycleActions(l, all).map((a) => (
                      <Link key={a.mode} className="npt-btn npt-btn--ghost" to={lifecycleLink(root, a.mode, l)}>
                        <span>{a.resume ? tt(`NTL_LC_BTN_CONTINUE_${a.mode.toUpperCase()}`) : tt(`NTL_LC_BTN_${a.mode.toUpperCase()}`)}</span>
                      </Link>
                    ))}
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
