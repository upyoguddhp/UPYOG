// Billing business services a citizen can owe money for (egbs_demand_v1.businessservice).
export const PAY_SERVICES = [
  { code: "PROPERTY", key: "PAY_SVC_PROPERTY", label: "Property tax" },
  { code: "GB", key: "PAY_SVC_GB", label: "Garbage collection charges" },
  { code: "NewTL", key: "PAY_SVC_NEWTL", label: "Trade licence fee" },
  { code: "pet-services", key: "PAY_SVC_PET", label: "Pet licence fee" },
  { code: "chb-services", key: "PAY_SVC_CHB", label: "Community hall booking fee" },
  { code: "ADVT", key: "PAY_SVC_ADVT", label: "Advertisement site booking fee" },
  { code: "REQSERV", key: "PAY_SVC_REQSERV", label: "Request service fee" },
];
export const serviceOf = (code) => PAY_SERVICES.find((s) => s.code === code) || { code, key: "", label: humanise(code) };

const auth = () => ({ apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token });

// Pulls the most useful message out of a failed API response/exception.
export const apiErrorMessage = (err, fallback) => {
  const e = err?.response?.data?.Errors?.[0] || err?.Errors?.[0] || err?.data?.Errors?.[0];
  const raw = e?.message || e?.description || err?.message;
  // bare transport errors ("Request failed with status code 500") are not actionable for citizens
  return !raw || /^Request failed with status code|^Network Error/i.test(raw) ? fallback : raw;
};

export const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/-/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim().replace(/^./, (c) => c.toUpperCase());
export const niceName = (v) => (v == null ? v : String(v).replace(/_+/g, " ").replace(/\s+/g, " ").trim());
export const ulbOf = (tenantId = "") => niceName(String(tenantId).split(".").slice(1).join(" ")) || String(tenantId);
export const inr = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const roundToTwo = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const fmtDate = (ms) => (ms ? new Date(Number(ms)).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");
export const fmtTime = (ms) => (ms ? new Date(Number(ms)).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
export const asArray = (v) => (Array.isArray(v) ? v : []);

export const getUser = () => {
  const info = Digit.UserService.getUser()?.info || {};
  return { uuid: info.uuid, name: info.name || "", mobileNumber: info.mobileNumber || "", emailId: info.emailId || "", tenantId: info.tenantId || Digit.ULBService.getStateId() };
};

// Razorpay settings come from globalConfigs; nothing secret lives in this repo.
const cfg = (key) => (window.globalConfigs && window.globalConfigs.getConfig && window.globalConfigs.getConfig(key)) || "";
export const razorpayConfig = () => ({ script: cfg("RAZOR_PAY_SCRIPT_URL"), key: cfg("RAZOR_PAY_KEY"), currency: cfg("RAZOR_PAY_CURRENCY") || "INR", logo: cfg("RAZOR_PAY_LOGO") });
export const razorpayConfigured = () => {
  const c = razorpayConfig();
  return !!(c.script && c.key);
};
export const loadScript = (src) =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve(true);
    el.onerror = () => resolve(false);
    document.body.appendChild(el);
  });

// params carry a timestamp so Digit's POST response cache never replays an old answer; tenantId lets the gateway route
const call = (url, data, params) => Digit.CustomService.getResponse({ url, params: { tenantId: Digit.ULBService.getStateId(), ...(params || {}), _: Date.now() }, data });
// a callback URL from the gateway may be absolute; go through our own origin/proxy
const relative = (u) => {
  try {
    const x = new URL(u, window.location.origin);
    return `${x.pathname}${x.search}`;
  } catch (e) {
    return u;
  }
};

