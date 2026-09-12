package org.egov.pdf.model;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Validated
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor

public class BuildingDownloadSearchCriteria {


	@JsonProperty("applicationNo")
	private String applicationNo = null;

	@JsonProperty("Status")
	private List<String> Status = null;

	@JsonProperty("businessService")
	private String businessService = null;

	@JsonProperty("applicationType")
	private String applicationType = null; 

}
