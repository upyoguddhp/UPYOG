import { GRB_PATTERNS, GRB_PAGES, GRB_SINGLE_TYPES, NEW_GRB_STEPS } from "../config/newGRBConfig";

export const GRB_SESSION_KEY = "GB_NEW_REGISTRATION";
export const GRB_BUSINESS_SERVICE = "GB_CITIZEN";

const isEmpty = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

// Values that come from the signed-in citizen rather than being typed.
export const getUserDefaults = () => {
  const info = Digit.UserService.getUser()?.info || {};
  return { name: info.name || "", phoneNumber: info.mobileNumber || "", email: info.emailId || "" };
};

export const emptyUnit = (extra = {}) => ({
  propertyOwnerType: "",
  name: "",
  phoneNumber: "",
  gender: "",
  email: "",
  category: "",
  subCategory: "",
  subCategoryType: "",
  calcType: "",
  no_of_units: "",
  isbplunit: false,
  ...extra,
});

// first unit starts from the citizen's own account details
export const initialUnits = (saved) => (saved && saved.list && saved.list.length ? saved.list : [emptyUnit(getUserDefaults())]);

// Is the unit's sub category type one that carries an additional cost (fixed / variable calculation)?
export const unitFlags = (unit, categories = []) => {
  const row = categories.find(
    (c) => c.categories === unit.category && c.subcategories === unit.subCategory && c.subcategorytype === unit.subCategoryType
  );
  const additional = !!row && (row.isAdditonalCostAdded === true || String(row.isAdditonalCostAdded).toLowerCase() === "true");
  return { additional, variable: additional && unit.calcType === "Variable" };
};

// Returns { fieldName: i18nErrorKey } for one object of values — empty when valid.
export const validateFields = (fields, values, ctx = {}) => {
  const errors = {};
  fields.forEach((f) => {
    if (f.type === "readonly") return;
    if (f.showIf && !ctx[f.showIf]) return;
    const v = values[f.name];
    if (f.required && isEmpty(v)) {
      errors[f.name] = "GRB_E_REQUIRED";
      return;
    }
    if (isEmpty(v)) return;
    if (f.pattern && !GRB_PATTERNS[f.pattern].re.test(String(v).trim())) {
      errors[f.name] = GRB_PATTERNS[f.pattern].error;
    }
    if (f.name === "no_of_units" && !GRB_PATTERNS.units.re.test(String(v).trim())) errors[f.name] = GRB_PATTERNS.units.error;
  });
  return errors;
};

// One collection unit in the shape garbage-service expects.
const toCollectionUnit = (u, typeOfCollection, flags) => ({
  unitType: typeOfCollection,
  category: u.category,
  subCategory: u.subCategory,
  subCategoryType: u.subCategoryType,
  isbplunit: !!u.isbplunit,
  isvariablecalculation: flags.variable,
  isbulkgeneration: flags.additional && u.calcType === "Fixed",
  no_of_units: flags.variable ? Number(u.no_of_units) || 0 : 0,
  ismonthlybilling: true,
  isActive: true,
});

