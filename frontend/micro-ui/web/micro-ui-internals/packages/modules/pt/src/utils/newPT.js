import { NEW_PT_STEPS, NPT_PATTERNS } from "../config/newPTConfig";

export const NPT_SESSION_KEY = "PT_NEW_REGISTRATION";

const isEmpty = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

// A field is hidden when its showIf sibling does not match.
export const isVisible = (field, values) => !field.showIf || values?.[field.showIf.field] === field.showIf.equals;

export const stepsFor = (params) => NEW_PT_STEPS.filter((s) => !s.when || s.when(params));

export const blankItem = (itemFields) => itemFields.reduce((o, f) => ({ ...o, [f.name]: f.default === undefined ? "" : f.default }), {});

export const initialValuesForStep = (step, saved = {}) => {
  const base = {};
  if (step.key === "specificationDetails") base.isBilling = true;
  step.fields.forEach((f) => {
    if (f.type === "repeater") base[f.name] = [blankItem(f.item)];
  });
  return { ...base, ...saved };
};

const checkField = (f, v, label) => {
  if (f.required && isEmpty(v)) return "NPT_E_REQUIRED";
  if (isEmpty(v)) return undefined;
  if (f.pattern && !NPT_PATTERNS[f.pattern].re.test(String(v).trim())) return NPT_PATTERNS[f.pattern].error;
  if (f.type === "number" && !(Number(v) > 0)) return "NPT_E_NUMBER";
  return undefined;
};

// Returns { fieldName: i18nErrorKey | [ {itemField: key}, ... ] } — empty when the step is valid.
export const validateStep = (step, values) => {
  const errors = {};
  step.fields.forEach((f) => {
    if (f.type === "readonly" || !isVisible(f, values)) return;
    if (f.type === "repeater") {
      const rows = (values[f.name] || []).map((row) => {
        const e = {};
        f.item.forEach((it) => {
          if (!isVisible(it, row)) return;
          const k = checkField(it, row?.[it.name]);
          if (k) e[it.name] = k;
        });
        return e;
      });
      if (rows.some((r) => Object.keys(r).length)) errors[f.name] = rows;
      return;
    }
    const k = checkField(f, values[f.name]);
    if (k) errors[f.name] = k;
  });
  return errors;
};

export const getUserType = () => (Digit.UserService.getUser()?.info?.type === "EMPLOYEE" ? "EMPLOYEE" : "CITIZEN");

