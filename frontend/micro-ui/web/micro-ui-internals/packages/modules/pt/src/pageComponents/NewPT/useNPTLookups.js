// MDMS masters used by the form. tenantId is a "virtual" sub-tenant (hp.District, hp.Districts, hp.<ULB>),
// exactly as the OldTheme registration form queries them.
const pick = (data, moduleName, master) => data?.[moduleName]?.[master] || data?.[master] || data?.MdmsRes?.[moduleName]?.[master] || [];

const useMaster = (tenantId, moduleName, master, enabled, filter) => {
  const q = Digit.Hooks.useCustomMDMS(tenantId, moduleName, [{ name: master, ...(filter ? { filter } : {}) }], {
    enabled: !!enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  return { list: enabled ? pick(q.data, moduleName, master) : [], isLoading: !!enabled && q.isLoading, isError: !!enabled && q.isError, refetch: q.refetch };
};

const byOrder = (list) => [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
const active = (x) => String(x.active).toLowerCase() !== "false";

/**
 * Option lists for the NewPT form, keyed by field `optionsFrom`.
 * `ulb` is the ULB picked on the location step (building masters are per ULB).
 * Each entry: { options: [{code, name}], isLoading, isError, refetch }.
 */
export const useNPTLookups = (values = {}, ulb = "") => {
  const stateId = Digit.ULBService.getStateId();
  const ulbName = values.ulbName || ulb;
  const districts = useMaster(`${stateId}.District`, "District", "District", true);
  const ulbs = useMaster(`${stateId}.Districts`, values.districtName || "_", "ULBS", !!values.districtName);
  const wards = useMaster(`${stateId}.${values.ulbName}`, "wards", "wards", !!values.ulbName);
  const zones = useMaster(`${stateId}.${values.ulbName}`, "zones", "zones", !!values.ulbName);
  const structures = useMaster(stateId, "BuildingStructure", "BuildingStructure", !!ulb, undefined);
  const years = useMaster(stateId, "BuildingEstablishmentYear", "BuildingEstablishmentYear", !!ulb, undefined);
  const purposes = useMaster(stateId, "BuildingPurpose", "BuildingPurpose", !!ulbName, `[?(@.ulbName == "${ulbName}")]`);
  const uses = useMaster(stateId, "BuildingUse", "BuildingUse", !!ulbName, `[?(@.ulbName == "${ulbName}")]`);

  const asOptions = (list, nameKey = "name", extra) => list.map((x) => ({ code: x[nameKey], name: x[nameKey], ...(extra ? extra(x) : {}) }));

  return {
    districts: { ...districts, options: asOptions(districts.list) },
    ulbs: { ...ulbs, options: asOptions(ulbs.list, "name", (u) => ({ ulbType: u.type })) },
    wards: { ...wards, options: asOptions(wards.list.filter(active)) },
    zones: { ...zones, options: asOptions(zones.list.filter(active)) },
    structures: { ...structures, options: asOptions(byOrder(structures.list), "structureType") },
    years: { ...years, options: asOptions(byOrder(years.list), "yearRange") },
    purposes: { ...purposes, options: asOptions(byOrder(purposes.list), "purposeName") },
    uses: { ...uses, options: asOptions(byOrder(uses.list), "useOfBuilding") },
  };
};
