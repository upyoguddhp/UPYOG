import { NTL_PROHIBITED_TRADE } from "../../config/newTLConfig";

// MDMS masters used by the form. tenantId is a "virtual" sub-tenant (hp.District, hp.Districts, hp.<ULB>),
// exactly as the OldTheme registration form queries them.
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

/**
 * Cascading option lists for the NewTL form, keyed by field `optionsFrom`.
 * Each entry: { options: [{code, name}], isLoading, isError, refetch }.
 */
export const useNTLLookups = (values = {}) => {
  const stateId = Digit.ULBService.getStateId();
  const districts = useMaster(`${stateId}.District`, "District", "District", true);
  const ulbs = useMaster(`${stateId}.Districts`, values.districtName || "_", "ULBS", !!values.districtName);
  const wards = useMaster(`${stateId}.${values.ulbName}`, "wards", "wards", !!values.ulbName);
  const zones = useMaster(`${stateId}.${values.ulbName}`, "zones", "zones", !!values.ulbName);
  const categories = useMaster(stateId, "TradeLicense", "Categories", true);

  const cats = categories.list.filter((c) => String(c.active).toLowerCase() !== "false");
  const trades = values.licenseCategory ? unique(cats.filter((c) => c.sector === values.licenseCategory), "trade") : [];
  const selectedTrades = Array.isArray(values.licenseTrade) ? values.licenseTrade : [];
  const subCategories = unique(cats.filter((c) => selectedTrades.includes(c.trade)), "subcategory");
  const selectedSubs = Array.isArray(values.licenseSubCategory) ? values.licenseSubCategory : [];
  const isProhibited = [...selectedTrades, ...selectedSubs].some((v) => String(v).trim().toLowerCase() === NTL_PROHIBITED_TRADE);

  const asOptions = (list, nameKey = "name", extra) => list.map((x) => ({ code: x[nameKey], name: x[nameKey], ...(extra ? extra(x) : {}) }));
  const year = (n) => ({ code: String(n), name: String(n) });

  return {
    districts: { ...districts, options: asOptions(districts.list) },
    ulbs: { ...ulbs, options: asOptions(ulbs.list, "name", (u) => ({ ulbType: u.type })) },
    wards: { ...wards, options: asOptions(wards.list.filter((w) => String(w.active).toLowerCase() !== "false")) },
    zones: { ...zones, options: asOptions(zones.list.filter((z) => String(z.active).toLowerCase() !== "false")) },
    sectors: { ...categories, options: asOptions(unique(cats, "sector"), "sector") },
    trades: { ...categories, options: asOptions(trades, "trade") },
    subCategories: { ...categories, options: asOptions(subCategories, "subcategory") },
    periods: { options: [year(1), ...(isProhibited ? [year(3)] : []), year(5)], isLoading: false, isError: false },
  };
};
