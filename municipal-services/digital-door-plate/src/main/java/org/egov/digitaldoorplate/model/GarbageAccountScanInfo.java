package org.egov.digitaldoorplate.model;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GarbageAccountScanInfo {

	private BigDecimal latitude;

	private BigDecimal longitude;

	private String wardNumber;

	private String ulbName;

	private String uuid;

	private String userUuid;

	private String garbageApplicationNo;

	private String garbageId;

	@JsonProperty("Name")
	private String name;

	private String mobileNumber;

	private String propertyId;

	private String propertyAddress;

	private Boolean garbageCollected;

	private Boolean residentAvailable;

	private Boolean isWasteKeptOutside;

	private Boolean dryWetSegregated;

	private String wasteType;

	private Long nextRetryTime;

	private List<ChildAccountScanInfo> childAccounts;
}
