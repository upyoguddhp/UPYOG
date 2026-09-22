package org.egov.garbageservice.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Trimmed view of the Property JSON returned by property-services'
 * /property/_search; only the fields needed to build a DDP printing record
 * are declared, everything else is ignored.
 */
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PtProperty {

	private String propertyId;

	private PtAddress address;

	private List<PtOwnerInfo> owners;
}
