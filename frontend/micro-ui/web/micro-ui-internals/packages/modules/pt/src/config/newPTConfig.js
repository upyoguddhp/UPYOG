// Step + field definitions for the HP "NewPT" property registration flow.
// Field set, required rules and payload keys mirror OldTheme's Property registration forms.
// type: text | textarea | number | select | readonly | repeater
// optionsFrom: a key resolved by useNPTLookups (MDMS driven) instead of static `options`.
// showIf: { field, equals } hides a field (and skips its validation) unless the sibling matches.
// step.when(params): the step is skipped entirely when it returns false.

const opt = (code, key) => ({ code, i18nKey: key });

export const NPT_YES_NO = [opt("Yes", "NPT_O_YES"), opt("No", "NPT_O_NO")];

const floors = [{ code: "0", i18nKey: "NPT_O_FLOOR_G" }, ...Array.from({ length: 10 }, (_, i) => ({ code: String(i + 1), i18nKey: `NPT_O_FLOOR_${i + 1}` }))];

export const NEW_PT_STEPS = [
  {
    route: "location",
    key: "locationDetails",
    head: "NPT_STEP_LOCATION",
    hint: "NPT_STEP_HINT_LOCATION",
    fields: [
      { name: "districtName", type: "select", required: true, optionsFrom: "districts", resets: ["ulbName", "ulbType", "wardNumber", "zone"] },
      {
        name: "ulbName",
        type: "select",
        required: true,
        optionsFrom: "ulbs",
        dependsOn: "districtName",
        parentLabel: "NPT_F_districtName",
        resets: ["ulbType", "wardNumber", "zone"],
      },
      { name: "ulbType", type: "readonly" },
      { name: "wardNumber", type: "select", required: true, optionsFrom: "wards", dependsOn: "ulbName", parentLabel: "NPT_F_ulbName" },
      { name: "zone", type: "select", required: true, help: true, optionsFrom: "zones", dependsOn: "ulbName", parentLabel: "NPT_F_ulbName" },
      { name: "propertyPinCode", type: "text", required: true, help: true, maxLength: 6, pattern: "pin", digitsOnly: true },
      { name: "oldPropertyId", type: "text", maxLength: 50, help: true },
      { name: "gpsLocation", type: "text", maxLength: 40, pattern: "gps", geo: true, help: true },
      { name: "propertyAddress", type: "text", required: true, maxLength: 300, help: true, span: 2 },
      {
        name: "multipleKhasra",
        type: "repeater",
        required: true,
        addLabel: "NPT_ADD_KHASRA",
        itemLabel: "NPT_KHASRA_ITEM",
        item: [
          { name: "khataOrKhatauniNo", type: "text", required: true, maxLength: 30 },
          { name: "khasraNo", type: "text", required: true, maxLength: 30 },
          { name: "area", type: "number", required: true },
          {
            name: "unit",
            type: "select",
            required: true,
            options: [
              opt("bigha", "NPT_O_BIGHA"),
              opt("hectare", "NPT_O_HECTARE"),
              opt("acre", "NPT_O_ACRE"),
              opt("biswa", "NPT_O_BISWA"),
              opt("kanal", "NPT_O_KANAL"),
              opt("Square Meter", "NPT_O_SQM"),
              opt("Deci Meter", "NPT_O_DECIMETER"),
            ],
          },
        ],
      },
    ],
  },
  {
    route: "specification",
    key: "specificationDetails",
    head: "NPT_STEP_SPEC",
    hint: "NPT_STEP_HINT_SPEC",
    fields: [
      { name: "isBilling", type: "checkbox", required: true, help: true },
      {
        name: "propertyType",
        type: "select",
        required: true,
        options: [opt("VACANT", "NPT_O_FOR_LAND"), opt("BUILTUP", "NPT_O_FOR_BUILDING")],
      },
      { name: "propArea", type: "number", required: true, help: true, showIf: { field: "propertyType", equals: "VACANT" } },
      { name: "mapRefNo", type: "text", maxLength: 50, help: true, showIf: { field: "propertyType", equals: "BUILTUP" } },
      {
        name: "units",
        type: "repeater",
        required: true,
        showIf: { field: "propertyType", equals: "BUILTUP" },
        addLabel: "NPT_ADD_UNIT",
        itemLabel: "NPT_UNIT_ITEM",
        item: [
          { name: "propBuildingType", type: "select", required: true, help: true, optionsFrom: "structures" },
          { name: "propType", type: "select", required: true, help: true, optionsFrom: "purposes" },
          { name: "propYearOfCons", type: "select", required: true, help: true, optionsFrom: "years" },
          { name: "useOfBuilding", type: "select", required: true, help: true, optionsFrom: "uses" },
          { name: "propArea", type: "number", required: true },
          { name: "floorNo", type: "select", required: true, options: floors },
        ],
      },
    ],
  },
  {
    route: "owner",
    key: "ownerDetails",
    head: "NPT_STEP_OWNER",
    hint: "NPT_STEP_HINT_OWNER",
    fields: [
      { name: "oldCustomerId", type: "text", maxLength: 50, help: true },
      { name: "ownerName", type: "text", required: true, maxLength: 100 },
      { name: "ownerFatherName", type: "text", required: true, maxLength: 100 },
      {
        name: "ownerGender",
        type: "select",
        required: true,
        options: [opt("MALE", "NPT_O_MALE"), opt("FEMALE", "NPT_O_FEMALE"), opt("OTHERS", "NPT_O_OTHERS")],
      },
      { name: "ownerMobileNumber", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true },
      { name: "ownerEmail", type: "text", pattern: "email", maxLength: 100 },
      { name: "ownerAddress", type: "text", required: true, maxLength: 300 },
      { name: "ownerPinCode", type: "text", required: true, help: true, maxLength: 6, pattern: "pin", digitsOnly: true },
      { name: "anyOtherCoWorker", type: "select", required: true, options: NPT_YES_NO, help: true },
      {
        name: "coOwners",
        type: "repeater",
        required: true,
        showIf: { field: "anyOtherCoWorker", equals: "Yes" },
        addLabel: "NPT_ADD_COOWNER",
        itemLabel: "NPT_COOWNER_ITEM",
        item: [
          { name: "coOwnerName", type: "text", required: true, maxLength: 100 },
          { name: "coOwnerMobile", type: "text", required: true, maxLength: 10, pattern: "mobile", digitsOnly: true },
          { name: "coOwnerEmail", type: "text", pattern: "email", maxLength: 100 },
          {
            name: "relationWithCoOwner",
            type: "select",
            required: true,
            options: ["Father", "Mother", "Brother", "Sister", "Husband", "Wife", "Son", "Daughter", "Spouse", "Others"].map((r) => opt(r, `NPT_O_REL_${r.toUpperCase()}`)),
          },
          { name: "addressSameAsOwner", type: "select", required: true, options: NPT_YES_NO, default: "Yes" },
          { name: "coOwnerAddress", type: "text", required: true, maxLength: 300, showIf: { field: "addressSameAsOwner", equals: "No" } },
          { name: "coOwnerPinCode", type: "text", required: true, maxLength: 6, pattern: "pin", digitsOnly: true, help: true, showIf: { field: "addressSameAsOwner", equals: "No" } },
        ],
      },
    ],
  },
  {
    route: "documents",
    key: "documents",
    head: "NPT_STEP_DOCUMENTS",
    hint: "NPT_STEP_HINT_DOCUMENTS",
    custom: "documents",
    fields: [],
  },
];

export const NPT_PATTERNS = {
  mobile: { re: /^[6-9]\d{9}$/, error: "NPT_E_MOBILE" },
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, error: "NPT_E_EMAIL" },
  pin: { re: /^[1-9]\d{5}$/, error: "NPT_E_PIN" },
  gps: { re: /^-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$/, error: "NPT_E_GPS" },
};
