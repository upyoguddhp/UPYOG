/* Bill generation for the Garbage and Property verifier / approver roles (same APIs as the legacy admin theme). */
import { call, roleCodes } from "./work";

// who may generate which bills (roles come from the employee's active session)
export const BILL_SERVICES = {
  grbg: { roles: ["GB_VERIFIER", "GB_APPROVER"], labelKey: "WRK_BILL_GRBG", icon: "home" },
  ppt: { roles: ["PROPERTY_VERIFIER", "PROPERTY_APPROVER"], labelKey: "WRK_BILL_PPT", icon: "briefcase" },
};
export const billServicesFor = (roles = roleCodes()) => Object.keys(BILL_SERVICES).filter((k) => BILL_SERVICES[k].roles.some((r) => roles.indexOf(r) >= 0));

// "hp.Shimla" -> "Shimla": the bill services address a ULB by name
export const ulbKey = (tenantId = "") => String(tenantId).split(".")[1] || "";

const stateTenant = () => Digit.ULBService.getStateId();

export const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
// <input type="month"> value "2026-03" -> { month: "MARCH", year: "2026" }
export const monthParts = (v = "") => {
  const [y, m] = String(v).split("-");
  return { month: MONTHS[Number(m) - 1] || "", year: y || "" };
};
const monthStart = (v) => { const [y, m] = String(v).split("-").map(Number); return Date.UTC(y, m - 1, 1); };
// last month's start-of-day, as the garbage scheduler expects
const monthEndDay = (v) => { const [y, m] = String(v).split("-").map(Number); return Date.UTC(y, m, 0); };

export const fetchWards = async (tenantId) => {
  const res = await call("/mdms-v2/v1/_search", { MdmsCriteria: { tenantId: stateTenant(), moduleDetails: [{ moduleName: "ULBS", masterDetails: [{ name: "Wards", filter: `[?(@.ulbName == "${ulbKey(tenantId)}")]` }] }] } });
  return ((res && res.MdmsRes && res.MdmsRes.ULBS && res.MdmsRes.ULBS.Wards) || []).map((w) => w.wardName).filter(Boolean);
};

// financial years newest first, as "2025-26"
export const fetchFinancialYears = async () => {
  const res = await call("/mdms-v2/v2/_search", { MdmsCriteria: { tenantId: stateTenant(), schemaCode: "FinancialYear.FinancialYear", isActive: true, limit: 50, offset: 0 } }, {});
  return ((res && res.mdms) || [])
    .sort((a, b) => Number(b.data.order) - Number(a.data.order))
    .map((i) => { const [s, e] = String(i.data.financialYear).split("-"); return `${s}-${String(e || "").slice(-2)}`; });
};

const idsOf = (v) => (v.billingType === "MULTIPLE" ? { wardNumbers: v.wards } : v.criteria === "MOBILE" ? { mobileNumbers: [v.mobile.trim()] } : { [v.service === "grbg" ? "grbgApplicationNumbers" : "propertyIds"]: [v.id.trim()] });

/* ---------------------------------------------------------------- garbage */
const garbageBody = (v) => {
  const period = v.basis === "PERIOD";
  const one = monthParts(v.month);
  return {
    ulbNames: [ulbKey(v.tenantId)],
    ...idsOf(v),
    ...(period
      ? { isMultiMonth: true, isRebate: !!v.rebate, fromDateTimestamp: monthStart(v.from), toDateTimestamp: monthEndDay(v.to) }
      : { month: one.month, months: [one.month], year: one.year }),
  };
};
export const garbagePreview = async (v) => {
  const one = monthParts(v.month);
  const period = v.basis === "PERIOD";
  const res = await call("/garbage-service/garbage-accounts-scheduler/bill-generator/preview", {
    ulbNames: [ulbKey(v.tenantId)],
    year: period ? "" : one.year,
    months: period ? [] : [one.month],
    isRebate: v.rebate ? "true" : "false",
    grbgApplicationNumbers: v.criteria === "ID" ? [v.id.trim()] : [],
    mobileNumbers: v.criteria === "MOBILE" ? [v.mobile.trim()] : [],
    isMultiMonth: period,
    fromDateTimestamp: period ? monthStart(v.from) : null,
    toDateTimestamp: period ? monthStart(v.to) : null,
  });
  return Array.isArray(res) ? res : res && (res.data || res.previews) || [];
};
export const garbageGenerate = (v) => call("/garbage-service/garbage-accounts-scheduler/bill-generator", garbageBody(v));

