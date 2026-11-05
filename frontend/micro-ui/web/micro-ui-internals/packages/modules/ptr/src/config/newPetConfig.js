// Step + field definitions for the HP "NewPet" (pet registration) flow.
// Sections (NEW_PET_STEPS) group into pages (NPR_PAGES): one page may show several sections.
// type: text | textarea | date | select | readonly
// optionsFrom: a key resolved by useNPRLookups (MDMS driven) instead of static `options`.
// showIf: { field, equals } — the field is only shown (and validated) when the condition holds.

const opt = (code, key) => ({ code, i18nKey: key });

export const NPR_YES_NO = [opt("Yes", "NPR_O_YES"), opt("No", "NPR_O_NO")];

export const NEW_PET_STEPS = [
  {
    // first step: pick the property the pet lives at (searched in property-services).
    // The selection supplies the ULB tenant and address; fields below are the read-only review rows.
    key: "propertyDetails",
    page: "property",
    custom: "property",
    head: "NPR_STEP_PROPERTY",
    hint: "NPR_STEP_HINT_PROPERTY",
    fields: [
      { name: "propertyId", type: "readonly", required: true },
      { name: "propertyOwnerName", type: "readonly" },
      { name: "propertyAddress", type: "readonly" },
      { name: "districtName", type: "readonly" },
      { name: "ulbName", type: "readonly" },
      { name: "wardNumber", type: "readonly" },
      { name: "propertyPinCode", type: "readonly" },
    ],
  },
  {
    key: "petDetails",
    page: "details",
    head: "NPR_STEP_PET",
    fields: [
      { name: "petName", type: "text", required: true, maxLength: 100 },
      { name: "petType", type: "select", required: true, optionsFrom: "petTypes", resets: ["breedType"] },
      { name: "breedType", type: "select", required: true, optionsFrom: "breeds", dependsOn: "petType", parentLabel: "NPR_F_petType", carry: ["_isBanned"] },
      { name: "petGender", type: "select", required: true, options: [opt("Male", "NPR_O_MALE"), opt("Female", "NPR_O_FEMALE")] },
      { name: "petAge", help: true, type: "text", required: true, maxLength: 3, digitsOnly: true, pattern: "age" },
      { name: "petColour", type: "text", maxLength: 50 },
      { name: "petStrelization", type: "select", required: true, options: NPR_YES_NO },
      {
        name: "petPurchaseSource",
        type: "select",
        required: true,
        options: [
          opt("Licensed Breeder", "NPR_O_BREEDER"),
          opt("Pet Shop", "NPR_O_SHOP"),
          opt("Adopted", "NPR_O_ADOPTED"),
          opt("Gift", "NPR_O_GIFT"),
          opt("Other", "NPR_O_OTHER"),
        ],
      },
      { name: "petPurchaseSourceDetail", type: "text", maxLength: 150 },
    ],
  },
  {
    key: "vaccination",
    page: "details",
    head: "NPR_STEP_VACCINATION",
    fields: [
      { name: "vaccinationStatus", help: true, type: "select", required: true, options: NPR_YES_NO },
      { name: "vaccinationNumber", type: "text", required: true, maxLength: 50, showIf: { field: "vaccinationStatus", equals: "Yes" } },
      { name: "lastVaccineDate", type: "date", required: true, maxToday: true, showIf: { field: "vaccinationStatus", equals: "Yes" } },
      { name: "clinicName", type: "text", required: true, maxLength: 100, showIf: { field: "vaccinationStatus", equals: "Yes" } },
      { name: "doctorName", type: "text", required: true, maxLength: 100, showIf: { field: "vaccinationStatus", equals: "Yes" } },
      { name: "doctorRegistrationNumber", type: "text", maxLength: 50, showIf: { field: "vaccinationStatus", equals: "Yes" } },
    ],
  },
  {
    key: "ownerDetails",
    page: "people",
    head: "NPR_STEP_OWNER",
    fields: [
      { name: "applicantName", type: "text", required: true, maxLength: 100 },
      { name: "fatherName", type: "text", required: true, maxLength: 100 },
      { name: "petOwnerGender", type: "select", required: true, options: [opt("Male", "NPR_O_MALE"), opt("Female", "NPR_O_FEMALE"), opt("Others", "NPR_O_OTHERS")] },
      { name: "mobileNumber", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true },
      { name: "emailId", type: "text", pattern: "email", maxLength: 100 },
      { name: "aadharNumber", help: true, type: "text", maxLength: 12, pattern: "aadhar", digitsOnly: true },
    ],
  },
  { key: "documents", page: "documents", custom: "documents", head: "NPR_STEP_DOCUMENTS", hint: "NPR_STEP_HINT_DOCUMENTS", fields: [] },
];

// Pages the citizen walks through (stepper + routes).
export const NPR_PAGES = [
  { route: "property", key: "property", head: "NPR_STEP_PROPERTY", hint: "NPR_STEP_HINT_PROPERTY", custom: "property" },
  { route: "details", key: "details", head: "NPR_STEP_DETAILS", hint: "NPR_STEP_HINT_DETAILS" },
  { route: "people", key: "people", head: "NPR_STEP_PEOPLE", hint: "NPR_STEP_HINT_PEOPLE" },
  { route: "documents", key: "documents", head: "NPR_STEP_DOCUMENTS", hint: "NPR_STEP_HINT_DOCUMENTS", custom: "documents" },
].map((pg) => ({ ...pg, sections: NEW_PET_STEPS.filter((s) => s.page === pg.key) }));

export const NPR_PATTERNS = {
  mobile: { re: /^[6-9]\d{9}$/, error: "NPR_E_MOBILE" },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, error: "NPR_E_EMAIL" },
  pin: { re: /^[1-9]\d{5}$/, error: "NPR_E_PIN" },
  aadhar: { re: /^\d{12}$/, error: "NPR_E_AADHAR" },
  age: { re: /^(?:[1-9]\d{0,2}|0)$/, error: "NPR_E_AGE" },
};
