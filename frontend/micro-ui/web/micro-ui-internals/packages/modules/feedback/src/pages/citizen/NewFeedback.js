import { SevaLoader } from "@upyog/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useHistory, useRouteMatch } from "react-router-dom";
import { fdbText } from "../../config/feedbackMessages";
import SearchSelect from "../../pageComponents/SearchSelect";
import { FDBCrumbs, FDBPageHead, FDBStars } from "../../pageComponents/FeedbackLayout";
import { FeedbackApi, GENERAL_SERVICE, apiErrorMessage, buildFeedbackPayload, generalQuestions, getUserInfo, questionsOf, servicesOf, validateAnswers } from "../../utils/feedback";

// Pick a service, answer its questions (MDMS Feedback.Qustions), submit to feedback-service.
const NewFeedback = () => {
  const { t } = useTranslation();
  const tt = (k, p) => fdbText(t, k, p);
  const history = useHistory();
  const match = useRouteMatch();
  const root = match.path.replace(/\/new$/, "");
  const [code, setCode] = useState("");
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const svcQ = useQuery(["FDB_SERVICES"], FeedbackApi.services, { refetchOnWindowFocus: false, retry: 1 });
  const services = useMemo(() => [...servicesOf(svcQ.data), { ...GENERAL_SERVICE, serviceName: tt("FDB_GENERAL_SERVICE") }], [svcQ.data, t]);
  const service = services.find((s) => s.serviceCode === code);

  const qQ = useQuery(["FDB_QUESTIONS", code], () => FeedbackApi.questions(code), { enabled: !!service && !service.general, refetchOnWindowFocus: false, retry: 1 });
  const questions = useMemo(() => {
    if (!service) return [];
    const fromMdms = service.general ? [] : questionsOf(qQ.data);
    return fromMdms.length ? fromMdms : generalQuestions(tt);
  }, [service, qQ.data, t]);

  const choose = (c) => {
    setCode(c);
    setValues({});
    setErrors({});
    setError(null);
  };
  const setAnswer = (q, v) => {
    setValues((s) => ({ ...s, [q.questionCode]: v }));
    if (errors[q.questionCode]) setErrors((e) => ({ ...e, [q.questionCode]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!service) return setError(tt("FDB_E_SERVICE"));
    const found = validateAnswers(questions, values);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (!getUserInfo().mobileNumber) return setError(tt("FDB_E_MOBILE"));
    setSubmitting(true);
    setError(null);
    try {
      const res = await FeedbackApi.create(buildFeedbackPayload(service.serviceCode, values, questions));
      const sub = ((res || {}).feedbackSubmisions || [])[0] || {};
      history.replace(`${root}/acknowledgement`, { applicationNo: sub.applicationNo, serviceName: service.serviceName, rating: sub.rating });
    } catch (err) {
      setError(apiErrorMessage(err, tt("FDB_SUBMIT_FAILED")));
      setSubmitting(false);
    }
  };

  if (svcQ.isLoading) return <div className="npt-wrap"><SevaLoader message={tt("FDB_LOADING_FORM")} /></div>;
  if (submitting) return <SevaLoader fullScreen message={tt("FDB_SUBMITTING")} />;

  const answer = (q) => {
    const err = errors[q.questionCode];
    const id = `fdb-q-${q.questionCode}`;
    return (
      <div className={`npt-field npt-field--wide${err ? " has-error" : ""}`} key={q.questionCode}>
        <label className="fdb-q" id={`${id}-l`} htmlFor={q.questionType === "text" ? id : undefined}>
          {q.question}
          {q.required ? <span className="npt-req" aria-hidden="true"> *</span> : null}
        </label>
        {q.questionType === "rating" ? (
          <FDBStars t={t} name={q.questionCode} value={Number(values[q.questionCode]) || 0} onChange={(n) => setAnswer(q, n)} describedBy={`${id}-l`} />
        ) : q.questionType === "radioButton" ? (
          <div className="fdb-radios" role="radiogroup" aria-labelledby={`${id}-l`}>
            {Object.entries(q.anserOptions || {}).map(([key, label]) => (
              <label key={key} className={`fdb-radio${values[q.questionCode] === key ? " is-on" : ""}`}>
                <input type="radio" name={q.questionCode} value={key} checked={values[q.questionCode] === key} onChange={() => setAnswer(q, key)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea id={id} className="fdb-text" rows={4} maxLength={1000} placeholder={tt("FDB_RESPONSE_PH")} value={values[q.questionCode] || ""} onChange={(e) => setAnswer(q, e.target.value)} />
        )}
        {err ? <p className="fdb-err" role="alert">{tt(err)}</p> : null}
      </div>
    );
  };

  return (
    <div className="npt-wrap">
      <FDBCrumbs t={t} current={tt("FDB_NEW_TITLE")} />
      <FDBPageHead title={tt("FDB_NEW_TITLE")} sub={tt("FDB_NEW_SUB")} />
      <form className="npt-card" onSubmit={submit} noValidate>
        <div className="npt-card__body">
          {svcQ.isError ? (
            <div className="npt-lookup-error" role="alert">
              <span>{apiErrorMessage(svcQ.error, tt("FDB_SERVICES_FAILED"))}</span>
              <button type="button" className="npt-link" onClick={() => svcQ.refetch()}>{tt("FDB_RETRY")}</button>
            </div>
          ) : null}
          <div className="npt-field npt-field--wide">
            <label className="fdb-q">{tt("FDB_SELECT_SERVICE")}<span className="npt-req" aria-hidden="true"> *</span></label>
            <SearchSelect value={code} options={services.map((s) => ({ value: s.serviceCode, label: s.serviceName }))} onChange={choose} allLabel={tt("FDB_SELECT_PLACEHOLDER")} searchPlaceholder={tt("FDB_SEARCH_LIST")} emptyLabel={tt("FDB_NO_RESULTS")} ariaLabel={tt("FDB_SELECT_SERVICE")} />
          </div>

          {!service ? <p className="npt-card__hint">{tt("FDB_PICK_SERVICE_HINT")}</p> : qQ.isLoading && !service.general ? (
            <SevaLoader message={tt("FDB_LOADING")} />
          ) : (
            <React.Fragment>
              {qQ.isError ? (
                <div className="npt-lookup-error" role="alert">
                  <span>{apiErrorMessage(qQ.error, tt("FDB_QUESTIONS_FAILED"))}</span>
                  <button type="button" className="npt-link" onClick={() => qQ.refetch()}>{tt("FDB_RETRY")}</button>
                </div>
              ) : null}
              {questions.map(answer)}
            </React.Fragment>
          )}
          {error ? <div className="npt-lookup-error" role="alert">{error}</div> : null}
        </div>
        <div className="fdb-actions">
          <button type="submit" className="npt-btn npt-btn--primary" disabled={!service || (qQ.isLoading && !service.general)}>
            <span>{tt("FDB_SUBMIT")}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewFeedback;