/* --------------------------------------------------------------- property */
const propertyBody = (v) => ({ ulbNames: [ulbKey(v.tenantId)], ...idsOf(v), ...(v.basis === "YEARLY" ? { financialYear: v.fy } : { fromDate: v.from, toDate: v.to }) });
export const propertyPreview = async (v) => {
  const res = await call("/property-services/property-scheduler/tax-calculator/preview", propertyBody(v));
  return Array.isArray(res) ? res : res && (res.data || res.previews) || [];
};
export const propertyGenerate = (v) => call("/property-services/property-scheduler/tax-calculator", propertyBody(v));

export const previewOf = (v) => (v.service === "grbg" ? garbagePreview(v) : propertyPreview(v));
export const generateOf = (v) => (v.service === "grbg" ? garbageGenerate(v) : propertyGenerate(v));
// did the call actually create bills?
// the account ids that got a bill (from the trackers the generator returns)
export const createdIds = (service, res) => {
  const list = (res && (service === "grbg" ? res.grbgBillTrackers : res.taxCalculatorTrackers)) || [];
  const seen = {};
  list.forEach((t) => { const id = t.grbgApplicationNo || t.applicationNo || t.consumerCode || t.propertyId || t.grbgApplicationId; if (id && /\D/.test(String(id)) && /[/A-Za-z-]/.test(String(id))) seen[id] = true; });
  return Object.keys(seen);
};
export const createdCount = (service, res) => ((res && (service === "grbg" ? res.grbgBillTrackers : res.taxCalculatorTrackers)) || []).length;

/* ------------------------------------------------------- search / cancel */
const BILL_API = {
  grbg: { service: "GB", download: "/garbage-service/garbage-accounts/_generateGrbgTaxBillReceipt", keys: { code: "grbgId", id: "billid" }, cancel: "/garbage-service/garbage-bills/_cancelbill", cancelService: "GB" },
  ppt: { service: "PROPERTY", download: "/property-services/property/_generatePropertyTaxBillReceipt", keys: { code: "propertyId", id: "billId" }, cancel: "/property-services/property/_cancelbill", cancelService: "PROPERTY" },
};
export const CANCELLABLE = ["ACTIVE", "ADVANCE_ADJUSTED"];
export const PAYABLE = ["ACTIVE", "PARTIALLY_PAID", "ADVANCE_ADJUSTED"];
const round = (n) => Number((Number(n) || 0).toFixed(2));

// the month(s) / financial year a bill covers
const periodOf = (bill, service) => {
  const details = [...(bill.billDetails || [])].sort((a, b) => b.fromPeriod - a.fromPeriod);
  if (!details.length) return "";
  if (service === "ppt") {
    const d = new Date(details[0].fromPeriod);
    const start = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
    return `${start}-${String(start + 1).slice(-2)}`;
  }
  const fmt = (s) => new Date(s).toLocaleString("en-IN", { month: "short", year: "numeric" });
  return details
    .map((d) => {
      const a = d.additionalDetails || {};
      if (Array.isArray(a.MONTHS) && a.MONTHS.length) return a.MONTHS.join(", ");
      if (a.MONTH) return a.MONTH;
      if (a.type === "MULTI_MONTH" && a.BILLING_PERIOD) { const [s, e] = a.BILLING_PERIOD.split(" - "); return `${fmt(s)} - ${fmt(e)}`; }
      return fmt(d.fromPeriod);
    })
    .filter(Boolean)
    .join(", ");
};

