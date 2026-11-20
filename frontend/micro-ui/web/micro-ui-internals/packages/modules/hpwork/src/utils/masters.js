/* State-level MDMS (mdms-v2) master management: schemas, records, create / update / disable. */
import { call, roleCodes } from "./work";

const ADMIN_ROLES = ["UD_ADMIN", "UD-ADMIN", "SUPERUSER", "MDMS_ADMIN"];
export const canManageMasters = (roles = roleCodes()) => ADMIN_ROLES.some((r) => roles.indexOf(r) >= 0);
export const mastersTenant = () => Digit.ULBService.getStateId();

export const fetchSchemas = async () => {
  const tenantId = mastersTenant();
  const res = await call("/mdms-v2/schema/v1/_search", { SchemaDefCriteria: { tenantId, limit: 1000, offset: 0 } }, { tenantId });
  return ((res && res.SchemaDefinitions) || [])
    .filter((s) => s && s.code)
    .map((s) => ({ code: s.code, description: s.description || "", active: s.isActive !== false, definition: typeof s.definition === "string" ? JSON.parse(s.definition) : s.definition || {} }))
    .sort((a, b) => a.code.localeCompare(b.code));
};

export const fetchRecords = async ({ schemaCode, tenantId = mastersTenant(), isActive, limit, offset }) => {
  const res = await call("/mdms-v2/v2/_search", { MdmsCriteria: { tenantId, schemaCode, limit, offset, ...(isActive === undefined || isActive === "" ? {} : { isActive }) } }, { tenantId });
  return (res && res.mdms) || [];
};

const failIfErrors = (res) => {
  if (res && res.Errors && res.Errors.length) { const e = new Error(res.Errors[0].message || res.Errors[0].code); e.Errors = res.Errors; throw e; }
  return res;
};
export const createRecord = async (schemaCode, data, tenantId = mastersTenant()) =>
  failIfErrors(await call(`/mdms-v2/v2/_create/${encodeURIComponent(schemaCode)}`, { Mdms: { tenantId, schemaCode, data, isActive: true } }, { tenantId }));
export const updateRecord = async (record, patch) =>
  failIfErrors(await call(`/mdms-v2/v2/_update/${encodeURIComponent(record.schemaCode)}`, { Mdms: { ...record, ...patch } }, { tenantId: record.tenantId }));

/* ----------------------------------------------------- schema -> form */
const primitive = (p) => ["string", "number", "integer", "boolean"].indexOf(p && p.type) >= 0;
// fields of the schema's top-level properties; anything not a plain value is edited as JSON
export const fieldsOf = (def) => {
  const props = (def && def.properties) || {};
  const required = (def && def.required) || [];
  const unique = (def && def["x-unique"]) || [];
  return Object.keys(props).map((key) => {
    const p = props[key] || {};
    const kind = p.enum ? "enum" : primitive(p) ? p.type : p.type === "array" && primitive(p.items) ? "list" : "json";
    return { key, kind, label: p.title || key, enum: p.enum || [], required: required.indexOf(key) >= 0, unique: unique.indexOf(key) >= 0, itemType: p.items && p.items.type };
  });
};
// columns shown in the table: identifying fields first, then the first plain fields
export const columnsOf = (def) => {
  const f = fieldsOf(def).filter((x) => x.kind !== "json");
  const first = f.filter((x) => x.unique).concat(f.filter((x) => !x.unique && x.required), f.filter((x) => !x.unique && !x.required));
  return first.slice(0, 4);
};

export const toForm = (fields, data = {}) => {
  const out = {};
  fields.forEach((f) => {
    const v = data[f.key];
    out[f.key] = f.kind === "json" ? (v === undefined ? "" : JSON.stringify(v, null, 2)) : f.kind === "list" ? (Array.isArray(v) ? v.join(", ") : "") : f.kind === "boolean" ? !!v : v === undefined || v === null ? "" : String(v);
  });
  return out;
};

// form values -> { data, errors }; keys the schema doesn't list are kept from `base`
export const fromForm = (fields, form, base = {}, t) => {
  const data = { ...base };
  const errors = {};
  fields.forEach((f) => {
    const raw = form[f.key];
    const blank = raw === "" || raw === undefined || raw === null;
    if (blank && f.kind !== "boolean") {
      if (f.required) errors[f.key] = t("WRK_MST_E_REQUIRED");
      delete data[f.key];
      return;
    }
    if (f.kind === "number" || f.kind === "integer") {
      const n = Number(raw);
      if (isNaN(n) || (f.kind === "integer" && !Number.isInteger(n))) errors[f.key] = t("WRK_MST_E_NUMBER");
      else data[f.key] = n;
    } else if (f.kind === "boolean") data[f.key] = !!raw;
    else if (f.kind === "list") data[f.key] = String(raw).split(",").map((s) => s.trim()).filter(Boolean).map((s) => (f.itemType === "number" || f.itemType === "integer" ? Number(s) : s));
    else if (f.kind === "json") {
      try { data[f.key] = JSON.parse(raw); } catch (e) { errors[f.key] = t("WRK_MST_E_JSON"); }
    } else data[f.key] = raw;
  });
  return { data, errors };
};
export const cellText = (v) => (v === undefined || v === null || v === "" ? "-" : typeof v === "object" ? JSON.stringify(v) : String(v));
