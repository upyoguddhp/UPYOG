package org.egov.digitaldoorplate.model;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class GarbageCollection {

	private String uuid;

	private String tenantId;

	private String attendanceUuid;

	private String staffUuid;

	private String garbageAccountUuid;

	private String subAccountUuid;

	private String garbageId;

	private String applicationNo;

	private String propertyId;

	private String wardNumber;

	private Boolean isResidentAvailable;

	private String wasteType;

	private Boolean isWasteKeptOutside;

	private Boolean isCollected;

	private Boolean appliedToAllTenants;

	private Long collectionTime;

	private BigDecimal latitude;

	private BigDecimal longitude;

	private String clientRefId;

	private String syncBatchUuid;

	private String remarks;

	private Object additionalDetails;

	private Boolean isActive;

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
