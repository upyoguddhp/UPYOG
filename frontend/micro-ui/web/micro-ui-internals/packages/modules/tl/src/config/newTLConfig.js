// Step + field definitions for the HP "NewTL" registration flow.
// Field set, required rules and options mirror OldTheme's tradeLicense/registration form.
// type: text | textarea | date | select | multiselect | readonly
// optionsFrom: a key resolved by useNTLLookups (MDMS driven) instead of static `options`.

const opt = (code, key) => ({ code, i18nKey: key });

export const NTL_YES_NO = [opt("Yes", "NTL_O_YES"), opt("No", "NTL_O_NO")];

export const NEW_TL_STEPS = [
  {
    // first step: pick the property the trade will run from (searched in property-services).
    // Saved under tradeLocationDetails, which buildNewTLPayload already reads; fields below are the read-only review rows.
    route: "property",
    key: "tradeLocationDetails",
    custom: "property",
    head: "NTL_STEP_PROPERTY",
    hint: "NTL_STEP_HINT_PROPERTY",
    fields: [
      { name: "propertyId", type: "readonly", required: true },
      { name: "propertyOwnerName", type: "readonly" },
      { name: "propertyAddress", type: "readonly" },
      { name: "districtName", type: "readonly" },
      { name: "ulbName", type: "readonly" },
      { name: "wardNumber", type: "readonly" },
      { name: "zone", type: "readonly" },
      { name: "propertyPinCode", type: "readonly" },
    ],
  },
  {
    route: "registration",
    key: "registrationDetails",
    page: "details",
    head: "NTL_STEP_REGISTRATION",
    hint: "NTL_STEP_HINT_REGISTRATION",
    fields: [
      { name: "registrationLicenseNumber", help: true, type: "text", maxLength: 50 },
      { name: "registrationCommencementDate", type: "date" },
      { name: "registrationValidityDate", type: "date", minFrom: "registrationCommencementDate" },
    ],
  },
  {
    route: "trade",
    key: "tradeDetails",
    page: "details",
    head: "NTL_STEP_TRADE",
    hint: "NTL_STEP_HINT_TRADE",
    fields: [
      { name: "businessName", type: "text", required: true, maxLength: 150 },
      {
        name: "scaleOfBusiness",
        type: "select",
        required: true,
        options: [opt("Small", "NTL_O_SMALL"), opt("Medium", "NTL_O_MEDIUM"), opt("Large", "NTL_O_LARGE")],
      },
      { name: "gstNumber", help: true, type: "text", maxLength: 15, pattern: "gst", upper: true },
      { name: "businessDetails", type: "textarea", required: true, maxLength: 500 },
      {
        name: "tradeIndustryType",
        type: "select",
        required: true,
        options: [opt("Goods", "NTL_O_GOODS"), opt("Services", "NTL_O_SERVICES")],
      },
      { name: "mapApproved", help: true, type: "select", required: true, options: NTL_YES_NO },
      {
        name: "propertyType",
        type: "select",
        required: true,
        options: [opt("Residential", "NTL_O_RESIDENTIAL"), opt("Commercial", "NTL_O_COMMERCIAL")],
      },
      {
        name: "infraStrOwnType",
        type: "select",
        required: true,
        options: [opt("Owned", "NTL_O_OWNED"), opt("Rented", "NTL_O_RENTED"), opt("Leased", "NTL_O_LEASED")],
      },
    ],
  },
  {
    route: "specifications",
    key: "tradeSpecifications",
    page: "details",
    head: "NTL_STEP_SPEC",
    hint: "NTL_STEP_HINT_SPEC",
    fields: [
      { name: "licenseCategory", type: "select", required: true, optionsFrom: "sectors", resets: ["licenseTrade", "licenseSubCategory"] },
      {
        name: "licenseTrade",
        type: "multiselect",
        required: true,
        optionsFrom: "trades",
        dependsOn: "licenseCategory",
        parentLabel: "NTL_F_licenseCategory",
        resets: ["licenseSubCategory"],
      },
      {
        name: "licenseSubCategory",
        type: "multiselect",
        required: true,
        optionsFrom: "subCategories",
        dependsOn: "licenseTrade",
        parentLabel: "NTL_F_licenseTrade",
      },
      { name: "licensePeriod", help: true, type: "select", required: true, optionsFrom: "periods" },
    ],
  },
  {
    route: "owner",
    key: "tradeOwnerDetails",
    page: "people",
    head: "NTL_STEP_OWNER",
    hint: "NTL_STEP_HINT_OWNER",
    fields: [
      { name: "tradeOwnerName", type: "text", required: true, maxLength: 100 },
      { name: "tradeOwnerFatherName", type: "text", required: true, maxLength: 100 },
      {
        name: "tradeOwnerGender",
        type: "select",
        required: true,
        options: [opt("MALE", "NTL_O_MALE"), opt("FEMALE", "NTL_O_FEMALE"), opt("Others", "NTL_O_OTHERS")],
      },
      { name: "tradeOwnerMobileNumber", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true },
      { name: "tradeOwnerEmailAddress", type: "text", pattern: "email", maxLength: 100 },
    ],
  },
  {
    route: "applicant",
    key: "applicantDetails",
    page: "people",
    head: "NTL_STEP_APPLICANT",
    hint: "NTL_STEP_HINT_APPLICANT",
    fields: [
      { name: "applicantName", type: "readonly" },
      { name: "applicantMobileNumber", type: "readonly" },
      { name: "applicantEmailAddress", type: "readonly" },
    ],
  },
  {
    route: "documents",
    key: "documents",
    custom: "documents",
    head: "NTL_STEP_DOCUMENTS",
    hint: "NTL_STEP_HINT_DOCUMENTS",
    fields: [],
  },
];

