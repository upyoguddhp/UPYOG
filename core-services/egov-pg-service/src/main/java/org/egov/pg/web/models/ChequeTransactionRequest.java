package org.egov.pg.web.models;

import org.egov.common.contract.request.RequestInfo;
import org.egov.pg.models.Transaction;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChequeTransactionRequest {
	
	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;
	
    private String billId;
    private Transaction.TxnStatusEnum action;
}
