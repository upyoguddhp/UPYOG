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
public class DoorPlate {

	private String uuid;

	private String tenantId;

	private String garbageAccountUuid;

	private String garbageId;

	private String applicationNo;

	private String propertyId;

	private String plateStatus;

	private Boolean isQrGenerated;

	private Long qrGeneratedTime;

	private String qrGeneratedBy;

	private Boolean isPrintVerified;

	private Long printVerifiedTime;

	private String printVerifiedBy;

	private BigDecimal verificationLatitude;

	private BigDecimal verificationLongitude;

	private Boolean isInstalled;

	private Long installedTime;

	private String installedBy;

	private BigDecimal installationLatitude;

	private BigDecimal installationLongitude;

	private String remarks;

	private Boolean isActive;

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