/* ------------------------------------------------------------------ bills */
// one bill per row; "no bill" is a normal answer
const NO_BILL = /NO_BILL|no bill|BILL_NOT_FOUND|EG_BS_BILL_NO_DEMANDS|No demand/i;
export const fetchBillsFor = async (service, user) => {
  try {
    const res = await Digit.PaymentService.fetchBill(user.tenantId, { businessService: service.code, ...(user.mobileNumber ? { mobileNumber: user.mobileNumber } : {}) });
    return asArray(res && res.Bill)
      .map((b) => {
        const details = asArray(b.billDetails);
        const dueMs = details.map((d) => d.expiryDate || d.toPeriod).filter(Boolean).sort((a, z) => a - z)[0];
        const from = details.map((d) => d.fromPeriod).filter(Boolean).sort((a, z) => a - z)[0];
        const to = details.map((d) => d.toPeriod).filter(Boolean).sort((a, z) => z - a)[0];
        return {
          key: `${service.code}-${b.consumerCode || b.id}-${b.id}`,
          bill: b,
          id: b.id,
          code: service.code,
          consumerCode: b.consumerCode,
          billNumber: b.billNumber,
          tenantId: b.tenantId,
          amount: Number(b.totalAmount) || 0,
          dueMs,
          from,
          to,
        };
      })
      .filter((r) => r.amount > 0);
  } catch (e) {
    if (NO_BILL.test(JSON.stringify((e && e.response && e.response.data) || (e && e.message) || ""))) return [];
    throw e;
  }
};

/* ----------------------------------------------------------- transaction */
// same shape as OldTheme CitizenPendingPayments.createTransactionPayload
export const buildTransaction = (rows, user) => {
  const first = rows[0];
  const payer = { name: String(user.name || "").replace(/[^a-zA-Z .'-]/g, "").trim() || "Citizen", mobileNumber: user.mobileNumber, emailId: user.emailId || undefined, tenantId: "hp" };
  const txn = {
    txnAmount: roundToTwo(rows.reduce((s, r) => s + Number(r.amount), 0)),
    tenantId: first.tenantId,
    callbackUrl: "",
    productInfo: first.code,
    module: first.code,
    moduleId: first.code,
    gateway: "RAZORPAY",
    taxAndPayments: rows.map((r) => ({ taxAmount: 0, amountPaid: r.amount, billId: r.id })),
    user: payer,
    TransactionDetails: rows.map((r) => ({ txnAmount: r.amount, billId: r.id, consumerCode: r.consumerCode })),
  };
  if (rows.length > 1) txn.isMultiTransaction = true;
  else {
    txn.billId = first.id;
    txn.consumerCode = first.consumerCode;
    txn.isMultiTransaction = false;
  }
  return txn;
};

export const PayApi = {
  create: (txn, uuid) => call("/pg-service/transaction/v2/_create", { RequestInfo: auth(), userUuid: uuid, Transactions: [txn] }),
  // after Razorpay: the callback carries the payment id, order id and signature
  confirm: (callbackUrl, razor) => {
    const sep = String(callbackUrl).indexOf("?") >= 0 ? "&" : "?";
    const qs = `razorpay_payment_id=${encodeURIComponent(razor.razorpay_payment_id)}&razorpay_order_id=${encodeURIComponent(razor.razorpay_order_id)}&razorpay_signature=${encodeURIComponent(razor.razorpay_signature)}`;
    return call(`${relative(callbackUrl)}${sep}${qs}`, { RequestInfo: auth() });
  },
  // the citizen closed the window: let the gateway record it
  dismiss: (txnId) => call("/pg-service/transaction/v1/_update", { RequestInfo: auth() }, { eg_pg_txnid: txnId }),
  status: (txnId) => call("/pg-service/transaction/v2/_update", { RequestInfo: auth() }, { transactionId: txnId }),
  searchPayments: (user, extra) => call("/collection-services/payments/_search", { RequestInfo: auth() }, { tenantId: user.tenantId, mobileNumber: user.mobileNumber, ...(extra || {}) }),
};

export const txnOf = (res) => (res && res.Transactions && res.Transactions[0]) || null;
export const paymentsOf = (res) => asArray(res && res.Payments);
export const receiptNoOf = (p) => ((asArray(p.paymentDetails)[0] || {}).receiptNumber) || "";
export const serviceOfPayment = (p) => ((asArray(p.paymentDetails)[0] || {}).businessService) || "";
export const consumerCodesOf = (p) => asArray(p.paymentDetails).map((d) => (d.bill || {}).consumerCode).filter(Boolean);