// Pages the citizen walks through (stepper + routes). A page may hold several NEW_TL_STEPS as sections.
export const NTL_PAGES = [
  { route: "property", key: "tradeLocationDetails", head: "NTL_STEP_PROPERTY", hint: "NTL_STEP_HINT_PROPERTY", custom: "property" },
  { route: "details", key: "details", head: "NTL_STEP_DETAILS", hint: "NTL_STEP_HINT_DETAILS" },
  { route: "people", key: "people", head: "NTL_STEP_PEOPLE", hint: "NTL_STEP_HINT_PEOPLE" },
  { route: "documents", key: "documents", head: "NTL_STEP_DOCUMENTS", hint: "NTL_STEP_HINT_DOCUMENTS", custom: "documents" },
].map((pg) => ({
  ...pg,
  sections: NEW_TL_STEPS.filter((s) => (s.page || s.key) === pg.key),
}));

export const NTL_PATTERNS = {
  mobile: { re: /^[6-9]\d{9}$/, error: "NTL_E_MOBILE" },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, error: "NTL_E_EMAIL" },
  pin: { re: /^[1-9]\d{5}$/, error: "NTL_E_PIN" },
  gst: { re: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, error: "NTL_E_GST" },
};

// Licence period: 1 or 5 years; 3 years is only offered for tobacco (prohibited substances).
export const NTL_PROHIBITED_TRADE = "prohibited substances (tobacco & tobacco products)";

// Lifecycle of an approved licence: which pages each flow walks through and which fields stay editable.
// type = tl-services applicationType; editable null = every field.
export const NTL_LIFECYCLE = {
  renew: { type: "RENEWAL", title: "NTL_LC_RENEW", pageKeys: ["details", "documents"], editable: ["licensePeriod"] },
  modify: { type: "MODIFICATION", title: "NTL_LC_MODIFY", pageKeys: ["details", "people", "documents"], editable: null },
  close: { type: "CLOSURE", title: "NTL_LC_CLOSE", pageKeys: [], editable: [] },
};

export const NTL_TYPE_KEYS = { NEW: "NTL_TYPE_NEW", RENEWAL: "NTL_TYPE_RENEWAL", MODIFICATION: "NTL_TYPE_MODIFICATION", CLOSURE: "NTL_TYPE_CLOSURE" };
