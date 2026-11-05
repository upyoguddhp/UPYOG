// MDMS masters for the request form. District / ULB / ward use the same "virtual" sub-tenants as the other HP forms
// (hp.District, hp.Districts, hp.<ULB>); service categories + fees are state-level (RequestService.Categories).
import { categoriesOf } from "../utils/reqsvc";

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
const asOptions = (list, nameKey = "name") => list.map((x) => ({ code: x[nameKey], label: x[nameKey] }));

/** Option lists keyed by field `optionsFrom`: { options, isLoading, isError, refetch }; also `rawCategories` for fee maths. */
export const useRQSLookups = (values = {}) => {
  const stateId = Digit.ULBService.getStateId();
  const cats = useMaster(stateId, "RequestService", "Categories", true);
  const districts = useMaster(`${stateId}.District`, "District", "District", true);
  const ulbs = useMaster(`${stateId}.Districts`, values.districtName || "_", "ULBS", !!values.districtName);
  const wards = useMaster(`${stateId}.${values.ulbName}`, "wards", "wards", !!values.ulbName);
  const categories = categoriesOf(cats.list);
  return {
    rawCategories: categories,
    categories: { ...cats, options: categories.map((c) => ({ code: c.categories, label: c.categories, fee: c.fee })) },
    districts: { ...districts, options: asOptions(districts.list) },
    ulbs: { ...ulbs, options: asOptions(ulbs.list) },
    wards: { ...wards, options: asOptions(wards.list.filter(active)) },
  };
};
