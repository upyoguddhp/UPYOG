import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch } from "react-router-dom";
import { OTS_ANY_OTHER } from "../../config/otsConfig";
import { otsText } from "../../config/otsMessages";
import { OTSCrumbs, OTSIcon, OTSPageHead } from "../../pageComponents/OTSLayout";
import { OtsApi, apiErrorMessage, createdOf, fmtDate, inr } from "../../utils/ots";

// The signed-in citizen's settlement applications (matched on their mobile number), newest first, with a search box.
const MyApplications = () => {
  const { t } = useTranslation();
  const tt = (k, p) => otsText(t, k, p);
  const match = useRouteMatch();
  const root = match.url.replace(/\/my-applications$/, ""); // .../ots
  const [q, setQ] = useState("");
  const mobile = (Digit.UserService.getUser()?.info || {}).mobileNumber;

  const { data, isLoading, isError, error, refetch } = useQuery(["OTS_MINE", mobile], () => OtsApi.listMine(mobile), { enabled: !!mobile, refetchOnWindowFocus: false, retry: 1 });
  const all = useMemo(() => [...(data || [])].sort((a, b) => createdOf(b) - createdOf(a)), [data]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((r) => !term || [r.id, r.applicant_name, r.name_of_ulb, r.category_of_shop].join(" ").toLowerCase().includes(term));
  }, [all, q]);

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("OTS_LOADING")} /></div>;

  return (
    <div className="npt-wrap">
      <OTSCrumbs t={t} current={tt("OTS_LIST_TITLE")} />
      <div className="npt-listhead">
        <OTSPageHead title={tt("OTS_LIST_TITLE")} sub={tt("OTS_LIST_SUB")} />
        <Link to={`${root}/new/applicant`} className="npt-btn npt-btn--primary"><OTSIcon name="plus" size={18} /><span>{tt("OTS_NEW")}</span></Link>
      </div>

      {isError ? (
        <div className="npt-lookup-error" role="alert">
          <span>{apiErrorMessage(error, tt("OTS_LIST_FAILED"))}</span>
          <button type="button" className="npt-link" onClick={() => refetch()}>{tt("OTS_RETRY")}</button>
        </div>
      ) : all.length === 0 ? (
        <div className="npt-empty">
          <OTSIcon name="building" size={40} />
          <strong>{tt("OTS_LIST_EMPTY")}</strong>
          <p>{tt("OTS_START_HINT")}</p>
          <Link to={`${root}/new/applicant`} className="npt-btn npt-btn--primary"><span>{tt("OTS_NEW")}</span></Link>
        </div>
      ) : (
        <React.Fragment>
          <div className="npt-filters">
            <label className="npt-search">
              <OTSIcon name="search" size={18} />
              <input type="search" value={q} placeholder={tt("OTS_SEARCH_APPS_PH")} onChange={(e) => setQ(e.target.value)} aria-label={tt("OTS_SEARCH_APPS_PH")} />
            </label>
          </div>
          {shown.length === 0 ? (
            <div className="npt-empty">
              <OTSIcon name="search" size={40} />
              <strong>{tt("OTS_NO_RESULTS")}</strong>
              <button type="button" className="npt-btn npt-btn--ghost" onClick={() => setQ("")}><span>{tt("OTS_CLEAR_FILTERS")}</span></button>
            </div>
          ) : (
            <ul className="npt-prop-list">
              {shown.map((r) => (
                <li className="npt-prop is-progress" key={r.id}>
                  <span className="npt-prop__ico"><OTSIcon name="building" size={22} /></span>
                  <div className="npt-prop__main">
                    <strong>{r.id}</strong>
                    <span>{r.applicant_name || "-"}</span>
                    <small>{[r.name_of_ulb, r.category_of_shop === OTS_ANY_OTHER ? "" : r.category_of_shop, fmtDate(r.created_at), r.annual_turnover ? inr(r.annual_turnover) : ""].filter(Boolean).join(" · ")}</small>
                  </div>
                  <span className="npt-badge npt-badge--progress">{tt("OTS_ST_SUBMITTED")}</span>
                  <Link className="npt-btn npt-btn--ghost" to={`${root}/application/${encodeURIComponent(r.id)}`}><span>{tt("OTS_VIEW_OPEN")}</span></Link>
                </li>
              ))}
            </ul>
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default MyApplications;
