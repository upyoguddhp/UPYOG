package org.upyog.chb.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
<<<<<<< HEAD
import java.util.Arrays;
=======
>>>>>>> niua-upstream/niua-dev-2.0
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

<<<<<<< HEAD
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.origin.SystemEnvironmentOrigin;
import org.springframework.stereotype.Service;
import org.upyog.chb.config.CommunityHallBookingConfiguration;
import org.upyog.chb.constants.CommunityHallBookingConstants;
import org.upyog.chb.util.MdmsUtil;
import org.upyog.chb.web.models.BookingSlotDetail;
import org.upyog.chb.web.models.CalculationType;
import org.upyog.chb.web.models.CommunityHallBookingRequest;
=======
import org.springframework.stereotype.Service;
import org.upyog.chb.config.CommunityHallBookingConfiguration;
import org.upyog.chb.constants.CommunityHallBookingConstants;
import org.upyog.chb.util.CalculationTypeCache;
import org.upyog.chb.util.CommunityHallBookingUtil;
import org.upyog.chb.util.MdmsUtil;
import org.upyog.chb.web.models.BookingSlotDetail;
import org.upyog.chb.web.models.CalculationType;
import org.upyog.chb.web.models.VenueBookingRequest;
>>>>>>> niua-upstream/niua-dev-2.0
import org.upyog.chb.web.models.billing.DemandDetail;
import org.upyog.chb.web.models.billing.TaxHeadMaster;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CalculationService {
	
<<<<<<< HEAD
	@Autowired
	private MdmsUtil mdmsUtil;
	@Autowired
	private CommunityHallBookingConfiguration config;

	/**
	 * @param bookingRequest
	 * @return
	 */
	public List<DemandDetail> calculateDemand(CommunityHallBookingRequest bookingRequest) {

		String tenantId = bookingRequest.getHallsBookingApplication().getTenantId().split("\\.")[0];
		
		List<TaxHeadMaster> headMasters = mdmsUtil.getTaxHeadMasterList(bookingRequest.getRequestInfo(), tenantId , CommunityHallBookingConstants.BILLING_SERVICE);
		
		List<CalculationType> calculationTypes = mdmsUtil.getcalculationType(bookingRequest.getRequestInfo(), tenantId , config.getModuleName(), bookingRequest.getHallsBookingApplication());
		
		log.info("calculationTypes " + calculationTypes);

		List<DemandDetail> demandDetails = processCalculationForDemandGeneration(tenantId, calculationTypes,
				bookingRequest, headMasters);

		return demandDetails;

	}

	private List<DemandDetail> processCalculationForDemandGeneration(String tenantId,
			List<CalculationType> calculationTypes, CommunityHallBookingRequest bookingRequest, List<TaxHeadMaster> headMasters) {

		Map<String, Long> hallCodeBookingDaysMap = bookingRequest.getHallsBookingApplication().getBookingSlotDetails()
				.stream().collect(Collectors.groupingBy(BookingSlotDetail::getHallCode, Collectors.counting()));
		//GST,SGST tax  codes are stored to calculate final amount
		List<String> taxCodes = Arrays.asList(config.getApplicableTaxes().split(","));
		log.info("tax applicable on booking  : " + taxCodes);
		//Demand will be generated using billing service for booking
		final List<DemandDetail> demandDetails = new LinkedList<>();
		
        List<String> taxHeadCodes = headMasters.stream().map(head -> head.getCode()).collect(Collectors.toList());
		
		log.info("tax head codes  : " + taxHeadCodes);

		//Demand for which tax is applicable is stored
		List<CalculationType> taxableFeeType = new ArrayList<>();
		
		BigDecimal hallCodeBookingDays = new BigDecimal(hallCodeBookingDaysMap.get(bookingRequest.getHallsBookingApplication().getBookingSlotDetails().get(0).getHallCode()));
		
		for (CalculationType type : calculationTypes) {
			if (taxHeadCodes.contains(type.getFeeType())) {
				if (type.isTaxApplicable()) {
					//Add taxable fee 
					taxableFeeType.add(type);
				} else if (!taxCodes.contains(type.getFeeType())) {
					DemandDetail data =  DemandDetail.builder().taxAmount(type.getAmount())
					.taxHeadMasterCode(type.getFeeType()).tenantId(tenantId).build();
					//Add fixed fee for which tax is not applicable
=======
	private final MdmsUtil mdmsUtil;
	private final CalculationTypeCache calculationTypeCache;
	private final CommunityHallBookingConfiguration config;

	public CalculationService(MdmsUtil mdmsUtil, CalculationTypeCache calculationTypeCache,
			CommunityHallBookingConfiguration config) {
		this.mdmsUtil = mdmsUtil;
		this.calculationTypeCache = calculationTypeCache;
		this.config = config;
	}

	public List<DemandDetail> calculateDemand(VenueBookingRequest bookingRequest) {

		String tenantId = CommunityHallBookingUtil.getTenantId(bookingRequest.getVenueBookingApplication().getTenantId());
		
		List<TaxHeadMaster> headMasters = mdmsUtil.getTaxHeadMasterList(bookingRequest.getRequestInfo(), tenantId , CommunityHallBookingConstants.BILLING_SERVICE);
		
		List<CalculationType> calculationTypes = calculationTypeCache.getcalculationType(bookingRequest.getRequestInfo(), bookingRequest.getVenueBookingApplication().getTenantId() , config.getModuleName(), bookingRequest.getVenueBookingApplication());

		log.info("Retrieved calculation types: {}", calculationTypes);

		return processCalculationForDemandGeneration(tenantId, calculationTypes,
				bookingRequest, headMasters);

	}

	private List<DemandDetail> processCalculationForDemandGeneration(String tenantId,
			List<CalculationType> calculationTypes, VenueBookingRequest bookingRequest, List<TaxHeadMaster> headMasters) {

		Map<String, BigDecimal> hallCodeBookingHoursMap = bookingRequest.getVenueBookingApplication().getBookingSlotDetails()
				.stream().collect(Collectors.groupingBy(BookingSlotDetail::getUnitCode, 
						Collectors.mapping(this::calculateHours, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));
		
		Map<String, Long> hallCodeBookingDaysMap = bookingRequest.getVenueBookingApplication().getBookingSlotDetails()
				.stream()
				.collect(Collectors.groupingBy(BookingSlotDetail::getUnitCode,
						Collectors.mapping(BookingSlotDetail::getBookingDate,
								Collectors.collectingAndThen(Collectors.toSet(), set -> (long) set.size()))));
		
		final List<DemandDetail> demandDetails = new LinkedList<>();
		
        List<String> taxHeadCodes = headMasters.stream().map(TaxHeadMaster::getCode).toList();
		
		log.info("tax head codes  : " + taxHeadCodes);

		List<CalculationType> taxableFeeType = new ArrayList<>();
		
		BigDecimal hallCodeBookingHours = hallCodeBookingHoursMap.get(bookingRequest.getVenueBookingApplication().getBookingSlotDetails().get(0).getUnitCode());
		Long venueBookingDates = hallCodeBookingDaysMap.get(bookingRequest.getVenueBookingApplication().getBookingSlotDetails().get(0).getUnitCode()); 
		for (CalculationType type : calculationTypes) {
			if (taxHeadCodes.contains(type.getFeeType())) {
				if (type.isTaxApplicable()) {
					taxableFeeType.add(type);
				} else {
					DemandDetail data =  DemandDetail.builder().taxAmount(type.getAmount())
					.taxHeadMasterCode(type.getFeeType()).tenantId(tenantId).build();
>>>>>>> niua-upstream/niua-dev-2.0
					demandDetails.add(data);
				}
			}
		}
		
		log.info("taxable fee type : " + taxableFeeType);

<<<<<<< HEAD
		List<DemandDetail> taxableDemands = taxableFeeType.stream().map(data ->
		// log.info("data :" + data);
		DemandDetail.builder().taxAmount(data.getAmount().multiply(hallCodeBookingDays))
				.taxHeadMasterCode(data.getFeeType()).tenantId(tenantId).build()).collect(Collectors.toList());
		
		log.info("taxableDemands : " + taxableDemands);
		
		BigDecimal totalTaxableAmount = taxableDemands.stream()
				.map(DemandDetail::getTaxAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

		demandDetails.addAll(taxableDemands);

		log.info("Total Taxable amount for the booking : " + totalTaxableAmount);

		for (CalculationType type : calculationTypes) {
			if (taxCodes.contains(type.getFeeType())) {
				DemandDetail demandDetail = DemandDetail.builder()
						.taxAmount(calculateAmount(totalTaxableAmount, type.getAmount()))
						.taxHeadMasterCode(type.getFeeType()).tenantId(tenantId).build();
				demandDetails.add(demandDetail);
			}
		}

		return demandDetails;
	}

	private BigDecimal calculateAmount(BigDecimal base, BigDecimal pct) {
		return base.multiply(pct).divide(CommunityHallBookingConstants.ONE_HUNDRED, RoundingMode.FLOOR);
=======
		List<DemandDetail> taxableDemands = taxableFeeType.stream().map(data -> {

			BigDecimal multiplier;

			if ("HOURLY".equalsIgnoreCase(data.getCalculationDurationType())) {
				multiplier = hallCodeBookingHours;
			} else if ("DAY".equalsIgnoreCase(data.getCalculationDurationType())) {
				multiplier = BigDecimal.valueOf(venueBookingDates);
			} else {
				multiplier = BigDecimal.ONE;
			}

			return DemandDetail.builder().taxAmount((data.getAmount().multiply(multiplier)).abs())
					.taxHeadMasterCode(data.getFeeType()).tenantId(tenantId).build();
		}).toList();
		
		
		log.info("taxableDemands : " + taxableDemands);
		
		demandDetails.addAll(taxableDemands);
		
		BigDecimal totalTaxableAmount = taxableDemands.stream()
				.map(DemandDetail::getTaxAmount).reduce(BigDecimal.ZERO, BigDecimal::add).abs();

		log.info("Total Taxable amount for the booking : " + totalTaxableAmount);
		
		calculateTaxDemands(bookingRequest, tenantId, demandDetails, totalTaxableAmount);

		return demandDetails;
	}
	
	private void calculateTaxDemands(VenueBookingRequest bookingRequest, String tenantId,
			List<DemandDetail> demandDetails, BigDecimal totalTaxableAmount) {
		List<CalculationType> taxRates = mdmsUtil.getTaxRatesMasterList(bookingRequest.getRequestInfo(), tenantId,
				config.getModuleName());
		taxRates.forEach(tax -> {
			DemandDetail demandDetail = DemandDetail.builder()
					.taxAmount(calculateAmount(totalTaxableAmount, tax.getAmount())).taxHeadMasterCode(tax.getFeeType())
					.tenantId(tenantId).build();
			demandDetails.add(demandDetail);
		});
	}

	private BigDecimal calculateAmount(BigDecimal amount, BigDecimal tax) {
		return amount.multiply(tax).divide(CommunityHallBookingConstants.ONE_HUNDRED,0, RoundingMode.FLOOR).abs();
	}

	private BigDecimal calculateHours(BookingSlotDetail bookingSlotDetail) {
		long minutesDifference = java.time.temporal.ChronoUnit.MINUTES.between(
				bookingSlotDetail.getBookingFromTime(), 
				bookingSlotDetail.getBookingToTime());
		return BigDecimal.valueOf(minutesDifference).divide(new BigDecimal(60), 2, RoundingMode.HALF_UP);
>>>>>>> niua-upstream/niua-dev-2.0
	}

}
