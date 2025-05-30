package org.egov.advertisementcanopy.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.egov.advertisementcanopy.config.AdvertisementSiteConfiguration;
import org.egov.advertisementcanopy.contract.bill.Demand;
import org.egov.advertisementcanopy.contract.bill.DemandDetail;
import org.egov.advertisementcanopy.contract.bill.DemandRepository;
import org.egov.advertisementcanopy.contract.bill.DemandResponse;
import org.egov.advertisementcanopy.model.SiteBooking;
import org.egov.advertisementcanopy.util.AdvtConstants;
import org.egov.advertisementcanopy.util.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

@Service
public class DemandService {

//    @Autowired
//    private CalculationService calculationService;

    @Autowired
    private DemandRepository demandRepository;
    
    @Autowired
    AdvertisementSiteConfiguration config;

    public List<Demand> generateDemand(RequestInfo requestInfo,SiteBooking siteBooking, String businessService){

    	// get total Tax
//    	ApplicationDetail applicationDetail = tradeLicenseService.getApplicationBillUserDetail(garbageAccount, requestInfo);
//    	BigDecimal taxAmount = new BigDecimal("100.00");
    	Long numberOfDays = siteBooking.getPeriodInDays();
    	Optional<Double> cost = Optional.of(0.0);
		if(null != siteBooking.getSiteCreationData().getAdditionalDetail() && null != siteBooking.getSiteCreationData().getAdditionalDetail().get("gstsiteCost").asText()) {
			try {
		        cost = Optional.of(Double.parseDouble(siteBooking.getSiteCreationData().getAdditionalDetail().get("gstsiteCost").asText()));
		    } catch (NumberFormatException e) {
		        throw new CustomException("GST_SITE_COST_INCORRECT_FORMAT", "Incorrect format of gst site cost.");
		    }
		}else {
			throw new CustomException("GST_SITE_COST_NOT_PRESENT","Gst site cost not present.");
		}
    	BigDecimal totalPayableAmount = BigDecimal.valueOf(numberOfDays)
				.multiply(new BigDecimal(cost.get()))
				.add(BigDecimal.valueOf(siteBooking.getSiteCreationData().getSecurityAmount() != null 
		                ? siteBooking.getSiteCreationData().getSecurityAmount() 
		                        : 0.0)).setScale(0, RoundingMode.CEILING);
    	System.out.println(totalPayableAmount);    	
    	DemandDetail demandDetail = DemandDetail.builder()
    								.taxHeadMasterCode(AdvtConstants.BILLING_TAX_HEAD_MASTER_CODE)
    								.taxAmount(totalPayableAmount)
    								.collectionAmount(BigDecimal.ZERO)
    								.build();
    	
    	Calendar cal = Calendar.getInstance();
		cal.add(Calendar.DAY_OF_MONTH, Integer.valueOf(config.getBillExpiryAfter()));
		cal.set(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DATE), 23, 59, 59);

    	
    	// create demand of 1 month
    	Demand demandOne = Demand.builder()
                .consumerCode(siteBooking.getApplicationNo())
                .demandDetails(Arrays.asList(demandDetail))
                .minimumAmountPayable(totalPayableAmount)
                .tenantId(siteBooking.getTenantId())
                .taxPeriodFrom(new Date().getTime())
                .taxPeriodTo(new Date((Calendar.getInstance().getTimeInMillis() + (long) 30 * 24 * 60 * 60 * 1000)).getTime())
//                .taxPeriodTo(new Date((Calendar.getInstance().getTimeInMillis() + (long) 365 * 24 * 60 * 60 * 1000)).getTime())
                .consumerType(siteBooking.getApplicationNo())
                .fixedBillExpiryDate(cal.getTimeInMillis())
                .businessService(AdvtConstants.BUSINESS_SERVICE_SITE_BOOKING)
                .build();
    	
    	List<Demand> demands = Arrays.asList(demandOne);
    	
    	List<Demand> savedDemands = demandRepository.saveDemand(requestInfo,demands);
    	
    	return savedDemands;
    }


    List<Demand> searchDemand(String tenantId,Set<String> consumerCodes,RequestInfo requestInfo, String businessService){
    	
    	RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();
    	DemandResponse response = demandRepository.search(tenantId, consumerCodes, requestInfoWrapper, businessService);

        if(CollectionUtils.isEmpty(response.getDemands()))
            return null;

        else 
        	return response.getDemands();

    }


}
