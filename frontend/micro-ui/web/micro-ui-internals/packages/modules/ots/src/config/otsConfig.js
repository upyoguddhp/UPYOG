// Step + field definitions for the HP citizen One Time Settlement (OTS) application.
// Field set and required rules mirror NewTheme's OneTimeSettlement create request (Yup schema).
// type: text | date | select | number ; optionsFrom: a key resolved at runtime (MDMS driven) instead of static `options`.

const opt = (code, key) => ({ code, i18nKey: key });

export const OTS_YES_NO = [opt("YES", "OTS_O_YES"), opt("NO", "OTS_O_NO")];

export const OTS_PATTERNS = {
  mobile: { re: /^[6-9]\d{9}$/, error: "OTS_E_MOBILE" },
  pin: { re: /^[1-9]\d{5}$/, error: "OTS_E_PIN" },
  ifsc: { re: /^[A-Z]{4}0[A-Z0-9]{6}$/, error: "OTS_E_IFSC" },
};

export const OTS_ANY_OTHER = "AnyOther";
export const OTS_MIN_TEXT = 20; // brief history / non-payment reason
export const OTS_DEFAULT_SCHEME = "RBI One Time Settlement Scheme";

export const OTS_DMS = "OTS"; // DMS service name (mst_service_master)
export const OTS_SESSION_KEY = "OTS_APPLICATION";

export const OTS_PAGES = [
  {
    key: "applicant",
    route: "applicant",
    head: "OTS_STEP_APPLICANT",
    hint: "OTS_STEP_HINT_APPLICANT",
    fields: [
      { name: "applicantName", type: "text", required: true, maxLength: 100 },
      { name: "fatherName", type: "text", required: true, maxLength: 100 },
      { name: "dateOfBirth", type: "date", required: true, maxToday: true },
      { name: "mobileNumber", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true, lockedFromLogin: true },
      { name: "isHimachalResident", type: "select", required: true, options: OTS_YES_NO },
    ],
  },
  {
    key: "shop",
    route: "shop",
    head: "OTS_STEP_SHOP",
    hint: "OTS_STEP_HINT_SHOP",
    fields: [
      { name: "ulbName", type: "select", required: true, optionsFrom: "ulbs", resets: ["ward"] },
      { name: "ward", type: "select", required: true, optionsFrom: "wards", dependsOn: "ulbName" },
      { name: "shopAddress", type: "text", required: true, maxLength: 255 },
      { name: "pincode", type: "text", required: true, maxLength: 6, pattern: "pin", digitsOnly: true },
      { name: "shopType", type: "select", required: true, optionsFrom: "categories", resets: ["shopTypeOther"] },
      { name: "shopTypeOther", type: "text", required: true, maxLength: 100, showWhen: { field: "shopType", equals: OTS_ANY_OTHER } },
      { name: "annualTurnover", type: "text", required: true, maxLength: 12, money: true },
      { name: "isGovernmentEmployee", type: "select", required: true, options: OTS_YES_NO },
    ],
  },
  { key: "loans", route: "loans", head: "OTS_STEP_LOANS", hint: "OTS_STEP_HINT_LOANS", custom: "loans" },
  { key: "settlement", route: "settlement", head: "OTS_STEP_SETTLEMENT", hint: "OTS_STEP_HINT_SETTLEMENT", custom: "settlement" },
  { key: "documents", route: "documents", head: "OTS_STEP_DOCUMENTS", hint: "OTS_STEP_HINT_DOCUMENTS", custom: "documents" },
];

// One row of the NPA loans list.
export const OTS_LOAN_FIELDS = [
  { name: "ifsc", type: "text", required: true, maxLength: 11, pattern: "ifsc", upper: true, help: true },
  { name: "bankName", type: "text", required: true, maxLength: 255 },
  { name: "branchName", type: "text", required: true, maxLength: 255 },
  { name: "loanTakenDate", type: "date", required: true, maxToday: true },
  { name: "npaDeclaredDate", type: "date", required: true, maxToday: true, minFrom: "loanTakenDate" },
  { name: "amountAvailed", type: "text", required: true, maxLength: 12, money: true },
  { name: "principal", type: "text", required: true, maxLength: 12, money: true },
  { name: "interest", type: "text", required: true, maxLength: 12, money: true },
];

// One row of the earlier-settlements list.
export const OTS_SETTLEMENT_FIELDS = [
  { name: "yearOfSettlement", type: "select", required: true, optionsFrom: "years" },
  { name: "amountSettled", type: "text", required: true, maxLength: 12, money: true },
  { name: "paidInFull", type: "select", required: true, options: OTS_YES_NO },
  { name: "schemeName", type: "text", required: true, maxLength: 255 },
];

export const otsPageOf = (key) => OTS_PAGES.find((p) => p.key === key);
export const OTS_NAV_STEPS = [...OTS_PAGES, { key: "review", route: "check", head: "OTS_STEP_REVIEW" }];
