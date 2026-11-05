package org.egov.digitaldoorplate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class ContractorCounts {

	private Long totalVendors;

	private Long activeVendors;

	private Long inactiveVendors;

	private Long contractors;

	private Long agencies;

	private Long otherVendors;
}