// Same body OldTheme's GarbageRegistrationSubmission sends to garbage-accounts/_create.
export const buildGarbagePayload = (params, { stateTenant, categories = [], action = "INITIATE", applicationType = "NEW" } = {}) => {
  const prop = params.propertyDetails || {};
  const spec = params.specifications || {};
  const units = (params.units && params.units.list) || [];
  const first = units[0] || {};
  const info = Digit.UserService.getUser()?.info || {};
  const ulbTenant = `${stateTenant}.${prop.ulbName}`;
  const flagsOf = (u) => unitFlags(u, categories);
  const [lat, lng] = String(prop.gpsLocation || "").split(",");

  return {
    garbageAccounts: [
      {
        action,
        applicationType,
        newRegistrationType: "PERMANENT",
        workflowAction: "INITIATE",
        workflowCode: "GB",
        tenantId: ulbTenant,
        type: "NEW",
        isDdpVerified: false,
        systemPropertyId: prop.propertyId,
        propertyId: prop.propertyId,
        name: String(first.name || "").trim(),
        mobileNumber: first.phoneNumber,
        gender: first.gender,
        emailId: first.email || info.emailId || undefined,
        isOwner: first.propertyOwnerType === "Owner",
        addresses: [
          {
            address1: prop.propertyAddress,
            district: prop.districtName,
            ulbName: prop.ulbName,
            ulbType: prop.ulbType,
            wardName: prop.wardNumber,
            zone: prop.zone,
            pincode: prop.propertyPinCode,
            isActive: true,
            additionalDetail: { district: prop.districtName, latitude: lat || "", longitude: lng || "" },
          },
        ],
        grbgOldDetails: { oldGarbageId: spec.oldGarbageId },
        grbgCollectionUnits: [toCollectionUnit(first, spec.typeOfCollection, flagsOf(first))],
        childGarbageAccounts: units.slice(1).map((u) => ({
          type: "NEW",
          isDdpVerified: false,
          systemPropertyId: prop.propertyId,
          isOwner: u.propertyOwnerType === "Owner",
          name: String(u.name || "").trim(),
          gender: u.gender,
          email: u.email,
          mobileNumber: u.phoneNumber,
          grbgApplication: {},
          grbgCollectionUnits: [toCollectionUnit(u, spec.typeOfCollection, flagsOf(u))],
        })),
        additionalDetail: {
          propertyOwnerName: prop.propertyOwnerName,
          applicantName: info.name,
          applicantEmail: info.emailId,
          applicantPhoneNumber: info.mobileNumber,
        },
      },
    ],
    RequestInfo: { apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token },
  };
};

// Second call: moves the freshly created (INITIATED) application into the workflow (citizen -> ULB verifier).
export const buildSubmitPayload = (created, action = "FORWARD_TO_VERIFIER") => ({
  garbageAccounts: [
    {
      businessService: created.businessService || GRB_BUSINESS_SERVICE,
      isOnlyWorkflowCall: true,
      grbgApplicationNumber: created.grbgApplication?.applicationNo,
      workflowAction: action,
      workflowComment: "Forward to Verifier",
    },
  ],
  RequestInfo: { apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token },
});

// garbage-service endpoints; params carry a timestamp so Digit's POST response cache never replays an old answer
const call = (path, data) =>
  Digit.CustomService.getResponse({ url: `/garbage-service/garbage-accounts/${path}`, params: { tenantId: Digit.ULBService.getStateId(), _: Date.now() }, data });

export const GarbageApi = {
  create: (payload) => call("_create", payload),
  update: (payload) => call("_update", payload),
  searchMine: (mobileNumber) =>
    call("_search", {
      RequestInfo: { apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token },
      searchCriteriaGarbageAccount: { mobileNumber: mobileNumber ? [mobileNumber] : [], isActiveAccount: true, isActiveSubAccount: true },
    }),
};

// application number of a garbage account record
export const applicationNoOf = (acc) => (acc && (acc.grbgApplication?.applicationNo || acc.grbgApplicationNumber)) || "";

// Pulls the most useful message out of a failed API response/exception.
export const apiErrorMessage = (err, fallback) => {
  const e = err?.response?.data?.Errors?.[0] || err?.Errors?.[0] || err?.data?.Errors?.[0];
  const raw = e?.message || e?.description || err?.message;
  // bare transport errors ("Request failed with status code 500") are not actionable for citizens
  return !raw || /^Request failed with status code|^Network Error/i.test(raw) ? fallback : raw;
};

// One-line address of a property-services record.
export const propertyAddressOf = (p) => {
  const a = p?.address || {};
  const extra = a.additionalDetails || {};
  return extra.propertyAddress || [a.doorNo, a.buildingName, a.street, a.locality?.name, a.city].filter(Boolean).join(", ");
};

