import { OTS_ANY_OTHER, OTS_MIN_TEXT, OTS_PATTERNS } from "../config/otsConfig";

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
  return { applicantName: info.name || "", mobileNumber: info.mobileNumber || "" };
};

export const humanise = (s = "") => String(s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase());

/* ---------------------------------------------------------------- dates */
const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayYmd = () => ymd(new Date());
export const fmtDate = (v) => {
  if (!v) return "";
  const d = typeof v === "number" ? new Date(v) : new Date(`${String(v).slice(0, 10)}T00:00:00`);
  return isNaN(d) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
export const fmtTime = (ms) => (ms ? new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
export const ageOn = (dob) => {
  if (!dob) return "";
  const b = new Date(`${dob}T00:00:00`);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a -= 1;
  return a >= 0 ? a : "";
};
export const inr = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v));
export const loanTotal = (l) => num(l.principal) + num(l.interest);
// settlement years offered: current year back to 1990
export const settlementYears = () => {
  const y = new Date().getFullYear();
  return Array.from({ length: y - 1989 }, (_, i) => String(y - i));
};

/* ------------------------------------------------------------ validation */
const checkFields = (fields, values, ctx = {}) => {
  const errors = {};
  fields.forEach((f) => {
    if (f.showWhen && values[f.showWhen.field] !== f.showWhen.equals) return;
    const v = values[f.name];
    if (f.required && isEmpty(v)) {
      errors[f.name] = "OTS_E_REQUIRED";
      return;
    }
    if (isEmpty(v)) return;
    if (f.pattern && !OTS_PATTERNS[f.pattern].re.test(String(v).trim())) errors[f.name] = OTS_PATTERNS[f.pattern].error;
    else if (f.money && !(Number(v) > 0)) errors[f.name] = "OTS_E_AMOUNT";
    else if (f.type === "date" && f.maxToday && v > todayYmd()) errors[f.name] = "OTS_E_FUTURE_DATE";
    else if (f.minFrom && values[f.minFrom] && v < values[f.minFrom]) errors[f.name] = "OTS_E_NPA_BEFORE_LOAN";
  });
  return errors;
};

// Returns { fieldName: i18nErrorKey } for one form page; empty when valid.
export const validatePage = (page, values) => checkFields(page.fields || [], values);
export const validateRow = (fields, values) => checkFields(fields, values);

export const validateLoans = (loans, totalRepayment) => {
  const errors = {};
  if (!loans || loans.length === 0) errors.list = "OTS_E_LOAN_ATLEAST_ONE";
  if (isEmpty(totalRepayment)) errors.totalRepayment = "OTS_E_REQUIRED";
  else if (!(Number(totalRepayment) >= 0)) errors.totalRepayment = "OTS_E_AMOUNT";
  return errors;
};

export const validateSettlement = (s) => {
  const errors = {};
  if (!s.hasLoanSettlementFacility) errors.hasLoanSettlementFacility = "OTS_E_REQUIRED";
  if (s.hasLoanSettlementFacility === "YES" && (!s.list || s.list.length === 0)) errors.list = "OTS_E_SETTLEMENT_ATLEAST_ONE";
  ["briefHistory", "nonPaymentReason"].forEach((k) => {
    const v = (s[k] || "").trim();
    if (!v) errors[k] = "OTS_E_REQUIRED";
    else if (v.length < OTS_MIN_TEXT) errors[k] = "OTS_E_MIN_TEXT";
  });
  return errors;
};

/* --------------------------------------------------------------- API calls */
// params carry a timestamp so Digit's POST response cache never replays an old answer
const call = (url, data, params) => Digit.CustomService.getResponse({ url, params: { tenantId: Digit.ULBService.getStateId(), ...(params || {}), _: Date.now() }, data });

const mdmsV1 = (moduleName, name, filter) =>
  call(
    "/egov-mdms-service/v1/_search",
    { RequestInfo: auth(), MdmsCriteria: { tenantId: "hp", moduleDetails: [{ moduleName, masterDetails: [filter ? { name, filter } : { name }] }] } },
    { tenantId: "hp" }
  );

const mdmsV2 = (schemaCode, filters) =>
  call("/egov-mdms-service/v2/_search", { RequestInfo: auth(), MdmsCriteria: { tenantId: "hp", schemaCode, ...(filters ? { filters } : {}), limit: 500 } });

