package org.egov.pgr.web.models;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CountStatusUpdate {

	private int pendingAtLME;
	private int pendingAtLMHE;
	private int resolved;
	private int closedAfterRejection;
	private int closedAfterResolution;
}