const normaliseBill = (bill, service) => {
  const details = bill.billDetails || [];
  const total = round(details.reduce((sum, d) => {
    const amt = Number(d.amount || 0);
    if (!(d.additionalDetails || {}).billId) return sum + amt;
    const accounts = Array.isArray(d.billAccountDetails) ? d.billAccountDetails : [];
    if (!accounts.length) return sum + amt;
    return sum + Math.min(amt, accounts.reduce((s, a) => s + Math.max(0, Number(a.amount || 0) - Number(a.adjustedAmount || 0)), 0));
  }, 0));
  const paid = round(details.reduce((sum, d) => ((d.additionalDetails || {}).billId ? sum : sum + (d.billAccountDetails || []).reduce((s, a) => s + Number(a.adjustedAmount || 0), 0)), 0));
  const processing = bill.isPaymentProcessing ? round(bill.processingAmount) : 0;
  const paidAll = round(paid + processing);
  const closed = ["PAID", "ADVANCE_PAID", "CANCELLED"].indexOf(bill.status) >= 0;
  const first = (details[0] && details[0].additionalDetails) || {};
  return {
    raw: bill,
    id: bill.id,
    tenantId: bill.tenantId,
    demandId: bill.demandId,
    consumerCode: bill.consumerCode,
    status: bill.status,
    processing: !!bill.isPaymentProcessing,
    businessService: bill.businessService,
    billDate: bill.billDate || 0,
    period: periodOf(bill, service),
    payer: first.name || first.ownerName || bill.payerName || "",
    mobile: first.mobileNumber || first.contactNumber || bill.mobileNumber || "",
    total,
    paid: paidAll,
    due: closed ? 0 : Math.max(0, round(total - paidAll)),
  };
};

// garbage: searching an account also lists the bills of its child (tenant) accounts
const consumerCodes = async (service, tenantId, id) => {
  if (service !== "grbg") return [id];
  const codes = { [id]: true };
  try {
    const res = await call("/garbage-service/garbage-accounts/_search", { searchCriteriaGarbageAccount: { tenantId, applicationNumber: [id], status: ["APPROVED"] } }, { tenantId });
    (res.garbageAccounts || []).forEach((a) => {
      if (a.grbgApplicationNumber) codes[a.grbgApplicationNumber] = true;
      (a.childGarbageAccounts || []).forEach((c) => { const n = c && c.grbgApplication && c.grbgApplication.applicationNo; if (n) codes[n] = true; });
    });
  } catch (e) { /* the bills of the entered ID are still searched */ }
  return Object.keys(codes);
};

let plainSearchOnly = false;
export const searchBills = async ({ service, tenantId, by, value, status, limit, offset, processing }) => {
  const codes = by === "ID" && value ? await consumerCodes(service, tenantId, value.trim()) : null;
  const params = {
    tenantId,
    service: BILL_API[service].service,
    skipValidation: true,
    limit,
    offset,
    ...(codes ? { consumerCode: codes.join(",") } : {}),
    ...(by === "MOBILE" ? { mobileNumber: value.trim() } : {}),
    ...(status ? { status } : {}),
    ...(processing ? { isProcessing: true } : {}),
  };
  let res;
  if (!plainSearchOnly) {
    try {
      // retrieveAll also returns paid / cancelled bills
      res = await call("/billing-service/bill/v2/_search", {}, { ...params, retrieveAll: true });
    } catch (e) {
      // some deployments fail the "retrieve all" lookup of garbage trackers: use the plain search from now on
      plainSearchOnly = true;
    }
  }
  if (!res) res = await call("/billing-service/bill/v2/_search", {}, params);
  return (res.Bill || []).map((b) => normaliseBill(b, service));
};