// Same body OldTheme's PropertyRegistration.handleNextClick sends to property-services/property/_create.
export const buildNewPTPayload = (params, { stateTenant }) => {
  const loc = params.locationDetails || {};
  const spec = params.specificationDetails || {};
  const owner = params.ownerDetails || {};
  const hasCo = owner.anyOtherCoWorker === "Yes";
  const coOwners = hasCo
    ? (owner.coOwners || []).map((c) => {
        const same = c.addressSameAsOwner === "Yes";
        return {
          coOwnerName: (c.coOwnerName || "").trim(),
          coOwnerMobile: c.coOwnerMobile,
          coOwnerEmail: c.coOwnerEmail || "",
          addressSameAsOwner: same,
          coOwnerAddress: (same ? owner.ownerAddress : c.coOwnerAddress) || "",
          coOwnerPinCode: (same ? owner.ownerPinCode : c.coOwnerPinCode) || "",
          relationWithCoOwner: c.relationWithCoOwner,
        };
      })
    : [];
  const first = coOwners[0] || {};
  const ulbTenant = `${stateTenant}.${loc.ulbName}`;
  const [lat, lng] = (loc.gpsLocation || "").split(",").map((x) => x.trim());
  const isBilling = spec.isBilling !== "No" && spec.isBilling !== false;
  const isBuilt = spec.propertyType === "BUILTUP";

  const units = isBuilt
    ? (spec.units || []).map((u) => ({
        additionalDetails: {
          propArea: u.propArea,
          propBuildingType: u.propBuildingType,
          propType: u.propType,
          propYearOfCons: u.propYearOfCons,
          useOfBuilding: u.useOfBuilding,
        },
        constructionDetail: { plinthArea: Number(u.propArea) || 0, superBuiltUpArea: Number(u.propArea) || 0 },
        usageCategory: "NONRESIDENTIAL.COMMERCIAL",
        floorNo: u.floorNo,
        occupancyType: "SELFOCCUPIED",
      }))
    : [
        {
          additionalDetails: { propArea: spec.propArea },
          // the PT API requires a construction detail on every unit, even for vacant land
          constructionDetail: { plinthArea: Number(spec.propArea) || 0, superBuiltUpArea: Number(spec.propArea) || 0 },
          usageCategory: "NONRESIDENTIAL.COMMERCIAL",
          occupancyType: "SELFOCCUPIED",
        },
      ];

  return {
    Property: {
      isBilling,
      oldPropertyId: loc.oldPropertyId || undefined,
      tenantId: ulbTenant,
      propertyType: spec.propertyType,
      ownershipCategory: "INDIVIDUAL",
      creationReason: "CREATE",
      usageCategory: "NONRESIDENTIAL.COMMERCIAL",
      noOfFloors: 2,
      landArea: 1000.0,
      source: "MUNICIPAL_RECORDS",
      channel: "SYSTEM",
      owners: [
        {
          name: (owner.ownerName || "").trim(),
          mobileNumber: owner.ownerMobileNumber,
          ownerType: "FREEDOMFIGHTER",
          additionalDetails: {
            emailId: owner.ownerEmail,
            gender: owner.ownerGender,
            fatherOrHusbandName: (owner.ownerFatherName || "").trim(),
            correspondenceAddress: owner.ownerAddress,
            anyOtherCoWorker: owner.anyOtherCoWorker,
            ownerPinCode: owner.ownerPinCode,
            ownerOldCustomerId: owner.oldCustomerId,
            // the first co-owner keeps the legacy single-owner keys; the full list is in coOwners
            coOwnerName: first.coOwnerName || "",
            coOwnerMobile: first.coOwnerMobile || "",
            coOwnerEmail: first.coOwnerEmail || "",
            addressSameAsOwner: !!first.addressSameAsOwner,
            coOwnerAddress: first.coOwnerAddress || "",
            coOwnerPinCode: first.coOwnerPinCode || "",
            relationWithCoOwner: first.relationWithCoOwner || "",
            coOwners,
          },
        },
      ],
      units,
      address: {
        district: loc.districtName,
        pincode: loc.propertyPinCode,
        locality: { code: "JLC476", latitude: lat, longitude: lng },
        geoLocation: { latitude: lat, longitude: lng },
        additionalDetails: {
          propertyAddress: loc.propertyAddress,
          ulbName: loc.ulbName,
          ulbType: loc.ulbType,
          wardNumber: loc.wardNumber,
          zone: loc.zone,
        },
      },
      additionalDetails: {
        propertyId: loc.oldPropertyId,
        multipleKhasra: loc.multipleKhasra,
        mapRefNumber: isBuilt ? spec.mapRefNo : undefined,
        isBilling,
      },
    },
  };
};

// Second call: moves the freshly created (INITIATED) property into the workflow.
export const buildSubmitPayload = (created, userType) => ({
  Property: {
    ...created,
    workflow: {
      businessService: userType === "EMPLOYEE" ? "PROPERTY_EMPLOYEE" : "PROPERTY_CITIZEN",
      action: userType === "EMPLOYEE" ? "VERIFY" : "FORWARD_TO_VERIFIER",
      tenantId: created.tenantId,
      comment: "",
      moduleName: "PROPERTY",
    },
  },
});

export const apiErrorMessage = (err, fallback) => {
  const e = err?.response?.data?.Errors?.[0] || err?.Errors?.[0] || err?.data?.Errors?.[0];
  const raw = e?.message || e?.description || err?.message;
  // bare transport errors ("Request failed with status code 500") are not actionable for citizens
  return !raw || /^Request failed with status code|^Network Error/i.test(raw) ? fallback : raw;
};
