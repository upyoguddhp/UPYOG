import { call, humanise, fmtDate } from "../utils/work";

// electricity NOC: noc-services records of nocType ELECTRICITYNOC, workflow business service of the same name
const NOC_TYPE = "ELECTRICITYNOC";

const normalise = (n) => {
  const x = n.additionalDetails || {};
  const c = n.citizenDetail || x.citizenDetail || {};
  return {
    id: n.applicationNo,
    tenantId: n.tenantId,
    title: x.typeOfNoc || n.applicationNo,
    applicant: [c.applicantName, c.mobile].filter(Boolean).join(" · "),
    status: n.applicationStatus,
    appliedOn: (n.auditDetails || {}).createdTime,
    kind: n.applicationType,
  };
};

const criteria = (q = "") => {
  const v = String(q).trim();
  if (!v) return {};
  return /^\d{10}$/.test(v) ? { mobileNumber: v } : { applicationNo: v };
};

const HPNOC = {
  code: "hpnoc",
  labelKey: "WRK_SVC_NOC",
  icon: "file",
  businessService: NOC_TYPE,
  dmsService: "NOC",

  async search({ tenantId, statuses, q, limit, offset }) {
    const res = await call(`/noc-services/v1/noc/_search`, {}, {
      tenantId,
      nocType: NOC_TYPE,
      limit,
      offset,
      ...(statuses && statuses.length ? { status: statuses.join(",") } : {}),
      ...criteria(q),
    });
    const rows = (res.Noc || []).map(normalise);
    return { rows, total: typeof res.count === "number" ? res.count : rows.length };
  },

  async fetch(id, tenantId) {
    const res = await call(`/noc-services/v1/noc/_search`, {}, { tenantId, nocType: NOC_TYPE, applicationNo: id });
    return (res.Noc || []).filter((n) => n.applicationNo === id)[0] || null;
  },

  summary(n) {
    const x = n.additionalDetails || {};
    const p = n.propertyDetail || x.propertyDetail || {};
    const c = n.citizenDetail || x.citizenDetail || {};
    return {
      id: n.applicationNo,
      title: x.typeOfNoc || n.applicationNo,
      status: n.applicationStatus,
      sections: [
        {
          head: "WRK_NOC_SEC_NOC",
          rows: [
            ["WRK_F_appNo", n.applicationNo],
            ["WRK_NOC_F_nocNo", n.nocNo],
            ["WRK_F_appliedOn", fmtDate((n.auditDetails || {}).createdTime)],
            ["WRK_NOC_F_typeOfNoc", x.typeOfNoc],
            ["WRK_NOC_F_connectionType", n.connectionType || x.connectionType],
            ["WRK_NOC_F_reason", n.nocReason || x.reason || x.nocReason],
            ["WRK_F_ulb", humanise(String(n.tenantId).split(".").slice(1).join(" "))],
          ],
        },
        {
          head: "WRK_NOC_SEC_PROPERTY",
          rows: [
            ["WRK_F_propertyId", p.oldPropertyId],
            ["WRK_NOC_F_plotNo", p.plotNo],
            ["WRK_NOC_F_coOwner", p.coOwnerName],
            ["WRK_F_ward", p.ward],
            ["WRK_F_address", p.propertyAddress],
            ["WRK_F_pincode", p.pincode],
            ["WRK_NOC_F_landType", p.landType],
            ["WRK_NOC_F_area", p.area],
            ["WRK_NOC_F_khasra", p.khasraNumber],
            ["WRK_NOC_F_khata", p.khata],
          ],
        },
        {
          head: "WRK_SEC_APPLICANT",
          rows: [
            ["WRK_F_name", c.applicantName],
            ["WRK_F_father", c.fatherName],
            ["WRK_F_mobile", c.mobile],
            ["WRK_NOC_F_dob", c.dob ? fmtDate(c.dob) : ""],
            ["WRK_F_gender", humanise(c.gender)],
            ["WRK_F_email", c.email],
            ["WRK_F_address", c.address],
          ],
        },
      ],
    };
  },

  commentMax: 64, // the service accepts a workflow comment of 1 to 64 characters

  buildUpdate(n, action, { comment, assignees }) {
    return {
      url: `/noc-services/v1/noc/_update`,
      data: {
        Noc: { ...n, workflow: { action, comment: comment || undefined, assignes: assignees && assignees.length ? assignees : undefined } },
      },
    };
  },
};

export default HPNOC;
