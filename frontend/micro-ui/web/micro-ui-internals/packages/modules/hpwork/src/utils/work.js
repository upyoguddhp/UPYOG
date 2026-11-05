/* Shared helpers of the HP employee Work module. */

const isEmpty = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

export const auth = () => ({ apiId: "Rainmaker", authToken: Digit.UserService.getUser()?.access_token });

// Pulls the most useful message out of a failed API response/exception.
export const apiErrorMessage = (err, fallback) => {
  const e = err?.response?.data?.Errors?.[0] || err?.Errors?.[0] || err?.data?.Errors?.[0];
  const raw = e?.message || e?.description || err?.message;
  return !raw || /^Request failed with status code|^Network Error/i.test(raw) ? fallback : raw;
};

// codes such as AHS_Kangra_Dharamshala or PENDINGFORVERIFICATION -> readable text
export const humanise = (s = "") =>
  String(s === null || s === undefined || String(s) === "null" ? "" : s).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();
// callers pass (status) or (t, status)
export const statusText = (a, b) => {
  const s = typeof a === "function" ? b || "" : a || "";
  const t = humanise(String(s).replace(/PENDINGFOR/i, "PENDING FOR ").replace(/PENDINGAT/i, "PENDING AT ")).toLowerCase().replace(/\b(lme|lmhe)\b/g, (m) => m.toUpperCase());
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const valueText = (v) => (isEmpty(v) || /^(null|undefined)$/i.test(String(v).trim()) ? "" : Array.isArray(v) ? v.map(humanise).join(", ") : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v));

