package org.egov.garbageservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One ULB/ward combination currently enabled for door plate printing, as
 * configured in the ULBS.DdpPrinting MDMS v2 master.
 */
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class DdpPrintingUlbWard {

	private String ulbName;

	private String wardName;
}
