package org.egov.digitaldoorplate.model;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Trimmed view of the address JSON nested under a garbage-service account;
 * only the fields needed to build the door plate scan response are
 * declared, everything else is ignored.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RemoteGrbgAddress {

	private String address1;

	private String address2;

	private String city;

	private String wardName;

	private String ulbName;
	
	private Map<String, Object> additionalDetail;
}
