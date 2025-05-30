package org.egov.pt.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.mdms.model.MdmsResponse;
import org.egov.pt.models.CalculateTaxRequest;
import org.egov.pt.models.CalculateTaxResponse;
import org.egov.pt.models.OwnerInfo;
import org.egov.pt.models.Property;
import org.egov.pt.models.PropertyCriteria;
import org.egov.pt.models.PtTaxCalculatorTracker;
import org.egov.pt.models.PtTaxCalculatorTrackerSearchCriteria;
import org.egov.pt.models.Unit;
import org.egov.pt.models.bill.Demand;
import org.egov.pt.models.bill.GenerateBillCriteria;
import org.egov.pt.models.collection.BillResponse;
import org.egov.pt.models.enums.Status;
import org.egov.pt.util.PTConstants;
import org.egov.pt.web.contracts.PtTaxCalculatorTrackerRequest;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PropertySchedulerService {

	@Autowired
	private PropertyService propertyService;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private MDMSService mdmsService;

	@Autowired
	private DemandService demandService;

	@Autowired
	private BillService billService;

	@Autowired
	private EnrichmentService enrichmentService;

	@Autowired
	private NotificationService notificationService;

	public CalculateTaxResponse calculateTax(CalculateTaxRequest calculateTaxRequest) {

		List<PtTaxCalculatorTracker> taxCalculatorTrackers = new ArrayList<>();

		JsonNode ulbModules = null;
		JsonNode propertyTaxRateModules = null;
		JsonNode zones = null;
		JsonNode buildingStructures = null;
		JsonNode buildingEstablishmentYears = null;
		JsonNode buildingPurposes = null;
		JsonNode buildingUses = null;
		JsonNode overAllRebatePercentages = null;
		JsonNode propertyTaxRates = null;

		BigDecimal days = calculateDays(calculateTaxRequest);

		Map<String, Set<String>> errorMap = new HashMap<>();

		MdmsResponse mdmsResponse = mdmsService.getMdmsData(calculateTaxRequest.getRequestInfo(), null);

		if (null != mdmsResponse && null != mdmsResponse.getMdmsRes()
				&& null != mdmsResponse.getMdmsRes().get(PTConstants.MDMS_MODULE_ULBS)) {
			ulbModules = objectMapper.valueToTree(mdmsResponse.getMdmsRes().get(PTConstants.MDMS_MODULE_ULBS));
			propertyTaxRateModules = objectMapper
					.valueToTree(mdmsResponse.getMdmsRes().get(PTConstants.MDMS_MODULE_PROPERTYTAXRATE));

			zones = objectMapper.valueToTree(ulbModules.get(PTConstants.MDMS_MASTER_DETAILS_ZONES));
			buildingStructures = objectMapper
					.valueToTree(ulbModules.get(PTConstants.MDMS_MASTER_DETAILS_BUILDINGSTRUCTURE));
			buildingEstablishmentYears = objectMapper
					.valueToTree(ulbModules.get(PTConstants.MDMS_MASTER_DETAILS_BUILDINGESTABLISHMENTYEAR));
			buildingPurposes = objectMapper
					.valueToTree(ulbModules.get(PTConstants.MDMS_MASTER_DETAILS_BUILDINGPURPOSE));
			buildingUses = objectMapper.valueToTree(ulbModules.get(PTConstants.MDMS_MASTER_DETAILS_BUILDINGUSE));
			overAllRebatePercentages = objectMapper
					.valueToTree(ulbModules.get(PTConstants.MDMS_MASTER_DETAILS_OVERALLREBATE));

			propertyTaxRates = objectMapper
					.valueToTree(propertyTaxRateModules.get(PTConstants.MDMS_MASTER_DETAILS_PROPERTYTAXRATE));
		}

		List<Property> properties = getProperties(calculateTaxRequest);

		properties = removeAlreadyTaxCalculatedProperties(properties, calculateTaxRequest);

		for (Property property : properties) {

			ArrayNode trackeradditionalDetails = objectMapper.createArrayNode();
			BigDecimal totalPropertyTax = BigDecimal.ZERO;
			BigDecimal oneDayPropertyTax = BigDecimal.ZERO;
			BigDecimal finalPropertyTax = BigDecimal.ZERO;
			String ulbName = property.getTenantId().split("\\.")[1];

			JsonNode addressAdditionalDetails = objectMapper.valueToTree(property.getAddress().getAdditionalDetails());

			for (Unit unit : property.getUnits()) {
				BigDecimal totalRateableValue = BigDecimal.ZERO;
				BigDecimal netRateableValue = BigDecimal.ZERO;
				BigDecimal structuralFactor = null;
				BigDecimal ageFactor = null;
				BigDecimal occupancyFactor = null;
				BigDecimal useFactor = null;
				BigDecimal locationFactor = null;
				BigDecimal oAndMRebateAmount = BigDecimal.ZERO;
				BigDecimal oAndMRebatePercentage = null;
				BigDecimal propertyTaxRatePercentage = null;
				BigDecimal propertyTax = BigDecimal.ZERO;

				Set<String> errorSet = new HashSet<>();

				JsonNode unitAdditionalDetails = objectMapper.valueToTree(unit.getAdditionalDetails());

				for (JsonNode buildingStructure : objectMapper.valueToTree(buildingStructures)) {
					if (ulbName.equalsIgnoreCase(buildingStructure.get("ulbName").asText())
							&& buildingStructure.get("structureType").asText()
									.equalsIgnoreCase(unitAdditionalDetails.get("propBuildingType").asText())) {
						structuralFactor = new BigDecimal(buildingStructure.get("rate").asText());
					}
				}
				for (JsonNode buildingEstablishmentYear : objectMapper.valueToTree(buildingEstablishmentYears)) {
					if (ulbName.equalsIgnoreCase(buildingEstablishmentYear.get("ulbName").asText())
							&& buildingEstablishmentYear.get("yearRange").asText()
									.equalsIgnoreCase(unitAdditionalDetails.get("propYearOfCons").asText())) {
						ageFactor = new BigDecimal(buildingEstablishmentYear.get("rate").asText());
					}
				}
				for (JsonNode buildingPurpose : objectMapper.valueToTree(buildingPurposes)) {
					if (ulbName.equalsIgnoreCase(buildingPurpose.get("ulbName").asText())
							&& buildingPurpose.get("purposeName").asText()
									.equalsIgnoreCase(unitAdditionalDetails.get("propType").asText() + "." + ulbName)) {
						occupancyFactor = new BigDecimal(buildingPurpose.get("rate").asText());
					}
				}
				for (JsonNode buildingUse : objectMapper.valueToTree(buildingUses)) {
					if (ulbName.equalsIgnoreCase(buildingUse.get("ulbName").asText())
							&& buildingUse.get("useOfBuilding").asText().equalsIgnoreCase(
									ulbName + "." + unitAdditionalDetails.get("useOfBuilding").asText())) {
						useFactor = new BigDecimal(buildingUse.get("rate").asText());
					}
				}

				for (JsonNode zone : objectMapper.valueToTree(zones)) {
					if (ulbName.equalsIgnoreCase(zone.get("ulbName").asText()) && addressAdditionalDetails.get("zone")
							.asText().equalsIgnoreCase(zone.get("zoneName").asText())) {
						locationFactor = new BigDecimal(zone.get("propertyRate").asText());
					}
				}
				for (JsonNode overAllRebatePercentage : objectMapper.valueToTree(overAllRebatePercentages)) {
					if (ulbName.equalsIgnoreCase(overAllRebatePercentage.get("ulbName").asText())) {
						oAndMRebatePercentage = new BigDecimal(overAllRebatePercentage.get("rate").asText());
					}
				}

				if (null == structuralFactor) {
					errorSet.add(PTConstants.MDMS_MASTER_DETAILS_BUILDINGSTRUCTURE + " is missing in mdms");
				}
				if (null == ageFactor) {
					errorSet.add(PTConstants.MDMS_MASTER_DETAILS_BUILDINGESTABLISHMENTYEAR + " is missing in mdms");
				}
				if (null == occupancyFactor) {
					errorSet.add(PTConstants.MDMS_MASTER_DETAILS_BUILDINGPURPOSE + " is missing in mdms");
				}
				if (null == useFactor) {
					errorSet.add(PTConstants.MDMS_MASTER_DETAILS_BUILDINGUSE + " is missing in mdms");
				}
				if (null == locationFactor) {
					errorSet.add(PTConstants.MDMS_MASTER_DETAILS_ZONES + " is missing in mdms");
				}
				if (null == oAndMRebatePercentage) {
					errorSet.add(PTConstants.MDMS_MASTER_DETAILS_OVERALLREBATE + " is missing in mdms");
				}

				if (null != structuralFactor && null != ageFactor && null != occupancyFactor && null != useFactor
						&& null != locationFactor && property.getPropertyType().equalsIgnoreCase("BUILTUP")) {
					totalRateableValue = new BigDecimal(unitAdditionalDetails.get("propArea").asText())
							.multiply(structuralFactor).multiply(ageFactor).multiply(occupancyFactor)
							.multiply(useFactor).multiply(locationFactor);
				}else if(property.getPropertyType().equalsIgnoreCase("VACANT") && null != locationFactor) {
					totalRateableValue = new BigDecimal(unitAdditionalDetails.get("propArea").asText())
							.multiply(locationFactor);
				}else {
					errorSet.add("PropertyType issue factor value" + " is missing in mdms");
				}

				if (!BigDecimal.ZERO.equals(totalRateableValue)) {
					oAndMRebateAmount = totalRateableValue
							.multiply(oAndMRebatePercentage.divide(BigDecimal.valueOf(100)));
					netRateableValue = totalRateableValue.subtract(oAndMRebateAmount);
				}

				for (JsonNode propertyTaxRate : propertyTaxRates) {
					// Check if the relevant details match
					if (ulbName.equalsIgnoreCase(propertyTaxRate.get("ulbName").asText())
							&& addressAdditionalDetails.get("zone").asText().equalsIgnoreCase(
									propertyTaxRate.get("zoneName").asText().replaceFirst(ulbName + ".", ""))
							&& propertyTaxRate.get("purposeName").asText()
									.equalsIgnoreCase(unitAdditionalDetails.get("propType").asText() + "." + ulbName)
							&& propertyTaxRate.get("useOfBuilding").asText().equalsIgnoreCase(
									ulbName + "." + unitAdditionalDetails.get("useOfBuilding").asText())) {

						String propertyAreaString = propertyTaxRate.get("propertyArea").asText();
						BigDecimal unitPropertyArea = new BigDecimal(unitAdditionalDetails.get("propArea").asText());

						if (isAreaWithinRange(propertyAreaString, unitPropertyArea)) {
							propertyTaxRatePercentage = new BigDecimal(propertyTaxRate.get("rate").asText());
						}
					}
				}

				if (!BigDecimal.ZERO.equals(netRateableValue) && null != propertyTaxRatePercentage) {
					propertyTax = netRateableValue.multiply(propertyTaxRatePercentage.divide(BigDecimal.valueOf(100)));
				} else {
					errorSet.add(PTConstants.MDMS_MASTER_DETAILS_PROPERTYTAXRATE + " is missing in mdms");
				}

				if (!BigDecimal.ZERO.equals(propertyTax)) {
					totalPropertyTax = totalPropertyTax.add(propertyTax);
				}

				if (BigDecimal.ZERO.equals(totalPropertyTax)) {
					errorSet.add("Calculated tax is " + totalPropertyTax);
				}

				if (!CollectionUtils.isEmpty(errorSet)) {
					errorMap.put(property.getPropertyId(), errorSet);
				} else {
					BigDecimal taxPerDay = propertyTax.divide(BigDecimal.valueOf(365), 6, RoundingMode.HALF_UP);
					BigDecimal propertyTaxGenerated = taxPerDay.multiply(days);
					JsonNode node = objectMapper.createObjectNode();

					((ObjectNode) node)
					    .put("propertyType", property.getPropertyType())
					    .put(PTConstants.MDMS_MASTER_DETAILS_ZONES, locationFactor.doubleValue())
					    .put(PTConstants.MDMS_MASTER_DETAILS_OVERALLREBATE, oAndMRebatePercentage.doubleValue())
					    .put(PTConstants.MDMS_MASTER_DETAILS_PROPERTYTAXRATE, propertyTaxRatePercentage.doubleValue())
					    .put("netRateableValue", netRateableValue.doubleValue())
					    .put("propertyArea", unitAdditionalDetails.get("propArea").asText())
					    .put("propertyTaxCalculated", propertyTax.doubleValue())
					    .put("propertyTaxGenerated", propertyTaxGenerated)
					    .put("days", days.doubleValue());

					if (property.getPropertyType().equalsIgnoreCase("BUILTUP")) {
					    ((ObjectNode) node)
					        .put(PTConstants.MDMS_MASTER_DETAILS_BUILDINGSTRUCTURE, structuralFactor.doubleValue())
					        .put(PTConstants.MDMS_MASTER_DETAILS_BUILDINGESTABLISHMENTYEAR, ageFactor.doubleValue())
					        .put(PTConstants.MDMS_MASTER_DETAILS_BUILDINGPURPOSE, occupancyFactor.doubleValue())
					        .put(PTConstants.MDMS_MASTER_DETAILS_BUILDINGUSE, useFactor.doubleValue());
					}
					
					if (node != null) {
						trackeradditionalDetails.add(node);
					}
				}
			}

			if (!CollectionUtils.isEmpty(errorMap)) {
				log.error(errorMap.toString());
			}

			if (!errorMap.containsKey(property.getPropertyId()) && !BigDecimal.ZERO.equals(totalPropertyTax)) {

				oneDayPropertyTax = totalPropertyTax.divide(BigDecimal.valueOf(365), 6, RoundingMode.HALF_UP);

				finalPropertyTax = oneDayPropertyTax.multiply(days);

				BillResponse billResponse = generateDemandAndBill(calculateTaxRequest, property, finalPropertyTax);

				if (null != billResponse && !CollectionUtils.isEmpty(billResponse.getBill())) {
					PtTaxCalculatorTrackerRequest ptTaxCalculatorTrackerRequest = enrichmentService
							.enrichTaxCalculatorTrackerCreateRequest(property, calculateTaxRequest, finalPropertyTax,
									trackeradditionalDetails, billResponse.getBill());
					
					PtTaxCalculatorTracker ptTaxCalculatorTracker = propertyService
							.saveToPtTaxCalculatorTracker(ptTaxCalculatorTrackerRequest);

					taxCalculatorTrackers.add(ptTaxCalculatorTracker);

					// notification calls
					notificationService.triggerNotificationsGenerateBill(ptTaxCalculatorTracker,
							billResponse.getBill().get(0), ptTaxCalculatorTrackerRequest.getRequestInfo());
				}
			}

		}

		return CalculateTaxResponse.builder().taxCalculatorTrackers(taxCalculatorTrackers).build();
	}
	
	private BigDecimal calculateDays(CalculateTaxRequest calculateTaxRequest) {
		BigDecimal days = new BigDecimal(365);

		if (!StringUtils.isEmpty(calculateTaxRequest.getFinancialYear())) {
			int financialYearStart = Integer.valueOf(calculateTaxRequest.getFinancialYear().split("-")[0]);
			LocalDate startDate = LocalDate.of(financialYearStart, 4, 1);
			LocalDate endDate = LocalDate.of(financialYearStart + 1, 3, 31);
			calculateTaxRequest.setFromDate(Date.from(startDate.atStartOfDay(ZoneId.systemDefault()).toInstant()));
			calculateTaxRequest.setToDate(Date.from(endDate.atStartOfDay(ZoneId.systemDefault()).toInstant()));
		} else if (null != calculateTaxRequest.getFromDate() && null != calculateTaxRequest.getToDate()) {
			LocalDate fromLocalDate = calculateTaxRequest.getFromDate().toInstant().atZone(ZoneId.systemDefault())
					.toLocalDate();
			LocalDate toLocalDate = calculateTaxRequest.getToDate().toInstant().atZone(ZoneId.systemDefault())
					.toLocalDate();

			days = BigDecimal.valueOf(ChronoUnit.DAYS.between(fromLocalDate, toLocalDate));
		} else {
			LocalDate currentDate = LocalDate.now();
			// Calculate the current financial year
			int currentYear = currentDate.getYear();
//			int financialYearStart = currentDate.isBefore(LocalDate.of(currentYear, 4, 1)) ? currentYear
//					: currentYear - 1;
			int financialYearStart = currentDate.isBefore(LocalDate.of(currentYear, 4, 1)) ? currentYear - 1
					: currentYear;

			int financialYearEnd = financialYearStart + 1;
			LocalDate startDate = LocalDate.of(financialYearStart, 4, 1);
			LocalDate endDate = LocalDate.of(financialYearStart + 1, 3, 31);
			calculateTaxRequest.setFromDate(Date.from(startDate.atStartOfDay(ZoneId.systemDefault()).toInstant()));
			calculateTaxRequest.setToDate(Date.from(endDate.atStartOfDay(ZoneId.systemDefault()).toInstant()));
			calculateTaxRequest
					.setFinancialYear(financialYearStart + "-" + String.valueOf(financialYearEnd).substring(2));
		}

		return days;
	}

	private List<Property> getProperties(CalculateTaxRequest calculateTaxRequest) {

		Set<String> ulbNames = calculateTaxRequest.getUlbNames();
		Set<String> wardNumbers = calculateTaxRequest.getWardNumbers();
		Set<String> mobileNumbers = calculateTaxRequest.getMobileNumbers();

		PropertyCriteria propertyCriteria = PropertyCriteria.builder().isSchedulerCall(true)
				.status(Collections.singleton(Status.APPROVED)).propertyIds(calculateTaxRequest.getPropertyIds())
				.build();

		List<Property> properties = propertyService.searchProperty(propertyCriteria,
				calculateTaxRequest.getRequestInfo(), null);

		if (!CollectionUtils.isEmpty(mobileNumbers)) {
			properties = properties.stream()
					.filter(property -> !Collections.disjoint(mobileNumbers,
							property.getOwners().stream().map(OwnerInfo::getMobileNumber).collect(Collectors.toSet())))
					.collect(Collectors.toList());
		}
		if (!CollectionUtils.isEmpty(ulbNames)) {
			properties = properties.stream().filter(
					property -> property.getAddress() != null && property.getAddress().getAdditionalDetails() != null)
					.filter(property -> {
						JsonNode addressAdditionalDetails = objectMapper
								.valueToTree(property.getAddress().getAdditionalDetails());
						JsonNode ulbNameNode = addressAdditionalDetails.get("ulbName");
						return null != ulbNameNode && ulbNames.contains(ulbNameNode.asText());
					}).collect(Collectors.toList());
		}
		if (!CollectionUtils.isEmpty(ulbNames) && !CollectionUtils.isEmpty(wardNumbers)) {
			properties = properties.stream().filter(
					property -> property.getAddress() != null && property.getAddress().getAdditionalDetails() != null)
					.filter(property -> {
						JsonNode addressAdditionalDetails = objectMapper
								.valueToTree(property.getAddress().getAdditionalDetails());
						JsonNode ulbNameNode = addressAdditionalDetails.get("ulbName");
						JsonNode wardNumberNode = addressAdditionalDetails.get("wardNumber");
						return null != ulbNameNode && null != wardNumberNode && ulbNames.contains(ulbNameNode.asText())
								&& wardNumbers.contains(wardNumberNode.asText());
					}).collect(Collectors.toList());
		}

		return properties;
	}

	private List<Property> removeAlreadyTaxCalculatedProperties(List<Property> properties,
			CalculateTaxRequest calculateTaxRequest) {
		List<Property> finalProperty = new ArrayList<>();

		Set<String> propertyIds = properties.stream().map(Property::getPropertyId).collect(Collectors.toSet());

		PtTaxCalculatorTrackerSearchCriteria ptTaxCalculatorTrackerSearchCriteria = PtTaxCalculatorTrackerSearchCriteria
				.builder().propertyIds(propertyIds).build();

		List<PtTaxCalculatorTracker> ptTaxCalculatorTrackers = propertyService
				.getTaxCalculatedProperties(ptTaxCalculatorTrackerSearchCriteria);

		Map<String, List<PtTaxCalculatorTracker>> ptTaxCalculatorTrackerMap = ptTaxCalculatorTrackers.stream()
				.collect(Collectors.groupingBy(PtTaxCalculatorTracker::getPropertyId));

		finalProperty = properties.stream().filter(property -> {
			List<PtTaxCalculatorTracker> trackers = ptTaxCalculatorTrackerMap.get(property.getPropertyId());

			return trackers == null || trackers.stream().noneMatch(tracker -> isOverlapping(tracker.getFromDate(),
					tracker.getToDate(), calculateTaxRequest.getFromDate(), calculateTaxRequest.getToDate()));
		}).collect(Collectors.toList());

		return finalProperty;
	}
	
	private boolean isOverlapping(Date trackerFrom, Date trackerTo, Date requestFrom, Date requestTo) {
		// Request is fully inside tracker OR tracker is fully inside request
		boolean requestInsideTracker = !trackerFrom.after(requestFrom) && !trackerTo.before(requestTo);
		boolean trackerInsideRequest = !requestFrom.after(trackerFrom) && !requestTo.before(trackerTo);
		return requestInsideTracker || trackerInsideRequest;
	}


	private BillResponse generateDemandAndBill(CalculateTaxRequest calculateTaxRequest, Property property,
			BigDecimal finalPropertyTax) {
		try {
			List<Demand> savedDemands = new ArrayList<>();
			// generate demand
			savedDemands = demandService.generateDemand(calculateTaxRequest, property, property.getBusinessService(),
					finalPropertyTax);

			if (CollectionUtils.isEmpty(savedDemands)) {
				throw new CustomException("INVALID_CONSUMERCODE",
						"Bill not generated due to no Demand found for the given consumerCode");
			}

			// fetch/create bill
			GenerateBillCriteria billCriteria = GenerateBillCriteria.builder().tenantId(property.getTenantId())
					.businessService(PTConstants.MODULE_PROPERTY).consumerCode(property.getPropertyId()).build();

			BillResponse billResponse = billService.generateBill(calculateTaxRequest.getRequestInfo(), billCriteria);
			return billResponse;
		} catch (Exception e) {
			log.error(e.getMessage());
		}
		return null;
	}

	private boolean isAreaWithinRange(String propertyAreaString, BigDecimal propertyArea) {
		if (propertyAreaString.contains("-")) {
			String[] range = propertyAreaString.split("-");
			BigDecimal min = new BigDecimal(range[0]);
			BigDecimal max = new BigDecimal(range[1]);
			return propertyArea.compareTo(min) >= 0 && propertyArea.compareTo(max) <= 0;
		} else if (propertyAreaString.contains(">")) {
			BigDecimal threshold = new BigDecimal(propertyAreaString.split(">")[1]);
			return propertyArea.compareTo(threshold) > 0;
		} else if (propertyAreaString.contains("<")) {
			BigDecimal threshold = new BigDecimal(propertyAreaString.split("<")[1]);
			return propertyArea.compareTo(threshold) < 0;
		} else if (propertyAreaString.contains(">=")) {
			BigDecimal threshold = new BigDecimal(propertyAreaString.split(">=")[1]);
			return propertyArea.compareTo(threshold) >= 0;
		} else if (propertyAreaString.contains("<=")) {
			BigDecimal threshold = new BigDecimal(propertyAreaString.split("<=")[1]);
			return propertyArea.compareTo(threshold) <= 0;
		}
		return false;
	}

}
