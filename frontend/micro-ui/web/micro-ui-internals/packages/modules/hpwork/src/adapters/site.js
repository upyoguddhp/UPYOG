import { call, humanise, fmtDate } from "../utils/work";

// site names are stored with underscores (AHS_Shimla_70): show them with spaces
const niceName = (v) => (v == null ? v : String(v).replace(/_+/g, " ").replace(/\s+/g, " ").trim());
const created = (b) => (b.auditDetails || {}).createdTime || (b.auditDetails || {}).createdDate || 0;
// dates are epoch seconds on site bookings
const day = (s) => (s ? fmtDate(Number(s) * 1000) : "");

const normalise = (b) => {
  const s = b.siteCreationData || {};
  return {
    id: b.applicationNo,
    tenantId: b.tenantId,
    title: niceName(s.siteName) || s.siteID || b.applicationNo,
    applicant: [b.applicantName, b.mobileNumber].filter(Boolean).join(" · "),
    status: b.status,
    appliedOn: created(b),
    kind: b.advertisementType,
  };
};

/*
 * The service filters by the tenant and by the statuses of the employee's roles itself and has no paging,
 * mobile or text search: those (and the status filter) are applied here on the returned list.
 */
const SITE = {
  code: "site",
  labelKey: "WRK_SVC_SITE",
  icon: "file",
  businessService: "ADVT",
  dmsService: "ADVT",

  async search({ tenantId, statuses, q, limit, offset }) {
    const res = await call(`/adrvcanopy-services/site-booking/_search`, { SiteBookingSearchCriteria: { tenantId } }, { tenantId });
    const want = String(q || "").trim().toLowerCase();
    const all = (res.SiteBookings || [])
      .filter((b) => !statuses || !statuses.length || statuses.indexOf(b.status) >= 0)
      .filter((b) => !want || [b.applicationNo, b.mobileNumber, b.applicantName, (b.siteCreationData || {}).siteName].some((v) => String(v || "").toLowerCase().indexOf(want) >= 0))
      .sort((a, b) => created(b) - created(a));
    const start = offset || 0;
    return { rows: all.slice(start, start + (limit || all.length)).map(normalise), total: all.length };
  },

  async fetch(id, tenantId) {
    const res = await call(`/adrvcanopy-services/site-booking/_search`, { SiteBookingSearchCriteria: { tenantId, applicationNumbers: [id] } }, { tenantId });
    return (res.SiteBookings || []).filter((b) => b.applicationNo === id).sort((a, b) => created(b) - created(a))[0] || null;
  },

  summary(b) {
    const s = b.siteCreationData || {};
    const x = b.additionalDetail || {};
    return {
      id: b.applicationNo,
      title: niceName(s.siteName) || s.siteID || b.applicationNo,
      status: b.status,
      sections: [
        {
          head: "WRK_SEC_APPLICATION",
          rows: [
            ["WRK_F_appNo", b.applicationNo],
            ["WRK_F_appliedOn", fmtDate(created(b))],
            ["WRK_F_ulb", humanise(String(b.tenantId).split(".").slice(1).join(" "))],
          ],
        },
        {
          head: "WRK_SITE_SEC_BOOKING",
          rows: [
            ["WRK_SITE_F_advType", humanise(b.advertisementType)],
            ["WRK_SITE_F_hoarding", humanise(b.hoardingType)],
            ["WRK_SITE_F_structure", humanise(b.structure)],
            ["WRK_SITE_F_from", day(b.fromDate)],
            ["WRK_SITE_F_to", day(b.toDate)],
            ["WRK_SITE_F_days", b.periodInDays],
          ],
        },
        {
          head: "WRK_SITE_SEC_SITE",
          rows: [
            ["WRK_SITE_F_siteName", niceName(s.siteName)],
            ["WRK_SITE_F_siteId", s.siteID],
            ["WRK_SITE_F_siteType", humanise(s.siteType)],
            ["WRK_F_address", s.siteAddress],
            ["WRK_F_district", niceName(s.districtName)],
            ["WRK_F_ward", s.wardNumber],
            ["WRK_SITE_F_size", s.sizeLength && s.sizeWidth ? `${s.sizeLength} × ${s.sizeWidth}` : ""],
            ["WRK_SITE_F_cost", s.siteCost],
            ["WRK_SITE_F_security", s.securityAmount],
          ],
        },
        {
          head: "WRK_SEC_APPLICANT",
          rows: [
            ["WRK_F_name", b.applicantName],
            ["WRK_F_father", b.applicantFatherName],
            ["WRK_F_gender", humanise(b.gender)],
            ["WRK_F_mobile", b.mobileNumber],
            ["WRK_F_email", b.emailId],
            ["WRK_SITE_F_remarks", x.remarks],
          ],
        },
      ],
    };
  },

  // the service reads only the workflow fields of a workflow-only call and reloads the booking itself
  buildUpdate(b, action, { comment }) {
    return {
      url: `/adrvcanopy-services/site-booking/_update`,
      data: { SiteBookings: [{ applicationNo: b.applicationNo, tenantId: b.tenantId, isOnlyWorkflowCall: true, workflowAction: action, comments: comment || "" }] },
    };
  },
};

export default SITE;
