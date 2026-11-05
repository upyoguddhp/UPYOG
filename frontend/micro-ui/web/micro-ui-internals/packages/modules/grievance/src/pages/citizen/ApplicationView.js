import { DocViewer, SevaLoader, Toast, fetchServiceDocumentList } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "react-query";
import { Link, useLocation, useParams, useRouteMatch } from "react-router-dom";
import { GRV_DMS, GRV_REOPEN_STATES, grvStageOf } from "../../config/grievanceConfig";
import { grvText } from "../../config/grievanceMessages";
import { docLabels } from "../../pageComponents/GrievanceDocuments";
import { GRVBtn, GRVCrumbs, GRVIcon, GRVPageHead } from "../../pageComponents/GrievanceLayout";
import { GRVGrid, statusText } from "../../pageComponents/GrievanceParts";
import { useServiceDefs } from "../../pageComponents/useGRVLookups";
import { GrievanceApi, apiErrorMessage, buildReopenPayload, defNameOf, fmtTime, humanise, servicesOf, statusOf } from "../../utils/grievance";

// Read-only, full summary of one grievance: details, applicant, photo/documents (with View), timeline, print, reopen.
const ApplicationView = () => {
  const { t } = useTranslation();
  const { applicationNumber: raw } = useParams();
  const tt = (k, p) => grvText(t, k, p);
  const match = useRouteMatch();
  const { search } = useLocation();
  const queryClient = useQueryClient();
  const applicationNumber = decodeURIComponent(raw || "");
  const tenantParam = new URLSearchParams(search).get("tenantId") || "";
  const root = match.url.replace(/\/application\/.*$/, ""); // .../grievance
  const { defs } = useServiceDefs();

  const { data, isLoading, isError, error, refetch } = useQuery(
    ["GRV_VIEW", applicationNumber],
    () => GrievanceApi.searchOne(Digit.ULBService.getStateId(), applicationNumber),
    { refetchOnWindowFocus: false, retry: 1 }
  );
  const rec = servicesOf(data).find((s) => s.serviceRequestId === applicationNumber);
  const tenantId = (rec && rec.tenantId) || tenantParam;
  const docsQ = useQuery(["GRV_VIEW_DOCS", applicationNumber], () => fetchServiceDocumentList(GRV_DMS, applicationNumber), { refetchOnWindowFocus: false, retry: 0 });
  const wfQ = useQuery(["GRV_VIEW_WF", applicationNumber], () => Digit.WorkflowService.getByBusinessId(tenantId, applicationNumber), { enabled: !!rec && !!tenantId, refetchOnWindowFocus: false, retry: 0 });

  const [viewing, setViewing] = useState(null);
  const [fetching, setFetching] = useState(null);
  const [viewError, setViewError] = useState(null);
  const [reopening, setReopening] = useState(false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
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
      setViewError(tt("GRV_DOCV_FAILED"));
    }
    setFetching(null);
  };

  const reopen = async () => {
    if (!comment.trim()) {
      setToast({ error: true, label: tt("GRV_REOPEN_COMMENT_REQUIRED") });
      return;
    }
    setSaving(true);
    try {
      const p = buildReopenPayload(rec, comment.trim());
      await GrievanceApi.update(p.service, p.workflow);
      setReopening(false);
      setComment("");
      setToast({ error: false, label: tt("GRV_REOPEN_DONE") });
      queryClient.invalidateQueries(["GRV_MINE"]);
      queryClient.invalidateQueries(["GRV_VIEW_WF", applicationNumber]);
      await refetch();
    } catch (e) {
      setToast({ error: true, label: apiErrorMessage(e, tt("GRV_REOPEN_FAILED")) });
    }
    setSaving(false);
  };

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("GRV_LOADING")} /></div>;

  const crumbs = <GRVCrumbs t={t} current={applicationNumber} />;
  if (isError || !rec) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <GRVPageHead title={tt("GRV_VIEW_TITLE")} sub={applicationNumber} />
        <div className="npt-lookup-error" role="alert">
          <span>{isError ? apiErrorMessage(error, tt("GRV_VIEW_FAILED")) : tt("GRV_VIEW_NOTFOUND")}</span>
          {isError ? <button type="button" className="npt-link" onClick={() => refetch()}>{tt("GRV_RETRY")}</button> : null}
        </div>
      </div>
    );
  }

  const status = statusOf(rec);
  const stage = grvStageOf(status).toLowerCase();
  const cz = rec.citizen || {};
  const ad = rec.address || {};
  const ax = rec.additionalDetail || {};
  const adx = ad.additionalDetails || {};
  const docs = (docsQ.data || []).filter((x) => x.attachment && x.attachment.url);
  const history = ((wfQ.data && wfQ.data.ProcessInstances) || []).slice().sort((x, y) => (y.auditDetails || {}).createdTime - (x.auditDetails || {}).createdTime);
  const canReopen = GRV_REOPEN_STATES.indexOf(status) >= 0;

  const summary = [
    [tt("GRV_VIEW_APPNO"), applicationNumber],
    [tt("GRV_VIEW_APPLIED"), fmtTime((rec.auditDetails || {}).createdTime)],
    [tt("GRV_F_grievanceType"), humanise(ax.grievanceType)],
    [tt("GRV_F_grievanceSubType"), defNameOf(defs, rec.serviceCode)],
    [tt("GRV_F_description"), rec.description],
  ];
  const locationRows = [
    [tt("GRV_F_districtName"), ad.district],
    [tt("GRV_F_ulbName"), ad.city],
    [tt("GRV_F_ward"), adx.ward],
    [tt("GRV_F_address"), adx.address],
  ];
  const applicantRows = [
    [tt("GRV_F_name"), cz.name || ax.citizenName],
    [tt("GRV_F_fatherName"), ax.citizenFatherName],
    [tt("GRV_F_mobileNumber"), cz.mobileNumber || ax.citizenMobile],
    [tt("GRV_F_emailId"), cz.emailId || ax.citizenEmail],
  ];

  return (
    <div className="npt-wrap bkg-view npt-printview">
      {crumbs}
      <div className="npt-listhead">
        <GRVPageHead title={tt("GRV_VIEW_TITLE")} sub={applicationNumber} />
        <button type="button" className="npt-btn npt-btn--ghost" onClick={() => window.print()}><GRVIcon name="print" size={18} /><span>{tt("GRV_VIEW_PRINT")}</span></button>
      </div>

      <section className="npt-card bkg-pane">
        <p className="bkg-pane__status">
          <span>{tt("GRV_VIEW_STATUS")}:</span>
          <span className={`npt-badge npt-badge--${stage}`}>{statusText(t, status)}</span>
        </p>
        <GRVGrid rows={summary} />
        {canReopen ? (
          <div className="bkg-pane__actions">
            {reopening ? (
              <div className="grv-reopen">
                <label>
                  <span>{tt("GRV_REOPEN_LABEL")}</span>
                  <textarea value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} placeholder={tt("GRV_REOPEN_PH")} />
                </label>
                <div className="grv-reopen__btns">
                  <GRVBtn kind="primary" onClick={reopen}>{tt("GRV_REOPEN_SUBMIT")}</GRVBtn>
                  <GRVBtn kind="ghost" onClick={() => { setReopening(false); setComment(""); }}>{tt("GRV_BTN_CANCEL")}</GRVBtn>
                </div>
              </div>
            ) : (
              <GRVBtn kind="primary" onClick={() => setReopening(true)}>{tt("GRV_REOPEN")}</GRVBtn>
            )}
          </div>
        ) : null}
      </section>
      <section className="npt-card bkg-pane"><h3>{tt("GRV_STEP_LOCATION")}</h3><GRVGrid rows={locationRows} /></section>
      <section className="npt-card bkg-pane"><h3>{tt("GRV_STEP_APPLICANT")}</h3><GRVGrid rows={applicantRows} /></section>

      <section className="npt-card bkg-pane">
        <h3>{tt("GRV_VIEW_DOCS")}</h3>
        {docsQ.isLoading ? <SevaLoader message={tt("GRV_LOADING")} /> : docs.length === 0 ? <p>{tt("GRV_VIEW_NODOCS")}</p> : (
          <ul className="bkg-docs">
            {docs.map((x) => (
              <li key={x.id}>
                <span>{x.documentName}</span>
                <button type="button" className="npt-btn npt-btn--ghost" disabled={fetching === x.id} onClick={() => openDoc(x)}>
                  <span>{fetching === x.id ? "…" : tt("GRV_DOC_VIEW")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {fetching ? <SevaLoader fullScreen message={tt("GRV_VIEW_OPENING")} /> : null}
      {saving ? <SevaLoader fullScreen message={tt("GRV_REOPEN_SAVING")} /> : null}
      {viewError ? <div className="npt-lookup-error" role="alert"><span>{viewError}</span></div> : null}
      {viewing ? <DocViewer source={viewing.source} name={viewing.name} labels={docLabels(tt)} onClose={() => setViewing(null)} /> : null}

      <section className="npt-card bkg-pane">
        <h3>{tt("GRV_VIEW_TIMELINE")}</h3>
        {wfQ.isLoading ? <SevaLoader message={tt("GRV_LOADING")} /> : history.length === 0 ? <p>{tt("GRV_VIEW_NOHISTORY")}</p> : (
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
      {toast ? <Toast error={toast.error} label={toast.label} onClose={() => setToast(null)} /> : null}

      <p className="bkg-back"><Link to={`${root}/my-grievances`} className="npt-btn npt-btn--ghost"><span>{tt("GRV_VIEW_BACK")}</span></Link></p>
    </div>
  );
};

export default ApplicationView;
