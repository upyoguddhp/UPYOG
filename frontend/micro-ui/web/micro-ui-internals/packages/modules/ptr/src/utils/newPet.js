import { NEW_PET_STEPS, NPR_PATTERNS } from "../config/newPetConfig";

export const NPR_SESSION_KEY = "PTR_NEW_REGISTRATION";

const isEmpty = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

const todayIso = () => new Date().toISOString().slice(0, 10);

// whether a conditional (showIf) field is visible for the current values
export const isFieldVisible = (field, values) => !field.showIf || values[field.showIf.field] === field.showIf.equals;

// Values that come from the signed-in citizen rather than being typed.
export const getUserDefaults = () => {
  const info = Digit.UserService.getUser()?.info || {};
  return {
    ownerDetails: { applicantName: info.name || "", mobileNumber: info.mobileNumber || "", emailId: info.emailId || "" },
  };
};

export const initialValuesForStep = (step, saved = {}) => {
  const defaults = getUserDefaults()[step.key] || {};
  // account details only fill gaps; whatever the citizen typed wins
  const merged = { ...defaults };
  Object.keys(saved || {}).forEach((k) => {
    if (!isEmpty(saved[k]) || isEmpty(defaults[k])) merged[k] = saved[k];
  });
  return merged;
};

// Returns { fieldName: i18nErrorKey } — empty when the step is valid.
export const validateStep = (step, values) => {
  const errors = {};
  step.fields.forEach((f) => {
    if (f.type === "readonly" || !isFieldVisible(f, values)) return;
    const v = values[f.name];
    if (f.required && isEmpty(v)) {
      errors[f.name] = "NPR_E_REQUIRED";
      return;
    }
    if (isEmpty(v)) return;
    if (f.pattern && !NPR_PATTERNS[f.pattern].re.test(String(v).trim())) {
      errors[f.name] = NPR_PATTERNS[f.pattern].error;
    }
    if (f.maxToday && String(v) > todayIso()) errors[f.name] = "NPR_E_DATE_FUTURE";
  });
  return errors;
};

// Same body shape OldTheme's pet registration sends to pet-registration/_create.
export const buildNewPetPayload = (params, { stateTenant, action = "INITIATE" } = {}) => {
  const pet = params.petDetails || {};
  const vac = params.vaccination || {};
  const owner = params.ownerDetails || {};
  const addr = params.propertyDetails || {};
  const ulbTenant = `${stateTenant}.${addr.ulbName}`;
  const vaccinated = vac.vaccinationStatus === "Yes";

  return {
    PetRegistrationApplications: [
      {
        tenantId: ulbTenant,
        applicationType: "NEW",
        applicantName: owner.applicantName,
        fatherName: owner.fatherName,
        mobileNumber: owner.mobileNumber,
        emailId: owner.emailId || undefined,
        aadharNumber: owner.aadharNumber || undefined,
        isBannedPet: !!pet._isBanned,
        address: {
          tenantId: ulbTenant,
          addressLine1: addr.propertyAddress,
          pincode: addr.propertyPinCode || undefined,
          city: addr.ulbName,
          type: "PERMANENT",
        },
        petDetails: {
          petName: pet.petName,
          petType: pet.petType,
          breedType: pet.breedType,
          petAge: String(pet.petAge),
          petGender: pet.petGender,
          vaccinationNumber: vaccinated ? vac.vaccinationNumber : undefined,
          lastVaccineDate: vaccinated ? vac.lastVaccineDate : undefined,
          clinicName: vaccinated ? vac.clinicName : undefined,
          doctorName: vaccinated ? vac.doctorName : undefined,
        },
        additionalDetail: {
          ulbName: addr.ulbName,
          ulbType: addr.ulbType || "",
          propertyId: addr.propertyId,
          districtName: addr.districtName,
          wardNumber: addr.wardNumber,
          petOwnerGender: owner.petOwnerGender,
          petColour: pet.petColour || "",
          petStrelization: pet.petStrelization,
          petPurchaseSource: pet.petPurchaseSource,
          petPurchaseSourceDetail: pet.petPurchaseSourceDetail || "",
          vaccinationStatus: vac.vaccinationStatus,
          doctorRegistrationNumber: vaccinated ? vac.doctorRegistrationNumber || "" : "",
          applicantName: owner.applicantName,
          applicantMobileNumber: owner.mobileNumber,
          applicantEmailAddress: owner.emailId || "",
          oldObjectId: "",
        },
        workflow: { businessService: "pet-services", moduleName: "pet-services", action },
      },
    ],
  };
};

// Second call: moves the freshly created (INITIATED) application to the ULB verifier.
export const buildSubmitPayload = (created, action = "FORWARD_TO_VERIFIER") => ({
  PetRegistrationApplications: [{ ...created, workflow: { businessService: "pet-services", moduleName: "pet-services", action, comments: "" } }],
});

// Pulls the most useful message out of a failed API response/exception.
export const apiErrorMessage = (err, fallback) => {
  const e = err?.response?.data?.Errors?.[0] || err?.Errors?.[0] || err?.data?.Errors?.[0];
  // pet-services also answers { errorMessage, errorDetails: [reason] } for custom exceptions
  const body = err?.response?.data || err?.data || {};
  const detail = Array.isArray(body.errorDetails) && body.errorDetails[0];
  const raw = e?.message || e?.description || detail || err?.message;
  // bare transport errors ("Request failed with status code 500") are not actionable for citizens
  return !raw || /^Request failed with status code|^Network Error/i.test(raw) ? fallback : raw;
};

