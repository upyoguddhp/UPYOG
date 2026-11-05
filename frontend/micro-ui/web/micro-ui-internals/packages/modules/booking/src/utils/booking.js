import { BKG_MAX_HALL_DAYS, BKG_PATTERNS } from "../config/bookingConfig";

const isEmpty = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

const auth = () => ({ apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token });

// Pulls the most useful message out of a failed API response/exception.
export const apiErrorMessage = (err, fallback) => {
  const e = err?.response?.data?.Errors?.[0] || err?.Errors?.[0] || err?.data?.Errors?.[0];
  const raw = e?.message || e?.description || err?.message;
  // bare transport errors ("Request failed with status code 500") are not actionable for citizens
  return !raw || /^Request failed with status code|^Network Error/i.test(raw) ? fallback : raw;
};

// Values that come from the signed-in citizen rather than being typed.
export const getUserDefaults = () => {
  const info = Digit.UserService.getUser()?.info || {};
  return { applicantName: info.name || "", mobileNumber: info.mobileNumber || "", emailId: info.emailId || "" };
};

export const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());

/* ---------------------------------------------------------------- dates */
const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayYmd = () => ymd(new Date());
// advertisement-canopy-service keeps dates as unix seconds (UTC midnight, as OldTheme sends them)
export const ymdToSeconds = (v) => (v ? new Date(v).getTime() / 1000 : null);
export const secondsToYmd = (s) => (s ? new Date(s * 1000).toISOString().split("T")[0] : "");
// site names come as AHS_Kangra_Dharamshala_Sakoh: show them with spaces
export const niceName = (v) => (v == null ? v : String(v).replace(/_+/g, " ").replace(/\s+/g, " ").trim());

