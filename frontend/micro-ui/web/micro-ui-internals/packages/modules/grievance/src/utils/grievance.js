import { GRV_PATTERNS } from "../config/grievanceConfig";

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

// "StreetLights" / "Street_Lights" -> "Street Lights"; names from backend codes never show underscores
export const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();

/* ---------------------------------------------------------------- dates */
export const fmtTime = (ms) => (ms ? new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
export const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");

/* ------------------------------------------------------------ validation */
// Returns { fieldName: i18nErrorKey } for one page of values; empty when valid.
export const validatePage = (page, values) => {
  const errors = {};
  (page.fields || []).forEach((f) => {
    const v = values[f.name];
    if (f.required && isEmpty(v)) {
      errors[f.name] = "GRV_E_REQUIRED";
      return;
    }
    if (isEmpty(v)) return;
    if (f.pattern && !GRV_PATTERNS[f.pattern].re.test(String(v).trim())) errors[f.name] = GRV_PATTERNS[f.pattern].error;
  });
  return errors;
};

/* --------------------------------------------------------------- service definitions */
// MDMS RAINMAKER-PGR.ServiceDefs: { serviceCode, name, menuPath (the grievance type), department, slaHours, active }
export const activeDefs = (list) => (list || []).filter((d) => String(d.active).toLowerCase() !== "false" && d.menuPath && String(d.menuPath).trim() !== "");
export const typesOf = (defs) => Array.from(new Set(defs.map((d) => d.menuPath))).sort((a, b) => a.localeCompare(b));
export const subTypesOf = (defs, type) => defs.filter((d) => d.menuPath === type).sort((a, b) => String(a.name).localeCompare(String(b.name)));

/* --------------------------------------------------------------- API calls */
// params carry a timestamp so Digit's POST response cache never replays an old answer;
// tenantId (state) lets the gateway authorise the call
const call = (url, data, params) => Digit.CustomService.getResponse({ url, params: { tenantId: Digit.ULBService.getStateId(), ...(params || {}), _: Date.now() }, data });

export const GrievanceApi = {
  create: (service, workflow) => call("/pgr-services/v2/request/_create", { RequestInfo: auth(), service, workflow }),
  update: (service, workflow) => call("/pgr-services/v2/request/_update", { RequestInfo: auth(), service, workflow }),
  // a citizen's search only returns their own grievances
  searchMine: () => call("/pgr-services/v2/request/_search", { RequestInfo: auth() }),
  searchOne: (tenantId, serviceRequestId) => call("/pgr-services/v2/request/_search", { RequestInfo: auth() }, { tenantId, serviceRequestId }),
};

/* ----------------------------------------------------------- payloads */
export const buildCreatePayload = (params) => {
  const g = params.grievance || {};
  const a = params.applicant || {};
  const state = Digit.ULBService.getStateId();
  const service = {
    source: "web",
    active: true,
    tenantId: `${state}.${g.ulbName}`,
    serviceCode: g.grievanceSubType,
    description: g.description,
    additionalDetail: {
      grievanceType: g.grievanceType,
      citizenName: a.name,
      citizenFatherName: a.fatherName || "",
      citizenEmail: a.emailId || "",
      citizenMobile: a.mobileNumber,
      source: g.grievanceType,
      applicantType: "CITIZEN",
    },
    citizen: {
      name: a.name,
      type: "CITIZEN",
      mobileNumber: a.mobileNumber,
      emailId: a.emailId || "",
      roles: [{ id: null, name: "Citizen", code: "CITIZEN", tenantId: state }],
      tenantId: state,
      active: true,
    },
    address: {
      city: g.ulbName,
      district: g.districtName,
      locality: { code: 171001 },
      additionalDetails: { ward: g.ward, address: g.address || "" },
      geoLocation: {},
    },
    priority: "HIGH",
  };
  return { service, workflow: { action: "APPLY" } };
};

// the citizen reopens a finished grievance: the workflow action OPEN (CITIZEN is allowed on RESOLVED / CLOSED*)
export const buildReopenPayload = (service, comment) => ({
  service,
  workflow: { action: "OPEN", comments: comment, comment },
});

/* ------------------------------------------------- list / view helpers */
export const wrappersOf = (res) => (res && res.ServiceWrappers) || [];
export const servicesOf = (res) => wrappersOf(res).map((w) => w.service).filter(Boolean);
export const statusOf = (s) => s.applicationStatus || "OPEN";
export const createdOf = (s) => (s.auditDetails || {}).createdTime || 0;
export const defNameOf = (defs, code) => ((defs || []).find((d) => d.serviceCode === code) || {}).name || humanise(code);
