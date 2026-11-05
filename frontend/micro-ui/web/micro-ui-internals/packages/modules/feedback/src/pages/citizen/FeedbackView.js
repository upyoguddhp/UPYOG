import { SevaLoader } from "@upyog/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Link, useParams, useRouteMatch } from "react-router-dom";
import { fdbText } from "../../config/feedbackMessages";
import { FDBCrumbs, FDBPageHead } from "../../pageComponents/FeedbackLayout";
import { FeedbackApi, apiErrorMessage, fmtTime, getUserInfo, humanise, questionsOf, servicesOf, statusKey } from "../../utils/feedback";

const HIDDEN = ["serviceCode", "rating"];

// Read-only summary of one submitted feedback.
const FeedbackView = () => {
  const { t } = useTranslation();
  const tt = (k, p) => fdbText(t, k, p);
  const match = useRouteMatch();
  const { applicationNo: raw } = useParams();
  const applicationNo = decodeURIComponent(raw || "");
  const root = match.path.replace(/\/application\/.*$/, "");
  const mobile = getUserInfo().mobileNumber;

  const { data, isLoading, isError, error, refetch } = useQuery(
    ["FDB_ONE", applicationNo],
    () => Digit.CustomService.getResponse({ url: "/feedback-service/submission/_search", params: { _: Date.now() }, data: { RequestInfo: { apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token }, FeedbackSearchCriteria: { mobileNo: mobile, applicationNo } } }),
    { refetchOnWindowFocus: false, retry: 1, enabled: !!mobile }
  );
  const rec = (Array.isArray(data) ? data : []).find((r) => r.applicationNo === applicationNo);
  const svcQ = useQuery(["FDB_SERVICES"], FeedbackApi.services, { refetchOnWindowFocus: false, retry: 0 });
  const qQ = useQuery(["FDB_QUESTIONS", rec && rec.serviceId], () => FeedbackApi.questions(rec.serviceId), { enabled: !!rec && rec.serviceId !== "GENERAL", refetchOnWindowFocus: false, retry: 0 });

  if (isLoading && mobile) return <div className="npt-wrap"><SevaLoader message={tt("FDB_LOADING")} /></div>;

  const head = (
    <React.Fragment>
      <FDBCrumbs t={t} list current={applicationNo} />
      <FDBPageHead title={tt("FDB_VIEW_TITLE")} sub={applicationNo} />
    </React.Fragment>
  );
  if (isError || !rec) {
    return (
      <div className="npt-wrap">
        {head}
        <div className="npt-lookup-error" role="alert">
          <span>{isError ? apiErrorMessage(error, tt("FDB_VIEW_FAILED")) : tt("FDB_VIEW_NOTFOUND")}</span>
          {isError ? <button type="button" className="npt-link" onClick={() => refetch()}>{tt("FDB_RETRY")}</button> : null}
        </div>
        <p style={{ marginTop: 16 }}><Link to={`${root}/my-feedback`} className="npt-btn npt-btn--ghost"><span>{tt("FDB_VIEW_BACK")}</span></Link></p>
      </div>
    );
  }

  const service = rec.serviceId === "GENERAL" ? tt("FDB_GENERAL_SERVICE") : ((servicesOf(svcQ.data).find((s) => s.serviceCode === rec.serviceId) || {}).serviceName || humanise(rec.serviceId));
  const questions = questionsOf(qQ.data);
  const responses = ((rec.additionalDetail || {}).questionResponses) || {};
  const labelOf = (code) => (questions.find((q) => q.questionCode === code) || {}).question || (code === "overallRating" ? tt("FDB_GENERAL_RATING") : code === "comment" ? tt("FDB_GENERAL_COMMENT") : humanise(code));
  const valueOf = (code, v) => {
    const q = questions.find((x) => x.questionCode === code);
    if (q && q.questionType === "rating") return tt("FDB_STAR", { n: v });
    if (q && q.questionType === "radioButton" && q.anserOptions && q.anserOptions[v]) return q.anserOptions[v];
    return code === "overallRating" ? tt("FDB_STAR", { n: v }) : String(v);
  };
  const answers = Object.keys(responses).filter((k) => !HIDDEN.includes(k) && responses[k] !== null && responses[k] !== "");
  const status = t(statusKey(rec.status), { defaultValue: humanise(rec.status) });
  const rows = [
    [tt("FDB_VIEW_NUMBER"), rec.applicationNo],
    [tt("FDB_VIEW_SERVICE"), service],
    [tt("FDB_VIEW_RATING"), rec.rating ? tt("FDB_STAR", { n: rec.rating }) : ""],
    [tt("FDB_VIEW_SUBMITTED"), fmtTime(rec.createdTime || (rec.auditDetails || {}).createdTime)],
    [tt("FDB_VIEW_TYPE"), rec.feedbackType ? t(`FDB_TYPE_${String(rec.feedbackType).replace(/-/g, "_").toUpperCase()}`, { defaultValue: humanise(rec.feedbackType) }) : ""],
    [tt("FDB_VIEW_SOURCE"), rec.source ? t(`FDB_SRC_${String(rec.source).toUpperCase()}`, { defaultValue: humanise(rec.source) }) : ""],
  ];
  const card = { padding: 18, marginBottom: 14 };

  return (
    <div className="npt-wrap npt-printview">
      <FDBCrumbs t={t} list current={applicationNo} />
      <div className="npt-listhead">
        <FDBPageHead title={tt("FDB_VIEW_TITLE")} sub={applicationNo} />
        <button type="button" className="npt-btn npt-btn--ghost" onClick={() => window.print()}><span>{tt("FDB_VIEW_PRINT")}</span></button>
      </div>

      <div className="npt-card" style={card}>
        <p style={{ margin: "0 0 14px" }}>
          <span style={{ marginRight: 8 }}>{tt("FDB_VIEW_STATUS")}:</span>
          <span className="npt-badge npt-badge--progress">{status}</span>
        </p>
        <dl className="npt-grid npt-grid--3" style={{ margin: 0 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ minWidth: 0 }}>
              <dt style={{ fontSize: 12, opacity: 0.7 }}>{k}</dt>
              <dd style={{ margin: 0, fontWeight: 600, wordBreak: "break-word" }}>{v || tt("FDB_NOT_PROVIDED")}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="npt-card" style={card}>
        <h3 style={{ margin: "0 0 10px" }}>{tt("FDB_VIEW_ANSWERS")}</h3>
        {qQ.isLoading && rec.serviceId !== "GENERAL" ? <SevaLoader /> : answers.length === 0 ? <p style={{ margin: 0 }}>{tt("FDB_VIEW_NO_ANSWERS")}</p> : (
          <dl style={{ margin: 0, display: "grid", gap: 12 }}>
            {answers.map((k) => (
              <div key={k}>
                <dt style={{ fontSize: 13, opacity: 0.75 }}>{labelOf(k)}</dt>
                <dd style={{ margin: 0, fontWeight: 600, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{valueOf(k, responses[k])}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="npt-card" style={card}>
        <h3 style={{ margin: "0 0 10px" }}>{tt("FDB_VIEW_TIMELINE")}</h3>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <strong>{tt("FDB_VIEW_SUBMITTED_STEP")}</strong>
            <div style={{ fontSize: 13, opacity: 0.75 }}>{[getUserInfo().name, fmtTime(rec.createdTime)].filter(Boolean).join(" · ")}</div>
          </li>
        </ol>
      </div>

      <p style={{ marginTop: 16 }}>
        <Link to={`${root}/my-feedback`} className="npt-btn npt-btn--ghost"><span>{tt("FDB_VIEW_BACK")}</span></Link>
      </p>
    </div>
  );
};

export default FeedbackView;
