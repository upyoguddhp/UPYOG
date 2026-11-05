import { call, humanise, fmtDate, valueText } from "../utils/work";

const appNoOf = (a) => (a && ((a.grbgApplication || {}).applicationNo || a.grbgApplicationNumber)) || "";
const statusOf = (a) => ((a && a.grbgApplication) || {}).status || (a && a.status) || "";
const createdOf = (a) => (a.auditDetails || {}).createdDate || 0;
const addressOf = (a) => (a.addresses || []).find((x) => x.isActive !== false) || (a.addresses || [])[0] || {};

const normalise = (a) => {
  const unit = (a.grbgCollectionUnits || [])[0] || {};
  return {
    id: appNoOf(a),
    tenantId: a.tenantId,
    title: [a.name, [unit.category, unit.subCategory].filter(Boolean).map(humanise).join(" / ")].filter(Boolean).join(" · ") || appNoOf(a),
    applicant: [a.name, a.mobileNumber].filter(Boolean).join(" · "),
    status: statusOf(a),
    appliedOn: createdOf(a),
    kind: a.type,
  };
};

// garbage-service _search has no paging: criteria go in, the full list comes back, so paging is done here
const searchAll = async (tenantId, criteria) => {
  const res = await call(`/garbage-service/garbage-accounts/_search`, { searchCriteriaGarbageAccount: { tenantId, ...criteria } }, { tenantId });
  const seen = {};
  return (res.garbageAccounts || [])
    .filter((a) => {
      const no = appNoOf(a);
      if (!no || seen[no]) return false;
      seen[no] = true;
      return true;
    })
    .sort((a, b) => createdOf(b) - createdOf(a));
};

const criteriaOf = (q = "") => {
  const v = String(q).trim();
  if (!v) return {};
  return /^\d{10}$/.test(v) ? { mobileNumber: [v] } : { applicationNumber: [v] };
};

const GARBAGE = {
  code: "grbg",
  labelKey: "WRK_SVC_GB",
  icon: "home",
  businessService: "GB_CITIZEN",
  dmsService: "GB",

  async search({ tenantId, statuses, q, limit, offset }) {
    const all = await searchAll(tenantId, { ...(statuses && statuses.length ? { status: statuses } : {}), ...criteriaOf(q) });
    return { rows: all.slice(offset || 0, (offset || 0) + (limit || all.length)).map(normalise), total: all.length };
  },

  async fetch(id, tenantId) {
    const all = await searchAll(tenantId, { applicationNumber: [id] });
    return all.find((a) => appNoOf(a) === id) || null;
  },

  summary(a) {
    const addr = addressOf(a);
    const x = a.additionalDetail || {};
    const units = a.grbgCollectionUnits || [];
    const children = a.childGarbageAccounts || [];
    return {
      id: appNoOf(a),
      title: a.name || appNoOf(a),
      status: statusOf(a),
      sections: [
        {
          head: "WRK_SEC_APPLICATION",
          rows: [
            ["WRK_F_appNo", appNoOf(a)],
            ["WRK_GB_F_garbageId", a.garbageId],
            ["WRK_GB_F_oldGarbageId", (a.grbgOldDetails || {}).oldGarbageId],
            ["WRK_F_type", humanise(a.type)],
            ["WRK_F_appliedOn", fmtDate(createdOf(a))],
            ["WRK_F_ulb", humanise(String(a.tenantId).split(".").slice(1).join(" "))],
          ],
        },
        {
          head: "WRK_SEC_OWNER",
          rows: [
            ["WRK_F_name", a.name],
            ["WRK_F_gender", a.gender],
            ["WRK_F_mobile", a.mobileNumber],
            ["WRK_F_email", a.emailId],
            ["WRK_GB_F_isOwner", a.isOwner === undefined || a.isOwner === null ? "" : valueText(a.isOwner)],
            ["WRK_GB_F_propertyOwner", x.propertyOwnerName],
          ],
        },
        {
          head: "WRK_SEC_LOCATION",
          rows: [
            ["WRK_F_propertyId", a.propertyId],
            ["WRK_F_address", [addr.address1, addr.address2].filter(Boolean).join(", ")],
            ["WRK_F_district", (addr.additionalDetail || {}).district],
            ["WRK_F_ulb", humanise(addr.ulbName)],
            ["WRK_F_ward", addr.wardName],
            ["WRK_GB_F_zone", addr.zone],
            ["WRK_F_pincode", addr.pincode],
          ],
        },
        {
          head: "WRK_GB_SEC_UNITS",
          rows: units.map((u) => [
            "WRK_GB_F_unit",
            [humanise(u.unitType), humanise(u.category), humanise(u.subCategory), humanise(u.subCategoryType), u.isvariablecalculation ? u.no_of_units : ""].filter(Boolean).join(" · "),
          ]),
        },
        ...(children.length
          ? [
              {
                head: "WRK_GB_SEC_CHILDREN",
                rows: children.map((c) => [
                  "WRK_GB_F_child",
                  [c.name, c.mobileNumber, ((c.grbgCollectionUnits || [])[0] || {}).category && humanise(c.grbgCollectionUnits[0].category)].filter(Boolean).join(" · "),
                ]),
              },
            ]
          : []),
        {
          head: "WRK_SEC_APPLICANT",
          rows: [
            ["WRK_F_name", x.applicantName],
            ["WRK_F_mobile", x.applicantPhoneNumber],
            ["WRK_F_email", x.applicantEmail],
          ],
        },
      ],
    };
  },

  // garbage-service moves an application with a workflow-only call (no data change); the workflow has no assignee step
  buildUpdate(a, action, { comment }) {
    return {
      url: `/garbage-service/garbage-accounts/_update`,
      data: {
        garbageAccounts: [
          {
            tenantId: a.tenantId,
            businessService: "GB_CITIZEN",
            isOnlyWorkflowCall: true,
            grbgApplicationNumber: appNoOf(a),
            workflowAction: action,
            workflowComment: comment || action,
          },
        ],
      },
    };
  },
};

export default GARBAGE;
