package org.egov.pt.web.contracts.alfresco;

import java.util.List;

import org.egov.common.contract.response.ResponseInfo;
//import org.egov.pt.web.contracts.alfresco.AADocumentDetails;
//import org.egov.pt.web.contracts.alfresco.RateData;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DmsResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo = null;

//	private List<RateData> rateDataList;
//	
//	private List<RateData> attachmentDataList;
//	
//	private List<AADocumentDetails> data;

	private String status;

	private String msg;

}
