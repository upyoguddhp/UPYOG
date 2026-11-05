import { DocViewer, SevaLoader, fetchServiceDocumentList } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useLocation, useParams, useRouteMatch } from "react-router-dom";
import { NEW_PET_STEPS } from "../../../config/newPetConfig";
import { nprText } from "../../../config/newPetMessages";
import { NPRCrumbs, NPRIcon, NPRPageHead } from "../../../pageComponents/NewPet/NPRLayout";
import { docLabels } from "../../../pageComponents/NewPet/NPRDocuments";
import { NPR_DMS_SERVICE } from "../../../pageComponents/NewPet/useNPRDocuments";
import { apiErrorMessage, canRenew, newestRowOf } from "../../../utils/newPet";

const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());
const fmtDate = (v) => {
  if (!v) return "";
  const d = typeof v === "number" ? new Date(v) : new Date(String(v));
  return isNaN(d) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtTime = (ms) => (ms ? new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

// Read-only, full summary of one submitted trade licence application.
const ApplicationView = () => {
  const { t } = useTranslation();
  const tt = (k, p) => nprText(t, k, p);
  const match = useRouteMatch();
  const { search } = useLocation();
  const { applicationNumber: raw } = useParams();
  const applicationNumber = decodeURIComponent(raw || "");
  const urlTenant = new URLSearchParams(search).get("tenantId");
  const tenantId = urlTenant || "";
  const root = match.path.replace(/\/registration\/.*$/, "");

  const { data, isLoading, isError, error, refetch } = useQuery(
    ["NPR_APPLICATION", applicationNumber, tenantId],
    () => Digit.PTRService.search({ tenantId: urlTenant || undefined, filters: { applicationNumber, limit: 10, offset: 0 } }),
    { refetchOnWindowFocus: false, retry: 1 }
  );
  const docsQ = useQuery(["NPR_APPLICATION_DOCS", applicationNumber], () => fetchServiceDocumentList(NPR_DMS_SERVICE, applicationNumber), { refetchOnWindowFocus: false, retry: 0 });
  const allRows = (data && data.PetRegistrationApplications) || [];
  const lic = newestRowOf(allRows, applicationNumber);
  const wfQ = useQuery(
    ["NPR_APPLICATION_WF", applicationNumber],
    () => Digit.WorkflowService.getByBusinessId((lic && lic.tenantId) || tenantId || Digit.ULBService.getStateId(), applicationNumber),
    { enabled: !!lic, refetchOnWindowFocus: false, retry: 0 }
  );

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
      setViewError(tt("NPR_DOCV_FAILED"));
    }
    setFetching(null);
  };

  if (isLoading) return <div className="npt-wrap"><SevaLoader /></div>;

  const crumbs = <NPRCrumbs t={t} current={applicationNumber} />;
  if (isError || !lic) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <NPRPageHead title={tt("NPR_VIEW_TITLE")} sub={applicationNumber} />
        <div className="npt-lookup-error" role="alert">
          <span>{isError ? apiErrorMessage(error, tt("NPR_VIEW_FAILED")) : tt("NPR_VIEW_NOTFOUND")}</span>
          {isError ? <button type="button" className="npt-link" onClick={() => refetch()}>{tt("NPR_RETRY")}</button> : null}
        </div>
      </div>
    );
  }

  const pet = lic.petDetails || {};
  const ad = lic.additionalDetail || {};
  const addr = lic.address || {};
  const optLabel = (field, v) => {
    const o = (field.options || []).find((x) => x.code === v);
    return o ? tt(o.i18nKey) : v;
  };

  // field name -> stored value, same names as the application form
  const values = {
    propertyId: ad.propertyId,
    propertyOwnerName: ad.propertyOwner,
    propertyAddress: addr.addressLine1,
    districtName: ad.districtName,
    ulbName: ad.ulbName || addr.city,
    wardNumber: ad.wardNumber,
    propertyPinCode: addr.pincode,
    petName: pet.petName,
    petType: pet.petType,
    breedType: pet.breedType,
    petGender: pet.petGender,
    petAge: pet.petAge,
    petColour: ad.petColour,
    petStrelization: ad.petStrelization,
    petPurchaseSource: ad.petPurchaseSource,
    petPurchaseSourceDetail: ad.petPurchaseSourceDetail,
    vaccinationStatus: ad.vaccinationStatus || (pet.vaccinationNumber ? "Yes" : "No"),
    vaccinationNumber: pet.vaccinationNumber,
    lastVaccineDate: fmtDate(pet.lastVaccineDate),
    clinicName: pet.clinicName,
    doctorName: pet.doctorName,
    doctorRegistrationNumber: ad.doctorRegistrationNumber,
    applicantName: lic.applicantName,
    fatherName: lic.fatherName,
    petOwnerGender: ad.petOwnerGender,
    mobileNumber: lic.mobileNumber,
    emailId: lic.emailId,
    aadharNumber: lic.aadharNumber,
  };
  const sections = NEW_PET_STEPS.filter((s) => s.custom !== "documents").map((s) => ({
    key: s.key,
    head: s.head,
    rows: s.fields.filter((f) => !f.showIf || values[f.showIf.field] === f.showIf.equals).map((f) => [tt(`NPR_F_${f.name}`), optLabel(f, values[f.name])]),
  }));

  const docs = (docsQ.data || []).filter((x) => x.attachment && x.attachment.url);
  const history = ((wfQ.data && wfQ.data.ProcessInstances) || []).slice().sort((x, y) => (y.auditDetails || {}).createdTime - (x.auditDetails || {}).createdTime);
  const statusText = t(`WF_NEWTL_${lic.status}`, { defaultValue: humanise(lic.status) });
  const summary = [
    [tt("NPR_VIEW_APPNO"), lic.applicationNumber],
    [tt("NPR_VIEW_APPLIED"), fmtDate((lic.auditDetails || {}).createdTime)],
    [tt("NPR_VIEW_VALIDITY"), lic.validityDate ? fmtDate(lic.validityDate) : ""],
  ];

  const Grid = ({ rows }) => (
    <dl className="npt-grid npt-grid--3" style={{ margin: 0 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ minWidth: 0 }}>
          <dt style={{ fontSize: 12, opacity: 0.7 }}>{k}</dt>
          <dd style={{ margin: 0, fontWeight: 600, wordBreak: "break-word" }}>{v === undefined || v === null || v === "" ? "-" : v}</dd>
        </div>
      ))}
    </dl>
  );
  const card = { padding: 18, marginBottom: 14 };

  return (
    <div className="npt-wrap npt-printview">
      {crumbs}
      <div className="npt-listhead">
        <NPRPageHead title={tt("NPR_VIEW_TITLE")} sub={applicationNumber} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {lic && canRenew(lic, allRows) ? <Link to={`${root}/renew/${encodeURIComponent(applicationNumber)}${lic.tenantId ? `?tenantId=${lic.tenantId}` : ""}`} className="npt-btn npt-btn--primary"><span>{tt("NPR_RN_BTN")}</span></Link> : null}
          <button type="button" className="npt-btn npt-btn--ghost" onClick={() => window.print()}><span>{tt("NPR_VIEW_PRINT")}</span></button>
        </div>
      </div>

      <div className="npt-card" style={card}>
        <p style={{ margin: "0 0 14px" }}>
          <span style={{ marginRight: 8 }}>{tt("NPR_VIEW_STATUS")}:</span>
          <span className="npt-badge npt-badge--progress">{statusText}</span>
          <span className="npt-badge" style={{ marginLeft: 8 }}>{tt(lic.applicationType === "RENEWAL" ? "NPR_TYPE_RENEWAL" : "NPR_TYPE_NEW")}</span>
        </p>
        <Grid rows={summary} />
      </div>

      {sections.map((s) => (
        <div className="npt-card" style={card} key={s.key}>
          <h3 style={{ margin: "0 0 12px" }}>{tt(s.head)}</h3>
          <Grid rows={s.rows} />
        </div>
      ))}

      <div className="npt-card" style={card}>
        <h3 style={{ margin: "0 0 10px" }}>{tt("NPR_VIEW_DOCS")}</h3>
        {docsQ.isLoading ? <SevaLoader /> : docs.length === 0 ? <p style={{ margin: 0 }}>{tt("NPR_VIEW_NODOCS")}</p> : (
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
            {docs.map((x) => (
              <li key={x.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid #e3eaf6" }}>
                <span style={{ minWidth: 0, wordBreak: "break-word" }}>{x.documentName}</span>
                <button type="button" className="npt-btn npt-btn--ghost" disabled={fetching === x.id} onClick={() => openDoc(x)}>
                  <span>{fetching === x.id ? "…" : tt("NPR_DOC_VIEW")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {fetching ? <SevaLoader fullScreen message={tt("NPR_VIEW_OPENING")} /> : null}
      {viewError ? <div className="npt-lookup-error" role="alert"><span>{viewError}</span></div> : null}
      {viewing ? <DocViewer source={viewing.source} name={viewing.name} labels={docLabels(tt)} onClose={() => setViewing(null)} /> : null}

      <div className="npt-card" style={card}>
        <h3 style={{ margin: "0 0 10px" }}>{tt("NPR_VIEW_TIMELINE")}</h3>
        {wfQ.isLoading ? <SevaLoader /> : history.length === 0 ? <p style={{ margin: 0 }}>{tt("NPR_VIEW_NOHISTORY")}</p> : (
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={h.id || i} style={{ marginBottom: 8 }}>
                <strong>{t(`WF_NEWTL_${(h.state || {}).state}`, { defaultValue: humanise((h.state || {}).state || h.action) })}</strong>
                <div style={{ fontSize: 13, opacity: 0.75 }}>{[(h.assigner || {}).name, fmtTime((h.auditDetails || {}).createdTime)].filter(Boolean).join(" · ")}</div>
                {h.comment ? <div style={{ fontSize: 13 }}>{h.comment}</div> : null}
              </li>
            ))}
          </ol>
        )}
      </div>

      <p style={{ marginTop: 16 }}>
        <Link to={`${root}/my-registrations`} className="npt-btn npt-btn--ghost"><span>{tt("NPR_VIEW_BACK")}</span></Link>
      </p>
    </div>
  );
};

export default ApplicationView;
