package org.egov.digitaldoorplate.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Trimmed view of the account JSON returned by garbage-service's account
 * search endpoint; only the fields needed to build the door plate scan
 * response are declared, everything else is ignored.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RemoteGarbageAccount {

	private String uuid;

	private String userUuid;

	private String name;

	private String mobileNumber;

	private String propertyId;

	private Long garbageId;

	private String grbgApplicationNumber;

	private List<RemoteGrbgAddress> addresses;

	private List<RemoteGarbageAccount> childGarbageAccounts;
}
