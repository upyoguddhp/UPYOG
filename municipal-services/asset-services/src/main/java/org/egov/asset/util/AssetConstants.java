package org.egov.asset.util;

import java.util.HashMap;
import java.util.Map;

public class AssetConstants {
	
	//Constants For MDMS
	public static final String ASSET_MODULE = "ASSET";
	public static final String ASSET_BusinessService = "ASSET";
	public static final String ASSET_MODULE_CODE = "ASSET";
	// mdms path codes
	public static final String ASSET_JSONPATH_CODE = "$.MdmsRes.ASSET";
	public static final String COMMON_MASTER_JSONPATH_CODE = "$.MdmsRes.common-masters";
	
	public static final String COMMON_MASTERS_MODULE = "common-masters";
	public static final String NOTIFICATION_LOCALE = "en_IN";
	public static final String NOTIFICATION_INITIATED = "tl.en.counter.initiate";
	public static final String NOTIFICATION_PANDING_APPL_FEE = "tl.en.counter.appl.fee";
	public static final String NOTIFICATION_APPLIED = "tl.en.counter.submit";
	public static final String NOTIFICATION_DOCUMENT_VERIFICATION = "asset.en.document";
	
	public static final String NOTIFICATION_APPROVED = "asset.en.counter.approved";
	public static final String NOTIFICATION_REJECTED = "asset.en.counter.rejected";
	public static final String NOTIFICATION_CANCELLED = "asset.en.counter.cancelled";
	
	public static final String NOTIFICATION_OBJECT_ADDED = "asset.en.edit.object.added";
	public static final String NOTIFICATION_OBJECT_REMOVED = "asset.en.edit.object.removed";
	public static final String NOTIFICATION_OBJECT_MODIFIED = "asset.en.edit.object.modified";
	
	

	// mdms master names
//	public static final String ASSET_CLASSIFICATION_MAPPING = "assetClassificationMapping";
	public static final String ASSET_CLASSIFICATION = "assetClassification";
	public static final String ASSET_PARENT_CATEGORY = "assetParentCategory";
	public static final String ASSET_CATEGORY = "assetCategory";
	public static final String ASSET_SUB_CATEGORY = "assetSubCategory";
	
//	public static final String ASSET_CLASSIFICATIONS = "ServiceType";
//	public static final String APPLICATION_TYPE = "ApplicationType";
//	public static final String OCCUPANCY_TYPE = "OccupancyType";
//	public static final String SUB_OCCUPANCY_TYPE = "SubOccupancyType";
//	public static final String USAGES = "Usages";

		
	// Asset Status
	public static final String STATUS_INITIATED = "INPROGRESS";
	public static final String STATUS_APPLIED = "INPROGRESS";
	public static final String STATUS_APPROVED = "APPROVED";
	public static final String ACTION_APPROVE= "APPROVE";
	public static final String STATUS_REJECTED = "REJECTED";
	public static final String STATUS_REVOCATED = "PERMIT REVOCATION";
	public static final String STATUS_DOCUMENTVERIFICATION = "INPROGRESS";
	public static final String STATUS_FIELDINSPECTION = "INPROGRESS";
	public static final String STATUS_NOCUPDATION = "INPROGRESS";
	public static final String STATUS_PENDINGAPPROVAL = "INPROGRESS";
	public static final String STATUS_CANCELLED = "CANCELLED";
	public static final String STATUS_PENDINGFORAPPROVAL = "PENDINGFORAPPROVAL";
	public static final String  STATUS_PENDINGFORMODIFICATION = "PENDINGFORMODIFICATION";
	public static final String STATUS_INITIATE = "INITIATED";
	public static final String ACTION_INITIATE =  "INITIATE";
	public static final String ACTION_RETURN_TO_INITIATOR = "RETURN_TO_INITIATOR";
	public static final String ACTION_FORWARD_TO_APPROVER ="FORWARD_TO_APPROVER";
	
	public static final String ACTION_PENDINGAPPROVAL = "PENDINGAPPROVAL";
	public static final String ACTION_REJECT = "REJECT";
	public static final String ACTION_REVOCATE = "REVOCATE";
	public static final String ACTION_CANCEL = "CANCEL";
	public static final String EMPLOYEE = "EMPLOYEE";
	public static final String CITIZEN = "CITIZEN";
	public static final String ASSET_APPROVER = "ASSET_APPROVER";
	public static final String ASSET_CREATOR = "ASSET_CREATOR"; 
	public static final String ASSET_VERIFIER = "ASSET_VERIFIER";
	public static final String INVALID_SEARCH = "INVALID SEARCH";
	public static final String ASSET_WF_CREATOR = "ASSET_WF_CREATOR";
	public static final String ASSET_WF_APPROVER = "ASSET_WF_APPROVER";
	
	
	public static final String BOOKING_AVAILABLE_STATUS = "AVAILABLE";

	public static final String BOOKING_BOOKED_STATUS = "BOOKED";
	
	
	public  static String getStatusOrAction(String action, boolean b) {
		
		Map<String, String> map = new HashMap<>();
		map.put(ACTION_INITIATE, STATUS_INITIATED);
		map.put(ACTION_RETURN_TO_INITIATOR, STATUS_PENDINGFORMODIFICATION);
		map.put(ACTION_FORWARD_TO_APPROVER, STATUS_PENDINGFORAPPROVAL);
		map.put(ACTION_APPROVE,STATUS_APPROVED);
		map.put(ACTION_REJECT,ACTION_REJECT);
		
		if (!b) {
			// return key
			for (Map.Entry<String, String> entry : map.entrySet()) {
				if (entry.getValue().equals(action)) {
					return entry.getKey();
				}
			}
		}
		
		return map.get(action);
	}

}
