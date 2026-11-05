// Step + field definitions for the HP Garbage Collection ("GB") registration flow.
// Field set and required rules mirror OldTheme's garbageCollection/registration form.
// type: text | select | checkbox | readonly   optionsFrom: a key resolved by useGRBLookups (MDMS driven).

const opt = (code, key) => ({ code, i18nKey: key });

export const GRB_COLLECTION_TYPES = [
  opt("Household (Single-Collection)", "GRB_O_HH_SINGLE"),
  opt("Household (Multi-Collection)", "GRB_O_HH_MULTI"),
  opt("Commercial (Single-Collection)", "GRB_O_COM_SINGLE"),
  opt("Commercial (Multi-Collection)", "GRB_O_COM_MULTI"),
  opt("Mix-Property (Household + Commercial)", "GRB_O_MIX"),
];

// only these types may hold a single collection unit
export const GRB_SINGLE_TYPES = ["Household (Single-Collection)", "Commercial (Single-Collection)"];

// Sections of the "details" page. `repeat` sections render one card per collection unit.
export const NEW_GRB_STEPS = [
  {
    // first step: pick the property the account is for (searched in property-services).
    route: "property",
    key: "propertyDetails",
    custom: "property",
    head: "GRB_STEP_PROPERTY",
    hint: "GRB_STEP_HINT_PROPERTY",
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
    route: "details",
    key: "specifications",
    page: "details",
    head: "GRB_SEC_SPEC",
    hint: "GRB_STEP_HINT_DETAILS",
    fields: [
      { name: "oldGarbageId", help: true, type: "text", maxLength: 50 },
      { name: "typeOfCollection", help: true, type: "select", required: true, options: GRB_COLLECTION_TYPES },
    ],
  },
  {
    route: "details",
    key: "units",
    page: "details",
    head: "GRB_SEC_UNITS",
    hint: "GRB_STEP_HINT_DETAILS",
    repeat: true,
    // one entry per collection unit; the first unit is the account holder
    fields: [
      { name: "propertyOwnerType", type: "select", required: true, options: [opt("Owner", "GRB_O_OWNER"), opt("Tenant", "GRB_O_TENANT")] },
      { name: "name", type: "text", required: true, maxLength: 100 },
      { name: "phoneNumber", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true },
      {
        name: "gender",
        type: "select",
        required: true,
        options: [opt("Male", "GRB_O_MALE"), opt("Female", "GRB_O_FEMALE"), opt("Others", "GRB_O_OTHERS")],
      },
      { name: "email", type: "text", pattern: "email", maxLength: 100 },
      { name: "category", type: "select", required: true, optionsFrom: "categories", resets: ["subCategory", "subCategoryType"] },
      { name: "subCategory", type: "select", required: true, optionsFrom: "subCategories", dependsOn: "category", parentLabel: "GRB_F_category", resets: ["subCategoryType"] },
      { name: "subCategoryType", type: "select", required: true, optionsFrom: "subCategoryTypes", dependsOn: "subCategory", parentLabel: "GRB_F_subCategory" },
      // shown only when the chosen sub category type carries an additional cost
      { name: "calcType", type: "select", required: true, showIf: "additional", options: [opt("Fixed", "GRB_O_FIXED"), opt("Variable", "GRB_O_VARIABLE")] },
      { name: "no_of_units", type: "text", required: true, showIf: "variable", maxLength: 5, digitsOnly: true, help: true },
      { name: "isbplunit", type: "checkbox", help: true },
    ],
  },
  {
    route: "documents",
    key: "documents",
    custom: "documents",
    head: "GRB_STEP_DOCUMENTS",
    hint: "GRB_STEP_HINT_DOCUMENTS",
    fields: [],
  },
];

// Pages the citizen walks through (stepper + routes). A page may hold several NEW_GRB_STEPS as sections.
export const GRB_PAGES = [
  { route: "property", key: "propertyDetails", head: "GRB_STEP_PROPERTY", hint: "GRB_STEP_HINT_PROPERTY", custom: "property" },
  { route: "details", key: "details", head: "GRB_STEP_DETAILS", hint: "GRB_STEP_HINT_DETAILS" },
  { route: "documents", key: "documents", head: "GRB_STEP_DOCUMENTS", hint: "GRB_STEP_HINT_DOCUMENTS", custom: "documents" },
].map((pg) => ({
  ...pg,
  sections: NEW_GRB_STEPS.filter((s) => (s.page || s.key) === pg.key),
}));

// A modification keeps the account's property, so its stepper has no property step.
export const grbPagesFor = (formData) => (formData && formData._mode === "MODIFICATION" ? GRB_PAGES.filter((p) => p.key !== "propertyDetails") : GRB_PAGES);
export const grbTitleKey = (formData) => (formData && formData._mode === "MODIFICATION" ? "GRB_LC_MODIFY_TITLE" : "GRB_MENU_NEW_REGISTRATION");

export const GRB_PATTERNS = {
  mobile: { re: /^[6-9]\d{9}$/, error: "GRB_E_MOBILE" },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, error: "GRB_E_EMAIL" },
  units: { re: /^[1-9]\d{0,4}$/, error: "GRB_E_UNITS" },
};
