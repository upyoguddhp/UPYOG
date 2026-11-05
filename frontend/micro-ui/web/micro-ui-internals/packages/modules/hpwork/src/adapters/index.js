import GRIEVANCE from "./grievance";
import PET from "./pet";
import TL from "./tl";
import GRBG from "./grbg";
import PT from "./pt";
import HPNOC from "./hpnoc";
import SITE from "./site";
import HALL from "./hall";

/*
 * Adapter registry of the employee Work module. One adapter per citizen service:
 *   code, labelKey (WRK_SVC_*), icon (WRK icon name), businessService (workflow), dmsService (DMS serviceName of its documents)
 *   search({ tenantId, statuses[], q, limit, offset })  -> Promise<{ rows, total }>
 *        row = { id, tenantId, title, applicant, status, appliedOn, kind? }
 *   fetch(id, tenantId)                                  -> Promise<record | null>
 *   summary(record)                                      -> { id, title, status, sections: [{ head, rows: [[labelKey, value]] }] }
 *   buildUpdate(record, action, { comment, assignees })  -> { url, data } (POSTed with RequestInfo + tenantId)
 * Add a service by creating adapters/<name>.js and listing it below.
 */
export const ADAPTERS = [TL, PET, GRBG, PT, HPNOC, SITE, HALL, GRIEVANCE];
export const adapterByCode = (code) => ADAPTERS.find((a) => a.code === code);
