package org.egov.garbageservice.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Trimmed view of the address JSON nested under a property-services Property;
 * only the fields needed to build a display address for the DDP printing
 * search are declared, the rest are ignored.
 */
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PtAddress {

	private String doorNo;

	private String buildingName;

	private String street;

	private String city;

	private String pincode;
}
