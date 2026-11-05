import { RQS_BUSINESS_SERVICE, RQS_PATTERNS } from "../config/reqsvcConfig";

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
  return { name: info.name || "", mobileNumber: info.mobileNumber || "", emailId: info.emailId || "" };
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
export const fmtTime = (ms) => (ms ? new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
export const inr = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* ------------------------------------------------------------ validation */
// Returns { fieldName: i18nErrorKey } for one page of values; empty when valid.
export const validatePage = (page, values) => {
  const errors = {};
  (page.fields || []).forEach((f) => {
    const v = values[f.name];
    if (f.required && isEmpty(v)) {
      errors[f.name] = "RQS_E_REQUIRED";
      return;
    }
    if (isEmpty(v)) return;
    if (f.pattern && !RQS_PATTERNS[f.pattern].re.test(String(v).trim())) errors[f.name] = RQS_PATTERNS[f.pattern].error;
  });
  return errors;
};

/* --------------------------------------------------------------- categories */
// MDMS RequestService.Categories: { categories, code (tax head), fee, fromDate, toDate, active }
export const categoriesOf = (list) => {
  const now = Date.now();
  return (list || []).filter((c) => String(c.active).toLowerCase() !== "false" && (!c.fromDate || c.fromDate <= now) && (!c.toDate || c.toDate >= now));
};
export const feeOf = (cats, name) => Number(((cats || []).find((c) => c.categories === name) || {}).fee || 0);

/* --------------------------------------------------------------- API calls */
// params carry a timestamp so Digit's POST response cache never replays an old answer
const call = (url, data, params) => Digit.CustomService.getResponse({ url, params: { tenantId: Digit.ULBService.getStateId(), ...(params || {}), _: Date.now() }, data });

export const RequestApi = {
  create: (Challan) => call("/echallan-services/eChallan/v1/_create", { RequestInfo: auth(), Challan }),
  update: (Challan) => call("/echallan-services/eChallan/v1/_update", { RequestInfo: auth(), Challan }),
  // the service restricts a citizen's search to their own requests
  searchMine: () => call("/echallan-services/eChallan/v1/_search", { RequestInfo: auth() }, { businessService: RQS_BUSINESS_SERVICE }),
};

/* ----------------------------------------------------------- payloads */
export const buildCreatePayload = (params, categories) => {
  const r = params.request || {};
  const l = params.location || {};
  const a = params.applicant || {};
  const fee = feeOf(categories, r.category);
  const cat = (categories || []).find((c) => c.categories === r.category) || {};
  const issue = r.issueDate ? new Date(r.issueDate) : new Date();
  const until = new Date(issue);
  until.setFullYear(until.getFullYear() + 1);
  const amount = [{ taxHeadCode: cat.code, amount: fee }];
  return {
    tenantId: `${Digit.ULBService.getStateId()}.${l.ulbName}`,
    businessService: RQS_BUSINESS_SERVICE,
    consumerType: "CH",
    description: r.category,
    taxPeriodFrom: issue.getTime(),
    taxPeriodTo: until.getTime(),
    citizen: { name: a.name, mobileNumber: a.mobileNumber, emailID: a.emailId || "" },
    additionalDetail: {
      fatherName: a.fatherName,
      aadharNumber: a.aadhaarNumber || "",
      name: a.name,
      mobileNumber: a.mobileNumber,
      districtName: l.districtName,
      ulbName: l.ulbName,
      ward: l.ward || "",
      amount: fee,
      amountDetails: amount,
    },
    address: {
      city: l.ulbName,
      street: l.street,
      landmark: l.landmark,
      detail: a.detail,
      pincode: a.pincode,
      district: l.districtName,
      locality: { code: l.ward || "" },
    },
    amount,
    workflow: { action: "INITIATE", businessService: RQS_BUSINESS_SERVICE, moduleName: RQS_BUSINESS_SERVICE },
  };
};

// the created challan, moved to "pending for payment" (what OldTheme did before sending the citizen to pay)
export const buildPendingPayload = (challan, categories) => {
  const name = challan.description;
  const cat = (categories || []).find((c) => c.categories === name) || {};
  return {
    ...challan,
    amount: [{ taxHeadCode: cat.code || (challan.amount || [])[0]?.taxHeadCode, amount: feeOf(categories, name) || (challan.amount || [])[0]?.amount }],
    applicationStatus: "ACTIVE",
    workflow: { action: "PENDING_FOR_PAYMENT", businessService: RQS_BUSINESS_SERVICE, moduleName: RQS_BUSINESS_SERVICE },
  };
};

/* ------------------------------------------------- list / view helpers */
export const challansOf = (res) => (res && res.challans) || [];
export const amountOf = (c) => {
  const a = (c.additionalDetail || {}).amount;
  return a !== undefined && a !== null ? Number(a) : (c.amount || []).reduce((s, x) => s + Number(x.amount || 0), 0);
};
export const statusOf = (c) => c.applicationStatus || "ACTIVE";
export const createdOf = (c) => (c.auditDetails || {}).createdTime || 0;
export const payPath = (c) => `/digit-ui/citizen/payment/my-bills/${RQS_BUSINESS_SERVICE}/${c.challanNo}`;
