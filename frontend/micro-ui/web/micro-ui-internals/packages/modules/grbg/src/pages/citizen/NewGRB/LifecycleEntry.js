import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import { Link, useHistory, useParams, useRouteMatch } from "react-router-dom";
import { grbText } from "../../../config/newGRBMessages";
import { GRBBtn, GRBCrumbs, GRBIcon, GRBPageHead, GRBTricolour } from "../../../pageComponents/NewGRB/GRBLayout";
import { useGRBAccount } from "../../../pageComponents/NewGRB/useGRBAccount";
import { GarbageApi, apiErrorMessage, applicationNoOf, buildWorkflowPayload, paramsFromAccount, pendingDuesOf } from "../../../utils/newGRB";

const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());

/**
 * Confirm step of an account lifecycle change.
 *   kind="modify": checks pending dues, takes the approved account back to the citizen (RETURN_TO_INITIATOR),
 *                  loads it into the modification session and opens the edit pages.
 *   kind="close":  asks for a reason + confirmation, checks dues, then runs the CLOSE workflow action.
 * What is allowed comes from the workflow's own nextActions for the signed-in citizen, never assumed.
 */
const LifecycleEntry = ({ kind, setParams, params }) => {
  const { t } = useTranslation();
  const tt = (k, p) => grbText(t, k, p);
  const history = useHistory();
  const match = useRouteMatch();
  const queryClient = useQueryClient();
  const { applicationNumber: raw } = useParams();
  const applicationNumber = decodeURIComponent(raw || "");
  const root = match.path.replace(/\/(modify|close)\/.*$/, "");
  const viewTo = `${root}/application/${encodeURIComponent(applicationNumber)}`;
  const modify = kind === "modify";

  const a = useGRBAccount(applicationNumber);
  const [busy, setBusy] = useState(null); // message key while a call runs
  const [error, setError] = useState(null);
  const [reason, setReason] = useState("");
  const [declared, setDeclared] = useState(false);
  const [showReq, setShowReq] = useState(false);
  const [closed, setClosed] = useState(false);

  if (a.isLoading) return <div className="npt-wrap"><SevaLoader message={tt("GRB_LC_CHECKING")} /></div>;
  const title = tt(modify ? "GRB_LC_MODIFY_TITLE" : "GRB_LC_CLOSE_TITLE");
  const crumbs = <GRBCrumbs t={t} current={title} />;
  if (a.isError || !a.acc) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <GRBPageHead title={title} sub={applicationNumber} />
        <div className="npt-lookup-error" role="alert">
          <span>{a.isError ? apiErrorMessage(a.error, tt("GRB_LC_FAILED")) : tt("GRB_LC_NOT_FOUND")}</span>
          {a.isError ? <button type="button" className="npt-link" onClick={a.refetch}>{tt("GRB_RETRY")}</button> : null}
        </div>
      </div>
    );
  }

  const acc = a.acc;
  const first = (acc.grbgCollectionUnits || [])[0] || {};
  const addr = (acc.addresses || [])[0] || {};
  const rows = [
    [tt("GRB_VIEW_APPNO"), applicationNumber],
    [tt("GRB_LC_STATUS_NOW"), t(`WF_GB_${a.status}`, { defaultValue: humanise(a.status) })],
    [tt("GRB_F_propertyId"), acc.systemPropertyId || acc.propertyId],
    [tt("GRB_F_propertyAddress"), addr.address1],
    [tt("GRB_F_typeOfCollection"), first.unitType],
  ];

  const allowed = modify ? a.canModify || a.canContinue : a.canClose;
  const notAllowedKey = modify ? "GRB_LC_NOT_ELIGIBLE" : a.status === "APPROVED" ? "GRB_LC_CLOSE_NOT_ALLOWED" : "GRB_LC_NOT_ELIGIBLE";
  const businessService = (a.wf && a.wf.businessService) || acc.businessService;

  const checkDues = async () => {
    setBusy("GRB_LC_CHECKING_DUES");
    const pending = await pendingDuesOf(acc);
    if (pending.length) {
      setError(tt("GRB_LC_DUES", { codes: pending.join(", ") }));
      return false;
    }
    return true;
  };

  const startModify = async () => {
    setError(null);
    try {
      let current = acc;
      if (a.status === "APPROVED") {
        if (!(await checkDues())) return;
        setBusy("GRB_LC_STARTING");
        await GarbageApi.update(buildWorkflowPayload(applicationNumber, businessService, "RETURN_TO_INITIATOR", "Modification requested by citizen"));
        // the account now sits in PENDINGFORMODIFICATION: reload it fresh for editing
        const info = (Digit.UserService.getUser() || {}).info || {};
        const res = await GarbageApi.searchMine(info.mobileNumber);
        current = ((res && res.garbageAccounts) || []).find((x) => applicationNoOf(x) === applicationNumber) || acc;
      }
      // an unfinished modification keeps what was typed so far
      const resume = params && params._appNo === applicationNumber && params._mode === "MODIFICATION";
      setParams(resume && a.status !== "APPROVED" ? params : { ...paramsFromAccount(current), _businessService: businessService });
      queryClient.invalidateQueries();
      history.push(`${match.url}/details`);
    } catch (e) {
      setError(apiErrorMessage(e, tt("GRB_LC_FAILED")));
      setBusy(null);
    }
  };

  const closeAccount = async () => {
    setError(null);
    if (!reason.trim() || !declared) {
      setShowReq(true);
      return;
    }
    try {
      if (!(await checkDues())) {
        setBusy(null);
        return;
      }
      setBusy("GRB_LC_CLOSING");
      await GarbageApi.update(buildWorkflowPayload(applicationNumber, businessService, "CLOSE", reason.trim()));
      queryClient.invalidateQueries();
      setClosed(true);
    } catch (e) {
      setError(apiErrorMessage(e, tt("GRB_LC_FAILED")));
    }
    setBusy(null);
  };

  if (busy) return <SevaLoader fullScreen message={tt(busy)} />;

  if (closed) {
    return (
      <div className="npt-wrap">
        {crumbs}
        <section className="npt-ack">
          <div className="npt-ack__banner">
            <span className="npt-ack__tick"><GRBIcon name="check" size={30} /></span>
            <div>
              <h1>{tt("GRB_LC_CLOSED_TITLE")}</h1>
              <p>{tt("GRB_LC_CLOSED_SUB")}</p>
            </div>
            <div className="npt-ack__id"><small>{tt("GRB_VIEW_APPNO")}</small><strong>{applicationNumber}</strong></div>
          </div>
          <div className="npt-ack__btns" style={{ padding: 16 }}>
            <Link to={`${root}/my-registrations`} className="npt-btn npt-btn--primary"><GRBIcon name="list" size={18} /><span>{tt("GRB_ACK_GO_APPS")}</span></Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="npt-wrap">
      {crumbs}
      <GRBPageHead title={title} sub={tt(modify ? "GRB_LC_MODIFY_SUB" : "GRB_LC_CLOSE_SUB")} />
      <section className="npt-card">
        <GRBTricolour />
        <div className="npt-card__body">
          <dl className="npt-grid npt-grid--3" style={{ margin: "0 0 16px" }}>
            {rows.map(([k, v]) => (
              <div key={k} style={{ minWidth: 0 }}>
                <dt style={{ fontSize: 12, opacity: 0.7 }}>{k}</dt>
                <dd style={{ margin: 0, fontWeight: 600, wordBreak: "break-word" }}>{v || "-"}</dd>
              </div>
            ))}
          </dl>

          {allowed ? (
            <React.Fragment>
              <p className="npt-card__hint" role="note">{tt(modify ? "GRB_LC_MODIFY_WARN" : "GRB_LC_CLOSE_WARN")}</p>
              {modify ? null : (
                <React.Fragment>
                  <label className={`npt-field${showReq && !reason.trim() ? " has-error" : ""}`}>
                    <span>{tt("GRB_LC_REASON")} <span className="npt-req" aria-hidden="true">*</span></span>
                    <textarea rows={3} maxLength={250} value={reason} placeholder={tt("GRB_LC_REASON_PH")} onChange={(e) => setReason(e.target.value)} style={{ width: "100%" }} />
                  </label>
                  {showReq && !reason.trim() ? <p className="npt-declare__err" role="alert">{tt("GRB_LC_REASON_REQUIRED")}</p> : null}
                  <label className={`npt-declare${showReq && !declared ? " has-error" : ""}`}>
                    <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
                    <span>{tt("GRB_LC_DECL_CLOSE")}</span>
                  </label>
                  {showReq && !declared ? <p className="npt-declare__err" role="alert">{tt("GRB_LC_DECL_REQUIRED")}</p> : null}
                </React.Fragment>
              )}
            </React.Fragment>
          ) : (
            <div className="npt-lookup-error" role="alert"><span>{tt(notAllowedKey)}</span></div>
          )}
          {error ? <div className="npt-lookup-error" role="alert"><span>{error}</span></div> : null}
        </div>
      </section>
      <div className="npt-actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
        <Link to={viewTo} className="npt-btn npt-btn--ghost"><span>{tt("GRB_LC_BACK")}</span></Link>
        {allowed ? (
          <GRBBtn kind="primary" icon={modify ? "edit" : "check"} onClick={modify ? startModify : closeAccount}>
            {tt(modify ? (a.status === "APPROVED" ? "GRB_LC_CONFIRM_MODIFY" : "GRB_LC_CONTINUE_MODIFY") : "GRB_LC_CONFIRM_CLOSE")}
          </GRBBtn>
        ) : null}
      </div>
    </div>
  );
};

export default LifecycleEntry;
