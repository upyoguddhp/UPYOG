import { call, humanise, fmtDate } from "../utils/work";

const BS = "chb-services";

const hallName = (b) => humanise(String(b.communityHallName || (b.relatedAsset || {}).assetName || b.communityHallCode || "").trim());

const normalise = (b) => {
  const slot = (b.bookingSlotDetails || [])[0] || {};
  const ap = b.applicantDetail || {};
  return {
    id: b.bookingNo,
    tenantId: b.tenantId,
    title: hallName(b),
    applicant: [ap.applicantName, ap.applicantMobileNo].filter(Boolean).join(" · "),
    status: b.applicationStatus,
    appliedOn: b.applicationDate || (b.auditDetails || {}).createdTime,
    kind: [slot.bookingDate ? fmtDate(slot.bookingDate) : "", slot.bookingToDate && slot.bookingToDate !== slot.bookingDate ? fmtDate(slot.bookingToDate) : ""].filter(Boolean).join(" - "),
  };
};

const criteria = (q = "") => {
  const v = String(q).trim();
  if (!v) return {};
  return /^\d{10}$/.test(v) ? { mobileNumber: v } : { bookingNo: v };
};

const HALL = {
  code: "hall",
  labelKey: "WRK_SVC_HALL",
  icon: "home",
  businessService: BS,
  dmsService: "chb-services",

  // the service's `status` filter is the booking slot status (AVAILABLE/BOOKED), not the workflow state,
  // so the workflow state is filtered and paged here
  async search({ tenantId, statuses, q, limit, offset }) {
    const res = await call(`/chb-services/booking/v1/_search`, {}, { tenantId, ...criteria(q) });
    let rows = (res.hallsBookingApplication || []).slice();
    if (statuses && statuses.length) rows = rows.filter((b) => statuses.includes(b.applicationStatus));
    rows.sort((a, b) => (b.applicationDate || (b.auditDetails || {}).createdTime || 0) - (a.applicationDate || (a.auditDetails || {}).createdTime || 0));
    const from = offset || 0;
    return { rows: (limit ? rows.slice(from, from + limit) : rows).map(normalise), total: rows.length };
  },

  async fetch(id, tenantId) {
    const res = await call(`/chb-services/booking/v1/_search`, {}, { tenantId, bookingNo: id });
    return (res.hallsBookingApplication || []).find((b) => b.bookingNo === id) || null;
  },

  summary(b) {
    const ap = b.applicantDetail || {};
    const ad = b.address || {};
    const slot = (b.bookingSlotDetails || [])[0] || {};
    const x = b.additionaldetail || {};
    const ax = ap.additionalDetails || {};
    const asset = b.relatedAsset || {};
    const addr = ad.addressLine1 || (asset.addressDetails || {}).street;
    return {
      id: b.bookingNo,
      title: hallName(b) || b.bookingNo,
      status: b.applicationStatus,
      sections: [
        {
          head: "WRK_SEC_APPLICATION",
          rows: [
            ["WRK_F_appNo", b.bookingNo],
            ["WRK_F_appliedOn", fmtDate(b.applicationDate || (b.auditDetails || {}).createdTime)],
            ["WRK_F_ulb", humanise(String(b.tenantId).split(".").slice(1).join(" "))],
            ["WRK_HALL_F_receipt", b.receiptNo],
          ],
        },
        {
          head: "WRK_HALL_SEC_BOOKING",
          rows: [
            ["WRK_HALL_F_hall", hallName(b)],
            ["WRK_HALL_F_category", humanise((b.specialCategory || {}).category)],
            ["WRK_HALL_F_bookingFor", humanise(x.bookingFor)],
            ["WRK_HALL_F_purpose", (b.purpose || {}).purpose || b.purposeDescription],
            ["WRK_HALL_F_from", slot.bookingDate ? fmtDate(slot.bookingDate) : ""],
            ["WRK_HALL_F_to", slot.bookingToDate ? fmtDate(slot.bookingToDate) : ""],
          ],
        },
        {
          head: "WRK_SEC_APPLICANT",
          rows: [
            ["WRK_F_name", ap.applicantName],
            ["WRK_F_father", ax.applicantFatherName],
            ["WRK_F_mobile", ap.applicantMobileNo],
            ["WRK_F_email", ap.applicantEmailId],
          ],
        },
        {
          head: "WRK_SEC_LOCATION",
          rows: [
            ["WRK_F_address", [addr, ad.locality, ad.city].filter(Boolean).join(", ")],
            ["WRK_F_district", (ad.additionalDetails || {}).district],
            ["WRK_F_pincode", ad.pincode],
          ],
        },
        {
          head: "WRK_HALL_SEC_REFUND",
          rows: [
            ["WRK_HALL_F_holder", ap.accountHolderName],
            ["WRK_HALL_F_account", ap.accountNumber],
            ["WRK_HALL_F_ifsc", ap.ifscCode],
            ["WRK_HALL_F_bank", [ap.bankName, ap.bankBranchName].filter(Boolean).join(", ")],
          ],
        },
      ],
    };
  },

  // the service reloads the stored booking and applies the workflow action to it
  buildUpdate(b, action, { comment, assignees }) {
    return {
      url: `/chb-services/booking/v1/_update_status`,
      data: {
        bookingNo: b.bookingNo,
        workflow: { businessService: BS, moduleName: "CHB", action, comments: comment || "", assignes: assignees && assignees.length ? assignees : undefined },
      },
    };
  },
};

export default HALL;
