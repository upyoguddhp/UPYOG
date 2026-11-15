package org.egov.garbageservice.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Trimmed view of the address JSON nested under a property-services Property;
 * the display address for the DDP printing search is read from eg_pt_address's
 * additionalDetails -&gt; propertyAddress key (see
 * {@code GarbageAccountService.toPropertyAddress}), not built by concatenating
 * doorNo/street/city.
 */
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PtAddress {

	private JsonNode additionalDetails;
}
