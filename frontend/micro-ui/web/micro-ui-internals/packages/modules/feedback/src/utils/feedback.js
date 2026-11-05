const auth = () => ({ apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token });

// Pulls the most useful message out of a failed API response/exception.
export const apiErrorMessage = (err, fallback) => {
  const e = err?.response?.data?.Errors?.[0] || err?.Errors?.[0] || err?.data?.Errors?.[0];
  const raw = e?.message || e?.description || err?.message;
  // bare transport errors ("Request failed with status code 500") are not actionable for citizens
  return !raw || /^Request failed with status code|^Network Error/i.test(raw) ? fallback : raw;
};

export const humanise = (s = "") => String(s).replace(/[_-]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());
export const fmtTime = (ms) => (ms ? new Date(Number(ms)).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

/* ---------------------------------------------------------------- API calls */
// params carry a timestamp so Digit's POST response cache never replays an old answer
const call = (url, data, params) => Digit.CustomService.getResponse({ url, params: { tenantId: Digit.ULBService.getStateId(), ...(params || {}), _: Date.now() }, data });

const mdms = (name, filter) =>
  call(
    "/egov-mdms-service/v1/_search",
    {
      RequestInfo: auth(),
      MdmsCriteria: { tenantId: "hp", moduleDetails: [{ moduleName: "Feedback", masterDetails: [filter ? { name, filter } : { name }] }] },
    },
    { tenantId: "hp" }
  );

export const FeedbackApi = {
  // Feedback.Services: [{ serviceCode, serviceName, order }]
  services: () => mdms("Services"),
  // Feedback.Qustions (spelling as in the master): [{ questionCode, question, questionType: rating|text|radioButton, required, order, anserOptions }]
  questions: (serviceCode) => mdms("Qustions", `[?(@.serviceCode == "${serviceCode}")]`),
  create: (payload) => call("/feedback-service/submission/_create", payload),
  // the service filters on mobile number; the signed-in citizen only ever asks for their own
  searchMine: (mobileNo) => call("/feedback-service/submission/_search", { RequestInfo: auth(), FeedbackSearchCriteria: { mobileNo } }),
};

export const servicesOf = (res) => [...(((res || {}).MdmsRes || {}).Feedback || {}).Services || []].sort((a, b) => (a.order || 0) - (b.order || 0));
export const questionsOf = (res) => [...(((res || {}).MdmsRes || {}).Feedback || {}).Qustions || []].sort((a, b) => (a.order || 0) - (b.order || 0));

// Shown when the Feedback masters hold no questions for a service, so feedback can still be given.
export const GENERAL_SERVICE = { serviceCode: "GENERAL", serviceName: "", general: true };
export const generalQuestions = (tt) => [
  { questionCode: "overallRating", question: tt("FDB_GENERAL_RATING"), questionType: "rating", required: true, order: 1 },
  { questionCode: "comment", question: tt("FDB_GENERAL_COMMENT"), questionType: "text", required: false, order: 2 },
];

export const getUserInfo = () => Digit.UserService.getUser()?.info || {};

/* ----------------------------------------------------------------- payload */
// Same shape OldTheme / NewTheme send to feedback-service /submission/_create.
export const buildFeedbackPayload = (serviceCode, values, questions) => {
  const info = getUserInfo();
  const rating = values.rating != null ? values.rating : (questions.find((q) => q.questionType === "rating") ? values[questions.find((q) => q.questionType === "rating").questionCode] : null);
  const firstText = questions.find((q) => q.questionType === "text");
  return {
    RequestInfo: { ...auth(), userInfo: Digit.UserService.getUser()?.info },
    feedbackSubmisions: [
      {
        mobileNo: info.mobileNumber,
        email: info.emailId,
        serviceId: serviceCode,
        rating: rating == null ? undefined : String(rating),
        source: "WEB",
        feedbackType: "POST-SERVICE",
        comment: firstText ? values[firstText.questionCode] || undefined : undefined,
        additionalDetail: { questionResponses: { ...values, serviceCode }, tenantId: info.tenantId },
      },
    ],
  };
};

/* -------------------------------------------------------------- validation */
// Returns { questionCode: i18nErrorKey }; empty when valid.
export const validateAnswers = (questions, values) => {
  const errors = {};
  questions.forEach((q) => {
    if (!q.required) return;
    const v = values[q.questionCode];
    if (q.questionType === "rating") {
      if (!(Number(v) >= 1)) errors[q.questionCode] = "FDB_E_RATING";
    } else if (v === undefined || v === null || String(v).trim() === "") errors[q.questionCode] = "FDB_E_REQUIRED";
  });
  return errors;
};

/* -------------------------------------------------------------------- list */
export const FDB_FILTERS = ["ALL", "PROGRESS", "DONE"];
// the backend stores "SUBMITED" (sic) until someone closes the feedback
export const fdbStageOf = (status) => (String(status || "").toUpperCase() === "SUBMITED" ? "PROGRESS" : "DONE");
export const statusKey = (status) => `FDB_ST_${String(status || "SUBMITED").toUpperCase()}`;