// What the Property step keeps (and the payload reads) once a property is chosen.
export const propertyToSelection = (p) => {
  const a = p?.address || {};
  const extra = a.additionalDetails || {};
  return {
    // the account is filed with the property's own ULB (tenant "hp.<ulb>")
    districtName: a.district || "",
    ulbName: (p.tenantId || "").split(".")[1] || extra.ulbName || "",
    ulbType: extra.ulbType || "",
    propertyId: p.propertyId,
    propertyOwnerName: (p.owners || []).filter((o) => o.status !== "INACTIVE").map((o) => o.name).filter(Boolean).join(", "),
    propertyAddress: propertyAddressOf(p),
    wardNumber: extra.wardNumber || "",
    zone: extra.zone || "",
    propertyPinCode: a.pincode || "",
    gpsLocation: extra.gpsLocation || "",
    propertyStatus: p.status || "",
  };
};

export const singleCollection = (typeOfCollection) => GRB_SINGLE_TYPES.includes(typeOfCollection);

// all sections' fields for the pages (used by the review page)
export const sectionsOf = () => NEW_GRB_STEPS;
export const stepIndex = (route) => GRB_PAGES.findIndex((s) => s.route === route);

/* ---- account lifecycle: modification + closure ---- */
export const GRB_MODIFY_SESSION_KEY = "GB_MODIFY_ACCOUNT";

const clone = (o) => JSON.parse(JSON.stringify(o));
const statusOfAccount = (a) => (a && ((a.grbgApplication && a.grbgApplication.status) || a.status)) || "";
export { statusOfAccount };

// Workflow-only call (no data change): moves the application with `action` under the workflow it already runs in.
export const buildWorkflowPayload = (applicationNo, businessService, action, comment) => ({
  garbageAccounts: [
    {
      businessService: businessService || GRB_BUSINESS_SERVICE,
      isOnlyWorkflowCall: true,
      grbgApplicationNumber: applicationNo,
      workflowAction: action,
      workflowComment: comment || action,
    },
  ],
  RequestInfo: { apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token },
});

// What the workflow lets this signed-in user do next: { businessService, status, nextActions[] } from the latest process instance.
export const workflowState = async (tenantId, applicationNo) => {
  const res = await Digit.WorkflowService.getByBusinessId(tenantId, applicationNo);
  const list = (res && res.ProcessInstances) || [];
  const latest = list.slice().sort((a, b) => ((b.auditDetails || {}).createdTime || 0) - ((a.auditDetails || {}).createdTime || 0))[0] || {};
  return {
    businessService: latest.businessService || "",
    status: (latest.state && latest.state.state) || "",
    nextActions: (latest.nextActions || []).map((x) => x.action),
  };
};

// Pending dues: bills of the account, its child accounts and the monthly consumer codes "<appNo>/<n>" that are not paid / cancelled.
export const pendingDuesOf = async (acc) => {
  const appNo = applicationNoOf(acc);
  const codes = [appNo, ...((acc.childGarbageAccounts || []).map((c) => applicationNoOf(c) || c.grbgApplicationNumber).filter(Boolean))];
  const search = async (consumerCode) => {
    try {
      const r = await Digit.CustomService.getResponse({
        url: "/billing-service/bill/v2/_search",
        params: { tenantId: acc.tenantId, consumerCode, service: "GB", _: Date.now() },
        data: { RequestInfo: { apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token } },
      });
      return (r && r.Bill) || [];
    } catch (e) {
      return []; // same as OldTheme: a failed lookup for a code is treated as "no bill"
    }
  };
  let n = 1;
  for (;;) {
    const code = `${appNo}/${n}`;
    if (!(await search(code)).length) break;
    codes.push(code);
    n += 1;
    if (n > 60) break;
  }
  const pending = [];
  for (const code of [...new Set(codes)]) {
    const bills = await search(code);
    if (bills.some((b) => !/^(PAID|CANCELLED)$/i.test(b.status || ""))) pending.push(code);
  }
  return pending;
};

