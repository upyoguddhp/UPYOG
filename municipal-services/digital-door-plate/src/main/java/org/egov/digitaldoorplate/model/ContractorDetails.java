package org.egov.digitaldoorplate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class ContractorDetails {

	private String name;

	private String fatherName;

	private String contactNumber;

	private String email;

	private String address;

	private String pincode;
}
