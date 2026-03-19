package org.egov.pt.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.egov.pt.config.PropertyConfiguration;
import org.egov.pt.repository.PropertyRepository;
import org.egov.pt.models.RequestInfoWrapper;
import org.egov.pt.models.UmeedDashboardResponse;
import org.egov.pt.models.data.Bucket;
import org.egov.pt.models.data.DataItem;
import org.egov.pt.models.data.GroupedData;
import org.egov.pt.models.data.Metrics;
import org.egov.pt.models.data.ULBMappings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UmeedDashboardService {

	@Autowired
	private PropertyConfiguration propertyConfiguration;

	@Autowired
	private PropertyRepository PropertyRepository;

	//epoch conversion
	private long[] getEpochRange(String date) {

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

		LocalDate localDate = LocalDate.parse(date, formatter);

		long startEpoch = localDate.atStartOfDay().atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant()
				.toEpochMilli();

		long endEpoch = localDate.plusDays(1).atStartOfDay().atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant()
				.toEpochMilli();

		return new long[] { startEpoch, endEpoch };
	}
	
	
	
	public UmeedDashboardResponse prepareDataMetrics(RequestInfoWrapper requestInfoWrapper) {

		int slaDays = Optional.ofNullable(propertyConfiguration.getUmeedDashboardSlaDays()).orElse(7);

		// get yesterday's date
		// String yesterday =
		// LocalDate.now().minusDays(1).format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
		// LocalDate yesterday = LocalDate.now().minusDays(1); // this is a LocalDate

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

		// String yesterday = "30-08-2025";
		LocalDate startDate = LocalDate.parse("08-07-2025", formatter);
		LocalDate endDate = startDate;

		// Define the month (August 2025)
//    		LocalDate startDate = yesterday;
//    		LocalDate endDate = yesterday;
		// LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

		List<DataItem> allProcessedItems = new ArrayList<>();

		for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
			String formattedDate = date.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

			List<DataItem> dataItems = PropertyRepository.getUniqueWards(formattedDate);

			if (CollectionUtils.isEmpty(dataItems)) {
				continue;
			}

//			List<DataItem> processedItems = dataItems.stream()
//					.map(dataItem -> buildDataItemMetrics(dataItem, formattedDate, slaDays))
//					.collect(Collectors.toList());

			List<DataItem> processedItems = dataItems.parallelStream()
					.map(dataItem -> buildDataItemMetrics(dataItem, formattedDate, slaDays))
					.collect(Collectors.toList());

			allProcessedItems.addAll(processedItems);

		}
		// List<DataItem> processedItems = dataItems.stream()
		// .map(dataItem -> buildDataItemMetrics(dataItem, yesterday,
		// slaDays)).collect(Collectors.toList());

		return UmeedDashboardResponse.builder().data(allProcessedItems).build();
	}

	private final Map<String, Metrics> metricsCache = new ConcurrentHashMap<>();

