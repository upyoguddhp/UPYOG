import { DocViewer, SevaLoader, fetchServiceDocumentList } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useRouteMatch, useParams } from "react-router-dom";
import { OTS_ANY_OTHER, OTS_DMS } from "../../config/otsConfig";
import { otsText } from "../../config/otsMessages";
import { docLabels } from "../../pageComponents/OTSDocuments";
import { OTSCrumbs, OTSIcon, OTSPageHead } from "../../pageComponents/OTSLayout";
import { OTSGrid, statusText } from "../../pageComponents/OTSParts";
import { OtsApi, ageOn, apiErrorMessage, fmtDate, fmtTime, humanise, inr, yesNo } from "../../utils/ots";

// Read-only, full summary of one settlement application: applicant, shop, loans, settlements, documents (with View), timeline, print.
const ApplicationView = () => {
  const { t } = useTranslation();
  const { applicationNumber: raw } = useParams();
  const tt = (k, p) => otsText(t, k, p);
  const match = useRouteMatch();
  const applicationNumber = decodeURIComponent(raw || "");
  const root = match.url.replace(/\/application\/.*$/, ""); // .../ots
  const mobile = (Digit.UserService.getUser()?.info || {}).mobileNumber;

  // the list call is shared with My applications; the service has no lookup by id, so the record is picked out here
  const { data, isLoading, isError, error, refetch } = useQuery(["OTS_MINE", mobile], () => OtsApi.listMine(mobile), { enabled: !!mobile, refetchOnWindowFocus: false, retry: 1 });
  const rec = (data || []).find((r) => String(r.id) === applicationNumber);
  const docsQ = useQuery(["OTS_VIEW_DOCS", applicationNumber], () => fetchServiceDocumentList(OTS_DMS, applicationNumber), { refetchOnWindowFocus: false, retry: 0 });
  const wfQ = useQuery(["OTS_VIEW_WF", applicationNumber], () => Digit.WorkflowService.getByBusinessId("hp", applicationNumber), { enabled: !!rec, refetchOnWindowFocus: false, retry: 0 });

  const [viewing, setViewing] = useState(null);
  const [fetching, setFetching] = useState(null);
  const [viewError, setViewError] = useState(null);
  const dms = ((window.globalConfigs && window.globalConfigs.getConfig && window.globalConfigs.getConfig("DMS_URL")) || "/hpud-dms-service").replace(/\/$/, "");
  const openDoc = async (x) => {
    setFetching(x.id);
    setViewError(null);
    try {
      const res = await fetch(`${dms}/dms/downloadFile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(Digit.UserService.getUser() || {}).access_token}` },
        body: JSON.stringify({ RequestInfo: { apiId: "Rainmaker" }, id: x.attachment.url }),
      });
      if (!res.ok || (res.headers.get("content-type") || "").indexOf("json") >= 0) throw new Error("download");
      setViewing({ source: await res.blob(), name: x.attachment.name || x.documentName });
    } catch (e) {
      setViewError(tt("OTS_DOCV_FAILED"));
    }
    setFetching(null);
  };

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("OTS_LOADING")} /></div>;

  const crumbs = <OTSCrumbs t={t} current={applicationNumber} />;
  if (isError || !rec) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <OTSPageHead title={tt("OTS_VIEW_TITLE")} sub={applicationNumber} />
        <div className="npt-lookup-error" role="alert">
          <span>{isError ? apiErrorMessage(error, tt("OTS_VIEW_FAILED")) : tt("OTS_VIEW_NOTFOUND")}</span>
          {isError ? <button type="button" className="npt-link" onClick={() => refetch()}>{tt("OTS_RETRY")}</button> : null}
        </div>
      </div>
    );
  }

  const yn = (v) => yesNo(tt, v);
  const loans = rec.applicationNpaLoans || [];
  const sets = rec.applicationSettlements || [];
  const docs = (docsQ.data || []).filter((x) => x.attachment && x.attachment.url);
  const history = ((wfQ.data && wfQ.data.ProcessInstances) || []).slice().sort((x, y) => (y.auditDetails || {}).createdTime - (x.auditDetails || {}).createdTime);
  const status = history.length ? (history[0].state || {}).state : "SUBMITTED";

  return (
    <div className="npt-wrap ots-view npt-printview">
      {crumbs}
      <div className="npt-listhead">
        <OTSPageHead title={tt("OTS_VIEW_TITLE")} sub={applicationNumber} />
        <button type="button" className="npt-btn npt-btn--ghost" onClick={() => window.print()}><OTSIcon name="print" size={18} /><span>{tt("OTS_VIEW_PRINT")}</span></button>
      </div>

      <section className="npt-card ots-pane">
        <p className="ots-pane__status">
          <span>{tt("OTS_VIEW_STATUS")}:</span>
          <span className="npt-badge npt-badge--progress">{statusText(t, status)}</span>
        </p>
        <OTSGrid rows={[[tt("OTS_VIEW_APPNO"), applicationNumber], [tt("OTS_VIEW_APPLIED"), fmtDate(rec.created_at)], [tt("OTS_F_totalRepayment"), inr(rec.total_repayment)]]} />
      </section>
      <section className="npt-card ots-pane">
        <h3>{tt("OTS_STEP_APPLICANT")}</h3>
        <OTSGrid rows={[
          [tt("OTS_F_applicantName"), rec.applicant_name], [tt("OTS_F_fatherName"), rec.fathers_name], [tt("OTS_F_dateOfBirth"), fmtDate(rec.date_of_birth)],
          [tt("OTS_VIEW_AGE"), ageOn(String(rec.date_of_birth || "").slice(0, 10))], [tt("OTS_F_mobileNumber"), rec.mobile_no], [tt("OTS_F_isHimachalResident"), yn(rec.is_permanent_residence_hp)],
        ]} />
      </section>
      <section className="npt-card ots-pane">
        <h3>{tt("OTS_STEP_SHOP")}</h3>
        <OTSGrid rows={[
          [tt("OTS_F_ulbName"), rec.name_of_ulb], [tt("OTS_F_ward"), rec.ward_name], [tt("OTS_F_shopAddress"), rec.house_or_shop_no],
          [tt("OTS_F_shopType"), rec.category_of_shop === OTS_ANY_OTHER ? tt("OTS_O_ANY_OTHER") : rec.category_of_shop], [tt("OTS_F_annualTurnover"), inr(rec.annual_turnover)],
          [tt("OTS_F_isGovernmentEmployee"), yn(rec.is_family_govt_employee)],
        ]} />
      </section>
      <section className="npt-card ots-pane">
        <h3>{tt("OTS_STEP_LOANS")}</h3>
        {loans.length === 0 ? <p>{tt("OTS_LOAN_EMPTY")}</p> : loans.map((l, i) => (
          <div key={l.id || i}>
            <h4 className="npt-section__title">{tt("OTS_LOAN_N", { n: i + 1 })}</h4>
            <OTSGrid rows={[[tt("OTS_F_bankName"), l.bank_name], [tt("OTS_F_branchName"), l.branch], [tt("OTS_F_amountAvailed"), inr(l.availed_amt)], [tt("OTS_F_loanTakenDate"), fmtDate(l.loan_taken_date)], [tt("OTS_F_npaDeclaredDate"), fmtDate(l.npa_declared_date)]]} />
          </div>
        ))}
      </section>
      <section className="npt-card ots-pane">
        <h3>{tt("OTS_STEP_SETTLEMENT")}</h3>
        <OTSGrid rows={[[tt("OTS_F_hasLoanSettlementFacility"), yn(rec.is_settlement_availed)]]} />
        {sets.map((s, i) => (
          <div key={s.id || i}>
            <h4 className="npt-section__title">{tt("OTS_SET_N", { n: i + 1 })}</h4>
            <OTSGrid rows={[[tt("OTS_F_yearOfSettlement"), s.year_of_settlement], [tt("OTS_F_amountSettled"), inr(s.settled_amt)], [tt("OTS_F_paidInFull"), yn(s.is_paid_full)], [tt("OTS_F_schemeName"), s.name_of_scheme], [tt("OTS_VIEW_TOTAL_OUT"), inr(s.outstanding_total_amt)]]} />
          </div>
        ))}
      </section>

      <section className="npt-card ots-pane">
        <h3>{tt("OTS_VIEW_DOCS")}</h3>
        {docsQ.isLoading ? <SevaLoader message={tt("OTS_LOADING")} /> : docs.length === 0 ? <p>{tt("OTS_VIEW_NODOCS")}</p> : (
          <ul className="ots-docs">
            {docs.map((x) => (
              <li key={x.id}>
                <span>{x.documentName}</span>
                <button type="button" className="npt-btn npt-btn--ghost" disabled={fetching === x.id} onClick={() => openDoc(x)}>
                  <span>{fetching === x.id ? "…" : tt("OTS_DOC_VIEW")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {fetching ? <SevaLoader fullScreen message={tt("OTS_VIEW_OPENING")} /> : null}
      {viewError ? <div className="npt-lookup-error" role="alert"><span>{viewError}</span></div> : null}
      {viewing ? <DocViewer source={viewing.source} name={viewing.name} labels={docLabels(tt)} onClose={() => setViewing(null)} /> : null}

      <section className="npt-card ots-pane">
        <h3>{tt("OTS_VIEW_TIMELINE")}</h3>
        {wfQ.isLoading ? <SevaLoader message={tt("OTS_LOADING")} /> : history.length === 0 ? <p>{tt("OTS_VIEW_NOHISTORY")}</p> : (
          <ol className="ots-timeline">
            {history.map((h, i) => (
              <li key={h.id || i}>
                <strong>{statusText(t, (h.state || {}).state) || humanise(h.action)}</strong>
                <small>{[(h.assigner || {}).name, fmtTime((h.auditDetails || {}).createdTime)].filter(Boolean).join(" · ")}</small>
                {h.comment ? <span>{h.comment}</span> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="ots-back"><Link to={`${root}/my-applications`} className="npt-btn npt-btn--ghost"><span>{tt("OTS_VIEW_BACK")}</span></Link></p>
    </div>
  );
};

export default ApplicationView;
