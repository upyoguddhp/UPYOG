/**
 * Website pages (Directorate of Urban Development portal): routes and settings.
 * Content pages are standalone website pages with the same header / footer as the landing.
 */
export const BASE = "/digit-ui/citizen";

/** Route slugs match the existing portal (citizenseva.hp.gov.in/hp-udd/...) */
export const ROUTES = {
  home: BASE,
  about: `${BASE}/introduction`,
  notifications: `${BASE}/notification-order`,
  acts: `${BASE}/acts-rules`,
  byelaws: `${BASE}/byelaws`,
  userManual: `${BASE}/user-manual`,
  sop: `${BASE}/sop-manual`,
  rti: `${BASE}/rti-documents`,
  faq: `${BASE}/faq`,
  contact: `${BASE}/contact-us`,
  organization: `${BASE}/organization-chart`,
  websitePolicy: `${BASE}/website-policy`,
  privacy: `${BASE}/privacy-policy`,
  paymentInstructions: `${BASE}/payment-instructions`,
  quickPay: `${BASE}/quick-pay`,
  accessibility: `${BASE}/accessibility-statement`,
};

/** PDFs of Acts / ByeLaws are served by the existing portal */
export const DOCUMENT_BASE = "https://citizenseva.hp.gov.in/hp-udd";

/** Quick pay flows live on the existing portal until they are migrated */
export const QUICK_PAY_URL = (type) => `https://citizenseva.hp.gov.in/hp-udd/bill-payment/quick-bill-payment/${type}`;

/** Document services (served through the gateway: rdf-monitoring and hpud-dms-service) */
export const API = {
  notifications: "/rdf-monitoring/notifications/search-notification", // POST { notification_type }
  userManual: "/rdf-monitoring/notifications/search-user-manual", // GET
  fetchDocument: "/hpud-dms-service/dms/fetchServicebyDocID", // POST { serviceName, objectId, documentId, documentType }
};

export const DEPARTMENT = {
  name: "Directorate of Urban Development",
  address: ["Palika Bhawan, Talland", "Shimla, Himachal Pradesh - 171002"],
  email: "ud-hp[at]nic[dot]in",
  phone: "+91-177-2626518",
  helpline: "+91-177-2809784",
  mapQuery: "Directorate of Urban Development Palika Bhawan Talland Shimla Himachal Pradesh 171002",
};
