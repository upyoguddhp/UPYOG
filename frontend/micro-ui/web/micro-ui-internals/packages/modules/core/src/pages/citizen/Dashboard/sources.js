import { humanise } from "./helpers";

/**
 * Dashboard data sources. To show a new service on the dashboard, add ONE entry to
 * APPLICATION_SOURCES (and, if it has a bill, one to BILL_SOURCES). Nothing else needs touching.
 *
 * Which sources run is decided by MDMS: Workflow.BusinessServiceMasterConfig (active entries, field
 * `businessService`). A source loads only when one of its `modules` codes is active there; sources
 * with no `modules` (none today) are always on. DASHBOARD_SERVICES below is the fallback used when
 * MDMS cannot be read, so the dashboard still works.
 *
 * APPLICATION_SOURCES entry
 *   key      unique id (also the row "kind")
 *   label    plural name, used in error messages
 *   service  singular name, shown on the row
 *   modules  business-service codes that enable it (any match, case-insensitive)
 *   enabled  set false to switch it off without deleting it
 *   fetch    ({ tenantId, mobileNumber, uuid }) => Promise<raw response>
 *   list     raw response => array of raw records
 *   map      raw record => { id, title, status, createdMs, updatedMs }
 *   href     where a row opens (string, or record => string)
 * BILL_SOURCES entry: code (billing business service), label, modules.
 */
export const MDMS_SERVICES = { moduleName: "Workflow", masterName: "BusinessServiceMasterConfig" };
/** MDMS v2 schema code (what eg_mdms_data.schemacode holds) */
export const MDMS_SCHEMA = `${MDMS_SERVICES.moduleName}.${MDMS_SERVICES.masterName}`;

const isOn = (m) => String(m?.active) !== "false";

/** Active codes from an MDMS v1 response ({ Workflow: { BusinessServiceMasterConfig: [...] } }). */
export const activeServiceCodes = (data) =>
  (data?.[MDMS_SERVICES.moduleName]?.[MDMS_SERVICES.masterName] || []).filter(isOn).map((m) => m.businessService).filter(Boolean);

/** Active codes from an MDMS v2 response ({ mdms: [{ data, isActive }] }). */
export const activeServiceCodesV2 = (res) =>
  (res?.mdms || []).filter((r) => r?.isActive !== false && isOn(r?.data)).map((r) => r.data.businessService).filter(Boolean);

/** Fallback service list (used only if MDMS returns nothing). */
export const DASHBOARD_SERVICES = [
  "NewTL", "ADVT", "GB_CITIZEN", "GB", "SITE", "PROPERTY_CITIZEN", "PROPERTY", "RDF2",
  "NOC", "pet-services", "chb-services",
  "WATERNOC", "ELECTRICITYNOC", "CANOPYNOC", "BARNOC", "SEWERAGENOC", "BOREWELLNOC", "GARBAGENOC", "PROPERTYNOC",
];

const NOC_CODES = DASHBOARD_SERVICES.filter((c) => /NOC$/.test(c));

const post = (url, params, data = {}) => Digit.CustomService.getResponse({ url, params, data });

const arr = (v) => (Array.isArray(v) ? v : []);

