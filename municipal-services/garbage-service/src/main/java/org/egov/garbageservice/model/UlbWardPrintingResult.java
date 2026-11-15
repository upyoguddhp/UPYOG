package org.egov.garbageservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class UlbWardPrintingResult {

	private String ulbName;

	private String wardName;

	private Integer accountsMarkedReady;
}
