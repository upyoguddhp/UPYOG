import { call, humanise, valueText, fmtDate } from "../utils/work";

const latest = (rows, no) => {
  const same = (rows || []).filter((l) => l.applicationNumber === no);
  return same.sort((a, b) => ((b.auditDetails || {}).createdTime || 0) - ((a.auditDetails || {}).createdTime || 0))[0] || null;
};

const normalise = (l) => {
  const d = l.tradeLicenseDetail || {};
  const owner = (d.owners || [])[0] || {};
  return {
    id: l.applicationNumber,
    tenantId: l.tenantId,
    title: l.tradeName,
    applicant: [owner.name, owner.mobileNumber].filter(Boolean).join(" · "),
    status: l.status,
    appliedOn: l.applicationDate || (l.auditDetails || {}).createdTime,
    kind: l.applicationType,
  };
};

// q: 10 digits = mobile number, text with "/" = application number, anything else = trade name
const criteria = (q = "") => {
  const v = String(q).trim();
  if (!v) return {};
  if (/^\d{10}$/.test(v)) return { mobileNumber: v };
  if (v.indexOf("/") >= 0) return { applicationNumber: v };
  return { tradeName: v };
};

const TL = {
  code: "tl",
  labelKey: "WRK_SVC_TL",
  icon: "briefcase",
  businessService: "NewTL",
  dmsService: "NewTL",

  async search({ tenantId, statuses, q, limit, offset }) {
    const res = await call(`/tl-services/v1/NewTL/_search`, {}, {
      tenantId,
      limit,
      offset,
      ...(statuses && statuses.length ? { status: statuses.join(",") } : {}),
      ...criteria(q),
    });
    const rows = (res.Licenses || []).map(normalise);
    return { rows, total: typeof res.Count === "number" ? res.Count : rows.length };
  },

  async fetch(id, tenantId) {
    const res = await call(`/tl-services/v1/NewTL/_search`, {}, { tenantId, applicationNumber: id });
    return latest(res.Licenses, id);
  },

  summary(l) {
    const d = l.tradeLicenseDetail || {};
    const a = d.additionalDetail || {};
    const addr = d.address || {};
    const ex = addr.additionalDetail || {};
    const owner = (d.owners || [])[0] || {};
    return {
      id: l.applicationNumber,
      title: l.tradeName,
      status: l.status,
      sections: [
        {
          head: "WRK_SEC_APPLICATION",
          rows: [
            ["WRK_F_appNo", l.applicationNumber],
            ["WRK_F_type", humanise(l.applicationType)],
            ["WRK_F_appliedOn", fmtDate(l.applicationDate || (l.auditDetails || {}).createdTime)],
            ["WRK_F_fy", l.financialYear],
            ["WRK_F_validity", l.validFrom ? `${fmtDate(l.validFrom)} – ${fmtDate(l.validTo)}` : ""],
            ["WRK_F_ulb", humanise(String(l.tenantId).split(".").slice(1).join(" "))],
          ],
        },
        {
          head: "WRK_SEC_TRADE",
          rows: [
            ["WRK_F_businessName", l.tradeName],
            ["WRK_F_scale", a.scaleOfBusiness],
            ["WRK_F_gst", a.gstNumber],
            ["WRK_F_businessDetails", a.businessDetails],
            ["WRK_F_category", a.tradeCategory],
            ["WRK_F_trade", valueText(a.licenseTrade)],
            ["WRK_F_subCategory", valueText(a.tradeSubType)],
            ["WRK_F_period", a.periodOfLicense ? `${a.periodOfLicense}` : ""],
            ["WRK_F_propertyType", a.propertyType],
            ["WRK_F_ownership", a.InfrastructureOwnershipType],
          ],
        },
        {
          head: "WRK_SEC_LOCATION",
          rows: [
            ["WRK_F_propertyId", l.propertyId],
            ["WRK_F_address", addr.addressLine1],
            ["WRK_F_district", ex.district],
            ["WRK_F_ward", ex.wardName],
            ["WRK_F_pincode", addr.pincode],
          ],
        },
        {
          head: "WRK_SEC_OWNER",
          rows: [
            ["WRK_F_name", a.tradeOwnerName || owner.name],
            ["WRK_F_father", a.tradeOwnerFatherName || owner.fatherOrHusbandName],
            ["WRK_F_gender", owner.gender],
            ["WRK_F_mobile", a.tradeOwnerMobileNumber || owner.mobileNumber],
            ["WRK_F_email", a.tradeOwnerEmailAddress || owner.emailId],
          ],
        },
      ],
    };
  },

  // workflow action on the whole licence record (tl-services reads action / comment / assignee from it)
  buildUpdate(l, action, { comment, assignees }) {
    return {
      url: `/tl-services/v1/NewTL/_update`,
      data: { Licenses: [{ ...l, action, comment: comment || "", assignee: assignees && assignees.length ? assignees : undefined }] },
    };
  },
};

export default TL;
