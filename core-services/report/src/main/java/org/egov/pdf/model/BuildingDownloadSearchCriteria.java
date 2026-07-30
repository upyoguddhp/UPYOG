package org.egov.pdf.model;

import java.util.List;
import jakarta.validation.Valid;
import org.hibernate.validator.constraints.CustomSafeHtml;
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


	@CustomSafeHtml
	@JsonProperty("applicationNo")
	private String applicationNo = null;

	@CustomSafeHtml
	@JsonProperty("Status")
	private List<String> Status = null;

	@CustomSafeHtml
	@JsonProperty("businessService")
	private String businessService = null;

	@CustomSafeHtml
	@JsonProperty("applicationType")
	private String applicationType = null; 

}
