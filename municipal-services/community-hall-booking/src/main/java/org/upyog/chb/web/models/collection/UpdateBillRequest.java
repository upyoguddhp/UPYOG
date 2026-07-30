package org.upyog.chb.web.models.collection;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.egov.common.contract.request.RequestInfo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBillRequest {

	@NotNull
	private RequestInfo RequestInfo;
	
	@NotNull
	@Valid
	private UpdateBillCriteria UpdateBillCriteria;
}
