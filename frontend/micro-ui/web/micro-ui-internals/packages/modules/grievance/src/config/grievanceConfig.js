// Step + field definitions for the HP citizen Grievance flow (pgr-services /v2/request).
// Field set and required rules mirror OldTheme's CitizenGrievances form.
// type: text | textarea | select | readonly ; optionsFrom: a key resolved by useGRVLookups (MDMS driven).

export const GRV_DMS = "PGR"; // DMS service name (mst_service_master)
export const GRV_DOC_ID = 16; // "Grievance Document"
export const GRV_SESSION_KEY = "GRV_REQUEST";
export const GRV_BUSINESS_SERVICE = "PGR";

export const GRV_PATTERNS = {
  mobile: { re: /^[6-9]\d{9}$/, error: "GRV_E_MOBILE" },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, error: "GRV_E_EMAIL" },
};

export const GRV_PAGES = [
  {
    key: "grievance",
    route: "grievance",
    head: "GRV_STEP_GRIEVANCE",
    hint: "GRV_STEP_HINT_GRIEVANCE",
    fields: [
      { name: "districtName", type: "select", required: true, optionsFrom: "districts", resets: ["ulbName", "ward"] },
      { name: "ulbName", type: "select", required: true, optionsFrom: "ulbs", dependsOn: "districtName", parentLabel: "GRV_F_districtName", resets: ["ward"] },
      { name: "ward", type: "select", required: true, optionsFrom: "wards", dependsOn: "ulbName", parentLabel: "GRV_F_ulbName" },
      { name: "grievanceType", type: "select", required: true, optionsFrom: "types", resets: ["grievanceSubType"] },
      { name: "grievanceSubType", type: "select", required: true, optionsFrom: "subTypes", dependsOn: "grievanceType", parentLabel: "GRV_F_grievanceType" },
      { name: "address", type: "text", maxLength: 250, span: 2 },
      { name: "description", type: "textarea", required: true, maxLength: 1000, wide: true },
    ],
  },
  {
    key: "applicant",
    route: "applicant",
    head: "GRV_STEP_APPLICANT",
    hint: "GRV_STEP_HINT_APPLICANT",
    fields: [
      { name: "name", type: "text", required: true, maxLength: 100, lock: true },
      { name: "fatherName", type: "text", maxLength: 100 },
      { name: "mobileNumber", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true, lock: true },
      { name: "emailId", type: "text", pattern: "email", maxLength: 100, lock: true },
    ],
  },
  { key: "documents", route: "documents", head: "GRV_STEP_DOCUMENTS", hint: "GRV_STEP_HINT_DOCUMENTS", custom: "documents" },
];

// Stage shown on list / view badge and used by the list filters.
export const GRV_STAGE = {
  PENDINGFORASSIGNMENT: "PROGRESS",
  PENDINGATLME: "PROGRESS",
  PENDINGATLMHE: "PROGRESS",
  PENDINGFORREASSIGNMENT: "PROGRESS",
  OPEN: "PROGRESS",
  PENDINGFORMODIFICATION: "ACTION",
  RESOLVED: "RESOLVED",
  CLOSEDAFTERRESOLUTION: "RESOLVED",
  REJECTED: "CLOSED",
  CLOSEDAFTERREJECTION: "CLOSED",
};
export const grvStageOf = (status) => GRV_STAGE[status] || "PROGRESS";
export const GRV_FILTERS = ["ALL", "PROGRESS", "ACTION", "RESOLVED", "CLOSED"];

// Citizen actions the PGR workflow offers on a finished grievance (workflow action -> button)
export const GRV_REOPEN_STATES = ["RESOLVED", "CLOSEDAFTERRESOLUTION", "CLOSEDAFTERREJECTION"];
