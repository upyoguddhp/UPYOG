import { call, humanise, fmtDate } from "../utils/work";

const normalise = (w) => {
  const s = w.service || {};
  const c = s.citizen || {};
  return {
    id: s.serviceRequestId,
    tenantId: s.tenantId,
    title: humanise(s.serviceCode),
    applicant: [c.name || (s.additionalDetail || {}).citizenName, c.mobileNumber || (s.additionalDetail || {}).citizenMobile].filter(Boolean).join(" · "),
    status: s.applicationStatus,
    appliedOn: (s.auditDetails || {}).createdTime,
    kind: (s.additionalDetail || {}).grievanceType,
  };
};

const criteria = (q = "") => {
  const v = String(q).trim();
  if (!v) return {};
  return /^\d{10}$/.test(v) ? { mobileNumber: v } : { serviceRequestId: v };
};

const GRIEVANCE = {
  code: "grievance",
  labelKey: "WRK_SVC_GRV",
  icon: "alert",
  businessService: "PGR",
  dmsService: "PGR",

  async search({ tenantId, statuses, q, limit, offset }) {
    const res = await call(`/pgr-services/v2/request/_search`, {}, {
      tenantId,
      limit,
      offset,
      ...(statuses && statuses.length ? { applicationStatus: statuses.join(",") } : {}),
      ...criteria(q),
    });
    const rows = (res.ServiceWrappers || []).map(normalise);
    return { rows, total: typeof res.totalCount === "number" ? res.totalCount : rows.length };
  },

  // the whole wrapper is kept: the update call needs service (+ workflow) built from it
  async fetch(id, tenantId) {
    const res = await call(`/pgr-services/v2/request/_search`, {}, { tenantId, serviceRequestId: id });
    return ((res.ServiceWrappers || [])[0] || {}).service || null;
  },

  summary(s) {
    const c = s.citizen || {};
    const a = s.additionalDetail || {};
    const addr = s.address || {};
    const ex = addr.additionalDetails || {};
    return {
      id: s.serviceRequestId,
      title: humanise(s.serviceCode),
      status: s.applicationStatus,
      sections: [
        {
          head: "WRK_SEC_GRIEVANCE",
          rows: [
            ["WRK_F_appNo", s.serviceRequestId],
            ["WRK_F_grvType", a.grievanceType],
            ["WRK_F_grvSubType", humanise(s.serviceCode)],
            ["WRK_F_description", s.description],
            ["WRK_F_appliedOn", fmtDate((s.auditDetails || {}).createdTime)],
            ["WRK_F_source", s.source],
            ["WRK_F_ulb", humanise(String(s.tenantId).split(".").slice(1).join(" "))],
          ],
        },
        {
          head: "WRK_SEC_LOCATION",
          rows: [
            ["WRK_F_district", addr.district],
            ["WRK_F_ward", ex.ward],
            ["WRK_F_address", ex.address],
          ],
        },
        {
          head: "WRK_SEC_APPLICANT",
          rows: [
            ["WRK_F_name", c.name || a.citizenName],
            ["WRK_F_father", a.citizenFatherName],
            ["WRK_F_mobile", c.mobileNumber || a.citizenMobile],
            ["WRK_F_email", c.emailId || a.citizenEmail],
          ],
        },
      ],
    };
  },

  buildUpdate(s, action, { comment, assignees }) {
    return {
      url: `/pgr-services/v2/request/_update`,
      data: { service: s, workflow: { action, comments: comment || "", assignes: assignees && assignees.length ? assignees : undefined } },
    };
  },
};

export default GRIEVANCE;
