import { NEW_TL_STEPS, NTL_PATTERNS } from "../config/newTLConfig";

export const NTL_SESSION_KEY = "TL_NEW_REGISTRATION";

const isEmpty = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

// Values that come from the signed-in citizen rather than being typed.
export const getUserDefaults = () => {
  const info = Digit.UserService.getUser()?.info || {};
  return {
    tradeOwner: { tradeOwnerMobileNumber: info.mobileNumber || "", tradeOwnerEmailAddress: info.emailId || "" },
    applicant: {
      applicantName: info.name || "",
      applicantMobileNumber: info.mobileNumber || "",
      applicantEmailAddress: info.emailId || "",
    },
  };
};

export const initialValuesForStep = (step, saved = {}) => {
  const defaults = getUserDefaults();
  const base = {};
  if (step.key === "tradeOwnerDetails") Object.assign(base, defaults.tradeOwner);
  if (step.key === "applicantDetails") Object.assign(base, defaults.applicant);
  // an applicant's account details always win over stale session data
  return step.key === "applicantDetails" ? { ...saved, ...base } : { ...base, ...saved };
};

// Returns { fieldName: i18nErrorKey } — empty when the step is valid.
export const validateStep = (step, values) => {
  const errors = {};
  step.fields.forEach((f) => {
    if (f.type === "readonly") return;
    const v = values[f.name];
    if (f.required && isEmpty(v)) {
      errors[f.name] = "NTL_E_REQUIRED";
      return;
    }
    if (isEmpty(v)) return;
    if (f.pattern && !NTL_PATTERNS[f.pattern].re.test(String(v).trim())) {
      errors[f.name] = NTL_PATTERNS[f.pattern].error;
    }
    if (f.minFrom && values[f.minFrom] && v < values[f.minFrom]) {
      errors[f.name] = "NTL_E_DATE_ORDER";
    }
  });
  if (step.key === "tradeDetails" && values.mapApproved === "No") {
    errors.mapApproved = "NTL_E_MAP_NOT_APPROVED";
  }
  return errors;
};

export const currentFinancialYearLabel = () => {
  const y = new Date().getFullYear();
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
};

// Same body OldTheme's TradeLicenseSubmission.constructLicenseParams sends to NewTL/_create.
export const buildNewTLPayload = (params, { stateTenant, roles = [], action = "INITIATE", applicationType = "NEW" } = {}) => {
  const reg = params.registrationDetails || {};
  const trade = params.tradeDetails || {};
  const spec = params.tradeSpecifications || {};
  const loc = params.tradeLocationDetails || {};
  const owner = params.tradeOwnerDetails || {};
  const applicant = params.applicantDetails || {};
  const ulbTenant = `${stateTenant}.${loc.ulbName}`;

  return {
    Licenses: [
      {
        action,
        applicationType,
        financialYear: currentFinancialYearLabel(),
        licenseType: "PERMANENT",
        tenantId: ulbTenant,
        businessService: "NewTL",
        workflowCode: "NewTL",
        propertyId: loc.propertyId || undefined,
        tradeName: trade.businessName,
        tradeLicenseDetail: {
          channel: "CITIZEN",
          address: {
            pincode: loc.propertyPinCode,
            addressLine1: loc.propertyAddress,
            tenantId: ulbTenant,
            additionalDetail: {
              district: loc.districtName,
              ulbName: loc.ulbName,
              ulbType: loc.ulbType,
              wardName: loc.wardNumber,
              zone: loc.zone,
            },
          },
          applicationDocuments: null,
          owners: [
            {
              mobileNumber: owner.tradeOwnerMobileNumber,
              name: owner.tradeOwnerName,
              fatherOrHusbandName: owner.tradeOwnerFatherName,
              gender: owner.tradeOwnerGender,
              emailId: owner.tradeOwnerEmailAddress || undefined,
              roles,
              tenantId: stateTenant,
              userActive: true,
            },
          ],
          tradeUnits: [{ tradeType: trade.tradeIndustryType, active: true }],
          additionalDetail: {
            tradeSubType: spec.licenseSubCategory,
            tradeCategory: spec.licenseCategory,
            licenseTrade: spec.licenseTrade,
            scaleOfBusiness: trade.scaleOfBusiness,
            periodOfLicense: Number(spec.licensePeriod),
            InfrastructureOwnershipType: trade.infraStrOwnType,
            propertyOwner: loc.propertyOwnerName,
            businessDetails: trade.businessDetails,
            labourLicenseNumber: reg.registrationLicenseNumber,
            labourRegistrationCommencementDate: reg.registrationCommencementDate,
            labourRegistrationValidityDate: reg.registrationValidityDate,
            gstNumber: trade.gstNumber,
            mapApproved: trade.mapApproved,
            propertyType: trade.propertyType,
            tradeOwnerMobileNumber: owner.tradeOwnerMobileNumber,
            tradeOwnerName: owner.tradeOwnerName,
            tradeOwnerFatherName: owner.tradeOwnerFatherName,
            tradeOwnerEmailAddress: owner.tradeOwnerEmailAddress,
            applicantName: applicant.applicantName,
            applicantMobileNumber: applicant.applicantMobileNumber,
            applicantEmail: applicant.applicantEmailAddress,
            oldObjectId: "",
          },
        },
      },
    ],
  };
};

// Second call: moves the freshly created (INITIATED) licence into the workflow.
// tl-services refuses APPLY while tradeLicenseDetail.applicationDocuments is null, so the documents
// that went to DMS are recorded on the licence (type + DMS document id + DMS file id; the files themselves live in DMS).
export const buildSubmitPayload = (created, action = "FORWARD_TO_VERIFIER", docs = []) => ({
  Licenses: [
    {
      ...created,
      action,
      comment: "",
      tradeLicenseDetail: {
        ...(created.tradeLicenseDetail || {}),
        // tl-services rejects two documents with the same fileStoreId, so each carries its own DMS file id
        applicationDocuments: docs.map((d) => ({
          documentType: String(d.documentName || d.id).slice(0, 64),
          documentUid: String(d.id),
          fileStoreId: String((d.attachment && d.attachment.url) || `dms-${d.id}`).slice(0, 64),
          tenantId: created.tenantId,
          active: true,
        })),
      },
    },
  ],
});

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

// What the Property step keeps (and the licence payload reads) once a property is chosen.
export const propertyToSelection = (p) => {
  const a = p?.address || {};
  const extra = a.additionalDetails || {};
  return {
    // the licence is filed with the property's own ULB (tenant "hp.<ulb>")
    districtName: a.district || "",
    ulbName: (p.tenantId || "").split(".")[1] || extra.ulbName || "",
    ulbType: extra.ulbType || "",
    propertyId: p.propertyId,
    propertyOwnerName: (p.owners || []).filter((o) => o.status !== "INACTIVE").map((o) => o.name).filter(Boolean).join(", "),
    propertyAddress: propertyAddressOf(p),
    wardNumber: extra.wardNumber || "",
    zone: extra.zone || "",
    propertyPinCode: a.pincode || "",
    propertyStatus: p.status || "",
  };
};

export const stepIndex = (route) => NEW_TL_STEPS.findIndex((s) => s.route === route);
