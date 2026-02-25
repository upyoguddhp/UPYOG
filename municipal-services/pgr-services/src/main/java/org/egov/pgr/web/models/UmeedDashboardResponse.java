package org.egov.pgr.web.models;

import java.util.List;

import org.egov.pgr.web.models.data.DataItem;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UmeedDashboardResponse {

	@JsonProperty("Data")
	private List<DataItem> data;

}
