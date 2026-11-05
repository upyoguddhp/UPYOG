import { DocViewer, SevaLoader, fetchServiceDocumentList } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useLocation, useParams, useRouteMatch } from "react-router-dom";
import { NEW_PT_STEPS } from "../../../config/newPTConfig";
import { nptText } from "../../../config/newPTMessages";
import { NPTCrumbs, NPTPageHead } from "../../../pageComponents/NewPT/NPTLayout";
import { docLabels } from "../../../pageComponents/NewPT/NPTDocuments";
import { NPT_DMS_SERVICE } from "../../../pageComponents/NewPT/useNPTDocuments";
import { apiErrorMessage } from "../../../utils/newPT";

const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());
const fmtTime = (ms) => (ms ? new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");

// Read-only, full summary of one submitted property application.
const ApplicationView = () => {
  const { t } = useTranslation();
  const tt = (k, p) => nptText(t, k, p);
  const match = useRouteMatch();
  const { search } = useLocation();
  const { propertyId: raw } = useParams();
  const propertyId = decodeURIComponent(raw || "");
  const tenantId = new URLSearchParams(search).get("tenantId") || Digit.ULBService.getStateId();
  const root = match.path.replace(/\/application\/.*$/, "");

  const { data, isLoading, isError, error, refetch } = useQuery(
    ["NPT_APPLICATION", propertyId, tenantId],
    () => Digit.PTService.search({ tenantId, filters: { propertyIds: propertyId } }),
    { refetchOnWindowFocus: false, retry: 1 }
  );
  const docsQ = useQuery(["NPT_APPLICATION_DOCS", propertyId], () => fetchServiceDocumentList(NPT_DMS_SERVICE, propertyId), { refetchOnWindowFocus: false, retry: 0 });
  const prop = ((data && data.Properties) || []).find((p) => p.propertyId === propertyId);
  const wfQ = useQuery(
    ["NPT_APPLICATION_WF", propertyId],
    () => Digit.WorkflowService.getByBusinessId((prop && prop.tenantId) || tenantId, (prop && prop.acknowldgementNumber) || propertyId),
    { enabled: !!prop, refetchOnWindowFocus: false, retry: 0 }
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
      setViewError(tt("NPT_DOCV_FAILED"));
    }
    setFetching(null);
  };

  if (isLoading) return <div className="npt-wrap"><SevaLoader /></div>;

  const crumbs = <NPTCrumbs t={t} current={propertyId} />;
  if (isError || !prop) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <NPTPageHead title={tt("NPT_VIEW_TITLE")} sub={propertyId} />
        <div className="npt-lookup-error" role="alert">
          <span>{isError ? apiErrorMessage(error, tt("NPT_VIEW_FAILED")) : tt("NPT_VIEW_NOTFOUND")}</span>
          {isError ? <button type="button" className="npt-link" onClick={() => refetch()}>{tt("NPT_RETRY")}</button> : null}
        </div>
      </div>
    );
  }

  const addr = prop.address || {};
  const aex = addr.additionalDetails || {};
  const owner = (prop.owners || [])[0] || {};
  const oad = owner.additionalDetails || {};
  const ad = prop.additionalDetails || {};
  const unit0 = (prop.units || [])[0] || {};
  const specStep = NEW_PT_STEPS.find((s) => s.key === "specificationDetails");
  const ownerStep = NEW_PT_STEPS.find((s) => s.key === "ownerDetails");
  const locStep = NEW_PT_STEPS.find((s) => s.key === "locationDetails");
  const optLabel = (field, v) => {
    const o = ((field && field.options) || []).find((x) => String(x.code) === String(v));
    return o ? tt(o.i18nKey) : v;
  };
  const yn = (v) => (v === true || v === "Yes" ? tt("NPT_O_YES") : v === false || v === "No" ? tt("NPT_O_NO") : v);
  const fieldOf = (step, name) => ((step && step.fields) || []).find((f) => f.name === name);
  const row = (step, name, v) => [tt(`NPT_F_${name}`), optLabel(fieldOf(step, name), v)];

  const loc = [
    row(locStep, "districtName", addr.district),
    row(locStep, "ulbName", aex.ulbName),
    row(locStep, "ulbType", aex.ulbType),
    row(locStep, "wardNumber", aex.wardNumber),
    row(locStep, "zone", aex.zone),
    row(locStep, "propertyPinCode", addr.pincode),
    row(locStep, "oldPropertyId", prop.oldPropertyId),
    row(locStep, "gpsLocation", addr.geoLocation && addr.geoLocation.latitude ? `${addr.geoLocation.latitude}, ${addr.geoLocation.longitude}` : ""),
    row(locStep, "propertyAddress", aex.propertyAddress),
  ];
  const khasra = (ad.multipleKhasra || []).map((k, i) => [tt("NPT_KHASRA_ITEM", { n: i + 1 }), [k.khataOrKhatauniNo, k.khasraNo, [k.area, k.unit].filter(Boolean).join(" ")].filter(Boolean).join(" · ")]);
  const built = prop.propertyType === "BUILTUP";
  const spec = [
    row(specStep, "isBilling", yn(ad.isBilling !== undefined ? ad.isBilling : prop.isBilling)),
    row(specStep, "propertyType", prop.propertyType),
    ...(built ? [row(specStep, "mapRefNo", ad.mapRefNo)] : [row(specStep, "propArea", (unit0.additionalDetails || {}).propArea)]),
  ];
  const unitItem = (specStep.fields.find((f) => f.name === "units") || {}).item || [];
  const units = built ? (prop.units || []).map((u, i) => ({
    title: tt("NPT_UNIT_ITEM", { n: i + 1 }),
    rows: unitItem.map((f) => [tt(`NPT_FI_${f.name}`), optLabel(f, f.name === "floorNo" ? u.floorNo : (u.additionalDetails || {})[f.name])]),
  })) : [];
  const own = [
    row(ownerStep, "oldCustomerId", oad.ownerOldCustomerId),
    row(ownerStep, "ownerName", owner.name),
    row(ownerStep, "ownerFatherName", oad.fatherOrHusbandName || owner.fatherOrHusbandName),
    row(ownerStep, "ownerGender", oad.gender || owner.gender),
    row(ownerStep, "ownerMobileNumber", owner.mobileNumber),
    row(ownerStep, "ownerEmail", oad.emailId || owner.emailId),
    row(ownerStep, "ownerAddress", oad.correspondenceAddress),
    row(ownerStep, "ownerPinCode", oad.ownerPinCode),
    row(ownerStep, "anyOtherCoWorker", oad.anyOtherCoWorker),
  ];
  const coItem = (ownerStep.fields.find((f) => f.name === "coOwners") || {}).item || [];
  const coOwners = (oad.coOwners || []).map((c, i) => ({
    title: tt("NPT_COOWNER_ITEM", { n: i + 1 }),
    rows: coItem.filter((f) => f.name !== "addressSameAsOwner" || true).map((f) => [tt(`NPT_F_${f.name}`), f.name === "addressSameAsOwner" ? yn(c[f.name]) : optLabel(f, c[f.name])]),
  }));

  const docs = (docsQ.data || []).filter((x) => x.attachment && x.attachment.url);
  const history = ((wfQ.data && wfQ.data.ProcessInstances) || []).slice().sort((x, y) => (y.auditDetails || {}).createdTime - (x.auditDetails || {}).createdTime);
  const statusText = t(`WF_PROPERTY_${prop.status}`, { defaultValue: humanise(prop.status) });
  const summary = [
    [tt("NPT_VIEW_PID"), prop.propertyId],
    [tt("NPT_VIEW_APPLIED"), fmtDate((prop.auditDetails || {}).createdTime)],
    [tt("NPT_VIEW_UPDATED"), fmtDate((prop.auditDetails || {}).lastModifiedTime)],
    [tt("NPT_VIEW_OWNER"), [owner.name, owner.mobileNumber].filter(Boolean).join(" · ")],
  ];

  const Grid = ({ rows }) => (
    <dl className="npt-grid npt-grid--3" style={{ margin: 0 }}>
      {rows.map(([k, v], i) => (
        <div key={`${k}${i}`} style={{ minWidth: 0 }}>
          <dt style={{ fontSize: 12, opacity: 0.7 }}>{k}</dt>
          <dd style={{ margin: 0, fontWeight: 600, wordBreak: "break-word" }}>{v === undefined || v === null || v === "" ? "-" : v}</dd>
        </div>
      ))}
    </dl>
  );
  const card = { padding: 18, marginBottom: 14 };
  const Section = ({ head, children }) => (
    <div className="npt-card" style={card}>
      <h3 style={{ margin: "0 0 12px" }}>{head}</h3>
      {children}
    </div>
  );

  return (
    <div className="npt-wrap npt-printview">
      {crumbs}
      <div className="npt-listhead">
        <NPTPageHead title={tt("NPT_VIEW_TITLE")} sub={propertyId} />
        <button type="button" className="npt-btn npt-btn--ghost" onClick={() => window.print()}><span>{tt("NPT_VIEW_PRINT")}</span></button>
      </div>

      <div className="npt-card" style={card}>
        <p style={{ margin: "0 0 14px" }}>
          <span style={{ marginRight: 8 }}>{tt("NPT_VIEW_STATUS")}:</span>
          <span className="npt-badge npt-badge--progress">{statusText}</span>
        </p>
        <Grid rows={summary} />
      </div>

      <Section head={tt("NPT_STEP_LOCATION")}>
        <Grid rows={loc} />
        {khasra.length ? <div style={{ marginTop: 12 }}><h4 style={{ margin: "0 0 8px" }}>{tt("NPT_F_multipleKhasra")}</h4><Grid rows={khasra} /></div> : null}
      </Section>
      <Section head={tt("NPT_STEP_SPEC")}>
        <Grid rows={spec} />
        {units.map((u) => <div key={u.title} style={{ marginTop: 12 }}><h4 style={{ margin: "0 0 8px" }}>{u.title}</h4><Grid rows={u.rows} /></div>)}
      </Section>
      <Section head={tt("NPT_STEP_OWNER")}>
        <Grid rows={own} />
        {coOwners.map((c) => <div key={c.title} style={{ marginTop: 12 }}><h4 style={{ margin: "0 0 8px" }}>{c.title}</h4><Grid rows={c.rows} /></div>)}
      </Section>

      <Section head={tt("NPT_VIEW_DOCS")}>
        {docsQ.isLoading ? <SevaLoader /> : docs.length === 0 ? <p style={{ margin: 0 }}>{tt("NPT_VIEW_NODOCS")}</p> : (
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
            {docs.map((x) => (
              <li key={x.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid #e3eaf6" }}>
                <span style={{ minWidth: 0, wordBreak: "break-word" }}>{x.documentName}</span>
                <button type="button" className="npt-btn npt-btn--ghost" disabled={fetching === x.id} onClick={() => openDoc(x)}>
                  <span>{fetching === x.id ? "…" : tt("NPT_DOC_VIEW")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {fetching ? <SevaLoader fullScreen message={tt("NPT_VIEW_OPENING")} /> : null}
      {viewError ? <div className="npt-lookup-error" role="alert"><span>{viewError}</span></div> : null}
      {viewing ? <DocViewer source={viewing.source} name={viewing.name} labels={docLabels(tt)} onClose={() => setViewing(null)} /> : null}

      <Section head={tt("NPT_VIEW_TIMELINE")}>
        {wfQ.isLoading ? <SevaLoader /> : history.length === 0 ? <p style={{ margin: 0 }}>{tt("NPT_VIEW_NOHISTORY")}</p> : (
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={h.id || i} style={{ marginBottom: 8 }}>
                <strong>{t(`WF_PROPERTY_${(h.state || {}).state}`, { defaultValue: humanise((h.state || {}).state || h.action) })}</strong>
                <div style={{ fontSize: 13, opacity: 0.75 }}>{[(h.assigner || {}).name, fmtTime((h.auditDetails || {}).createdTime)].filter(Boolean).join(" · ")}</div>
                {h.comment ? <div style={{ fontSize: 13 }}>{h.comment}</div> : null}
              </li>
            ))}
          </ol>
        )}
      </Section>

      <p style={{ marginTop: 16 }}>
        <Link to={`${root}/my-properties`} className="npt-btn npt-btn--ghost"><span>{tt("NPT_VIEW_BACK")}</span></Link>
      </p>
    </div>
  );
};

export default ApplicationView;
