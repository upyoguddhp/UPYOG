package org.egov.digitaldoorplate.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Snapshot of the owner/property details embedded in a door plate's QR code
 * at print time. Field names/casing match the QR payload exactly (as
 * supplied by the scanner) so it can be deserialized directly; the same
 * shape is reused to represent the corresponding live record fetched from
 * garbage-service, so the two can be compared field by field.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DoorPlateQrSnapshot {

	@JsonProperty("OwnerName")
	private String ownerName;

	@JsonProperty("MobileNo")
	private String mobileNo;

	@JsonProperty("PropertyID")
	private String propertyId;

	@JsonProperty("id")
	private String id;

	@JsonProperty("ulbName")
	private String ulbName;

	@JsonProperty("Ward")
	private String ward;

	@JsonProperty("Address")
	private String address;
}