export const stepIndex = (route) => NEW_PET_STEPS.findIndex((s) => s.route === route);

// One-line address of a property-services record.
export const propertyAddressOf = (p) => {
  const a = p?.address || {};
  const extra = a.additionalDetails || {};
  return extra.propertyAddress || [a.doorNo, a.buildingName, a.street, a.locality?.name, a.city].filter(Boolean).join(", ");
};

// What the Property step keeps (and the pet payload reads) once a property is chosen.
export const propertyToSelection = (p) => {
  const a = p?.address || {};
  const extra = a.additionalDetails || {};
  return {
    // the application is filed with the property's own ULB (tenant "hp.<ulb>")
    districtName: a.district || "",
    ulbName: (p.tenantId || "").split(".")[1] || extra.ulbName || "",
    ulbType: extra.ulbType || "",
    propertyId: p.propertyId,
    propertyOwnerName: (p.owners || []).filter((o) => o.status !== "INACTIVE").map((o) => o.name).filter(Boolean).join(", "),
    propertyAddress: propertyAddressOf(p),
    wardNumber: extra.wardNumber || "",
    propertyPinCode: a.pincode || "",
    propertyStatus: p.status || "",
  };
};

// ---- renewal (OldTheme: petRenewalInitiate / PetRenewal) ----

// Rows of one registration share its applicationNumber (a renewal adds a newer row); search returns newest first.
export const newestRowOf = (rows = [], applicationNumber) =>
  [...rows].filter((r) => r.applicationNumber === applicationNumber).sort((a, b) => ((b.auditDetails || {}).createdTime || 0) - ((a.auditDetails || {}).createdTime || 0))[0];

// Only the newest row of a registration, and only when APPROVED, can be renewed (pet-services enforces the same).
export const canRenew = (row, rows) => !!row && row.status === "APPROVED" && newestRowOf(rows, row.applicationNumber) === row;

// Body of pet-registration/_renewal: a copy of the approved record; pet-services creates the new row (state PENDINGFORMODIFICATION).
export const buildRenewalInitPayload = (rec) => {
  const ad = rec.additionalDetail || {};
  const pd = rec.petDetails || {};
  return {
    PetRegistrationApplications: [
      {
        tenantId: (rec.address || {}).tenantId || rec.tenantId,
        applicationType: "RENEWAL",
        applicationNumber: rec.applicationNumber,
        status: "INITIATED",
        address: { tenantId: (rec.address || {}).tenantId || rec.tenantId, type: "PERMANENT", pincode: (rec.address || {}).pincode, addressLine1: (rec.address || {}).addressLine1 },
        petDetails: {
          petType: pd.petType,
          breedType: pd.breedType,
          petGender: pd.petGender,
          petName: pd.petName,
          petAge: pd.petAge,
          doctorName: pd.doctorName,
          lastVaccineDate: pd.lastVaccineDate,
          vaccinationNumber: pd.vaccinationNumber,
        },
        additionalDetail: {
          applicationType: "RENEWAL",
          comment: "Applying for renewal",
          applicantName: rec.applicantName,
          fatherName: rec.fatherName,
          emailId: rec.emailId,
          mobileNumber: rec.mobileNumber,
          ulbType: ad.ulbType,
          districtName: ad.districtName,
          petOwnerGender: ad.petOwnerGender,
          ulbName: ad.ulbName,
          wardNumber: ad.wardNumber,
          propertyId: ad.propertyId,
          vaccinationStatus: ad.vaccinationStatus,
          petPurchaseSource: ad.petPurchaseSource,
          petPurchaseSourceDetail: ad.petPurchaseSourceDetail,
          petStrelization: ad.petStrelization,
          petColour: ad.petColour,
          oldObjectId: ad.oldObjectId || rec.id,
        },
        workflow: { businessService: "pet-services", moduleName: "pet-services", action: "PENDING_FOR_MODIFICATION", status: "INITIATE", comment: "Applying for renewal" },
      },
    ],
  };
};

// Renewal row + the fields the citizen may change, moved to the ULB verifier in one _update.
export const buildRenewalSubmitPayload = (rec, v = {}) => {
  const vaccinated = v.vaccinationStatus === "Yes";
  return {
    PetRegistrationApplications: [
      {
        ...rec,
        petDetails: {
          ...rec.petDetails,
          petAge: String(v.petAge),
          vaccinationNumber: vaccinated ? v.vaccinationNumber : undefined,
          lastVaccineDate: vaccinated ? v.lastVaccineDate : undefined,
          clinicName: vaccinated ? v.clinicName : undefined,
          doctorName: vaccinated ? v.doctorName : undefined,
        },
        additionalDetail: { ...rec.additionalDetail, vaccinationStatus: v.vaccinationStatus, doctorRegistrationNumber: vaccinated ? v.doctorRegistrationNumber || "" : "" },
        workflow: { businessService: "pet-services", moduleName: "pet-services", action: "FORWARD_TO_VERIFIER", comments: "" },
      },
    ],
  };
};
