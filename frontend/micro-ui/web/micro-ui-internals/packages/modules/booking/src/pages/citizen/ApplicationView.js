import { DocViewer, SevaLoader, fetchServiceDocumentList } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useParams, useRouteMatch } from "react-router-dom";
import { BKG_SERVICES, bkgStageOf } from "../../config/bookingConfig";
import { bkgText } from "../../config/bookingMessages";
import { docLabels } from "../../pageComponents/BookingDocuments";
import { BKGCrumbs, BKGIcon, BKGPageHead } from "../../pageComponents/BookingLayout";
import { BKGEstimate, BKGGrid, statusText } from "../../pageComponents/BookingParts";
import { AssetApi, SiteApi, apiErrorMessage, applicationNoOf, fmtDate, fmtTime, humanise, niceName, secondsToYmd, statusOf } from "../../utils/booking";

// Read-only, full summary of one booking: details, applicant, documents (with View), timeline, print, pay.
const ApplicationView = () => {
  const { t } = useTranslation();
  const { svc, applicationNumber: raw } = useParams();
  const cfg = BKG_SERVICES[svc];
  const tt = (k, p) => bkgText(t, k, p);
  const match = useRouteMatch();
  const applicationNumber = decodeURIComponent(raw || "");
  const root = match.url.replace(/\/application\/.*$/, ""); // .../booking/<svc>

  const { data, isLoading, isError, error, refetch } = useQuery(["BKG_MINE", svc], svc === "site" ? SiteApi.searchMine : AssetApi.searchMine, { refetchOnWindowFocus: false, retry: 1 });
  const rec = (((svc === "site" ? (data || {}).SiteBookings : (data || {}).hallsBookingApplication) || []).find((r) => applicationNoOf(svc, r) === applicationNumber));
  const docsQ = useQuery(["BKG_VIEW_DOCS", svc, applicationNumber], () => fetchServiceDocumentList(cfg.dms, applicationNumber), { refetchOnWindowFocus: false, retry: 0 });
  const wfQ = useQuery(["BKG_VIEW_WF", svc, applicationNumber], () => Digit.WorkflowService.getByBusinessId(rec.tenantId, applicationNumber), { enabled: !!rec, refetchOnWindowFocus: false, retry: 0 });

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
      setViewError(tt("BKG_DOCV_FAILED"));
    }
    setFetching(null);
  };

  if (isLoading) return <div className="npt-wrap"><SevaLoader message={tt("BKG_LOADING")} /></div>;

  const crumbs = <BKGCrumbs t={t} svc={svc} current={applicationNumber} />;
  if (isError || !rec) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <BKGPageHead title={tt("BKG_VIEW_TITLE")} sub={applicationNumber} />
        <div className="npt-lookup-error" role="alert">
          <span>{isError ? apiErrorMessage(error, tt("BKG_VIEW_FAILED")) : tt("BKG_VIEW_NOTFOUND")}</span>
          {isError ? <button type="button" className="npt-link" onClick={() => refetch()}>{tt("BKG_RETRY")}</button> : null}
        </div>
      </div>
    );
  }

  const status = statusOf(svc, rec);
  const stage = bkgStageOf(status).toLowerCase();
  const s = rec.siteCreationData || {};
  const slot = (rec.bookingSlotDetails || [])[0] || {};
  const ap = rec.applicantDetail || {};
  const apx = ap.additionalDetails || {};
  const ad = rec.address || {};
  const from = svc === "site" ? secondsToYmd(rec.fromDate) : slot.bookingDate;
  const to = svc === "site" ? secondsToYmd(rec.toDate) : slot.bookingToDate || slot.bookingDate;

  const summary = [
    [tt("BKG_VIEW_APPNO"), applicationNumber],
    [tt("BKG_VIEW_APPLIED"), fmtTime((rec.auditDetails || {}).createdTime)],
    [tt("BKG_VIEW_PERIOD"), from ? `${fmtDate(from)} - ${fmtDate(to)}` : ""],
  ];
  const targetRows =
    svc === "site"
      ? [
          [tt("BKG_F_siteID"), s.siteID],
          [tt("BKG_F_siteName"), niceName(s.siteName)],
          [tt("BKG_F_siteType"), s.siteType],
          [tt("BKG_F_siteAddress"), s.siteAddress],
          [tt("BKG_F_ulbName"), s.ulbName || (rec.additionalDetail || {}).ulbName],
          [tt("BKG_F_districtName"), s.districtName],
          [tt("BKG_F_size"), s.sizeLength && s.sizeWidth ? `${s.sizeLength} x ${s.sizeWidth}` : ""],
        ]
      : [
          [tt("BKG_F_assetName"), rec.communityHallName],
          [tt("BKG_F_applicationNo"), rec.communityHallCode],
          [tt("BKG_F_ulbName"), (rec.tenantId || "").split(".")[1]],
          [tt("BKG_F_street"), ((rec.relatedAsset || {}).addressDetails || {}).street],
        ];
  const bookingRows =
    svc === "site"
      ? [
          [tt("BKG_F_fromDate"), fmtDate(from)],
          [tt("BKG_F_toDate"), fmtDate(to)],
          [tt("BKG_F_hoardingType"), rec.hoardingType],
        ]
      : [
          [tt("BKG_F_fromDate"), fmtDate(from)],
          [tt("BKG_F_toDate"), fmtDate(to)],
          [tt("BKG_F_bookingFor"), (rec.additionaldetail || {}).bookingFor],
          [tt("BKG_F_purpose"), (rec.purpose || {}).purpose || rec.purposeDescription],
        ];
  const applicantRows =
    svc === "site"
      ? [
          [tt("BKG_F_applicantName"), rec.applicantName],
          [tt("BKG_F_applicantFatherName"), rec.applicantFatherName],
          [tt("BKG_F_gender"), rec.gender],
          [tt("BKG_F_mobileNumber"), rec.mobileNumber],
          [tt("BKG_F_emailId"), rec.emailId],
          [tt("BKG_F_gstNumber"), (rec.additionalDetail || {}).gstNumber],
        ]
      : [
          [tt("BKG_F_applicantName"), ap.applicantName],
          [tt("BKG_F_applicantFatherName"), apx.applicantFatherName],
          [tt("BKG_F_gender"), apx.gender],
          [tt("BKG_F_mobileNumber"), ap.applicantMobileNo],
          [tt("BKG_F_emailId"), ap.applicantEmailId],
          [tt("BKG_F_accountHolderName"), ap.accountHolderName],
          [tt("BKG_F_accountNumber"), ap.accountNumber],
          [tt("BKG_F_bankName"), ap.bankName],
          [tt("BKG_F_bankBranchName"), ap.bankBranchName],
          [tt("BKG_F_ifscCode"), ap.ifscCode],
        ];
  const addressRows = [
    [tt("BKG_F_addressLine1"), ad.addressLine1],
    [tt("BKG_F_locality"), ad.locality],
    [tt("BKG_F_landmark"), ad.landmark],
    [tt("BKG_F_city"), ad.city],
    [tt("BKG_F_districtName"), (ad.additionalDetails || {}).district],
    [tt("BKG_F_pincode"), ad.pincode],
  ];

  const docs = (docsQ.data || []).filter((x) => x.attachment && x.attachment.url);
  const history = ((wfQ.data && wfQ.data.ProcessInstances) || []).slice().sort((x, y) => (y.auditDetails || {}).createdTime - (x.auditDetails || {}).createdTime);

  return (
    <div className="npt-wrap bkg-view npt-printview">
      {crumbs}
      <div className="npt-listhead">
        <BKGPageHead title={tt("BKG_VIEW_TITLE")} sub={applicationNumber} />
        <button type="button" className="npt-btn npt-btn--ghost" onClick={() => window.print()}><BKGIcon name="print" size={18} /><span>{tt("BKG_VIEW_PRINT")}</span></button>
      </div>

      <section className="npt-card bkg-pane">
        <p className="bkg-pane__status">
          <span>{tt("BKG_VIEW_STATUS")}:</span>
          <span className={`npt-badge npt-badge--${stage}`}>{statusText(t, status)}</span>
        </p>
        <BKGGrid rows={summary} />
        {status === "PENDINGFORPAYMENT" ? (
          <div className="bkg-pane__actions">
            <Link className="npt-btn npt-btn--primary" to={{ pathname: `/digit-ui/citizen/payment/my-bills/${cfg.businessService}/${applicationNumber}`, state: { tenantId: rec.tenantId, applicationNumber } }}>
              <span>{tt("BKG_PAY_NOW")}</span>
            </Link>
          </div>
        ) : null}
      </section>
      <section className="npt-card bkg-pane"><h3>{tt(svc === "site" ? "BKG_SEL_SITE" : "BKG_SEL_ASSET")}</h3><BKGGrid rows={targetRows} /></section>
      <section className="npt-card bkg-pane"><h3>{tt("BKG_STEP_BOOKING")}</h3><BKGGrid rows={bookingRows} /></section>
      {svc === "site" && from && to ? (
        <section className="npt-card bkg-pane">
          <BKGEstimate t={t} svc={svc} sel={{ siteCost: s.siteCost, gstPercnetage: (s.additionalDetail || {}).gstPercnetage, securityAmount: s.securityAmount }} booking={{ fromDate: from, toDate: to }} />
        </section>
      ) : null}
      <section className="npt-card bkg-pane"><h3>{tt("BKG_STEP_APPLICANT")}</h3><BKGGrid rows={applicantRows} /></section>
      {svc === "asset" ? <section className="npt-card bkg-pane"><h3>{tt("BKG_STEP_ADDRESS")}</h3><BKGGrid rows={addressRows} /></section> : null}

      <section className="npt-card bkg-pane">
        <h3>{tt("BKG_VIEW_DOCS")}</h3>
        {docsQ.isLoading ? <SevaLoader message={tt("BKG_LOADING")} /> : docs.length === 0 ? <p>{tt("BKG_VIEW_NODOCS")}</p> : (
          <ul className="bkg-docs">
            {docs.map((x) => (
              <li key={x.id}>
                <span>{x.documentName}</span>
                <button type="button" className="npt-btn npt-btn--ghost" disabled={fetching === x.id} onClick={() => openDoc(x)}>
                  <span>{fetching === x.id ? "…" : tt("BKG_DOC_VIEW")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {fetching ? <SevaLoader fullScreen message={tt("BKG_VIEW_OPENING")} /> : null}
      {viewError ? <div className="npt-lookup-error" role="alert"><span>{viewError}</span></div> : null}
      {viewing ? <DocViewer source={viewing.source} name={viewing.name} labels={docLabels(tt)} onClose={() => setViewing(null)} /> : null}

      <section className="npt-card bkg-pane">
        <h3>{tt("BKG_VIEW_TIMELINE")}</h3>
        {wfQ.isLoading ? <SevaLoader message={tt("BKG_LOADING")} /> : history.length === 0 ? <p>{tt("BKG_VIEW_NOHISTORY")}</p> : (
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

      <p className="bkg-back"><Link to={`${root}/my-bookings`} className="npt-btn npt-btn--ghost"><span>{tt("BKG_VIEW_BACK")}</span></Link></p>
    </div>
  );
};

export default ApplicationView;
