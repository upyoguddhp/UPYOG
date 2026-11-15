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
public class Attendance {

	private String uuid;

	private String tenantId;

	private String staffUuid;

	private String staffName;

	private String mobileNumber;

	private String dutyStatus;

	private String dutyDate;

	private Long startTime;

	private Long endTime;

	private BigDecimal latitude;

	private BigDecimal longitude;

	private String remarks;

	private Object additionalDetails;

	private Boolean isActive;

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
