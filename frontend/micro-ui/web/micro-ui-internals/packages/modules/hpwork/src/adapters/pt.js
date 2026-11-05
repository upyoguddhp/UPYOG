import { call, humanise, valueText, fmtDate } from "../utils/work";

// codes such as BUILTUP.INDEPENDENTPROPERTY or NONRESIDENTIAL.COMMERCIAL.RETAIL -> readable text
const codeText = (v) => (v ? humanise(String(v).replace(/\./g, " / ")) : "");

const ownersOf = (p) => (p.owners || []).filter((o) => o.status !== "INACTIVE");

const normalise = (p) => {
  const owner = ownersOf(p)[0] || {};
  return {
    id: p.acknowldgementNumber || p.propertyId,
    tenantId: p.tenantId,
    title: p.propertyId || p.acknowldgementNumber,
    applicant: [owner.name, owner.mobileNumber].filter(Boolean).join(" · "),
    status: p.status,
    appliedOn: (p.auditDetails || {}).createdTime,
    kind: p.creationReason,
  };
};

// q: 10 digits = mobile number, text with "-" and digits = property id / acknowledgement number, else owner name
const criteria = (q = "") => {
  const v = String(q).trim();
  if (!v) return {};
  if (/^\d{10}$/.test(v)) return { mobileNumber: v };
  if (/\d/.test(v) && /^[A-Za-z0-9\/-]+$/.test(v)) return /^PB-AS|^HP-AS|ACK/i.test(v) ? { acknowledgementIds: v } : { propertyIds: v };
  return { name: v };
};

const PT = {
  code: "pt",
  labelKey: "WRK_SVC_PT",
  icon: "home",
  businessService: "PROPERTY_EMPLOYEE",
  dmsService: "PROPERTY",

  async search({ tenantId, statuses, q, limit, offset }) {
    const res = await call(`/property-services/property/_search`, {}, {
      tenantId,
      limit,
      offset,
      ...(statuses && statuses.length ? { status: statuses.join(",") } : {}),
      ...criteria(q),
    });
    const rows = (res.Properties || []).map(normalise);
    let total = rows.length;
    // a full page means there may be more: ask the status counts for the real total (no text query, whose total is unknown)
    if (!String(q || "").trim() && statuses && statuses.length && rows.length >= limit) {
      try { total = Math.max(rows.length, await PT.count({ tenantId, statuses })); } catch (e) { /* keep the page size */ }
    }
    return { rows, total };
  },

  // property-services does not return a total with a search; its status counts do (per ULB)
  async count({ tenantId, statuses }) {
    const res = await call(`/property-services/property/_counts`, { tenantId }, { tenantId });
    // the service returns lower-case keys (applicationpendingformodification); drafts are never counted
    const c = {};
    Object.keys(res.Counts || {}).forEach((k) => { c[k.toLowerCase()] = res.Counts[k]; });
    return (statuses || []).reduce((n, st) => (/^(INITIATION|INITIATED)$/.test(st) ? n : n + (Number(c["application" + String(st).toLowerCase()]) || 0)), 0);
  },

  // id is the acknowledgement number of the application (falls back to the property id for approved ones)
  async fetch(id, tenantId) {
    const byAck = await call(`/property-services/property/_search`, {}, { tenantId, acknowledgementIds: id });
    let rows = (byAck.Properties || []).filter((p) => p.acknowldgementNumber === id);
    if (!rows.length) {
      const byId = await call(`/property-services/property/_search`, {}, { tenantId, propertyIds: id });
      rows = (byId.Properties || []).filter((p) => p.propertyId === id);
    }
    return rows.sort((a, b) => ((b.auditDetails || {}).lastModifiedTime || 0) - ((a.auditDetails || {}).lastModifiedTime || 0))[0] || null;
  },

  summary(p) {
    const addr = p.address || {};
    const loc = addr.locality || {};
    const units = (p.units || []).filter((u) => u.active !== false);
    const owners = ownersOf(p);
    const sections = [
      {
        head: "WRK_SEC_APPLICATION",
        rows: [
          ["WRK_F_appNo", p.acknowldgementNumber],
          ["WRK_F_propertyId", p.propertyId],
          ["WRK_F_type", humanise(p.creationReason)],
          ["WRK_F_appliedOn", fmtDate((p.auditDetails || {}).createdTime)],
          ["WRK_F_ulb", humanise(String(p.tenantId).split(".").slice(1).join(" "))],
        ],
      },
      {
        head: "WRK_PT_SEC_PROPERTY",
        rows: [
          ["WRK_PT_F_oldId", p.oldPropertyId],
          ["WRK_F_propertyType", codeText(p.propertyType)],
          ["WRK_PT_F_usage", codeText(p.usageCategory)],
          ["WRK_PT_F_ownership", codeText(p.ownershipCategory)],
          ["WRK_PT_F_floors", p.noOfFloors],
          ["WRK_PT_F_landArea", p.landArea],
          ["WRK_PT_F_builtArea", p.superBuiltUpArea],
          ["WRK_PT_F_units", units.length ? String(units.length) : ""],
        ],
      },
      {
        head: "WRK_SEC_LOCATION",
        rows: [
          ["WRK_F_address", [addr.doorNo, addr.buildingName, addr.street, addr.landmark].filter(Boolean).join(", ")],
          ["WRK_PT_F_locality", loc.name || loc.code],
          ["WRK_F_district", addr.district],
          ["WRK_F_ward", (addr.additionalDetails || {}).wardNumber || (addr.additionalDetails || {}).wardName],
          ["WRK_F_pincode", addr.pincode],
        ],
      },
    ];
    owners.forEach((o) =>
      sections.push({
        head: "WRK_SEC_OWNER",
        rows: [
          ["WRK_F_name", o.name],
          ["WRK_F_father", o.fatherOrHusbandName],
          ["WRK_F_gender", o.gender],
          ["WRK_F_mobile", o.mobileNumber],
          ["WRK_F_email", o.emailId],
          ["WRK_PT_F_ownerType", codeText(o.ownerType)],
          ["WRK_PT_F_share", o.ownerShipPercentage ? `${o.ownerShipPercentage}%` : ""],
        ],
      })
    );
    return { id: p.acknowldgementNumber || p.propertyId, title: p.propertyId || p.acknowldgementNumber, status: p.status, sections };
  },

  // property-services reads the workflow block of the full property (the whole record must be sent back)
  buildUpdate(p, action, { comment, assignees }) {
    return {
      url: `/property-services/property/_update`,
      data: {
        Property: {
          ...p,
          workflow: {
            businessService: p.businessService || PT.businessService,
            moduleName: "PROPERTY",
            action,
            tenantId: p.tenantId,
            comment: comment || "",
            assignes: assignees && assignees.length ? assignees.map((a) => (typeof a === "string" ? { uuid: a } : a)) : undefined,
          },
        },
      },
    };
  },
};

export default PT;
