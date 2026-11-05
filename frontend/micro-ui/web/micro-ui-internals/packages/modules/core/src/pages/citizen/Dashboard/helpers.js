/** Pure helpers for the citizen dashboard (no React, no network). */

export const DASH_BASE = "/digit-ui/citizen";
export const DASH_URL = `${DASH_BASE}/dashboard`;

const DAY = 24 * 60 * 60 * 1000;

const DONE_RE = /(RESOLVED|APPROVED|ISSUED|ACTIVE_CERT|CLOSED|COMPLETED|PAID|DISBURSED|REGISTERED|FULFILLED|ACTIVATED)/i;
const STOP_RE = /(REJECT|CANCEL|WITHDRAW|DECLIN|EXPIRED)/i;
const ACTION_RE = /(CITIZEN|PENDING_FOR_DOCUMENT|PENDINGFORDOCUMENT|SENDBACK|SEND_BACK|REASSIGN|MODIFY|RESUBMIT|PENDINGPAYMENT|PENDING_PAYMENT|PENDING_FOR_PAYMENT)/i;

/** Normalise a raw workflow status into a stage the UI can draw. */
export const classifyStatus = (status = "") => {
  const s = String(status || "");
  if (STOP_RE.test(s)) return { stage: "stopped", progress: 100 };
  if (DONE_RE.test(s)) return { stage: "done", progress: 100 };
  if (ACTION_RE.test(s)) return { stage: "action", progress: 45 };
  if (/(APPLIED|SUBMIT|PENDINGFORASSIGNMENT|PENDING_FOR_ASSIGNMENT|INITIATED)/i.test(s)) return { stage: "active", progress: 20 };
  if (/(INSPECT|VERIF|SCRUTIN|FIELD)/i.test(s)) return { stage: "active", progress: 60 };
  if (/(APPROVAL|APPROVE|FORWARD)/i.test(s)) return { stage: "active", progress: 80 };
  return { stage: "active", progress: 50 };
};

const STATUS_LABELS = {
  PENDINGFORASSIGNMENT: "Waiting for assignment",
  PENDINGATLME: "Assigned to staff",
  PENDINGFORREASSIGNMENT: "Being reassigned",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  CLOSEDAFTERRESOLUTION: "Closed",
  CANCELLED: "Cancelled",
  APPLIED: "Submitted",
  CITIZENACTIONREQUIRED: "Needs your action",
  CITIZEN_ACTION_REQUIRED: "Needs your action",
  EXPIRED: "Expired",
  INWORKFLOW: "Under processing",
  INITIATED: "Draft",
  PENDINGAPPROVAL: "Awaiting approval",
  PENDINGFORPAYMENT: "Payment pending",
  PENDINGFORDOCUMENTVERIFICATION: "Documents under review",
  FIELDINSPECTION: "Field inspection",
  APPROVED: "Approved",
  CONNECTION_ACTIVATED: "Connection active",
  PENDING_FOR_CONNECTION_ACTIVATION: "Awaiting activation",
  PENDING_FOR_PAYMENT: "Payment pending",
  PENDING_FOR_DOCUMENT_VERIFICATION: "Documents under review",
  PENDING_FOR_FIELD_INSPECTION: "Field inspection",
  PENDING_APPROVAL_FOR_CONNECTION: "Awaiting approval",
  ACTIVE: "Active",
  PAID: "Paid",
};

export const humanise = (code = "") =>
  STATUS_LABELS[String(code || "").toUpperCase()] || rawHumanise(code);

const rawHumanise = (code = "") =>
  String(code || "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatINR = (n) => {
  const v = Number(n) || 0;
  return `₹ ${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

export const toDate = (ms) => {
  const n = Number(ms);
  if (!n) return null;
  const d = new Date(n);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (ms, opts = { day: "numeric", month: "short", year: "numeric" }) => {
  const d = toDate(ms);
  return d ? d.toLocaleDateString("en-IN", opts) : "";
};

export const daysFrom = (ms, now = Date.now()) => {
  const d = toDate(ms);
  if (!d) return null;
  const a = new Date(now);
  a.setHours(0, 0, 0, 0);
  const b = new Date(d);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / DAY);
};

export const timeAgo = (ms, now = Date.now()) => {
  const d = toDate(ms);
  if (!d) return "";
  const diff = Math.max(0, now - d.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(ms);
};

export const greeting = (now = new Date()) => {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/** "Rakesh Kumar" -> "Rakesh"; empty names never render as "undefined". */
export const firstName = (name = "") => String(name || "").trim().split(/\s+/)[0] || "";

export const initials = (name = "") =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "C";

/**
 * Pick the single most useful thing the citizen should do next:
 * overdue dues > application waiting on the citizen > dues due soon > nothing.
 */
export const nextBestAction = (applications = [], dues = [], now = Date.now()) => {
  const overdue = dues
    .filter((d) => d.dueMs && daysFrom(d.dueMs, now) < 0)
    .sort((a, b) => a.dueMs - b.dueMs)[0];
  if (overdue) return { kind: "overdue", item: overdue };
  const blocked = applications.find((a) => a.stage === "action");
  if (blocked) return { kind: "application", item: blocked };
  const soon = dues
    .filter((d) => d.dueMs && daysFrom(d.dueMs, now) <= 7)
    .sort((a, b) => a.dueMs - b.dueMs)[0];
  if (soon) return { kind: "due-soon", item: soon };
  return null;
};

/** Build the cells of a month grid, Monday first. */
export const monthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
};

export const sameDay = (ms, y, m, d) => {
  const dt = toDate(ms);
  return !!dt && dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
};
