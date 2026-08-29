package org.egov.garbageservice.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Trimmed view of an owner entry inside property-services' Property JSON;
 * only the fields needed for the DDP printing search are declared, the rest
 * are ignored.
 */
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PtOwnerInfo {

	private String name;

	private String mobileNumber;

	private Boolean isPrimaryOwner;
}