// every bill of one account, whatever its status, newest first
export const billHistory = async (service, tenantId, consumerCode) => {
  const statuses = ["ACTIVE", "PAID", "PARTIALLY_PAID", "EXPIRED", "CANCELLED"];
  const lists = await Promise.all(statuses.map((status) => searchBills({ service, tenantId, by: "ID", value: consumerCode, status, limit: 50, offset: 0 }).catch(() => [])));
  const seen = {};
  return [].concat(...lists).filter((b) => b.consumerCode === consumerCode && !seen[b.id] && (seen[b.id] = true)).sort((a, c) => c.billDate - a.billDate);
};

// bill PDF -> Blob (the gateway answers with the PDF itself)
export const downloadBillPdf = async (service, bill) => {
  const api = BILL_API[service];
  const q = new URLSearchParams({ [api.keys.code]: bill.consumerCode, [api.keys.id]: bill.id, status: bill.status, tenantId: bill.tenantId });
  const base = String(window.__API_BASE_URL__ || "").replace(/\/+$/, "");
  const user = Digit.UserService.getUser() || {};
  const res = await fetch(`${base}${api.download}?${q.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/pdf,application/json" },
    body: JSON.stringify({ RequestInfo: { apiId: "Rainmaker", authToken: user.access_token, userInfo: user.info } }),
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.blob();
};

export const cancelBill = (service, bill, reason) => {
  const api = BILL_API[service];
  const user = Digit.UserService.getUser() || {};
  return call(api.cancel, {
    requestInfo: { authToken: user.access_token, userInfo: user.info },
    tenantId: bill.tenantId,
    billId: bill.id,
    demandId: [bill.demandId],
    businessService: api.cancelService,
    consumerCode: [bill.consumerCode],
    reason,
  }, { tenantId: bill.tenantId });
};

/* ---------------------------------------------------------------- arrears */
// full financial years as the demand needs them ("2025-2026"), newest first
export const fetchFinancialYearsFull = async () => {
  const res = await call("/mdms-v2/v2/_search", { MdmsCriteria: { tenantId: stateTenant(), schemaCode: "FinancialYear.FinancialYear", isActive: true, limit: 50, offset: 0 } }, {});
  return ((res && res.mdms) || []).sort((a, b) => Number(b.data.order) - Number(a.data.order)).map((i) => i.data.financialYear).filter(Boolean);
};

// accounts a verifier can add an arrear to
export const searchArrearAccounts = async ({ service, tenantId, by, value }) => {
  const v = value.trim();
  if (service === "ppt") {
    const params = { tenantId, ...(by === "ID" ? { propertyIds: v } : by === "OLD_ID" ? { oldpropertyids: v } : { ownerOldCustomerIds: v }) };
    const res = await call("/property-services/property/_search", {}, params);
    const all = res.Properties || [];
    const rows = by === "OLD_ID" ? all.filter((p) => String(p.oldpropertyids || "").trim() === v) : all;
    return rows.map((p) => ({ code: p.propertyId, tenantId: p.tenantId, name: (p.owners && p.owners[0] && p.owners[0].propertyOwnerName) || "", mobile: (p.owners && p.owners[0] && p.owners[0].mobileNumber) || "", status: p.status || "", businessService: p.businessService, conservancy: p.tenantId === "hp.Solan" && p.status === "APPROVED" }));
  }
  const crit = { tenantId, ...(by === "ID" ? { applicationNumber: [v] } : { mobileNumber: [v] }) };
  const res = await call("/garbage-service/garbage-accounts/_search", { searchCriteriaGarbageAccount: crit }, { tenantId });
  const seen = {};
  return (res.garbageAccounts || res.GarbageAccounts || [])
    .map((g) => ({ code: g.grbgApplicationNumber || (g.grbgApplication || {}).applicationNo || "", tenantId: g.tenantId, name: g.name || (g.additionalDetail || {}).applicantName || "", mobile: g.mobileNumber || (g.additionalDetail || {}).applicantPhoneNumber || "", status: g.status || (g.grbgApplication || {}).status || "", businessService: "GB" }))
    .filter((a) => a.code && !seen[a.code] && (seen[a.code] = true) && (by !== "ID" || a.code.toLowerCase() === v.toLowerCase()));
};

const monthRange = (from, to) => {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return { from: Date.UTC(fy, fm - 1, 1), to: new Date(ty, tm, 0, 23, 59, 59, 999).getTime() };
};

// rows: [{ fy | from,to, tax, arrear, penalty, interest, description }]
export const createArrears = (service, account, rows) => {
  const ppt = service === "ppt";
  const Demands = rows.map((r) => {
    const total = round((Number(r.tax) || 0) + (Number(r.arrear) || 0) + (Number(r.penalty) || 0) + (Number(r.interest) || 0));
    let period;
    if (ppt) { const [s, e] = r.fy.split("-"); period = { taxPeriodFrom: new Date(`${s}-04-01`).getTime(), taxPeriodTo: new Date(`${e}-03-31T23:59:59`).getTime() }; }
    else { const m = monthRange(r.from, r.to); period = { taxPeriodFrom: m.from, taxPeriodTo: m.to }; }
    return {
      tenantId: account.tenantId,
      ...period,
      consumerCode: account.code,
      consumerType: ppt ? "PROPERTY" : "GB",
      businessService: account.businessService || (ppt ? "PROPERTY" : "GB"),
      demandDetails: [{ taxHeadMasterCode: ppt ? "LCF.Property_Tax_Collection_Fee" : "LCF.Garbage_Collection_Fee", taxAmount: total, collectionAmount: 0, additionalDetails: { type: "fee" } }],
      minimumAmountPayable: total,
      additionalDetails: {
        source: ppt ? "Property Arrear" : "Garbage Arrear",
        financialYear: ppt ? (account.conservancy && r.fy === "2022-2023" ? "2022-2023 Conservancy Tax Before 04-08-2022" : r.fy) : `${r.from} to ${r.to}`,
        propertyTax: r.tax, arear: r.arrear, penalty: r.penalty, interest: r.interest, description: r.description, total: String(total),
      },
    };
  });
  return call(ppt ? "/property-services/property/_createArear" : "/garbage-service/garbage-accounts/_createArear", { Demands }, { tenantId: account.tenantId });
};
export const arrearTotal = (r) => round((Number(r.tax) || 0) + (Number(r.arrear) || 0) + (Number(r.penalty) || 0) + (Number(r.interest) || 0));

/* ---------------------------------------------------------------- payments */
export const ONLINE_MODES = [["PAYTMPOS", "WRK_PAY_POS"], ["RAZORPAY", "WRK_PAY_RAZORPAY"]];
export const PAY_MODES = [["CASH", "WRK_PAY_CASH"], ["DD", "WRK_PAY_DD"], ["CHEQUE", "WRK_PAY_CHEQUE"], ["OFFLINE_NEFT", "WRK_PAY_NEFT"], ["OFFLINE_RTGS", "WRK_PAY_RTGS"]];
export const BANK_MODES = ["CHEQUE", "DD", "OFFLINE_NEFT", "OFFLINE_RTGS"];
// partial payment: property bills always, garbage only from Rs 5,000 (as in the old counter)
export const canPayPartly = (service, bill) => service === "ppt" || Math.max(bill.total, bill.due, bill.paid) >= 5000;
export const fetchBanks = async () => {
  const res = await call("/egf-master/banks/_search", {}, { tenantId: stateTenant() });
  return (res && res.banks) || [];
};
// one bill, paid at the counter (offline modes)
export const collectPayment = (bill, { amount, mode, receipt, bank, date, online }) => {
  const user = Digit.UserService.getUser() || {};
  const module = bill.businessService;
  const amountPaid = round(amount);
  const base = String(window.__API_BASE_URL__ || "").replace(/\/+$/, "");
  return call("/pg-service/transaction/v2/_create", {
    Transactions: [{
      txnAmount: amountPaid,
      tenantId: bill.tenantId,
      module, moduleId: module, productInfo: module,
      billId: bill.id,
      consumerCode: bill.consumerCode,
      isMultiTransaction: false,
      gateway: online ? mode : "OFFLINE",
      gatewayPaymentMode: mode,
      receipt: receipt || "",
      additionalDetails: { receipt: receipt || "", bank: bank || "", transactionDate: date || "" },
      callbackUrl: `${base}/pg-service/transaction/v2/_update`,
      user: { name: bill.payer || (user.info || {}).name || "", mobileNumber: bill.mobile || (user.info || {}).mobileNumber || "", tenantId: stateTenant() },
      taxAndPayments: [{ taxAmount: 0, amountPaid, billId: bill.id }],
      TransactionDetails: [{ txnAmount: amountPaid, billId: bill.id, consumerCode: bill.consumerCode, module, moduleId: module, payerName: bill.payer, mobileNumber: bill.mobile }],
    }],
  }, { tenantId: bill.tenantId });
};
// cheque / DD cleared (SUCCESS) or bounced (FAILURE)
export const settleCheque = (bill, action) => call("/pg-service/transaction/v2/_updateChequeTransaction", { billId: bill.id, action }, { tenantId: bill.tenantId });

// resend the bill SMS (the server allows it twice per bill)
export const resendBillSms = async (bill) => {
  const count = await call("/notification-sms/resend-counter", { billId: bill.id }, { tenantId: bill.tenantId });
  if (Number(count) > 2) return { limit: true };
  const res = await call("/notification-sms/send-sms", { billId: bill.id }, { tenantId: bill.tenantId });
  return { message: res && res.message };
};

/* online payment: Razorpay checkout / Paytm POS terminal (configure RAZORPAY_KEY, RAZORPAY_SCRIPT_URL, RAZORPAY_CURRENCY in globalConfigs) */
const cfg = (k, d) => { try { return (window.globalConfigs && window.globalConfigs.getConfig(k)) || d; } catch (e) { return d; } };
export const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement("script");
  s.src = cfg("RAZORPAY_SCRIPT_URL", "https://checkout.razorpay.com/v1/checkout.js");
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});
export const razorpayKey = () => cfg("RAZORPAY_KEY", "");
export const openRazorpay = (tx, { onPaid, onFailed, onDismiss }) => {
  const t0 = (tx.Transactions || [])[0] || {};
  const codes = tx.consumerCodeArray || [];
  const rz = new window.Razorpay({
    key: razorpayKey(),
    amount: tx.totalPayableAmount,
    currency: cfg("RAZORPAY_CURRENCY", "INR"),
    name: (tx.user || {}).name,
    description: `Payment for Application ${codes.slice(0, 3).join(", ")}`,
    order_id: (tx.orderIdArray || [])[0],
    handler: async () => {
      try {
        const r = await call("/pg-service/transaction/v2/_update", {}, { eg_pg_txnid: t0.txnId, tenantId: t0.tenantId });
        const st = ((r.Transactions || [])[0] || {}).txnStatus;
        if (st === "SUCCESS") onPaid(); else onFailed(st);
      } catch (e) { onFailed(); }
    },
    prefill: { name: (tx.user || {}).name, email: (tx.user || {}).emailId, contact: (tx.user || {}).mobileNumber },
    theme: { color: "#1f3a8a" },
    modal: { ondismiss: () => { call("/pg-service/transaction/v2/_update", {}, { eg_pg_txnid: t0.txnId, tenantId: t0.tenantId }).catch(() => {}); onDismiss(); } },
  });
  rz.open();
};
// Paytm POS: the terminal is prompted; poll until the transaction settles
export const pollPaytmPos = async (txnId, tenantId, { tries = 6, every = 20000 } = {}) => {
  for (let i = 0; i < tries; i += 1) {
    await new Promise((r) => setTimeout(r, every));
    const r = await call("/pg-service/transaction/v2/_update", {}, { transactionId: txnId, tenantId }).catch(() => null);
    const st = r && ((r.Transactions || [])[0] || {}).txnStatus;
    if (st === "SUCCESS" || st === "FAILURE") return st;
  }
  return "PENDING";
};
