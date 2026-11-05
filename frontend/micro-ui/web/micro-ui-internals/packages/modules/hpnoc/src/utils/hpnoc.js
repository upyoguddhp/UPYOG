import { HNC_BUSINESS_SERVICE, HNC_NOC_TYPE, HNC_PATTERNS } from "../config/hpnocConfig";

const isEmpty = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

const auth = () => ({ apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token });

// Pulls the most useful message out of a failed API response/exception.
export const apiErrorMessage = (err, fallback) => {
  const e = err?.response?.data?.Errors?.[0] || err?.Errors?.[0] || err?.data?.Errors?.[0];
  const raw = e?.message || e?.description || err?.message;
  // bare transport errors ("Request failed with status code 500") are not actionable for citizens
  return !raw || /^Request failed with status code|^Network Error/i.test(raw) ? fallback : raw;
};

// Values that come from the signed-in citizen rather than being typed.
export const getUserDefaults = () => {
  const info = Digit.UserService.getUser()?.info || {};
  return { applicantName: info.name || "", mobile: info.mobileNumber || "", email: info.emailId || "" };
};

export const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());

/* ---------------------------------------------------------------- dates */
const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayYmd = () => ymd(new Date());
export const fmtDate = (v) => {
  if (!v) return "";
  const d = typeof v === "number" ? new Date(v) : new Date(`${String(v).slice(0, 10)}T00:00:00`);
  return isNaN(d) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
export const fmtTime = (ms) => (ms ? new Date(Number(ms)).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
export const inr = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* ------------------------------------------------------------ validation */
// Returns { fieldName: i18nErrorKey } for one page of values; empty when valid.
export const validatePage = (page, values) => {
  const errors = {};
  (page.fields || []).forEach((f) => {
    const v = values[f.name];
    if (f.required && isEmpty(v)) {
      errors[f.name] = "HNC_E_REQUIRED";
      return;
    }
    if (isEmpty(v)) return;
    if (f.pattern && !HNC_PATTERNS[f.pattern].re.test(String(v).trim())) errors[f.name] = HNC_PATTERNS[f.pattern].error;
    if (f.max === "today" && String(v) > todayYmd()) errors[f.name] = "HNC_E_FUTURE";
  });
  return errors;
};

/* --------------------------------------------------------------- API calls */
// params carry a timestamp so Digit's POST response cache never replays an old answer
const call = (url, data, params) => Digit.CustomService.getResponse({ url, params: { tenantId: Digit.ULBService.getStateId(), ...(params || {}), _: Date.now() }, data });

export const NocApi = {
  create: (Noc) => call("/noc-services/v1/noc/_create", { RequestInfo: auth(), Noc }),
  update: (Noc) => call("/noc-services/v1/noc/_update", { RequestInfo: auth(), Noc }),
  // the service restricts a citizen's search to their own applications
  searchMine: () => call("/noc-services/v1/noc/_search", { RequestInfo: auth() }, {}),
  // payments recorded against the NOC fee bill (empty until the citizen has paid)
  payments: (tenantId, applicationNo) => Digit.PaymentService.getReciept(tenantId, HNC_BUSINESS_SERVICE, { consumerCodes: applicationNo }),
};

/* ----------------------------------------------------------- payloads */
export const buildCreatePayload = (params) => {
  const n = params.noc || {};
  const p = params.property || {};
  const a = params.applicant || {};
  return {
    tenantId: `${Digit.ULBService.getStateId()}.${p.ulbName}`,
    applicationType: "PROVISIONAL",
    nocType: HNC_NOC_TYPE,
    source: "ONLINE",
    sourceRefId: "ONLINE",
    status: "ACTIVE",
    workflow: { action: "INITIATE" },
    additionalDetails: {
      mode: "online",
      typeOfNoc: n.typeOfNoc,
      reason: n.nocReason,
      nocReason: n.nocReason,
      connectionType: n.connectionType,
      workflowCode: HNC_NOC_TYPE,
      propertyDetail: { ...p },
      citizenDetail: {
        applicantName: a.applicantName,
        fatherName: a.fatherName,
        mobile: a.mobile,
        dob: a.dob,
        gender: a.gender,
        email: a.email || "",
        address: a.address,
      },
    },
  };
};

// created application, moved to the verifier (what NewTheme did right after creating it)
export const buildSubmitPayload = (noc) => ({
  ...noc,
  workflow: { action: "FORWARD_TO_VERIFIER", comments: "Sent for verification" },
});

export const buildApproverPayload = (noc) => ({
  ...noc,
  workflow: { action: "FORWARD_TO_APPROVER", comments: "Fee paid, sent for approval" },
});

/* ------------------------------------------------- list / view helpers */
export const nocsOf = (res) => (res && res.Noc) || [];
export const statusOf = (n) => n.applicationStatus || "INITIATED";
export const createdOf = (n) => (n.auditDetails || {}).createdTime || 0;
export const appNoOf = (n) => n.applicationNo;
export const detailsOf = (n) => n.additionalDetails || {};
export const payPath = (n) => `/digit-ui/citizen/payment/my-bills/${HNC_BUSINESS_SERVICE}/${n.applicationNo}`;
