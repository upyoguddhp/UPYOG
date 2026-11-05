import { call, humanise, fmtDate } from "../utils/work";

const normalise = (a) => ({
  id: a.applicationNumber,
  tenantId: a.tenantId,
  title: [(a.petDetails || {}).petName, (a.petDetails || {}).petType].filter(Boolean).join(" · ") || a.applicationNumber,
  applicant: [a.applicantName, a.mobileNumber].filter(Boolean).join(" · "),
  status: a.status,
  appliedOn: (a.auditDetails || {}).createdTime,
  kind: a.applicationType,
});

const criteria = (q = "") => {
  const v = String(q).trim();
  if (!v) return {};
  return /^\d{10}$/.test(v) ? { mobileNumber: v } : { applicationNumber: v };
};

const PET = {
  code: "pet",
  labelKey: "WRK_SVC_PET",
  icon: "paw",
  businessService: "pet-services",
  dmsService: "PTR",

  // the pet service ignores a status filter and has no total, so fetch the ULB's applications and filter and page here
  async search({ tenantId, statuses, q, limit, offset }) {
    const res = await call(`/pet-services/pet-registration/_search`, {}, { tenantId, limit: 2000, offset: 0, ...criteria(q) });
    let rows = (res.PetRegistrationApplications || []).map(normalise);
    if (statuses && statuses.length) rows = rows.filter((r) => statuses.indexOf(r.status) >= 0);
    rows.sort((x, y) => (y.appliedOn || 0) - (x.appliedOn || 0));
    return { rows: rows.slice(offset, offset + limit), total: rows.length };
  },

  async fetch(id, tenantId) {
    const res = await call(`/pet-services/pet-registration/_search`, {}, { tenantId, applicationNumber: id });
    const rows = (res.PetRegistrationApplications || []).filter((a) => a.applicationNumber === id);
    return rows.sort((a, b) => ((b.auditDetails || {}).createdTime || 0) - ((a.auditDetails || {}).createdTime || 0))[0] || null;
  },

  summary(a) {
    const p = a.petDetails || {};
    const x = a.additionalDetail || {};
    const addr = a.address || {};
    return {
      id: a.applicationNumber,
      title: p.petName || a.applicationNumber,
      status: a.status,
      sections: [
        {
          head: "WRK_SEC_APPLICATION",
          rows: [
            ["WRK_F_appNo", a.applicationNumber],
            ["WRK_F_type", humanise(a.applicationType)],
            ["WRK_F_appliedOn", fmtDate((a.auditDetails || {}).createdTime)],
            ["WRK_F_ulb", humanise(String(a.tenantId).split(".").slice(1).join(" "))],
          ],
        },
        {
          head: "WRK_SEC_PET",
          rows: [
            ["WRK_F_petName", p.petName],
            ["WRK_F_petType", p.petType],
            ["WRK_F_breed", p.breedType],
            ["WRK_F_age", p.petAge],
            ["WRK_F_gender", p.petGender],
            ["WRK_F_vaccinated", x.vaccinationStatus],
            ["WRK_F_vaccinationNo", p.vaccinationNumber],
            ["WRK_F_lastVaccine", p.lastVaccineDate ? fmtDate(p.lastVaccineDate) : ""],
            ["WRK_F_clinic", p.clinicName],
            ["WRK_F_doctor", p.doctorName],
            ["WRK_F_sterilised", x.petStrelization],
            ["WRK_F_source", x.petPurchaseSource],
          ],
        },
        {
          head: "WRK_SEC_OWNER",
          rows: [
            ["WRK_F_name", a.applicantName],
            ["WRK_F_father", a.fatherName],
            ["WRK_F_mobile", a.mobileNumber],
            ["WRK_F_email", a.emailId],
          ],
        },
        {
          head: "WRK_SEC_LOCATION",
          rows: [
            ["WRK_F_address", [addr.addressLine1, addr.street].filter(Boolean).join(", ")],
            ["WRK_F_district", x.districtName],
            ["WRK_F_ward", x.wardNumber],
            ["WRK_F_pincode", addr.pincode],
          ],
        },
      ],
    };
  },

  buildUpdate(a, action, { comment, assignees }) {
    return {
      url: `/pet-services/pet-registration/_update`,
      data: {
        PetRegistrationApplications: [
          { ...a, workflow: { businessService: "pet-services", moduleName: "pet-services", action, comments: comment || "", assignes: assignees && assignees.length ? assignees : undefined } },
        ],
      },
    };
  },
};

export default PET;
