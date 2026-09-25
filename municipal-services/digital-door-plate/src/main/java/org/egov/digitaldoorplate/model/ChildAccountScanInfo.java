package org.egov.digitaldoorplate.model;

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
public class ChildAccountScanInfo {

	private String uuid;

	private String userUuid;

	private String garbageApplicationNo;

	private String garbageId;

	@JsonProperty("Name")
	private String name;

	private String mobileNumber;

	/**
	 * Collection unit category of the garbage application, e.g.
	 * Residential/Commercial/Institutional.
	 */
	private String propertyType;

	private Boolean garbageCollected;

	private Boolean residentAvailable;

	private Boolean isWasteKeptOutside;

	private Boolean dryWetSegregated;

	private String wasteType;

	private Long nextRetryTime;
}
