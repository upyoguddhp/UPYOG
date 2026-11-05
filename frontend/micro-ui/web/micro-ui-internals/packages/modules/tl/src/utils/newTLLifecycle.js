import { currentFinancialYearLabel } from "./newTL";

const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const created = (l) => (l && l.auditDetails && l.auditDetails.createdTime) || 0;

// Newest row of an application (renewals add a new row under the same application number).
export const latestRow = (rows = [], applicationNumber) =>
  rows.filter((l) => !applicationNumber || l.applicationNumber === applicationNumber).sort((a, b) => created(b) - created(a))[0];

// Which lifecycle actions the citizen may take on `row` (must be the newest row of its application).
// [{ mode: "renew"|"modify"|"close", resume: bool }]
export const lifecycleActions = (row, rows = []) => {
  if (!row || row !== latestRow(rows, row.applicationNumber)) return [];
  if (row.status === "APPROVED" && row.applicationType !== "CLOSURE") {
    return [{ mode: "renew" }, { mode: "modify" }, { mode: "close" }];
  }
  if (row.status === "PENDINGFORMODIFICATION" && row.applicationType === "RENEWAL") return [{ mode: "renew", resume: true }];
  if (row.status === "INITIATED" && row.applicationType === "RENEWAL") return [{ mode: "renew", resume: true }];
  if (row.status === "PENDINGFORMODIFICATION" && row.applicationType === "MODIFICATION") return [{ mode: "modify", resume: true }];
  return [];
};

export const lifecycleLink = (root, mode, row) =>
  `${root}/${mode}/${encodeURIComponent(row.applicationNumber)}/start?tenantId=${encodeURIComponent(row.tenantId)}&id=${encodeURIComponent(row.id)}`;

// Licence record -> the same value sets the registration form keeps in session (inverse of buildNewTLPayload).
export const licenceToParams = (lic) => {
  const d = lic.tradeLicenseDetail || {};
  const a = d.additionalDetail || {};
  const addr = d.address || {};
  const ex = addr.additionalDetail || {};
  const o = (d.owners || [])[0] || {};
  const unit = (d.tradeUnits || [])[0] || {};
  return {
    tradeLocationDetails: {
      propertyId: lic.propertyId || "",
      propertyOwnerName: a.propertyOwner || "",
      propertyAddress: addr.addressLine1 || "",
      districtName: ex.district || "",
      ulbName: ex.ulbName || "",
      ulbType: ex.ulbType || "",
      wardNumber: ex.wardName || "",
      zone: ex.zone || "",
      propertyPinCode: addr.pincode || "",
    },
    registrationDetails: {
      registrationLicenseNumber: a.labourLicenseNumber || "",
      registrationCommencementDate: a.labourRegistrationCommencementDate || "",
      registrationValidityDate: a.labourRegistrationValidityDate || "",
    },
    tradeDetails: {
      businessName: lic.tradeName || "",
      scaleOfBusiness: a.scaleOfBusiness || "",
      gstNumber: a.gstNumber || "",
      businessDetails: a.businessDetails || "",
      tradeIndustryType: unit.tradeType || "",
      mapApproved: a.mapApproved || "",
      propertyType: a.propertyType || "",
      infraStrOwnType: a.InfrastructureOwnershipType || "",
    },
    tradeSpecifications: {
      licenseCategory: a.tradeCategory || "",
      licenseTrade: list(a.licenseTrade),
      licenseSubCategory: list(a.tradeSubType),
      licensePeriod: a.periodOfLicense ? String(a.periodOfLicense) : "",
    },
    tradeOwnerDetails: {
      tradeOwnerName: a.tradeOwnerName || o.name || "",
      tradeOwnerFatherName: a.tradeOwnerFatherName || o.fatherOrHusbandName || "",
      tradeOwnerGender: o.gender || "",
      tradeOwnerMobileNumber: a.tradeOwnerMobileNumber || o.mobileNumber || "",
      tradeOwnerEmailAddress: a.tradeOwnerEmailAddress || o.emailId || "",
    },
    applicantDetails: {
      applicantName: a.applicantName || "",
      applicantMobileNumber: a.applicantMobileNumber || "",
      applicantEmailAddress: a.applicantEmail || "",
    },
  };
};

