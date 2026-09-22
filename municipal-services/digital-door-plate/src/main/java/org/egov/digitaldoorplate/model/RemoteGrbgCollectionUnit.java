package org.egov.digitaldoorplate.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Trimmed view of the collection unit JSON nested under a garbage-service
 * account; only the fields needed to build the door plate scan response are
 * declared, everything else is ignored.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RemoteGrbgCollectionUnit {

	private String category;
}
