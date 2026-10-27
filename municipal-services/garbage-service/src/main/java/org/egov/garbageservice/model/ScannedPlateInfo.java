package org.egov.garbageservice.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One plate scanned into a dispatch batch, as returned in the batch's
 * scannedPlates list.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScannedPlateInfo {

	@JsonProperty("ownerName")
	private String ownerName;

	@JsonProperty("ward")
	private String ward;

	@JsonProperty("propertyID")
	private String propertyId;
}
