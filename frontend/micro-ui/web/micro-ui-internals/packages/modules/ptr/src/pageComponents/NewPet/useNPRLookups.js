// MDMS masters used by the form. District / ULB / ward use "virtual" sub-tenants (hp.District, hp.Districts, hp.<ULB>),
// exactly as the Trade Licence form does; pet type and breed come from the PetService module at state level.
const pick = (data, moduleName, master) => data?.[moduleName]?.[master] || data?.[master] || data?.MdmsRes?.[moduleName]?.[master] || [];

const unique = (list, key) => {
  const seen = new Set();
  return list.filter((x) => {
    const k = x[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

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

/**
 * Cascading option lists for the NewPet form, keyed by field `optionsFrom`.
 * Each entry: { options: [{code, name, ...}], isLoading, isError, refetch }.
 */
export const useNPRLookups = (values = {}) => {
  const stateId = Digit.ULBService.getStateId();
  const districts = useMaster(`${stateId}.District`, "District", "District", true);
  const ulbs = useMaster(`${stateId}.Districts`, values.districtName || "_", "ULBS", !!values.districtName);
  const wards = useMaster(`${stateId}.${values.ulbName}`, "wards", "wards", !!values.ulbName);
  const petTypes = useMaster(stateId, "PetService", "PetType", true);
  const breedTypes = useMaster(stateId, "PetService", "BreedType", true);

  const asOptions = (list, nameKey = "name", extra) => list.map((x) => ({ code: x[nameKey], name: x[nameKey], ...(extra ? extra(x) : {}) }));
  const breeds = breedTypes.list.filter((b) => active(b) && (!values.petType || !b.PetType || b.PetType === values.petType));

  return {
    districts: { ...districts, options: asOptions(districts.list) },
    ulbs: { ...ulbs, options: asOptions(ulbs.list, "name", (u) => ({ ulbType: u.type })) },
    wards: { ...wards, options: asOptions(wards.list.filter(active)) },
    petTypes: { ...petTypes, options: asOptions(unique(petTypes.list.filter(active), "name")) },
    breeds: { ...breedTypes, options: asOptions(unique(breeds, "name"), "name", (b) => ({ isBannedPet: b.isBannedPet === true || String(b.isBannedPet) === "true" })) },
  };
};
