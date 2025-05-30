package org.egov.pt.models.bill;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BillAuditDetails {

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
