// Garbage categories come from MDMS (Garbage / Categories) of the property's ULB tenant (hp.<ULB>).
const pick = (data, moduleName, master) => data?.[moduleName]?.[master] || data?.[master] || data?.MdmsRes?.[moduleName]?.[master] || [];

const unique = (list) => Array.from(new Set(list));

export const useGRBCategories = (ulbName) => {
  const stateId = Digit.ULBService.getStateId();
  const enabled = !!ulbName;
  const q = Digit.Hooks.useCustomMDMS(`${stateId}.${ulbName}`, "Garbage", [{ name: "Categories" }], {
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const rows = (enabled ? pick(q.data, "Garbage", "Categories") : []).filter((c) => String(c.active).toLowerCase() !== "false");
  return { rows, isLoading: enabled && q.isLoading, isError: enabled && q.isError, refetch: q.refetch };
};

// Option lists for one unit, narrowed by the collection type (Household -> Residential only; Commercial -> everything else;
// Shimla keeps the full list, as OldTheme does).
export const unitOptions = (rows, unit, typeOfCollection, ulbName) => {
  let cats = unique(rows.map((c) => c.categories));
  if (ulbName !== "Shimla" && typeOfCollection) {
    if (typeOfCollection.includes("Household (")) cats = cats.filter((c) => c === "Residential");
    if (typeOfCollection.includes("Commercial (")) cats = cats.filter((c) => c !== "Residential");
  }
  const subs = unique(rows.filter((c) => c.categories === unit.category).map((c) => c.subcategories));
  const types = unique(rows.filter((c) => c.categories === unit.category && c.subcategories === unit.subCategory).map((c) => c.subcategorytype));
  const asOpts = (list) => list.map((x) => ({ code: x, label: x }));
  return { categories: asOpts(cats), subCategories: asOpts(subs), subCategoryTypes: asOpts(types) };
};
