package org.egov.rentlease.repository;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.rentlease.contract.bill.Bill;
import org.egov.rentlease.contract.bill.BillResponse;
import org.egov.rentlease.contract.bill.BillSearchCriteria;
import org.egov.rentlease.contract.bill.GenerateBillCriteria;
import org.egov.rentlease.util.RentConstants;
import org.egov.rentlease.util.RequestInfoWrapper;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.databind.ObjectMapper;

@Repository
public class BillRepository {
	
	  @Autowired
	    private RestCallRepository restCallRepository;

	    @Autowired
	    private RentConstants constants;

	    @Autowired
	    private ObjectMapper objectMapper;
	    
	    public BillResponse fetchBill(GenerateBillCriteria billCriteria, RequestInfo requestInfo) {
			

	        String uri = constants.getBillHost().concat(constants.getFetchBillEndpoint());
	        uri = uri.concat("?consumerCode=").concat(billCriteria.getConsumerCode());
	        uri = uri.concat("&tenantId=").concat(billCriteria.getTenantId());
	        uri = uri.concat("&businessService=").concat(billCriteria.getBusinessService());

	        Object result = restCallRepository.fetchResult(new StringBuilder(uri),RequestInfoWrapper.builder()
	                                                             .requestInfo(requestInfo).build());
	        BillResponse response = null;
	         try{
	              response = objectMapper.convertValue(result,BillResponse.class);
	         }
	         catch (IllegalArgumentException e){
	            throw new CustomException("PARSING ERROR","Unable to parse response of generate bill");
	         }
	         
			return response;
		}
	    
	    public List<Bill> searchBill(BillSearchCriteria billCriteria, RequestInfo requestInfo){
			
			String uri = constants.getBillHost().concat(constants.getSearchBillEndpoint());
	        uri = uri.concat("?tenantId=").concat(billCriteria.getTenantId());
	        uri = uri.concat("&service=").concat(billCriteria.getService());
	        uri = uri.concat("&consumerCode=").concat(StringUtils.join(billCriteria.getConsumerCode(), ","));

	        Object result = restCallRepository.fetchResult(new StringBuilder(uri),RequestInfoWrapper.builder()
	                                                             .requestInfo(requestInfo).build());
	        
	        BillResponse billResponse = objectMapper.convertValue(result, BillResponse.class);
	        
	        return ( null == billResponse ? null : billResponse.getBill()) ; 
		}

}
