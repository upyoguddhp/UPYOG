import { useEffect, useState } from "react";
import { DASHBOARD_SERVICES, MDMS_SCHEMA, MDMS_SERVICES, activeServiceCodes, activeServiceCodesV2 } from "./sources";

/**
 * Which services are active, read from MDMS:
 *   1. MDMS v2   POST /mdms-v2/v2/_search  (schema Workflow.BusinessServiceMasterConfig)
 *   2. MDMS v1   if v2 is refused or unreachable (e.g. a citizen role without access to the v2 search)
 *   3. DASHBOARD_SERVICES as a last resort, so the dashboard never ends up empty.
 * Returns { services, source: "mdms-v2" | "mdms-v1" | "fallback", loading }.
 */
export const useEnabledServices = ({ tenantId, stateId }) => {
  const [state, setState] = useState({ services: DASHBOARD_SERVICES, source: "fallback", loading: true });

  useEffect(() => {
    if (!tenantId) return undefined;
    let alive = true;
    const done = (services, source) => alive && setState({ services, source, loading: false });

    const viaV2 = () =>
      Digit.CustomService.getResponse({
        url: "/mdms-v2/v2/_search",
        data: { MdmsCriteria: { tenantId: stateId || tenantId, schemaCode: MDMS_SCHEMA, limit: 200 } },
      }).then((res) => activeServiceCodesV2(res));

    const viaV1 = () =>
      Digit.MDMSService.getMultipleTypesWithFilter(stateId || tenantId, MDMS_SERVICES.moduleName, [
        { name: MDMS_SERVICES.masterName },
      ]).then((res) => activeServiceCodes(res));

    viaV2()
      .catch(() => [])
      .then((codes) => (codes.length ? done(codes, "mdms-v2") : viaV1().catch(() => []).then((c) => (c.length ? done(c, "mdms-v1") : done(DASHBOARD_SERVICES, "fallback")))));

    return () => {
      alive = false;
    };
  }, [tenantId, stateId]);

  return state;
};