export const APPLICATION_SOURCES = [
  {
    key: "grievance",
    label: "Grievances",
    service: "Grievance",
    modules: ["GRIEVANCE", "PGR"],
    fetch: ({ tenantId }) => Digit.PGRService.search(tenantId, {}),
    list: (res) => arr(res?.ServiceWrappers).map((w) => w.service || {}),
    map: (s) => ({
      id: s.serviceRequestId,
      tenantId: s.tenantId,
      title: humanise(s.serviceCode) || "Grievance",
      status: s.applicationStatus,
      createdMs: s.auditDetails?.createdTime,
      updatedMs: s.auditDetails?.lastModifiedTime,
    }),
    href: (s) => `/digit-ui/citizen/grievance/application/${encodeURIComponent(s.serviceRequestId)}?tenantId=${encodeURIComponent(s.tenantId || "")}`,
  },
  {
    key: "pet",
    label: "Pet registrations",
    service: "Pet registration",
    modules: ["PTR", "pet-services"],
    fetch: ({ tenantId, mobileNumber }) =>
      Digit.PTRService.search({ tenantId, filters: mobileNumber ? { mobileNumber } : {} }),
    list: (res) => arr(res?.PetRegistrationApplications),
    map: (p) => ({
      id: p.applicationNumber,
      title: p.petDetails?.petName ? `Pet licence · ${p.petDetails.petName}` : "Pet registration",
      status: p.status,
      createdMs: p.auditDetails?.createdTime,
      updatedMs: p.auditDetails?.lastModifiedTime,
    }),
    href: (s) => `/digit-ui/citizen/ptr/petservice/registration/${encodeURIComponent(s.id)}`,
  },
  {
    key: "challan",
    label: "Challans",
    service: "Challan",
    modules: ["MCollect"],
    fetch: ({ tenantId, mobileNumber }) =>
      Digit.MCollectService.search({ tenantId, filters: mobileNumber ? { mobileNumber } : {} }),
    list: (res) => arr(res?.challans),
    map: (c) => ({
      id: c.challanNo,
      title: humanise(c.businessService) || "Challan",
      status: c.applicationStatus,
      createdMs: c.auditDetails?.createdTime,
      updatedMs: c.auditDetails?.lastModifiedTime,
    }),
    href: "/digit-ui/citizen/mcollect/my-challans",
  },
  {
    key: "tl",
    label: "Trade licences",
    service: "Trade licence",
    modules: ["NewTL", "TL"],
    fetch: ({ tenantId }) => post("/tl-services/v1/NewTL/_search", { tenantId }),
    list: (res) => arr(res?.Licenses),
    map: (l) => {
      const unit = l.tradeLicenseDetail?.tradeUnits?.[0]?.tradeType;
      const name = unit ? humanise(String(unit).split(".").pop()) : l.tradeName;
      return {
        id: l.applicationNumber || l.licenseNumber,
        title: `${{ RENEWAL: "Trade licence renewal", MODIFICATION: "Trade licence modification", CLOSURE: "Trade licence closure" }[l.applicationType] || "Trade licence"}${name ? ` · ${name}` : ""}`,
        status: l.status,
        createdMs: l.auditDetails?.createdTime,
        updatedMs: l.auditDetails?.lastModifiedTime,
      };
    },
    href: (s) => `/digit-ui/citizen/newtl/application/${encodeURIComponent(s.id)}`,
  },
  {
    key: "property",
    label: "Property applications",
    service: "Property",
    modules: ["PROPERTY", "PROPERTY_CITIZEN"],
    fetch: ({ tenantId, mobileNumber }) =>
      Digit.PTService.search({ tenantId, filters: mobileNumber ? { mobileNumber } : {} }),
    // registered (ACTIVE) properties are not applications; only show ones still in a workflow
    list: (res) => arr(res?.Properties).filter((p) => p.status && p.status !== "ACTIVE"),
    map: (p) => ({
      id: p.acknowldgementNumber || p.propertyId,
      title: `Property · ${humanise(p.creationReason || "application")}`,
      status: p.status,
      createdMs: p.auditDetails?.createdTime,
      updatedMs: p.auditDetails?.lastModifiedTime,
    }),
    href: (s) => `/digit-ui/citizen/property/application/${encodeURIComponent(s.id)}`,
  },
  {
    key: "noc",
    label: "NOC applications",
    service: "NOC",
    modules: NOC_CODES.concat("NOC"),
    fetch: ({ tenantId, mobileNumber }) =>
      Digit.NOCService.NOCsearch({ tenantId, filters: mobileNumber ? { mobileNumber } : {} }),
    list: (res) => arr(res?.Noc),
    map: (n) => ({
      id: n.applicationNo,
      title: n.nocType ? `${humanise(String(n.nocType).replace(/NOC$/i, ""))} NOC`.trim() : "NOC",
      status: n.applicationStatus,
      createdMs: n.auditDetails?.createdTime,
      updatedMs: n.auditDetails?.lastModifiedTime,
    }),
    // electricity NOCs are migrated to the HPNOC module; other types still go to all services
    href: (n) => (/^ELECTRICITYNOC$/i.test(n.nocType || "") ? `/digit-ui/citizen/hpnoc/application/${encodeURIComponent(n.applicationNo)}` : "/digit-ui/citizen/all-services"),
  },
  {
    key: "chb",
    label: "Community hall bookings",
    service: "Community hall booking",
    modules: ["chb-services"],
    // no filters: the service then returns the signed-in citizen's own bookings
    fetch: () => post("/chb-services/booking/v1/_search", {}),
    list: (res) => arr(res?.hallsBookingApplication),
    map: (b) => ({
      id: b.bookingNo,
      title: `Community hall · ${b.communityHallName || humanise(b.communityHallCode)}`,
      status: b.applicationStatus || b.bookingStatus,
      createdMs: b.auditDetails?.createdTime,
      updatedMs: b.auditDetails?.lastModifiedTime,
    }),
    href: (s) => `/digit-ui/citizen/booking/asset/application/${encodeURIComponent(s.id)}`,
  },
  {
    key: "adv",
    label: "Advertisement site bookings",
    service: "Advertisement site booking",
    modules: ["ADVT", "SITE"],
    fetch: () => post("/adrvcanopy-services/site-booking/_search", {}, { SiteBookingSearchCriteria: {} }),
    list: (res) => arr(res?.SiteBookings || res?.siteBookings),
    map: (b) => ({
      id: b.applicationNo,
      title: `Advertisement · ${b.siteCreationData?.siteName || humanise(b.advertisementType || "site booking")}`,
      status: b.status,
      createdMs: b.auditDetails?.createdTime,
      updatedMs: b.auditDetails?.lastModifiedTime,
    }),
    href: (s) => `/digit-ui/citizen/booking/site/application/${encodeURIComponent(s.id)}`,
  },
  {
    key: "reqsvc",
    label: "Service requests",
    service: "Request services",
    modules: ["REQSVC", "REQSERV"],
    // echallan-services limits a citizen's search to their own requests
    fetch: () => post("/echallan-services/eChallan/v1/_search", { businessService: "REQSERV" }),
    list: (res) => arr(res?.challans),
    map: (c) => ({
      id: c.challanNo,
      title: `Service request · ${c.description || ""}`.trim(),
      // the challan only carries ACTIVE / PAID / CANCELLED; ACTIVE means the fee is still to be paid
      status: c.applicationStatus === "ACTIVE" ? "PENDINGFORPAYMENT" : c.applicationStatus === "PAID" ? "PENDINGFORAPPROVAL" : c.applicationStatus,
      createdMs: c.auditDetails?.createdTime,
      updatedMs: c.auditDetails?.lastModifiedTime,
    }),
    href: (s) => `/digit-ui/citizen/reqsvc/application/${encodeURIComponent(s.id)}`,
  },
  {
    key: "ots",
    label: "One time settlement applications",
    service: "One time settlement",
    modules: ["OTS"],
    fetch: ({ mobileNumber }) =>
      mobileNumber ? post("/rdf-monitoring/msme/get-applications", {}, { pageSize: 50, filters: { mobile_no: Number(mobileNumber) } }) : Promise.resolve({ data: [] }),
    list: (res) => arr(res?.data),
    map: (o) => ({
      id: String(o.id),
      title: `One time settlement · ${o.applicant_name || ""}`.trim(),
      status: "SUBMITTED",
      createdMs: o.created_at ? new Date(String(o.created_at).replace(" ", "T")).getTime() : undefined,
      updatedMs: o.updated_at ? new Date(String(o.updated_at).replace(" ", "T")).getTime() : undefined,
    }),
    href: (s) => `/digit-ui/citizen/ots/application/${encodeURIComponent(s.id)}`,
  },
  {
    key: "garbage",
    label: "Garbage collection accounts",
    service: "Garbage collection",
    modules: ["GB_CITIZEN", "GB"],
    fetch: ({ mobileNumber }) =>
      post("/garbage-service/garbage-accounts/_search", {}, {
        searchCriteriaGarbageAccount: {
          mobileNumber: mobileNumber ? [mobileNumber] : [],
          isActiveAccount: true,
          isActiveSubAccount: true,
        },
      }),
    list: (res) => arr(res?.garbageAccounts),
    map: (g) => ({
      id: g.grbgApplication?.applicationNo || String(g.garbageId || ""),
      title: `Garbage collection${g.name ? ` · ${g.name}` : ""}`,
      status: g.status || g.grbgApplication?.status,
      createdMs: g.auditDetails?.createdTime,
      updatedMs: g.auditDetails?.lastModifiedTime,
    }),
    href: (s) => `/digit-ui/citizen/gb/application/${encodeURIComponent(s.id)}`,
  },
  ...[
    { key: "ws", code: "WS", name: "Water", list: "WaterConnection" },
    { key: "sw", code: "SW", name: "Sewerage", list: "SewerageConnections" },
  ].map((c) => ({
    key: c.key,
    label: `${c.name} connections`,
    service: `${c.name} connection`,
    modules: ["WS", "NewWS", "SW"],
    fetch: ({ tenantId, mobileNumber }) =>
      Digit.WSService.search({ tenantId, businessService: c.code, filters: mobileNumber ? { mobileNumber } : {} }),
    list: (res) => arr(res?.[c.list]),
    map: (w) => ({
      id: w.applicationNo || w.connectionNo,
      title: `${c.name} connection${w.applicationType ? ` · ${humanise(w.applicationType)}` : ""}`,
      status: w.applicationStatus,
      createdMs: w.auditDetails?.createdTime,
      updatedMs: w.auditDetails?.lastModifiedTime,
    }),
    href: "/digit-ui/citizen/ws/my-applications",
  })),
];

export const BILL_SOURCES = [
  { code: "PT", label: "Property tax", modules: ["PROPERTY", "PROPERTY_CITIZEN", "PT"] },
  { code: "WS", label: "Water charges", modules: ["WS", "NewWS"] },
  { code: "SW", label: "Sewerage charges", modules: ["SW", "WS", "NewWS"] },
  { code: "TL", label: "Trade licence fee", modules: ["NewTL", "TL"] },
  { code: "pet-services", label: "Pet licence fee", modules: ["PTR", "pet-services"] },
  { code: "chb-services", label: "Community hall booking fee", modules: ["chb-services"] },
];

/**
 * A source runs when it is not switched off and, if it names modules, at least one of them is
 * enabled in MDMS. While the enabled-module list is unknown (still loading / not available) nothing
 * is hidden, so a missing list never blanks the dashboard.
 */
export const isSourceOn = (source, enabledModules) => {
  if (source.enabled === false) return false;
  if (!source.modules || !enabledModules || !enabledModules.length) return true;
  const on = enabledModules.map((m) => String(m).toLowerCase());
  return source.modules.some((m) => on.includes(String(m).toLowerCase()));
};
