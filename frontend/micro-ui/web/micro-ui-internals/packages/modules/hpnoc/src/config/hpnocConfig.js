// Step + field definitions for the HP citizen "NOC" flow (noc-services, workflow ELECTRICITYNOC).
// Field set and required rules mirror NewTheme's NocServices/Noc form.
// type: text | textarea | date | select ; options: static [{code, label(i18n key)}]; optionsFrom: a key resolved at runtime (MDMS driven).
// Option codes are the English texts the employee screens already read from additionalDetails.

export const HNC_NOC_TYPE = "ELECTRICITYNOC"; // NOC.NocType code (online workflow ELECTRICITYNOC)
export const HNC_BUSINESS_SERVICE = "NOC"; // billing / collection business service
export const HNC_DMS = "NOC"; // DMS service name (mst_service_master)
export const HNC_SESSION_KEY = "HNC_REQUEST";

const opt = (code, key) => ({ code, label: key });

export const HNC_PATTERNS = {
  mobile: { re: /^[6-9]\d{9}$/, error: "HNC_E_MOBILE" },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, error: "HNC_E_EMAIL" },
  pin: { re: /^[1-9]\d{5}$/, error: "HNC_E_PIN" },
};

// English type texts stored in additionalDetails.typeOfNoc -> i18n key
export const NOC_TYPE_KEYS = { "Electricity NOC - Residential": "HNC_O_ELEC_RES", "Electricity NOC - Commercial": "HNC_O_ELEC_COM" };

export const HNC_GENDERS = [opt("MALE", "HNC_O_MALE"), opt("FEMALE", "HNC_O_FEMALE"), opt("OTHERS", "HNC_O_OTHERS")];

export const HNC_PAGES = [
  {
    key: "noc",
    route: "noc",
    head: "HNC_STEP_NOC",
    hint: "HNC_STEP_HINT_NOC",
    fields: [
      {
        name: "typeOfNoc",
        type: "select",
        required: true,
        options: [opt("Electricity NOC - Residential", "HNC_O_ELEC_RES"), opt("Electricity NOC - Commercial", "HNC_O_ELEC_COM")],
      },
      {
        name: "connectionType",
        type: "select",
        required: true,
        options: [
          opt("Temporary Connection/Construction Connection", "HNC_O_CONN_TEMP"),
          opt("Domestic Connection", "HNC_O_CONN_DOM"),
          opt("Commercial Connection", "HNC_O_CONN_COM"),
        ],
      },
      {
        name: "nocReason",
        type: "select",
        required: true,
        options: [
          opt("NOC on the basis of Old house(House Existing Prior to 1979)", "HNC_O_REASON_OLD"),
          opt("NOC on the Basis of Sanctioned Map", "HNC_O_REASON_MAP"),
          opt("The Government Building", "HNC_O_REASON_GOVT"),
        ],
      },
    ],
  },
  {
    key: "property",
    route: "property",
    head: "HNC_STEP_PROPERTY",
    hint: "HNC_STEP_HINT_PROPERTY",
    fields: [
      { name: "oldPropertyId", type: "text", maxLength: 50 },
      { name: "plotNo", type: "text", maxLength: 50 },
      { name: "coOwnerName", type: "text", required: true, maxLength: 100 },
      { name: "ulbName", type: "select", required: true, optionsFrom: "ulbs", resets: ["ward"] },
      { name: "ward", type: "select", required: true, optionsFrom: "wards", dependsOn: "ulbName", parentLabel: "HNC_F_ulbName" },
      { name: "propertyAddress", type: "textarea", required: true, maxLength: 250 },
      { name: "pincode", type: "text", required: true, maxLength: 6, pattern: "pin", digitsOnly: true },
      { name: "landType", type: "select", required: true, options: [opt("Residential", "HNC_O_RESIDENTIAL"), opt("Commercial", "HNC_O_COMMERCIAL")] },
      { name: "area", type: "text", maxLength: 30 },
      { name: "khasraNumber", type: "text", maxLength: 50 },
      { name: "khata", type: "text", maxLength: 50 },
    ],
  },
  {
    key: "applicant",
    route: "applicant",
    head: "HNC_STEP_APPLICANT",
    hint: "HNC_STEP_HINT_APPLICANT",
    fields: [
      { name: "applicantName", type: "text", required: true, maxLength: 100 },
      { name: "fatherName", type: "text", required: true, maxLength: 100 },
      { name: "mobile", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true },
      { name: "dob", type: "date", required: true, max: "today" },
      { name: "gender", type: "select", required: true, options: HNC_GENDERS },
      { name: "email", type: "text", pattern: "email", maxLength: 100 },
      { name: "address", type: "textarea", required: true, maxLength: 250 },
    ],
  },
  { key: "documents", route: "documents", head: "HNC_STEP_DOCUMENTS", hint: "HNC_STEP_HINT_DOCUMENTS", custom: "documents" },
];

// Stage shown on the list / view badge (noc-services applicationStatus -> citizen-facing stage).
export const HNC_STAGE = {
  INITIATED: "DRAFT",
  PENDINGFORVERIFICATION: "PROGRESS",
  PENDINGFORMODIFICATION: "ACTION",
  PENDINGFORPAYMENT: "PAYMENT",
  PENDINGFORAPPROVAL: "PROGRESS",
  APPROVED: "APPROVED",
  REJECTED: "CLOSED",
  CANCELLED: "CLOSED",
};
export const hncStageOf = (status) => HNC_STAGE[status] || "PROGRESS";
export const HNC_FILTERS = ["ALL", "ACTION", "PAYMENT", "PROGRESS", "APPROVED", "CLOSED"];
