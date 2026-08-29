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

	/**
	 * The owner's display name is stored under eg_pt_owner's
	 * propertyOwnerName column (not the generic "name" inherited from User),
	 * so that's the field the DDP printing search reads for OwnerName.
	 */
	private String propertyOwnerName;

	/**
	 * eg_pt_owner.mobile_number.
	 */
	private String mobileNumber;

	private Boolean isPrimaryOwner;
}