// Body of POST /tl-services/v1/NewTL/_renewal (same as OldTheme's tradeRenewalInitiate).
export const buildRenewalInitiatePayload = (row) => {
  const d = row.tradeLicenseDetail || {};
  const a = d.additionalDetail || {};
  const ex = (d.address && d.address.additionalDetail) || {};
  return {
    Licenses: [
      {
        tenantId: row.tenantId,
        applicationType: "RENEWAL",
        licenseNumber: row.licenseNumber || ex.licenseNumber || row.applicationNumber,
        applicationNumber: row.applicationNumber,
        businessService: "NewTL",
        comment: "Applying for renewal",
        tradeLicenseDetail: {
          financialYear: currentFinancialYearLabel(),
          address: { tenantId: row.tenantId, doorNo: "NA", street: "NA", locality: { code: ex.ulbName } },
          additionalDetail: {
            oldObjectId: a.oldObjectId || row.id,
            periodOfLicense: a.periodOfLicense,
            mapApproved: a.mapApproved,
          },
        },
        workflow: { action: "PENDING_FOR_MODIFICATION", comment: "Renewal initiated" },
      },
    ],
  };
};

// The licence with the citizen's edits applied, ready for _update (OldTheme constructLicenseParams, plus the stored ids).
export const buildLifecyclePayload = (lic, params, { action, type, comment = "" }) => {
  const reg = params.registrationDetails || {};
  const trade = params.tradeDetails || {};
  const spec = params.tradeSpecifications || {};
  const owner = params.tradeOwnerDetails || {};
  const applicant = params.applicantDetails || {};
  const d = lic.tradeLicenseDetail || {};
  const a = d.additionalDetail || {};
  const o = (d.owners || [])[0] || {};
  const unit = (d.tradeUnits || [])[0] || {};
  const addr = d.address || {};
  return {
    Licenses: [
      {
        id: lic.id,
        applicationNumber: lic.applicationNumber,
        licenseNumber: lic.licenseNumber,
        status: lic.status,
        action,
        comment,
        applicationType: type,
        financialYear: lic.financialYear || currentFinancialYearLabel(),
        licenseType: lic.licenseType || "PERMANENT",
        tenantId: lic.tenantId,
        businessService: "NewTL",
        workflowCode: "NewTL",
        propertyId: lic.propertyId,
        tradeName: trade.businessName || lic.tradeName,
        tradeLicenseDetail: {
          id: d.id,
          channel: d.channel || "CITIZEN",
          address: { id: addr.id, pincode: addr.pincode, addressLine1: addr.addressLine1, additionalDetail: addr.additionalDetail, tenantId: addr.tenantId || lic.tenantId },
          applicationDocuments: d.applicationDocuments || null,
          owners: [
            {
              uuid: o.uuid,
              mobileNumber: owner.tradeOwnerMobileNumber || o.mobileNumber,
              name: owner.tradeOwnerName || o.name,
              fatherOrHusbandName: owner.tradeOwnerFatherName || o.fatherOrHusbandName,
              gender: owner.tradeOwnerGender || o.gender,
              emailId: owner.tradeOwnerEmailAddress || o.emailId || undefined,
              roles: o.roles,
              tenantId: o.tenantId,
              userActive: true,
            },
          ],
          tradeUnits: [{ id: unit.id, tradeType: trade.tradeIndustryType || unit.tradeType, active: true }],
          additionalDetail: {
            ...a,
            licenseNumber: lic.licenseNumber || a.licenseNumber,
            tradeSubType: spec.licenseSubCategory,
            tradeCategory: spec.licenseCategory,
            licenseTrade: spec.licenseTrade,
            scaleOfBusiness: trade.scaleOfBusiness,
            periodOfLicense: Number(spec.licensePeriod),
            InfrastructureOwnershipType: trade.infraStrOwnType,
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
            applicantName: applicant.applicantName || a.applicantName,
            applicantMobileNumber: applicant.applicantMobileNumber || a.applicantMobileNumber,
            applicantEmail: applicant.applicantEmailAddress || a.applicantEmail,
            oldObjectId: a.oldObjectId || "",
          },
        },
      },
    ],
  };
};

// Closure sends the stored licence as it is; only the action, type and the citizen's reason change.
export const buildClosurePayload = (lic, comment = "") => ({
  Licenses: [{ ...lic, action: "FORWARD_TO_VERIFIER", applicationType: "CLOSURE", comment }],
});
