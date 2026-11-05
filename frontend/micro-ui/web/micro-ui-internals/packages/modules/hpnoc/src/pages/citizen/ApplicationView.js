import { DocViewer, SevaLoader, Toast, fetchServiceDocumentList } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useParams, useRouteMatch } from "react-router-dom";
import { HNC_DMS, NOC_TYPE_KEYS, hncStageOf } from "../../config/hpnocConfig";
import { rqsText } from "../../config/hpnocMessages";
import { docLabels } from "../../pageComponents/HpnocDocuments";
import { HNCCrumbs, HNCIcon, HNCPageHead } from "../../pageComponents/HpnocLayout";
import { HNCGrid, statusText } from "../../pageComponents/HpnocParts";
import { NocApi, apiErrorMessage, buildApproverPayload, buildSubmitPayload, detailsOf, fmtDate, fmtTime, humanise, nocsOf, payPath, statusOf } from "../../utils/hpnoc";

// Read-only, full summary of one request: details, applicant, documents (with View), timeline, print, pay.
const ApplicationView = () => {
  const { t } = useTranslation();
  const { applicationNumber: raw } = useParams();
  const tt = (k, p) => rqsText(t, k, p);
  const match = useRouteMatch();
  const applicationNumber = decodeURIComponent(raw || "");
  const root = match.url.replace(/\/application\/.*$/, ""); // .../hpnoc

  const { data, isLoading, isError, error, refetch } = useQuery(["HNC_MINE"], NocApi.searchMine, { refetchOnWindowFocus: false, retry: 1 });
  const rec = nocsOf(data).find((c) => c.applicationNo === applicationNumber);
  const docsQ = useQuery(["HNC_VIEW_DOCS", applicationNumber], () => fetchServiceDocumentList(HNC_DMS, applicationNumber), { refetchOnWindowFocus: false, retry: 0 });
  const wfQ = useQuery(["HNC_VIEW_WF", applicationNumber], () => Digit.WorkflowService.getByBusinessId(rec.tenantId, applicationNumber), { enabled: !!rec, refetchOnWindowFocus: false, retry: 0 });

  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
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
      setViewError(tt("HNC_DOCV_FAILED"));
    }
    setFetching(null);
  };

  // PENDINGFORPAYMENT: confirm the fee was collected, then hand the application to the approver
  const sendToApprover = async () => {
    setActing(true);
    setActionMsg(null);
    try {
      const pay = await NocApi.payments(rec.tenantId, applicationNumber);
      if (!(pay && pay.Payments && pay.Payments.length)) {
        setActionMsg({ error: true, label: tt("HNC_PAY_FIRST") });
      } else {
        await NocApi.update(buildApproverPayload(rec));
        setActionMsg({ label: tt("HNC_SENT_APPROVER") });
        await refetch();
        wfQ.refetch();
      }
    } catch (e) {
      setActionMsg({ error: true, label: apiErrorMessage(e, tt("HNC_ACTION_FAILED")) });
    }
    setActing(false);
  };
  // PENDINGFORMODIFICATION: send the application back to the verifier once the citizen has attended to the remarks
  const resubmit = async () => {
    setActing(true);
    setActionMsg(null);
    try {
      await NocApi.update(buildSubmitPayload(rec));
      setActionMsg({ label: tt("HNC_RESUBMITTED") });
      await refetch();
      wfQ.refetch();
    } catch (e) {
      setActionMsg({ error: true, label: apiErrorMessage(e, tt("HNC_ACTION_FAILED")) });
    }
    setActing(false);
  };

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("HNC_LOADING")} /></div>;

  const crumbs = <HNCCrumbs t={t} current={applicationNumber} />;
  if (isError || !rec) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <HNCPageHead title={tt("HNC_VIEW_TITLE")} sub={applicationNumber} />
        <div className="npt-lookup-error" role="alert">
          <span>{isError ? apiErrorMessage(error, tt("HNC_VIEW_FAILED")) : tt("HNC_VIEW_NOTFOUND")}</span>
          {isError ? <button type="button" className="npt-link" onClick={() => refetch()}>{tt("HNC_RETRY")}</button> : null}
        </div>
      </div>
    );
  }

  const status = statusOf(rec);
  const stage = hncStageOf(status).toLowerCase();
  const ax = detailsOf(rec);
  const pd = ax.propertyDetail || {};
  const cd = ax.citizenDetail || {};
  const docs = (docsQ.data || []).filter((x) => x.attachment && x.attachment.url);
  const history = ((wfQ.data && wfQ.data.ProcessInstances) || []).slice().sort((x, y) => (y.auditDetails || {}).createdTime - (x.auditDetails || {}).createdTime);

  const summary = [
    [tt("HNC_VIEW_APPNO"), applicationNumber],
    [tt("HNC_VIEW_NOCNO"), rec.nocNo],
    [tt("HNC_VIEW_APPLIED"), fmtTime((rec.auditDetails || {}).createdTime)],
    [tt("HNC_F_typeOfNoc"), ax.typeOfNoc ? tt(NOC_TYPE_KEYS[ax.typeOfNoc] || ax.typeOfNoc) : ""],
    [tt("HNC_F_connectionType"), ax.connectionType],
    [tt("HNC_F_nocReason"), ax.reason || ax.nocReason],
  ];
  const propertyRows = [
    [tt("HNC_F_oldPropertyId"), pd.oldPropertyId],
    [tt("HNC_F_plotNo"), pd.plotNo],
    [tt("HNC_F_coOwnerName"), pd.coOwnerName],
    [tt("HNC_F_ulbName"), pd.ulbName],
    [tt("HNC_F_ward"), pd.ward],
    [tt("HNC_F_propertyAddress"), pd.propertyAddress],
    [tt("HNC_F_pincode"), pd.pincode],
    [tt("HNC_F_landType"), pd.landType],
    [tt("HNC_F_area"), pd.area],
    [tt("HNC_F_khasraNumber"), pd.khasraNumber],
    [tt("HNC_F_khata"), pd.khata],
  ];
  const applicantRows = [
    [tt("HNC_F_applicantName"), cd.applicantName],
    [tt("HNC_F_fatherName"), cd.fatherName],
    [tt("HNC_F_mobile"), cd.mobile],
    [tt("HNC_F_dob"), fmtDate(cd.dob)],
    [tt("HNC_F_gender"), cd.gender ? tt(`HNC_O_${String(cd.gender).toUpperCase()}`) : ""],
    [tt("HNC_F_email"), cd.email],
    [tt("HNC_F_address"), cd.address],
  ];

  return (
    <div className="npt-wrap bkg-view npt-printview">
      {crumbs}
      <div className="npt-listhead">
        <HNCPageHead title={tt("HNC_VIEW_TITLE")} sub={applicationNumber} />
        <button type="button" className="npt-btn npt-btn--ghost" onClick={() => window.print()}><HNCIcon name="print" size={18} /><span>{tt("HNC_VIEW_PRINT")}</span></button>
      </div>

      <section className="npt-card bkg-pane">
        <p className="bkg-pane__status">
          <span>{tt("HNC_VIEW_STATUS")}:</span>
          <span className={`npt-badge npt-badge--${stage}`}>{statusText(t, status)}</span>
        </p>
        <HNCGrid rows={summary} />
        {status === "PENDINGFORPAYMENT" ? (
          <div className="bkg-pane__actions">
            <p>{tt("HNC_PAY_HINT")}</p>
            <Link className="npt-btn npt-btn--primary" to={{ pathname: payPath(rec), state: { tenantId: rec.tenantId, applicationNumber } }}>
              <span>{tt("HNC_PAY_NOW")}</span>
            </Link>
            <button type="button" className="npt-btn npt-btn--ghost" disabled={acting} onClick={sendToApprover}><span>{tt("HNC_SEND_APPROVER")}</span></button>
          </div>
        ) : null}
        {status === "PENDINGFORMODIFICATION" ? (
          <div className="bkg-pane__actions">
            <p>{tt("HNC_MODIFY_HINT")}</p>
            <button type="button" className="npt-btn npt-btn--primary" disabled={acting} onClick={resubmit}><span>{tt("HNC_RESUBMIT")}</span></button>
          </div>
        ) : null}
      </section>
      <section className="npt-card bkg-pane"><h3>{tt("HNC_STEP_PROPERTY")}</h3><HNCGrid rows={propertyRows} /></section>
      <section className="npt-card bkg-pane"><h3>{tt("HNC_STEP_APPLICANT")}</h3><HNCGrid rows={applicantRows} /></section>

      <section className="npt-card bkg-pane">
        <h3>{tt("HNC_VIEW_DOCS")}</h3>
        {docsQ.isLoading ? <SevaLoader message={tt("HNC_LOADING")} /> : docs.length === 0 ? <p>{tt("HNC_VIEW_NODOCS")}</p> : (
          <ul className="bkg-docs">
            {docs.map((x) => (
              <li key={x.id}>
                <span>{x.documentName}</span>
                <button type="button" className="npt-btn npt-btn--ghost" disabled={fetching === x.id} onClick={() => openDoc(x)}>
                  <span>{fetching === x.id ? "…" : tt("HNC_DOC_VIEW")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {fetching ? <SevaLoader fullScreen message={tt("HNC_VIEW_OPENING")} /> : null}
      {acting ? <SevaLoader fullScreen message={tt("HNC_ACTING")} /> : null}
      {actionMsg ? <Toast error={!!actionMsg.error} label={actionMsg.label} onClose={() => setActionMsg(null)} /> : null}
      {viewError ? <div className="npt-lookup-error" role="alert"><span>{viewError}</span></div> : null}
      {viewing ? <DocViewer source={viewing.source} name={viewing.name} labels={docLabels(tt)} onClose={() => setViewing(null)} /> : null}

      <section className="npt-card bkg-pane">
        <h3>{tt("HNC_VIEW_TIMELINE")}</h3>
        {wfQ.isLoading ? <SevaLoader message={tt("HNC_LOADING")} /> : history.length === 0 ? <p>{tt("HNC_VIEW_NOHISTORY")}</p> : (
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

      <p className="bkg-back"><Link to={`${root}/my-requests`} className="npt-btn npt-btn--ghost"><span>{tt("HNC_VIEW_BACK")}</span></Link></p>
    </div>
  );
};

export default ApplicationView;
