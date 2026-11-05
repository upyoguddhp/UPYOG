import { SevaLoader, Toast, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { Redirect, useHistory } from "react-router-dom";
import { BKG_SERVICES } from "../../config/bookingConfig";
import { bkgText } from "../../config/bookingMessages";
import { BKGEstimate, BKGGrid, selectionRows } from "../../pageComponents/BookingParts";
import BookingShell, { navStepsOf } from "../../pageComponents/BookingShell";
import {
  AssetApi,
  SiteApi,
  apiErrorMessage,
  applicationNoOf,
  buildAssetForwardPayload,
  buildAssetPayload,
  buildSiteForwardPayload,
  buildSitePayload,
  categoriesOf,
  fmtDate,
} from "../../utils/booking";

const BookingCheckPage = ({ t, svc, params, setParams, basePath }) => {
  const history = useHistory();
  const tt = (k, p) => bkgText(t, k, p);
  const cfg = BKG_SERVICES[svc];
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);
  const sel = ((params || {}).select || {})[svc] || {};
  const isAsset = svc === "asset";
  const cats = useQuery(["BKG_CATEGORIES", sel.applicationNo], () => AssetApi.categories(sel.applicationNo), { enabled: isAsset && !!sel.applicationNo, refetchOnWindowFocus: false, retry: 1 });
  const category = categoriesOf(cats.data).find((c) => c.code === ((params || {}).booking || {}).bookingFor);

  // a refreshed or deep-linked review page with nothing filled in goes back to the start
  const complete = cfg.pages.every((p) => params && params[p.key]);
  if (!complete) return <Redirect to={`${basePath}/select`} />;

  let state = params;
  const save = (patch) => {
    state = { ...state, ...patch };
    setParams(state);
  };

  const submit = async () => {
    if (!declared) {
      setDeclareError(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let rec = params._result;
      if (!applicationNoOf(svc, rec)) {
        const res = await (isAsset ? AssetApi.create(buildAssetPayload(params)) : SiteApi.create(buildSitePayload(params)));
        rec = isAsset ? res && res.hallsBookingApplication && res.hallsBookingApplication[0] : res && res.SiteBookings && res.SiteBookings[0];
        if (!applicationNoOf(svc, rec)) throw new Error(tt("BKG_SUBMIT_FAILED"));
        save({ _result: rec }); // kept so a retry never creates a second booking
      }
      const appNo = applicationNoOf(svc, rec);
      if (!params._docsSent) {
        const toSend = ((params.documents || {}).list || []).filter((d) => serviceDocumentStore.get(cfg.dms, d.id));
        const { failed } = await uploadServiceDocuments({ serviceName: cfg.dms, objectId: appNo, list: toSend, description: `${svc}-booking-application` });
        if (failed.length) throw new Error(tt("BKG_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
        save({ _docsSent: true });
      }
      // move into the workflow (citizen -> ULB)
      await (isAsset ? AssetApi.updateStatus(buildAssetForwardPayload(appNo)) : SiteApi.update(buildSiteForwardPayload(appNo)));
      serviceDocumentStore.clear(cfg.dms);
      history.replace(`${basePath}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("BKG_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (submitting) return <SevaLoader fullScreen message={tt("BKG_SUBMITTING")} />;

  const navSteps = navStepsOf(svc);
  const sections = cfg.pages.filter((p) => !p.custom);
  const docs = (((params.documents || {}).chosen) || []).filter((d) => serviceDocumentStore.get(cfg.dms, d.id));
  const show = (field, v) => {
    if (v === undefined || v === null || v === "") return tt("BKG_NOT_PROVIDED");
    if (field.type === "date") return fmtDate(v);
    const o = (field.options || []).find((x) => x.code === v);
    if (o) return tt(o.i18nKey);
    if (field.optionsFrom === "bookingFor") return (categoriesOf(cats.data).find((c) => c.code === v) || {}).name || v;
    return String(v);
  };

  return (
    <BookingShell t={t} svc={svc} pageKey="review" onNext={submit} nextLabel={tt("BKG_BTN_SUBMIT")} nextIcon="check" onBack={() => history.push(`${basePath}/${cfg.pages[cfg.pages.length - 1].route}`)}>
      <p className="npt-card__hint">{tt("BKG_REVIEW_HINT")}</p>
      <div className="npt-review-block">
        <div className="npt-review-head">
          <h3>{tt(navSteps[0].head)}</h3>
          <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/select`)}>{tt("BKG_BTN_EDIT")}</button>
        </div>
        <BKGGrid rows={selectionRows(t, svc, sel)} />
      </div>
      {sections.map((p) => (
        <div className="npt-review-block" key={p.key}>
          <div className="npt-review-head">
            <h3>{tt(p.head)}</h3>
            <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/${p.route}`)}>{tt("BKG_BTN_EDIT")}</button>
          </div>
          <dl className="npt-review-grid">
            {p.fields.map((f) => (
              <div key={f.name}>
                <dt>{tt(`BKG_F_${f.name}`)}</dt>
                <dd>{show(f, params[p.key][f.name])}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <BKGEstimate t={t} svc={svc} sel={sel} booking={params.booking} category={category} />
      <div className="npt-review-block">
        <div className="npt-review-head">
          <h3>{tt("BKG_STEP_DOCUMENTS")}</h3>
          <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/documents`)}>{tt("BKG_BTN_EDIT")}</button>
        </div>
        <ul className="npt-review-docs">
          {docs.length === 0 ? <li>{tt("BKG_NOT_PROVIDED")}</li> : docs.map((d) => <li key={d.id}><strong>{d.documentName}</strong><span>{d.name}</span></li>)}
        </ul>
      </div>
      <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
        <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
        <span>{tt("BKG_DECLARATION")}</span>
      </label>
      {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("BKG_DECLARE_REQUIRED")}</p> : null}
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </BookingShell>
  );
};

export default BookingCheckPage;
