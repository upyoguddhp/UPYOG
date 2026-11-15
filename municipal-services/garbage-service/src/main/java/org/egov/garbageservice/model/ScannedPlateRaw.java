package org.egov.garbageservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One plate assigned to a dispatch batch, before owner/ward enrichment from
 * property-services. Not exposed in any API response.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class ScannedPlateRaw {

	private String tenantId;

	private String systemPropertyId;

	/**
	 * Display property id: the garbage account's own property_id, falling
	 * back to system_property_id when that's empty.
	 */
	private String propertyId;
}