export const OtsApi = {
  ulbs: () => mdmsV1("District", "ULBS"),
  wards: (ulbName) => mdmsV1("ULBS", "Wards", `[?(@.ulbName == "${String(ulbName).replace(/"/g, "")}")]`),
  categories: () => mdmsV2("OTS.ShopCategory"),
  bankByIfsc: (ifsc) => mdmsV2("OTS.BankMaster", { bankIfscCode: ifsc }),
  // RDF-monitoring (PHP) service. It answers HTTP 200 with { status:false } on failure, so that is turned into an error here.
  create: async (payload) => {
    const info = Digit.UserService.getUser()?.info || {};
    const res = await call("/rdf-monitoring/msme/create-application", { RequestInfo: { ...auth(), userInfo: info }, ...payload });
    if (!res || res.status === false || !res.application_id) {
      const detail = res && (res.error || res.message || (res.errors && Object.values(res.errors).flat().join(", ")));
      throw new Error(detail && !/^Failed to create application$/i.test(detail) ? detail : "");
    }
    return res;
  },
  // the service has no owner filter beyond mobile number, so the citizen's own number is sent
  listMine: async (mobile) => {
    const res = await call("/rdf-monitoring/msme/get-applications", { RequestInfo: auth(), pageSize: 50, filters: { mobile_no: Number(mobile) } });
    if (!res || res.status === false) throw new Error(res && res.message ? res.message : "");
    return res.data || [];
  },
};

export const ulbsOf = (res) => {
  const seen = {};
  (((res || {}).MdmsRes || {}).District?.ULBS || []).forEach((u) => {
    if (u.ulbName) seen[u.ulbName] = { code: u.ulbName, label: u.ulbName };
  });
  return Object.values(seen).sort((a, b) => a.label.localeCompare(b.label));
};
export const wardsOf = (res) => {
  const seen = {};
  (((res || {}).MdmsRes || {}).ULBS?.Wards || []).forEach((w) => {
    if (w.wardName) seen[w.wardName] = { code: w.wardName, label: w.wardName };
  });
  return Object.values(seen).sort((a, b) => a.label.localeCompare(b.label));
};
export const categoriesOf = (res) =>
  ((res || {}).mdms || [])
    .filter((m) => m.isActive !== false && m.data)
    .map((m) => ({ code: m.data.code, label: m.data.name || m.data.code }))
    .filter((c) => c.code && c.code !== OTS_ANY_OTHER)
    .sort((a, b) => a.label.localeCompare(b.label));
export const bankOf = (res) => {
  const m = ((res || {}).mdms || []).find((x) => x.isActive !== false && x.data);
  return m ? { bankName: m.data.bankName || "", branchName: m.data.bankBranch || "" } : null;
};

/* ----------------------------------------------------------- payload */
// Same field mapping as NewTheme's createRequest buildPayload (RDFMonitorning ApplicationMaster / NpaLoans / Settlements).
export const buildPayload = (params) => {
  const a = params.applicant || {};
  const s = params.shop || {};
  const loans = (params.loans || {}).list || [];
  const st = params.settlement || {};
  const totalPrincipal = loans.reduce((n, l) => n + num(l.principal), 0);
  const totalInterest = loans.reduce((n, l) => n + num(l.interest), 0);
  return {
    ApplicationMaster: {
      applicant_name: a.applicantName,
      fathers_name: a.fatherName,
      date_of_birth: a.dateOfBirth,
      is_permanent_residence_hp: a.isHimachalResident === "YES",
      mobile_no: Number(a.mobileNumber),
      category_of_shop: s.shopType === OTS_ANY_OTHER ? s.shopTypeOther : s.shopType,
      annual_turnover: Number(s.annualTurnover),
      is_family_govt_employee: s.isGovernmentEmployee === "YES",
      total_repayment: Number((params.loans || {}).totalRepayment),
      date_of_repayment: loans.length ? loans[loans.length - 1].npaDeclaredDate : null,
      is_settlement_availed: st.hasLoanSettlementFacility === "YES",
      tanentId: "HP-MSME-2025",
      name_of_ulb: s.ulbName,
      ward_name: s.ward,
      ward_no: s.ward,
      house_or_shop_no: s.shopAddress,
      area: s.shopAddress,
      city_or_village_name: s.ulbName,
    },
    npa_loans: loans.map((l) => ({
      availed_amt: Number(l.amountAvailed),
      bank_name: l.bankName,
      branch: l.branchName,
      loan_taken_date: l.loanTakenDate,
      npa_declared_date: l.npaDeclaredDate,
    })),
    settlements:
      st.hasLoanSettlementFacility === "YES"
        ? (st.list || []).map((x) => ({
            year_of_settlement: Number(x.yearOfSettlement),
            settled_amt: Number(x.amountSettled),
            is_paid_full: x.paidInFull === "YES",
            name_of_scheme: x.schemeName,
            outstanding_principal_amt: totalPrincipal,
            outstanding_interest_amt: totalInterest,
            outstanding_total_amt: totalPrincipal + totalInterest,
          }))
        : [],
  };
};

/* ------------------------------------------------- list / view helpers */
export const createdOf = (rec) => (rec.created_at ? new Date(String(rec.created_at).replace(" ", "T")).getTime() : 0);
export const yesNo = (t, v) => (v === true || v === 1 || v === "1" || v === "t" || v === "true" ? t("OTS_O_YES") : t("OTS_O_NO"));
