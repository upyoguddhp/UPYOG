// MDMS masters for the grievance form. District / ULB / ward use the same "virtual" sub-tenants as the other HP forms
// (hp.District, hp.Districts, hp.<ULB>); grievance types are state-level (RAINMAKER-PGR.ServiceDefs).
import { activeDefs, humanise, subTypesOf, typesOf } from "../utils/grievance";

const pick = (data, moduleName, master) => (data && ((data[moduleName] && data[moduleName][master]) || data[master] || (data.MdmsRes && data.MdmsRes[moduleName] && data.MdmsRes[moduleName][master]))) || [];

const useMaster = (tenantId, moduleName, master, enabled) => {
  const q = Digit.Hooks.useCustomMDMS(tenantId, moduleName, [{ name: master }], {
    enabled: !!enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  return { list: enabled ? pick(q.data, moduleName, master) : [], isLoading: !!enabled && q.isLoading, isError: !!enabled && q.isError, refetch: q.refetch };
};

const active = (x) => String(x.active).toLowerCase() !== "false";
const asOptions = (list, nameKey = "name") => list.map((x) => ({ code: x[nameKey], label: humanise(x[nameKey]) }));

/** The grievance types / sub types (ServiceDefs) alone, for list and details pages. */
export const useServiceDefs = () => {
  const defs = useMaster(Digit.ULBService.getStateId(), "RAINMAKER-PGR", "ServiceDefs", true);
  return { ...defs, defs: activeDefs(defs.list) };
};

/** Option lists keyed by field `optionsFrom`: { options, isLoading, isError, refetch }. */
export const useGRVLookups = (values = {}) => {
  const stateId = Digit.ULBService.getStateId();
  const sd = useServiceDefs();
  const districts = useMaster(`${stateId}.District`, "District", "District", true);
  const ulbs = useMaster(`${stateId}.Districts`, values.districtName || "_", "ULBS", !!values.districtName);
  const wards = useMaster(`${stateId}.${values.ulbName}`, "wards", "wards", !!values.ulbName);
  return {
    defs: sd.defs,
    types: { ...sd, options: typesOf(sd.defs).map((t) => ({ code: t, label: humanise(t) })) },
    subTypes: { ...sd, options: subTypesOf(sd.defs, values.grievanceType).map((d) => ({ code: d.serviceCode, label: d.name })) },
    districts: { ...districts, options: asOptions(districts.list) },
    ulbs: { ...ulbs, options: asOptions(ulbs.list) },
    wards: { ...wards, options: asOptions(wards.list.filter(active)) },
  };
};
