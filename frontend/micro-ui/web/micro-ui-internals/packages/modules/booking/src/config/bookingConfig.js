// Step + field definitions for the HP citizen booking flows: Site (advertisement hoarding/canopy) and Asset (community hall).
// Field set and required rules mirror OldTheme's advertisement/booking and asset/booking forms.
// type: text | date | select | readonly ; optionsFrom: a key resolved at runtime (MDMS driven) instead of static `options`.

const opt = (code, key) => ({ code, i18nKey: key });

const GENDERS = [opt("MALE", "BKG_O_MALE"), opt("FEMALE", "BKG_O_FEMALE"), opt("Others", "BKG_O_OTHERS")];

export const BKG_PATTERNS = {
  mobile: { re: /^[6-9]\d{9}$/, error: "BKG_E_MOBILE" },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, error: "BKG_E_EMAIL" },
  pin: { re: /^[1-9]\d{5}$/, error: "BKG_E_PIN" },
  gst: { re: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, error: "BKG_E_GST" },
  ifsc: { re: /^[A-Z]{4}0[A-Z0-9]{6}$/, error: "BKG_E_IFSC" },
  account: { re: /^\d{9,18}$/, error: "BKG_E_ACCOUNT" },
};

// A community hall can be booked for at most this many consecutive days (same rule as OldTheme).
export const BKG_MAX_HALL_DAYS = 7;

export const BKG_SERVICES = {
  site: {
    code: "site",
    dms: "ADVT", // DMS service name (mst_service_master)
    businessService: "ADVT", // workflow + billing business service
    sessionKey: "BKG_SITE_BOOKING",
    crumb: "BKG_CRUMB_SITE",
    title: "BKG_SITE_TITLE",
    listTitle: "BKG_SITE_LIST_TITLE",
    listSub: "BKG_SITE_LIST_SUB",
    pages: [
      { key: "select", route: "select", head: "BKG_STEP_SELECT_SITE", hint: "BKG_STEP_HINT_SELECT_SITE", custom: "select" },
      {
        key: "booking",
        route: "booking",
        head: "BKG_STEP_BOOKING",
        hint: "BKG_STEP_HINT_BOOKING_SITE",
        fields: [
          { name: "fromDate", type: "date", required: true },
          { name: "toDate", type: "date", required: true, minFrom: "fromDate" },
          { name: "hoardingType", type: "select", required: true, options: [opt("Event Hoarding/Canopy", "BKG_O_EVENT_HOARDING"), opt("Retail Hoarding/Canopy", "BKG_O_RETAIL_HOARDING")] },
        ],
      },
      {
        key: "applicant",
        route: "applicant",
        head: "BKG_STEP_APPLICANT",
        hint: "BKG_STEP_HINT_APPLICANT",
        fields: [
          { name: "applicantName", type: "text", required: true, maxLength: 100 },
          { name: "applicantFatherName", type: "text", required: true, maxLength: 100 },
          { name: "gender", type: "select", required: true, options: GENDERS },
          { name: "mobileNumber", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true },
          { name: "emailId", type: "text", pattern: "email", maxLength: 100 },
          { name: "gstNumber", type: "text", maxLength: 15, pattern: "gst", upper: true },
        ],
      },
      { key: "documents", route: "documents", head: "BKG_STEP_DOCUMENTS", hint: "BKG_STEP_HINT_DOCUMENTS", custom: "documents" },
    ],
  },
  asset: {
    code: "asset",
    dms: "chb-services",
    businessService: "chb-services",
    sessionKey: "BKG_ASSET_BOOKING",
    crumb: "BKG_CRUMB_ASSET",
    title: "BKG_ASSET_TITLE",
    listTitle: "BKG_ASSET_LIST_TITLE",
    listSub: "BKG_ASSET_LIST_SUB",
    pages: [
      { key: "select", route: "select", head: "BKG_STEP_SELECT_ASSET", hint: "BKG_STEP_HINT_SELECT_ASSET", custom: "select" },
      {
        key: "booking",
        route: "booking",
        head: "BKG_STEP_BOOKING",
        hint: "BKG_STEP_HINT_BOOKING_ASSET",
        fields: [
          { name: "fromDate", type: "date", required: true },
          { name: "toDate", type: "date", required: true, minFrom: "fromDate" },
          { name: "bookingFor", type: "select", required: true, optionsFrom: "bookingFor" },
          { name: "purpose", type: "select", required: true, options: [opt("Private Event", "BKG_O_PRIVATE_EVENT"), opt("Public Fair or Public Event", "BKG_O_PUBLIC_EVENT")] },
        ],
      },
      {
        key: "applicant",
        route: "applicant",
        head: "BKG_STEP_APPLICANT",
        hint: "BKG_STEP_HINT_APPLICANT_ASSET",
        fields: [
          { name: "applicantName", type: "text", required: true, maxLength: 100 },
          { name: "applicantFatherName", type: "text", required: true, maxLength: 100 },
          { name: "gender", type: "select", required: true, options: GENDERS },
          { name: "mobileNumber", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true },
          { name: "emailId", type: "text", required: true, pattern: "email", maxLength: 100 },
          { name: "accountHolderName", type: "text", required: true, maxLength: 100 },
          { name: "accountNumber", type: "text", required: true, maxLength: 18, pattern: "account", digitsOnly: true },
          { name: "bankName", type: "text", required: true, maxLength: 100 },
          { name: "bankBranchName", type: "text", required: true, maxLength: 100 },
          { name: "ifscCode", type: "text", required: true, maxLength: 11, pattern: "ifsc", upper: true },
        ],
      },
      {
        key: "address",
        route: "address",
        head: "BKG_STEP_ADDRESS",
        hint: "BKG_STEP_HINT_ADDRESS",
        fields: [
          { name: "addressLine1", type: "text", required: true, maxLength: 200 },
          { name: "locality", type: "text", required: true, maxLength: 100 },
          { name: "landmark", type: "text", maxLength: 100 },
          { name: "city", type: "text", required: true, maxLength: 100 },
          { name: "districtName", type: "text", required: true, maxLength: 100 },
          { name: "pincode", type: "text", required: true, maxLength: 6, pattern: "pin", digitsOnly: true },
        ],
      },
      { key: "documents", route: "documents", head: "BKG_STEP_DOCUMENTS", hint: "BKG_STEP_HINT_DOCUMENTS", custom: "documents" },
    ],
  },
};

export const bkgPagesOf = (svc) => BKG_SERVICES[svc].pages;

// Workflow status -> list stage (drives the filter chips and the badge colour).
export const BKG_STAGE = {
  INITIATED: "DRAFT",
  PENDINGFORPAYMENT: "PAYMENT",
  APPROVED: "APPROVED",
  REJECTED: "CLOSED",
  CANCELLED: "CLOSED",
};
export const bkgStageOf = (status) => BKG_STAGE[status] || "PROGRESS";
export const BKG_FILTERS = ["ALL", "DRAFT", "PROGRESS", "PAYMENT", "APPROVED", "CLOSED"];
