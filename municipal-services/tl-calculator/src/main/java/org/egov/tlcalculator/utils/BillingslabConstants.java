package org.egov.tlcalculator.utils;

import org.springframework.stereotype.Component;

@Component
public class BillingslabConstants {
	
	private BillingslabConstants() {}
	
	public static final String TL_MDMS_MODULE_NAME = "TradeLicense";
	public static final String BPA_MDMS_MODULE_NAME = "StakeholderRegistraition";
	public static final String BPA_MDMS_TRADETYPETOROLEMAPPING = "TradeTypetoRoleMapping";
	public static final String COMMON_MASTERS_MDMS_MODULE_NAME = "common-masters";
	public static final String TL_MDMS_TRADETYPE = "TradeType";
	public static final String TL_MDMS_ACCESSORIESCATEGORY = "AccessoriesCategory";
	//public static final String TL_MDMS_ACCESSORIESCATEGORY_PART2 = "AccessoriesCategoryPart2";
	public static final String TL_MDMS_UOM = "UOM";
	public static final String TL_MDMS_STRUCTURETYPE = "StructureType";
	public static final String TL_MDMS_DOCUMENT = "DocumentType";
	public static final String MDMS_JSONPATH_FOR_MASTER_CODES = "$.MdmsRes.#module#.#master#.*.code";
	public static final String BPA_MDMS_JSONPATH_FOR_MAPPING = "$.MdmsRes.StakeholderRegistraition.TradeTypetoRoleMapping";

}