export const fmtDate = (v) => {
  if (!v) return "";
  const d = typeof v === "number" ? new Date(v) : new Date(`${String(v).slice(0, 10)}T00:00:00`);
  return isNaN(d) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
export const fmtTime = (ms) => (ms ? new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
export const daysBetween = (from, to) => {
  if (!from || !to) return 0;
  const n = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
  return n > 0 ? n : 0;
};
const datesInRange = (from, to) => {
  const out = [];
  for (let d = new Date(`${from}T00:00:00`); d <= new Date(`${to}T00:00:00`); d.setDate(d.getDate() + 1)) out.push(ymd(d));
  return out;
};
export const inr = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* ------------------------------------------------------------ validation */
// Returns { fieldName: i18nErrorKey } for one page of values; empty when valid. ctx: { svc, site, bookedDates }.
export const validatePage = (page, values, ctx = {}) => {
  const errors = {};
  (page.fields || []).forEach((f) => {
    const v = values[f.name];
    if (f.required && isEmpty(v)) {
      errors[f.name] = "BKG_E_REQUIRED";
      return;
    }
    if (isEmpty(v)) return;
    if (f.pattern && !BKG_PATTERNS[f.pattern].re.test(String(v).trim())) errors[f.name] = BKG_PATTERNS[f.pattern].error;
  });
  if (page.key === "booking" && !errors.fromDate && !errors.toDate) {
    const { fromDate, toDate } = values;
    if (fromDate < todayYmd()) errors.fromDate = "BKG_E_PAST_DATE";
    else if (toDate < fromDate) errors.toDate = "BKG_E_TO_BEFORE_FROM";
    else if (ctx.svc === "site") {
      const site = ctx.site || {};
      if ((site.bookingPeriodStartDate && fromDate < secondsToYmd(site.bookingPeriodStartDate)) || (site.bookingPeriodEndDate && toDate > secondsToYmd(site.bookingPeriodEndDate))) {
        errors.fromDate = "BKG_E_OUTSIDE_PERIOD";
      }
    } else if (ctx.svc === "asset") {
      if (daysBetween(fromDate, toDate) > BKG_MAX_HALL_DAYS) errors.toDate = "BKG_E_MAX_DAYS";
      else if (datesInRange(fromDate, toDate).some((d) => (ctx.bookedDates || []).includes(d))) errors.toDate = "BKG_E_BOOKED_DATES";
    }
  }
  return errors;
};

/* ------------------------------------------------------------- estimates */
// Indicative amount shown to the citizen; the ULB's own calculation is what gets billed.
export const estimate = (svc, selection, booking, category) => {
  const days = daysBetween(booking.fromDate, booking.toDate);
  const rate = svc === "site" ? Number(selection.siteCost || 0) : Number((category || {}).assetCost || 0);
  const pct = svc === "site" ? Number(selection.gstPercnetage || 0) : Number((category || {}).gstPercentage || 0);
  const security = svc === "site" ? Number(selection.securityAmount || 0) : Number((category || {}).securityAmount || 0);
  const rent = days * rate;
  const gst = (rent * pct) / 100;
  return { days, rate, pct, rent, gst, security, total: rent + gst + security };
};

/* --------------------------------------------------------------- API calls */
// params carry a timestamp so Digit's POST response cache never replays an old answer
const call = (url, data, params) => Digit.CustomService.getResponse({ url, params: { tenantId: Digit.ULBService.getStateId(), ...(params || {}), _: Date.now() }, data });

export const SiteApi = {
  // approved, available sites (the service restricts a citizen's search to those)
  searchSites: () => call("/adrvcanopy-services/site/_search", { RequestInfo: auth(), searchData: { active: true } }),
  // the signed-in citizen's own bookings (the service filters on the caller)
  searchMine: () => call("/adrvcanopy-services/site-booking/_search", { RequestInfo: auth(), SiteBookingSearchCriteria: {} }),
  create: (payload) => call("/adrvcanopy-services/site-booking/_create", payload),
  update: (payload) => call("/adrvcanopy-services/site-booking/_update", payload),
};

export const AssetApi = {
  searchAssets: () => call("/asset-services/v1/assets/_search", { RequestInfo: auth() }, { assetParentCategory: "COMMUNITY_HALLS,COMMUNITY_GROUNDS" }),
  bookedDates: (communityHallCode) => call("/chb-services/booking/v1/_slot-details", { RequestInfo: auth(), communityHallCode }),
  searchMine: () => call("/chb-services/booking/v1/_search", { RequestInfo: auth() }),
  create: (payload) => call("/chb-services/booking/v1/_create", payload),
  updateStatus: (payload) => call("/chb-services/booking/v1/_update_status", payload),
  // "Booking for" options + their rates, kept in MDMS per hall (AssetParentCategory.AssetCategory, assetNumber = hall code)
  categories: (assetNumber) =>
    call(
      "/egov-mdms-service/v1/_search",
      {
        RequestInfo: auth(),
        MdmsCriteria: {
          tenantId: "hp",
          moduleDetails: [{ moduleName: "AssetParentCategory", masterDetails: [{ name: "AssetCategory", filter: `[?(@.assetNumber=="${assetNumber}")]` }] }],
        },
      },
      { tenantId: "hp" }
    ),
};

export const categoriesOf = (res) => (((res || {}).MdmsRes || {}).AssetParentCategory || {}).AssetCategory || [];

/* ----------------------------------------------------------- payloads */
export const buildSitePayload = (params) => {
  const site = (params.select || {}).site || {};
  const b = params.booking || {};
  const a = params.applicant || {};
  return {
    SiteBookings: [
      {
        siteUuid: site.uuid,
        applicantName: a.applicantName,
        applicantFatherName: a.applicantFatherName,
        gender: a.gender,
        mobileNumber: a.mobileNumber,
        emailId: a.emailId || "",
        fromDate: ymdToSeconds(b.fromDate),
        toDate: ymdToSeconds(b.toDate),
        hoardingType: b.hoardingType,
        additionalDetail: { ulbName: site.ulbName, gstNumber: a.gstNumber || "" },
        isActive: true,
        workflowAction: "INITIATE",
        tenantId: site.tenantId,
      },
    ],
    RequestInfo: auth(),
  };
};

// moves the created (INITIATED) booking into the workflow
export const buildSiteForwardPayload = (applicationNo, action = "FORWARD_TO_VERIFIER") => ({
  SiteBookings: [{ applicationNo, isOnlyWorkflowCall: true, workflowAction: action, comments: "" }],
  RequestInfo: auth(),
});

export const buildAssetPayload = (params) => {
  const asset = (params.select || {}).asset || {};
  const b = params.booking || {};
  const a = params.applicant || {};
  const ad = params.address || {};
  const info = Digit.UserService.getUser()?.info || {};
  return {
    hallsBookingApplication: {
      tenantId: asset.tenantId,
      communityHallCode: asset.applicationNo,
      communityHallName: asset.assetName,
      bookingStatus: "AVAILABLE",
      specialCategory: { category: asset.assetParentCategory },
      purpose: { purpose: b.purpose },
      additionaldetail: { bookingFor: b.bookingFor },
      purposeDescription: b.purpose,
      bookingSlotDetails: [
        {
          hallCode: asset.applicationNo,
          capacity: 0,
          bookingDate: b.fromDate,
          bookingToDate: b.toDate,
          bookingFromTime: "00:00 PM",
          bookingToTime: "00:00 PM",
          status: "BOOKED",
        },
      ],
      applicantDetail: {
        applicantName: a.applicantName,
        applicantMobileNo: a.mobileNumber,
        applicantEmailId: a.emailId || info.emailId,
        accountNumber: a.accountNumber,
        ifscCode: a.ifscCode,
        bankName: a.bankName,
        bankBranchName: a.bankBranchName,
        accountHolderName: a.accountHolderName,
        additionalDetails: { gender: a.gender, applicantFatherName: a.applicantFatherName },
      },
      address: {
        addressLine1: ad.addressLine1,
        city: ad.city,
        cityCode: "0",
        locality: ad.locality,
        localityCode: "0",
        pincode: ad.pincode,
        additionalDetails: { district: ad.districtName },
        landmark: ad.landmark,
      },
      workflow: { action: "INITIATE", businessService: "chb-services", moduleName: "CHB" },
    },
    RequestInfo: auth(),
  };
};

export const buildAssetForwardPayload = (bookingNo, action = "FORWARD_TO_APPROVER") => ({
  bookingNo,
  workflow: { action, businessService: "chb-services", moduleName: "CHB" },
  RequestInfo: auth(),
});

/* ------------------------------------------------- list / view helpers */
export const applicationNoOf = (svc, rec) => (rec ? (svc === "site" ? rec.applicationNo : rec.bookingNo) || "" : "");
export const statusOf = (svc, rec) => (svc === "site" ? rec.status : rec.applicationStatus || rec.bookingStatus) || "";
export const createdOf = (rec) => (rec.auditDetails || {}).createdTime || (rec.auditDetails || {}).createdDate || 0;

// one shape for both booking types, used by the list rows
export const rowOf = (svc, rec) => {
  if (svc === "site") {
    const s = rec.siteCreationData || {};
    return {
      id: rec.applicationNo,
      tenantId: rec.tenantId,
      status: rec.status,
      title: niceName(s.siteName) || s.siteID || rec.applicationNo,
      line: [rec.hoardingType, s.ulbName || (rec.additionalDetail || {}).ulbName].filter(Boolean).join(" · "),
      period: rec.fromDate ? `${fmtDate(rec.fromDate * 1000)} - ${fmtDate(rec.toDate * 1000)}` : "",
    };
  }
  const slot = (rec.bookingSlotDetails || [])[0] || {};
  return {
    id: rec.bookingNo,
    tenantId: rec.tenantId,
    status: rec.applicationStatus || rec.bookingStatus,
    title: rec.communityHallName || rec.communityHallCode,
    line: [((rec.additionaldetail || {}).bookingFor) || (rec.specialCategory || {}).category, ((rec.relatedAsset || {}).addressDetails || {}).street].filter(Boolean).join(" · "),
    period: slot.bookingDate ? `${fmtDate(slot.bookingDate)} - ${fmtDate(slot.bookingToDate || slot.bookingDate)}` : "",
  };
};