// The page values (same shape as the registration session) rebuilt from an existing account.
export const paramsFromAccount = (acc) => {
  const addr = (acc.addresses || [])[0] || {};
  const add = acc.additionalDetail || {};
  const first = (acc.grbgCollectionUnits || [])[0] || {};
  const unitOf = (a) => {
    const u = (a.grbgCollectionUnits || [])[0] || {};
    return {
      _uuid: a.uuid,
      propertyOwnerType: a.isOwner ? "Owner" : "Tenant",
      name: a.name || "",
      phoneNumber: a.mobileNumber || "",
      gender: a.gender || "",
      email: a.emailId || a.email || "",
      category: u.category || "",
      subCategory: u.subCategory || "",
      subCategoryType: u.subCategoryType || "",
      calcType: u.isvariablecalculation ? "Variable" : u.isbulkgeneration ? "Fixed" : "",
      no_of_units: u.isvariablecalculation && u.no_of_units ? String(u.no_of_units) : "",
      isbplunit: !!u.isbplunit,
    };
  };
  const ad = addr.additionalDetail || {};
  return {
    _mode: "MODIFICATION",
    _acc: clone(acc),
    _appNo: applicationNoOf(acc),
    propertyDetails: {
      propertyId: acc.systemPropertyId || acc.propertyId,
      propertyOwnerName: add.propertyOwnerName,
      propertyAddress: addr.address1,
      districtName: addr.district || ad.district,
      ulbName: addr.ulbName,
      ulbType: addr.ulbType,
      wardNumber: addr.wardName,
      zone: addr.zone,
      propertyPinCode: addr.pincode,
      gpsLocation: ad.latitude ? `${ad.latitude},${String(ad.longitude || "").trim()}` : "",
    },
    specifications: { oldGarbageId: (acc.grbgOldDetails || {}).oldGarbageId || "", typeOfCollection: first.unitType },
    units: { list: [unitOf(acc), ...(acc.childGarbageAccounts || []).map(unitOf)] },
  };
};

// Full update of an existing account (ids kept) with the edited specification + units; workflow stays PENDINGFORMODIFICATION
// until the separate FORWARD_TO_VERIFIER call. Children are matched by uuid; new units become new children and
// children left out are removed by garbage-service.
export const buildModifyPayload = (params, { categories = [] } = {}) => {
  const acc = clone(params._acc);
  const spec = params.specifications || {};
  const units = (params.units && params.units.list) || [];
  const first = units[0] || {};
  const flagsOf = (u) => unitFlags(u, categories);
  const unitRow = (existing, u) => ({ ...(existing || {}), ...toCollectionUnit(u, spec.typeOfCollection, flagsOf(u)) });

  acc.name = String(first.name || "").trim();
  acc.mobileNumber = first.phoneNumber;
  acc.gender = first.gender;
  acc.emailId = first.email || acc.emailId;
  acc.isOwner = first.propertyOwnerType === "Owner";
  acc.grbgOldDetails = { ...(acc.grbgOldDetails || {}), oldGarbageId: spec.oldGarbageId };
  acc.grbgCollectionUnits = [unitRow((acc.grbgCollectionUnits || [])[0], first)];

  const oldChildren = acc.childGarbageAccounts || [];
  acc.childGarbageAccounts = units.slice(1).map((u) => {
    const old = oldChildren.find((c) => c.uuid && c.uuid === u._uuid);
    const base = old || { type: "NEW", isDdpVerified: false, systemPropertyId: acc.systemPropertyId, grbgApplication: {} };
    return {
      ...base,
      isOwner: u.propertyOwnerType === "Owner",
      name: String(u.name || "").trim(),
      gender: u.gender,
      email: u.email,
      emailId: u.email,
      mobileNumber: u.phoneNumber,
      grbgCollectionUnits: [unitRow(old && (old.grbgCollectionUnits || [])[0], u)],
    };
  });

  acc.applicationType = "MODIFICATION";
  acc.workflowAction = "PENDING_FOR_MODIFICATION";
  acc.isOnlyWorkflowCall = false;
  return {
    garbageAccounts: [acc],
    RequestInfo: { apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token },
  };
};
