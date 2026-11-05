import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { nprText } from "../../../config/newPetMessages";
import { NPRCrumbs, NPRIcon, NPRPageHead } from "../../../pageComponents/NewPet/NPRLayout";
import { apiErrorMessage, canRenew } from "../../../utils/newPet";

// application status -> list stage
const stageOf = (status) => (status === "APPROVED" ? "APPROVED" : status === "INITIATED" ? "DRAFT" : "PROGRESS");
const FILTERS = ["ALL", "DRAFT", "PROGRESS", "APPROVED"];
const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());

// The signed-in citizen's pet registration applications (pet-services /pet-registration/_search), newest first.
const MyRegistrations = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const tt = (k, p) => nprText(t, k, p);
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const root = match.path.replace(/\/my-registrations$/, "");

  const { data, isLoading, isError, error, refetch } = useQuery(
    ["NPR_MY_REGISTRATIONS"],
    /* the service scopes a citizen's search to the applications they created, across all ULBs */
    () => Digit.PTRService.search({ filters: { limit: 100, offset: 0, sortBy: "createdTime", sortOrder: "DESC" } }),
    { refetchOnWindowFocus: false, retry: 1 }
  );

  const all = useMemo(() => [...((data && data.PetRegistrationApplications) || [])].sort((a, b) => ((b.auditDetails || {}).createdTime || 0) - ((a.auditDetails || {}).createdTime || 0)), [data]);
  const counts = useMemo(() => all.reduce((c, l) => ({ ...c, [stageOf(l.status)]: (c[stageOf(l.status)] || 0) + 1 }), { ALL: all.length }), [all]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((l) => (filter === "ALL" || stageOf(l.status) === filter) && (!term || [l.applicationNumber, (l.petDetails || {}).petName, (l.petDetails || {}).breedType, l.applicantName].join(" ").toLowerCase().includes(term)));
  }, [all, filter, q]);

  if (isLoading) return <div className="npt-wrap"><SevaLoader /></div>;

  return (
    <div className="npt-wrap">
      <NPRCrumbs t={t} current={tt("NPR_MY_APPS_TITLE")} />
      <div className="npt-listhead">
        <NPRPageHead title={tt("NPR_MY_APPS_TITLE")} sub={tt("NPR_MY_APPS_SUB")} />
        <Link to={`${root}/new-registration`} className="npt-btn npt-btn--primary">
          <NPRIcon name="plus" size={18} /><span>{tt("NPR_MY_APPS_NEW")}</span>
        </Link>
      </div>

      {isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(error, tt("NPR_MY_APPS_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => refetch()}>{tt("NPR_RETRY")}</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="npt-filters">
            <div className="npt-chips" role="tablist">
              {FILTERS.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} className={`npt-chip${filter === f ? " is-on" : ""}`} onClick={() => setFilter(f)}>
                  {tt(`NPR_FILTER_${f}`)} <b>{counts[f] || 0}</b>
                </button>
              ))}
            </div>
            <label className="npt-search">
              <NPRIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("NPR_SEARCH_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("NPR_SEARCH_PH")} />
            </label>
          </div>

          {all.length === 0 ? (
            <div className="npt-empty">
              <NPRIcon name="paw" size={40} />
              <strong>{tt("NPR_MY_APPS_EMPTY")}</strong>
              <p>{tt("NPR_START_HINT")}</p>
              <Link to={`${root}/new-registration`} className="npt-btn npt-btn--primary"><span>{tt("NPR_MY_APPS_NEW")}</span></Link>
            </div>
          ) : shown.length === 0 ? (
            <div className="npt-empty">
              <NPRIcon name="search" size={40} />
              <strong>{tt("NPR_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => { setQ(""); setFilter("ALL"); }}><span>{tt("NPR_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {shown.map((l) => {
                const stage = stageOf(l.status);
                const pet = l.petDetails || {};
                const ulb = l.additionalDetail || {};
                return (
                  <li className={`npt-prop is-${stage.toLowerCase()}`} key={l.id || l.applicationNumber}>
                    <span className="npt-prop__ico"><NPRIcon name="paw" size={22} /></span>
                    <div className="npt-prop__main">
                      <strong>{l.applicationNumber}</strong>
                      <span>{[pet.petName, pet.breedType].filter(Boolean).join(" · ") || "-"}</span>
                      <small>{[tt(l.applicationType === "RENEWAL" ? "NPR_TYPE_RENEWAL" : "NPR_TYPE_NEW"), l.applicantName, ulb.ulbName && `${tt("NPR_COL_ULB")}: ${ulb.ulbName}`].filter(Boolean).join(" · ")}</small>
                    </div>
                    <span className={`npt-badge npt-badge--${stage.toLowerCase()}`}>{t(`WF_NEWTL_${l.status}`, { defaultValue: humanise(l.status) })}</span>
                    {canRenew(l, all) ? (
                      <Link className="npt-btn npt-btn--primary" to={`${root}/renew/${encodeURIComponent(l.applicationNumber)}?tenantId=${l.tenantId}`}><span>{tt("NPR_RN_BTN")}</span></Link>
                    ) : null}
                    {l.status !== "INITIATED" ? (
                      <Link className="npt-btn npt-btn--ghost" to={`${root}/registration/${encodeURIComponent(l.applicationNumber)}?tenantId=${l.tenantId}`}><span>{tt("NPR_VIEW_OPEN")}</span></Link>
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
