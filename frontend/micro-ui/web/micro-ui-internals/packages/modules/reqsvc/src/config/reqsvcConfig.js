// Step + field definitions for the HP citizen "Request Services" flow (echallan-services, business service REQSERV).
// Field set and required rules mirror NewTheme's ServiceRequests/createRequest form.
// type: text | date | select ; optionsFrom: a key resolved at runtime (MDMS driven) instead of static `options`.

export const RQS_BUSINESS_SERVICE = "REQSERV";
export const RQS_DMS = "REQSERV"; // DMS service name (mst_service_master)
export const RQS_SESSION_KEY = "RQS_REQUEST";

export const RQS_PATTERNS = {
  mobile: { re: /^[6-9]\d{9}$/, error: "RQS_E_MOBILE" },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, error: "RQS_E_EMAIL" },
  pin: { re: /^[1-9]\d{5}$/, error: "RQS_E_PIN" },
  aadhaar: { re: /^\d{12}$/, error: "RQS_E_AADHAAR" },
};

export const RQS_PAGES = [
  {
    key: "request",
    route: "request",
    head: "RQS_STEP_REQUEST",
    hint: "RQS_STEP_HINT_REQUEST",
    fields: [
      { name: "category", type: "select", required: true, optionsFrom: "categories" },
      { name: "issueDate", type: "date", required: true },
    ],
  },
  {
    key: "location",
    route: "location",
    head: "RQS_STEP_LOCATION",
    hint: "RQS_STEP_HINT_LOCATION",
    fields: [
      { name: "districtName", type: "select", required: true, optionsFrom: "districts", resets: ["ulbName", "ward"] },
      { name: "ulbName", type: "select", required: true, optionsFrom: "ulbs", dependsOn: "districtName", parentLabel: "RQS_F_districtName", resets: ["ward"] },
      { name: "ward", type: "select", optionsFrom: "wards", dependsOn: "ulbName", parentLabel: "RQS_F_ulbName" },
      { name: "street", type: "text", required: true, maxLength: 200 },
      { name: "landmark", type: "text", required: true, maxLength: 100 },
    ],
  },
  {
    key: "applicant",
    route: "applicant",
    head: "RQS_STEP_APPLICANT",
    hint: "RQS_STEP_HINT_APPLICANT",
    fields: [
      { name: "name", type: "text", required: true, maxLength: 100 },
      { name: "fatherName", type: "text", required: true, maxLength: 100 },
      { name: "mobileNumber", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true },
      { name: "emailId", type: "text", pattern: "email", maxLength: 100 },
      { name: "aadhaarNumber", type: "text", maxLength: 12, pattern: "aadhaar", digitsOnly: true },
      { name: "detail", type: "text", required: true, maxLength: 250 },
      { name: "pincode", type: "text", required: true, maxLength: 6, pattern: "pin", digitsOnly: true },
    ],
  },
  { key: "documents", route: "documents", head: "RQS_STEP_DOCUMENTS", hint: "RQS_STEP_HINT_DOCUMENTS", custom: "documents" },
];

// Stage shown on the list / view badge. The challan itself only carries ACTIVE / PAID / CANCELLED;
// the finer workflow state (INITIATED, PENDINGFORAPPROVAL, ...) comes from the workflow service on the view page.
export const RQS_STAGE = {
  INITIATED: "DRAFT",
  ACTIVE: "PAYMENT",
  PENDINGFORPAYMENT: "PAYMENT",
  PAID: "PROGRESS",
  PENDINGFORAPPROVAL: "PROGRESS",
  APPROVED: "APPROVED",
  REJECTED: "CLOSED",
  CANCELLED: "CLOSED",
};
export const rqsStageOf = (status) => RQS_STAGE[status] || "PROGRESS";
export const RQS_FILTERS = ["ALL", "PAYMENT", "PROGRESS", "APPROVED", "CLOSED"];