//	private DataItem buildDataItemMetrics(DataItem dataItem, String date, int slaDays) {
//
//		DataItem returnObj = DataItem.builder().date(date).module("PT").state("Himachal Pradesh")
//				// .ward(dataItem.getWard())
//				.ward(dataItem.getWard().matches("^\\d+$") ? "Ward" + dataItem.getWard() : dataItem.getWard())
//				.region(dataItem.getRegion()).ulb(ULBMappings.getCode(dataItem.getUlb())).ulbCode("123456").build();
//
//		// Metrics metrics = PropertyRepository.getDataMetrics(date,
//		// returnObj.getWard(), slaDays);
//		String cacheKey = date + "_" + returnObj.getWard();
//		
//		
//
//		Metrics metrics = metricsCache.get(cacheKey);
//
//			if (metrics == null) {
//				metrics = PropertyRepository.getDataMetrics(date, returnObj.getWard(), slaDays);
//				metricsCache.put(cacheKey, metrics);
//			}
//		// Today Moved Application
//		metrics.setTodaysMovedApplications(buildTodaysMovedApplication(date, returnObj.getWard()));
//
//		// PropertyRegistered
//		metrics.setPropertiesRegistered(buildPropertyRegistered(returnObj.getWard()));
//
//		// Assessed Properties
//		metrics.setAssessedProperties(buildAssessedProperties(date, returnObj.getWard()));
//
//		// Transactions
//		metrics.setTransactions(buildTransaction(date, returnObj.getWard()));
//
//		// Today Collection
//		metrics.setTodayCollection(buildTodayCollection(date, returnObj.getWard()));
//
//		// Property Tax
//		metrics.setPropertyTax(buildPropertyTax(date, returnObj.getWard()));
////		metrics.setPropertyTax(buildPropertyTax(date, returnObj.getWard(), returnObj.getUlb(), returnObj.getRegion()));
//
//		// Cess
//		metrics.setCess(buildCess(date, returnObj.getWard()));
//
//		//rebate
//		metrics.setRebate(buildRebate(date, returnObj.getWard()));
//
//		//Penalty
//		metrics.setPenalty(buildPenalty(date, returnObj.getWard()));
//
//		// Today Reassign Requested Complaints
//		metrics.setInterest(buildInterest(date, returnObj.getWard()));
//
//		returnObj.setMetrics(metrics);
//		return returnObj;
//
//		// Departments Data
//	}
	
	private DataItem buildDataItemMetrics(DataItem dataItem, String date, int slaDays) {

		DataItem returnObj = DataItem.builder().date(date).module("PT").state("Himachal Pradesh")
				.ward(dataItem.getWard().matches("^\\d+$") ? "Ward" + dataItem.getWard() : dataItem.getWard())
				.region(dataItem.getRegion()).ulb(ULBMappings.getCode(dataItem.getUlb())).ulbCode("123456").build();

		long[] epochRange = getEpochRange(date);
		long startEpoch = epochRange[0];
		long endEpoch = epochRange[1];

		String cacheKey = date + "_" + returnObj.getWard();

		Metrics metrics = metricsCache.get(cacheKey);

		if (metrics == null) {
			metrics = PropertyRepository.getDataMetrics(startEpoch, endEpoch, returnObj.getWard(), slaDays);
			metricsCache.put(cacheKey, metrics);
		}

		metrics.setTodaysMovedApplications(buildTodaysMovedApplication(startEpoch, endEpoch, returnObj.getWard()));

		metrics.setPropertiesRegistered(buildPropertyRegistered(returnObj.getWard()));

		metrics.setAssessedProperties(buildAssessedProperties(startEpoch, endEpoch, returnObj.getWard()));

		metrics.setTransactions(buildTransaction(startEpoch, endEpoch, returnObj.getWard()));

		metrics.setTodayCollection(buildTodayCollection(startEpoch, endEpoch, returnObj.getWard()));

		metrics.setPropertyTax(buildPropertyTax(startEpoch, endEpoch, returnObj.getWard()));
		
		metrics.setCess(buildCess(startEpoch, endEpoch, returnObj.getWard()));
		
		metrics.setRebate(buildRebate(startEpoch, endEpoch, returnObj.getWard()));
		
		metrics.setPenalty(buildPenalty(startEpoch, endEpoch, returnObj.getWard()));
		
		metrics.setInterest(buildInterest(startEpoch, endEpoch, returnObj.getWard()));

		returnObj.setMetrics(metrics);

		return returnObj;
	}
	// All Application Status
	private List<GroupedData> buildApplicationStatusMetrics(Map<String, Long> deptWiseData, String groupBy) {

		final Map<String, Long> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());

		List<String> allStatus = PropertyRepository.getAllStatuses();

		List<Bucket> buckets = allStatus.stream().map(
				dept -> Bucket.builder().name(dept).value(BigDecimal.valueOf(safeData.getOrDefault(dept, 0L))).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
	}
	
	private GroupedData buildGenericMetrics(Map<String, Long> data, String groupBy, List<String> masterList) {

		final Map<String, Long> safeData = Optional.ofNullable(data).orElse(Collections.emptyMap());

		List<Bucket> buckets = masterList.stream().map(
				item -> Bucket.builder().name(item).value(BigDecimal.valueOf(safeData.getOrDefault(item, 0L))).build())
				.collect(Collectors.toList());

		return GroupedData.builder().groupBy(groupBy).buckets(buckets).build();
	}

	private List<GroupedData> buildFYMetrics(Map<String, Long> FYData, String groupBy) {

		final Map<String, Long> safeData = Optional.ofNullable(FYData).orElse(Collections.emptyMap());

		List<String> allFYear = PropertyRepository.getAllFinancialYears();

		List<Bucket> buckets = allFYear.stream().map(
				dept -> Bucket.builder().name(dept).value(BigDecimal.valueOf(safeData.getOrDefault(dept, 0L))).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
	}

	private List<GroupedData> buildAssessedPropertiesMetrics(Map<String, Long> deptWiseData, String groupBy) {

		final Map<String, Long> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());

		List<String> allStatus = PropertyRepository.getAllusagecategory();

		List<Bucket> buckets = allStatus.stream().map(
				dept -> Bucket.builder().name(dept).value(BigDecimal.valueOf(safeData.getOrDefault(dept, 0L))).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
	}

//--------------------Group data-------------------------------------
	// Today Moved Applications
	private List<GroupedData> buildTodaysMovedApplication(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getTodayMovedApplication(epochStart, epochEnd, wardName);

		return buildApplicationStatusMetrics(data, "ApplicationStatus");
	}

	private List<GroupedData> buildPropertyRegistered(String wardName) {

		Map<String, Long> data = PropertyRepository.getPropertiesRegisteredByFinancialYear(wardName);

		return buildFYMetrics(data, "FinancialYear");
	}

	private List<GroupedData> buildAssessedProperties(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getAssessedProperties(epochStart, epochEnd, wardName);

		return buildAssessedPropertiesMetrics(data, "usageCategory");
	}

	
	private List<GroupedData> buildTransaction(long epochStart, long epochEnd, String wardName) {

	    Map<String, Long> data = PropertyRepository.getTransactions(epochStart, epochEnd, wardName);

	    return buildAssessedPropertiesMetrics(data, "usageCategory");
	}
	 
	//Today Collection
	private List<GroupedData> buildTodayCollection(long epochStart, long epochEnd, String wardName) {
List<GroupedData> response = new ArrayList<>();
	
		Map<String, Long> data = PropertyRepository.getTodayCollection(epochStart, epochEnd, wardName);
	response.add(buildGenericMetrics(data, "usageCategory", PropertyRepository.getAllusagecategory()));
		
		Map<String, Long> channelData = PropertyRepository.getPaymentChannel(epochStart, epochEnd, wardName);
		response.add(buildGenericMetrics(channelData, "PaymentChannelType", PropertyRepository.getAllPaymentMode()));
		
		return  response;
	}

	//Property Tax
	private List<GroupedData> buildPropertyTax(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getPropertyTax(epochStart, epochEnd, wardName);

		return buildAssessedPropertiesMetrics(data, "usageCategory");
	}
	
	//Cess
	private List<GroupedData> buildCess(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getCess(epochStart, epochEnd, wardName);

		return buildAssessedPropertiesMetrics(data, "usageCategory");
	}
	
	//Rebate
	private List<GroupedData> buildRebate(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getRebate(epochStart, epochEnd, wardName);

		return buildAssessedPropertiesMetrics(data, "usageCategory");
	}
	
	//Penalty
	private List<GroupedData> buildPenalty(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getPenalty(epochStart, epochEnd, wardName);

		return buildAssessedPropertiesMetrics(data, "usageCategory");
	}
	
	//Interest
	private List<GroupedData> buildInterest(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getInterest(epochStart, epochEnd, wardName);

		return buildAssessedPropertiesMetrics(data, "usageCategory");
	}

}
