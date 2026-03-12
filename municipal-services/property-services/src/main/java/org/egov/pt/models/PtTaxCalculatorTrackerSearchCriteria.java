package org.egov.pt.models;

import java.math.BigDecimal;
import java.util.Set;

import org.egov.pt.models.enums.BillStatus;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PtTaxCalculatorTrackerSearchCriteria {

	private String tenantId;

	private Set<String> tenantIds;

	private Set<String> uuids;

	private Set<String> propertyIds;
	
	private String billId;

	private Set<String> financialYears;

	private Set<BillStatus> billStatus;

	private Set<BillStatus> notInBillStatus;
	
	private String demandID;
	
	private String type;
	
	private  BigDecimal rebateamount;

	private Integer limit;
	
	private String ward;

	@JsonIgnore
	private Long startDateTime;

	@JsonIgnore
	private Long endDateTime;
	

}