export const fmtDate = (v) => {
  if (!v) return "";
  const d = typeof v === "number" ? new Date(v) : new Date(String(v));
  return isNaN(d) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
export const fmtTime = (ms) => (ms ? new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

/* ---------------------------------------------------------- signed-in employee */
export const getUser = () => (Digit.UserService.getUser() || {}).info || {};
export const roleCodes = () => Array.from(new Set((getUser().roles || []).map((r) => r.code)));
// ULBs where the employee holds a role (e.g. hp.Shimla); the state tenant "hp" is not a ULB to work in
export const userTenants = () => {
  const own = getUser().tenantId;
  const all = (getUser().roles || []).map((r) => r.tenantId).concat(own ? [own] : []);
  return Array.from(new Set(all.filter(Boolean)));
};
export const currentTenant = () => Digit.ULBService.getCurrentTenantId() || getUser().tenantId;
export const ulbName = (tenantId = "") => humanise(String(tenantId).split(".").slice(1).join(" ") || tenantId);

/* ---------------------------------------------------------------- API calls */
// the gateway authorises the call by the tenantId it finds in the query/body: always send one
export const call = (url, data, params) =>
  Digit.CustomService.getResponse({ url, params: { tenantId: Digit.ULBService.getStateId(), ...(params || {}), _: Date.now() }, data: { RequestInfo: auth(), ...(data || {}) } });

/* ---------------------------------------------------------------- workflow */
const wfCache = {};
// business service definition (states + actions with roles) of one ULB
export const fetchWfDef = async (businessService, tenantId) => {
  const key = `${businessService}|${tenantId}`;
  const load = (tn) => Digit.WorkflowService.init(tn, businessService).then((r) => (r && r.BusinessServices && r.BusinessServices[0]) || null);
  // some services (PGR) define their workflow once at the state tenant
  if (!wfCache[key]) wfCache[key] = load(tenantId).then((d) => (d && (d.states || []).length ? d : load(Digit.ULBService.getStateId())));
  try {
    return await wfCache[key];
  } catch (e) {
    delete wfCache[key];
    throw e;
  }
};
// an application still being filled in by the citizen (INITIATED / DRAFT) is not the employee's to check
export const isDraft = (s = "") => /^(INITIATED|DRAFT)$/i.test(String(s));
export const stateKey = (s) => s.applicationStatus || s.state;

// states in which one of the employee's roles has an action = the employee's work queue
// actions that only send a finished application back are not work to do (e.g. returning an APPROVED application)
const RETURN_ONLY = /^(RETURN_TO_INITIATOR(_FOR_PAYMENT)?|REOPEN|OPEN|REASSESS|RE_ASSESS|CLOSE|TEMPERORY_CLOSED|TEMPORARY_CLOSED|WITHDRAW)$/i;
export const actionableStatuses = (def, roles = roleCodes()) => {
  if (!def) return [];
  return (def.states || [])
    .filter((s) => (s.actions || []).some((a) => a.active !== false && !RETURN_ONLY.test(a.action || "") && (a.roles || []).some((r) => roles.indexOf(r) >= 0)))
    .map(stateKey)
    .filter((x) => x && !isDraft(x));
};
export const allStatuses = (def) => (def ? (def.states || []).map(stateKey).filter((x) => x && !isDraft(x)) : []);
export const canWork = (def, roles = roleCodes()) => actionableStatuses(def, roles).length > 0;

export const processHistory = (tenantId, id) => Digit.WorkflowService.getByBusinessId(tenantId, id);

// roles that can act in the state a given action leads to -> who the application can be assigned to
export const assigneeRolesFor = (def, nextStateUuid) => {
  const st = def && (def.states || []).find((s) => s.uuid === nextStateUuid);
  if (!st) return [];
  return Array.from(new Set((st.actions || []).filter((a) => a.active !== false).flatMap((a) => a.roles || []))).filter((r) => r !== "CITIZEN" && r !== "SYSTEM");
};
// the user service holds employees under the state tenant with roles scoped to the ULB, and the HRMS records are not flagged active, so ask the user service
export const employeesByRoles = async (tenantId, roles) => {
  if (!roles.length) return [];
  const res = await call(`/user/_search`, { tenantId, roleCodes: roles, userType: "EMPLOYEE", active: true, pageSize: 200 }, { tenantId });
  const seen = {};
  return ((res && res.user) || [])
    .filter((u) => u.uuid && !seen[u.uuid] && (seen[u.uuid] = true))
    .map((u) => ({ code: u.uuid, label: `${u.name || u.userName}${u.mobileNumber ? ` (${u.mobileNumber})` : ""}` }))
    .sort((x, y) => x.label.localeCompare(y.label));
};

// actions the employee may take on the application right now: [{ action, nextStateUuid }]
export const nextActionsOf = (process, roles = roleCodes()) => {
  const pi = process && process.ProcessInstances && process.ProcessInstances[0];
  const seen = {};
  return ((pi && pi.nextActions) || [])
    .filter((a) => (!(a.roles || []).length || a.roles.some((r) => roles.indexOf(r) >= 0)) && a.action !== "CLOSE" && !seen[a.action] && (seen[a.action] = true))
    .map((a) => ({ action: a.action, nextState: a.nextState || "", roles: a.roles || [] }));
};

// status -> badge colour family shared with the other npt screens
export const stageOf = (status = "") => {
  const s = String(status).toUpperCase();
  if (/REJECT|CLOSE|CANCEL|EXPIRED/.test(s)) return "closed";
  if (/APPROVED|RESOLVED|COMPLETED|ACTIVE|PAID|ISSUED/.test(s)) return "approved";
  if (/PAYMENT/.test(s)) return "payment";
  if (/INITIATED|DRAFT/.test(s)) return "draft";
  return "progress";
};

// ULBs the employee can work in (state tenant excluded unless it is the only one)
export const workTenants = () => {
  const all = userTenants();
  const ulbs = all.filter((x) => x.indexOf(".") > 0);
  return ulbs.length ? ulbs : all.length ? all : [currentTenant()];
};
export const defaultTenant = () => {
  const cur = currentTenant();
  const list = workTenants();
  return list.indexOf(cur) >= 0 ? cur : list[0];
};

// uuid of the state an action leads to, read from the business service definition (process nextActions may omit it)
export const nextStateOf = (def, process, action) => {
  const pi = process && process.ProcessInstances && process.ProcessInstances[0];
  const cur = pi && pi.state && pi.state.uuid;
  const st = def && (def.states || []).find((x) => x.uuid === cur);
  const a = st && (st.actions || []).find((x) => x.action === action);
  return (a && a.nextState) || "";
};
