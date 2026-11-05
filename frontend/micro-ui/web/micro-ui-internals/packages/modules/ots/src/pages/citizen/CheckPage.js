import { SevaLoader, Toast, serviceDocumentStore, uploadServiceDocuments } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { OTS_ANY_OTHER, OTS_DMS, OTS_NAV_STEPS, OTS_PAGES } from "../../config/otsConfig";
import { otsText } from "../../config/otsMessages";
import { OTSDeclaration } from "../../pageComponents/OTSDeclaration";
import { OTSGrid } from "../../pageComponents/OTSParts";
import OTSShell from "../../pageComponents/OTSShell";
import { OtsApi, apiErrorMessage, buildPayload, fmtDate, inr, loanTotal } from "../../utils/ots";

const OTSCheckPage = ({ t, params, setParams, basePath }) => {
  const history = useHistory();
  const tt = (k, p) => otsText(t, k, p);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);

  // a refreshed or deep-linked review page with nothing filled in goes back to the start
  const complete = OTS_PAGES.every((p) => params && params[p.key]);
  if (!complete) return <Redirect to={`${basePath}/applicant`} />;

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
      let appId = params._applicationId;
      if (!appId) {
        const res = await OtsApi.create(buildPayload(params));
        appId = String(res.application_id);
        save({ _applicationId: appId }); // kept so a retry never creates a second application
      }
      if (!params._docsSent) {
        const toSend = ((params.documents || {}).list || []).filter((d) => serviceDocumentStore.get(OTS_DMS, d.id));
        const { failed } = await uploadServiceDocuments({ serviceName: OTS_DMS, objectId: appId, list: toSend, description: "ots-application" });
        if (failed.length) throw new Error(tt("OTS_DOC_UPLOAD_FAILED", { docs: failed.join(", ") }));
        save({ _docsSent: true });
      }
      serviceDocumentStore.clear(OTS_DMS);
      history.replace(`${basePath}/acknowledgement`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("OTS_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (submitting) return <SevaLoader fullScreen message={tt("OTS_SUBMITTING")} />;

  const a = params.applicant;
  const s = params.shop;
  const loans = params.loans.list || [];
  const st = params.settlement;
  const docs = (params.documents.chosen || []).filter((d) => serviceDocumentStore.get(OTS_DMS, d.id));
  const yn = (v) => tt(v === "YES" ? "OTS_O_YES" : "OTS_O_NO");
  const edit = (route) => <button type="button" className="npt-link" onClick={() => history.push(`${basePath}/${route}`)}>{tt("OTS_BTN_EDIT")}</button>;
  const block = (page, body) => (
    <div className="npt-review-block" key={page.key}>
      <div className="npt-review-head"><h3>{tt(page.head)}</h3>{edit(page.route)}</div>
      {body}
    </div>
  );

  return (
    <OTSShell t={t} pageKey="review" onNext={submit} nextLabel={tt("OTS_BTN_SUBMIT")} nextIcon="check" onBack={() => history.push(`${basePath}/${OTS_PAGES[OTS_PAGES.length - 1].route}`)}>
      <p className="npt-card__hint">{tt("OTS_REVIEW_HINT")}</p>
      {block(OTS_NAV_STEPS[0], <OTSGrid rows={[
        [tt("OTS_F_applicantName"), a.applicantName], [tt("OTS_F_fatherName"), a.fatherName], [tt("OTS_F_dateOfBirth"), fmtDate(a.dateOfBirth)],
        [tt("OTS_F_mobileNumber"), a.mobileNumber], [tt("OTS_F_isHimachalResident"), yn(a.isHimachalResident)],
      ]} />)}
      {block(OTS_NAV_STEPS[1], <OTSGrid rows={[
        [tt("OTS_F_ulbName"), s.ulbName], [tt("OTS_F_ward"), s.ward], [tt("OTS_F_shopAddress"), s.shopAddress], [tt("OTS_F_pincode"), s.pincode],
        [tt("OTS_F_shopType"), s.shopType === OTS_ANY_OTHER ? s.shopTypeOther : s.shopType], [tt("OTS_F_annualTurnover"), inr(s.annualTurnover)],
        [tt("OTS_F_isGovernmentEmployee"), yn(s.isGovernmentEmployee)],
      ]} />)}
      {block(OTS_NAV_STEPS[2], (
        <React.Fragment>
          {loans.map((l, i) => (
            <div key={i}>
              <h4 className="npt-section__title">{tt("OTS_LOAN_N", { n: i + 1 })}</h4>
              <OTSGrid rows={[
                [tt("OTS_F_ifsc"), l.ifsc], [tt("OTS_F_bankName"), l.bankName], [tt("OTS_F_branchName"), l.branchName],
                [tt("OTS_F_loanTakenDate"), fmtDate(l.loanTakenDate)], [tt("OTS_F_npaDeclaredDate"), fmtDate(l.npaDeclaredDate)], [tt("OTS_F_amountAvailed"), inr(l.amountAvailed)],
                [tt("OTS_F_principal"), inr(l.principal)], [tt("OTS_F_interest"), inr(l.interest)], [tt("OTS_F_total"), inr(loanTotal(l))],
              ]} />
            </div>
          ))}
          <OTSGrid rows={[[tt("OTS_F_totalRepayment"), inr(params.loans.totalRepayment)]]} />
        </React.Fragment>
      ))}
      {block(OTS_NAV_STEPS[3], (
        <React.Fragment>
          <OTSGrid rows={[[tt("OTS_F_hasLoanSettlementFacility"), yn(st.hasLoanSettlementFacility)]]} />
          {(st.list || []).map((x, i) => (
            <div key={i}>
              <h4 className="npt-section__title">{tt("OTS_SET_N", { n: i + 1 })}</h4>
              <OTSGrid rows={[[tt("OTS_F_yearOfSettlement"), x.yearOfSettlement], [tt("OTS_F_amountSettled"), inr(x.amountSettled)], [tt("OTS_F_paidInFull"), yn(x.paidInFull)], [tt("OTS_F_schemeName"), x.schemeName]]} />
            </div>
          ))}
          <OTSGrid rows={[[tt("OTS_F_briefHistory"), st.briefHistory], [tt("OTS_F_nonPaymentReason"), st.nonPaymentReason]]} />
        </React.Fragment>
      ))}
      {block(OTS_NAV_STEPS[4], (
        <ul className="npt-review-docs">
          {docs.length === 0 ? <li>{tt("OTS_NOT_PROVIDED")}</li> : docs.map((d) => <li key={d.id}><strong>{d.documentName}</strong><span>{d.name}</span></li>)}
        </ul>
      ))}
      <OTSDeclaration t={t} params={params} />
      <label className={`npt-declare${declareError && !declared ? " has-error" : ""}`}>
        <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false); }} />
        <span>{tt("OTS_DECLARATION")}</span>
      </label>
      {declareError && !declared ? <p className="npt-declare__err" role="alert">{tt("OTS_DECLARE_REQUIRED")}</p> : null}
      {error ? <Toast error={true} label={error} onClose={() => setError(null)} /> : null}
    </OTSShell>
  );
};

export default OTSCheckPage;
