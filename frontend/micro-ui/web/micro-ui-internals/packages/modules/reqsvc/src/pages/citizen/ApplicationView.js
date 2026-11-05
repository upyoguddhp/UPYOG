import { DocViewer, SevaLoader, fetchServiceDocumentList } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useParams, useRouteMatch } from "react-router-dom";
import { RQS_DMS, rqsStageOf } from "../../config/reqsvcConfig";
import { rqsText } from "../../config/reqsvcMessages";
import { docLabels } from "../../pageComponents/ReqsvcDocuments";
import { RQSCrumbs, RQSIcon, RQSPageHead } from "../../pageComponents/ReqsvcLayout";
import { RQSGrid, statusText } from "../../pageComponents/ReqsvcParts";
import { RequestApi, amountOf, apiErrorMessage, challansOf, fmtDate, fmtTime, humanise, inr, payPath, statusOf } from "../../utils/reqsvc";

// Read-only, full summary of one request: details, applicant, documents (with View), timeline, print, pay.
const ApplicationView = () => {
  const { t } = useTranslation();
  const { applicationNumber: raw } = useParams();
  const tt = (k, p) => rqsText(t, k, p);
  const match = useRouteMatch();
  const applicationNumber = decodeURIComponent(raw || "");
  const root = match.url.replace(/\/application\/.*$/, ""); // .../reqsvc

  const { data, isLoading, isError, error, refetch } = useQuery(["RQS_MINE"], RequestApi.searchMine, { refetchOnWindowFocus: false, retry: 1 });
  const rec = challansOf(data).find((c) => c.challanNo === applicationNumber);
  const docsQ = useQuery(["RQS_VIEW_DOCS", applicationNumber], () => fetchServiceDocumentList(RQS_DMS, applicationNumber), { refetchOnWindowFocus: false, retry: 0 });
  const wfQ = useQuery(["RQS_VIEW_WF", applicationNumber], () => Digit.WorkflowService.getByBusinessId(rec.tenantId, applicationNumber), { enabled: !!rec, refetchOnWindowFocus: false, retry: 0 });

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
      setViewError(tt("RQS_DOCV_FAILED"));
    }
    setFetching(null);
  };

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("RQS_LOADING")} /></div>;

  const crumbs = <RQSCrumbs t={t} current={applicationNumber} />;
  if (isError || !rec) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <RQSPageHead title={tt("RQS_VIEW_TITLE")} sub={applicationNumber} />
        <div className="npt-lookup-error" role="alert">
          <span>{isError ? apiErrorMessage(error, tt("RQS_VIEW_FAILED")) : tt("RQS_VIEW_NOTFOUND")}</span>
          {isError ? <button type="button" className="npt-link" onClick={() => refetch()}>{tt("RQS_RETRY")}</button> : null}
        </div>
      </div>
    );
  }

  const status = statusOf(rec);
  const stage = rqsStageOf(status).toLowerCase();
  const cz = rec.citizen || {};
  const ad = rec.address || {};
  const ax = rec.additionalDetail || {};
  const docs = (docsQ.data || []).filter((x) => x.attachment && x.attachment.url);
  const history = ((wfQ.data && wfQ.data.ProcessInstances) || []).slice().sort((x, y) => (y.auditDetails || {}).createdTime - (x.auditDetails || {}).createdTime);

  const summary = [
    [tt("RQS_VIEW_APPNO"), applicationNumber],
    [tt("RQS_VIEW_APPLIED"), fmtTime((rec.auditDetails || {}).createdTime)],
    [tt("RQS_F_category"), rec.description],
    [tt("RQS_FEE_AMOUNT"), inr(amountOf(rec))],
    [tt("RQS_F_issueDate"), fmtDate(rec.taxPeriodFrom)],
  ];
  const locationRows = [
    [tt("RQS_F_districtName"), ax.districtName || ad.district],
    [tt("RQS_F_ulbName"), ax.ulbName || ad.city],
    [tt("RQS_F_ward"), ax.ward],
    [tt("RQS_F_street"), ad.street],
    [tt("RQS_F_landmark"), ad.landmark],
  ];
  const applicantRows = [
    [tt("RQS_F_name"), cz.name || ax.name],
    [tt("RQS_F_fatherName"), ax.fatherName],
    [tt("RQS_F_mobileNumber"), cz.mobileNumber || ax.mobileNumber],
    [tt("RQS_F_emailId"), cz.emailID || cz.email],
    [tt("RQS_F_aadhaarNumber"), ax.aadharNumber],
    [tt("RQS_F_detail"), ad.detail],
    [tt("RQS_F_pincode"), ad.pincode],
  ];

  return (
    <div className="npt-wrap bkg-view npt-printview">
      {crumbs}
      <div className="npt-listhead">
        <RQSPageHead title={tt("RQS_VIEW_TITLE")} sub={applicationNumber} />
        <button type="button" className="npt-btn npt-btn--ghost" onClick={() => window.print()}><RQSIcon name="print" size={18} /><span>{tt("RQS_VIEW_PRINT")}</span></button>
      </div>

      <section className="npt-card bkg-pane">
        <p className="bkg-pane__status">
          <span>{tt("RQS_VIEW_STATUS")}:</span>
          <span className={`npt-badge npt-badge--${stage}`}>{statusText(t, status)}</span>
        </p>
        <RQSGrid rows={summary} />
        {status === "ACTIVE" ? (
          <div className="bkg-pane__actions">
            <Link className="npt-btn npt-btn--primary" to={{ pathname: payPath(rec), state: { tenantId: rec.tenantId, applicationNumber } }}>
              <span>{tt("RQS_PAY_NOW")}</span>
            </Link>
          </div>
        ) : null}
      </section>
      <section className="npt-card bkg-pane"><h3>{tt("RQS_STEP_LOCATION")}</h3><RQSGrid rows={locationRows} /></section>
      <section className="npt-card bkg-pane"><h3>{tt("RQS_STEP_APPLICANT")}</h3><RQSGrid rows={applicantRows} /></section>

      <section className="npt-card bkg-pane">
        <h3>{tt("RQS_VIEW_DOCS")}</h3>
        {docsQ.isLoading ? <SevaLoader message={tt("RQS_LOADING")} /> : docs.length === 0 ? <p>{tt("RQS_VIEW_NODOCS")}</p> : (
          <ul className="bkg-docs">
            {docs.map((x) => (
              <li key={x.id}>
                <span>{x.documentName}</span>
                <button type="button" className="npt-btn npt-btn--ghost" disabled={fetching === x.id} onClick={() => openDoc(x)}>
                  <span>{fetching === x.id ? "…" : tt("RQS_DOC_VIEW")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {fetching ? <SevaLoader fullScreen message={tt("RQS_VIEW_OPENING")} /> : null}
      {viewError ? <div className="npt-lookup-error" role="alert"><span>{viewError}</span></div> : null}
      {viewing ? <DocViewer source={viewing.source} name={viewing.name} labels={docLabels(tt)} onClose={() => setViewing(null)} /> : null}

      <section className="npt-card bkg-pane">
        <h3>{tt("RQS_VIEW_TIMELINE")}</h3>
        {wfQ.isLoading ? <SevaLoader message={tt("RQS_LOADING")} /> : history.length === 0 ? <p>{tt("RQS_VIEW_NOHISTORY")}</p> : (
          <ol className="bkg-timeline">
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

      <p className="bkg-back"><Link to={`${root}/my-requests`} className="npt-btn npt-btn--ghost"><span>{tt("RQS_VIEW_BACK")}</span></Link></p>
    </div>
  );
};

export default ApplicationView;
