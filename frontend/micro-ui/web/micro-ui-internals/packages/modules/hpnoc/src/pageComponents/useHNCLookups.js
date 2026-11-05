// MDMS masters for the NOC form. ULBs come from District.ULBS and wards from ULBS.Wards (filtered by ULB), both state-level.

const pick = (data, moduleName, master) => (data && ((data[moduleName] && data[moduleName][master]) || data[master] || (data.MdmsRes && data.MdmsRes[moduleName] && data.MdmsRes[moduleName][master]))) || [];

const useMaster = (tenantId, moduleName, master, enabled, filter) => {
  const q = Digit.Hooks.useCustomMDMS(tenantId, moduleName, [filter ? { name: master, filter } : { name: master }], {
    enabled: !!enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  return { list: enabled ? pick(q.data, moduleName, master) : [], isLoading: !!enabled && q.isLoading, isError: !!enabled && q.isError, refetch: q.refetch };
};

const active = (x) => String(x.active).toLowerCase() !== "false";

/** Option lists keyed by field `optionsFrom`: { options, isLoading, isError, refetch }; `ulbList` carries the ULB type. */
export const useHNCLookups = (values = {}) => {
  const stateId = Digit.ULBService.getStateId();
  const ulbs = useMaster(stateId, "District", "ULBS", true);
  const wards = useMaster(stateId, "ULBS", "Wards", !!values.ulbName, `[?(@.ulbName=='${String(values.ulbName || "").replace(/'/g, "")}')]`);
  const ulbOptions = ulbs.list.filter(active).map((x) => ({ code: x.ulbName, label: x.ulbName, type: x.type }));
  return {
    ulbList: ulbOptions,
    ulbs: { ...ulbs, options: ulbOptions },
    wards: { ...wards, options: wards.list.filter(active).map((x) => ({ code: x.wardName, label: x.wardName })) },
  };
};
