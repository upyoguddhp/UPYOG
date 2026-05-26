package org.egov.pt.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.egov.pt.config.PropertyConfiguration;
import org.egov.pt.repository.PropertyRepository;
import org.egov.pt.models.RequestInfoWrapper;
import org.egov.pt.models.UmeedDashboardResponse;
import org.egov.pt.models.data.Bucket;
import org.egov.pt.models.data.DataItem;
import org.egov.pt.models.data.GroupedData;
import org.egov.pt.models.data.Metrics;
import org.egov.pt.models.data.TaxMetricsDTO;
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

	// epoch conversion
	private long[] getEpochRange(String date) {

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

		LocalDate localDate = LocalDate.parse(date, formatter);

		long startEpoch = localDate.atStartOfDay().atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant()
				.toEpochMilli();

		long endEpoch = localDate.plusDays(1).atStartOfDay().atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant()
				.toEpochMilli();

		return new long[] { startEpoch, endEpoch };
	}

//	public UmeedDashboardResponse prepareDataMetrics(RequestInfoWrapper requestInfoWrapper) {
//
//		int slaDays = Optional.ofNullable(propertyConfiguration.getUmeedDashboardSlaDays()).orElse(7);
//
//		// get yesterday's date
//		// String yesterday =
//		// LocalDate.now().minusDays(1).format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
//		// LocalDate yesterday = LocalDate.now().minusDays(1); // this is a LocalDate
//
//		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
//
//		// String yesterday = "30-08-2025";
//		LocalDate startDate = LocalDate.parse("11-07-2025", formatter);
//		LocalDate endDate = startDate;
//
//		// Define the month (August 2025)
////    		LocalDate startDate = yesterday;
////    		LocalDate endDate = yesterday;
//		// LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
//
//		List<DataItem> allProcessedItems = new ArrayList<>();
//
//		for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
//			String formattedDate = date.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
//
//			List<DataItem> dataItems = PropertyRepository.getUniqueWards(formattedDate);
//
//			if (CollectionUtils.isEmpty(dataItems)) {
//				continue;
//			}
//
//			//dataItems.stream()   parallelStream()
//			List<DataItem> processedItems = dataItems.parallelStream()
//					.map(dataItem -> buildDataItemMetrics(dataItem, formattedDate, slaDays))
//					.collect(Collectors.toList());
//			allProcessedItems.addAll(processedItems);
//
//		}
//		// List<DataItem> processedItems = dataItems.stream()
//		// .map(dataItem -> buildDataItemMetrics(dataItem, yesterday,
//		// slaDays)).collect(Collectors.toList());
//
//		return UmeedDashboardResponse.builder().data(allProcessedItems).build();
//		
//	}

//	public void prepareDataMetrics(RequestInfoWrapper requestInfoWrapper, Consumer<DataItem> consumer) {
//
//		int slaDays = Optional.ofNullable(propertyConfiguration.getUmeedDashboardSlaDays()).orElse(7);
//
//		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
//
//		LocalDate startDate = LocalDate.parse("14-07-2025", formatter);
//
//		LocalDate endDate = startDate;
//
//		for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
//
//			String formattedDate = date.format(formatter);
//
//			//List<DataItem> dataItems = PropertyRepository.getUniqueWards(formattedDate);
//			
//			long startEpoch = date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
//
//			long endEpoch = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli() - 1;
//			
//			List<DataItem> dataItems =
//			        PropertyRepository.getUniqueWards(startEpoch, endEpoch);
//
//			if (CollectionUtils.isEmpty(dataItems)) {
//				continue;
//			}
//
//			for (DataItem dataItem : dataItems) {
//
//				DataItem processed = buildDataItemMetrics(dataItem, formattedDate, slaDays);
//
//				consumer.accept(processed);
//			}
//		}
//	}

//	public List<DataItem> prepareDataMetrics(RequestInfoWrapper requestInfoWrapper,int page,
//	        int size) {
//
//		List<DataItem> response = new ArrayList<>();
//
//		int slaDays = Optional.ofNullable(propertyConfiguration.getUmeedDashboardSlaDays()).orElse(7);
//
//		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
//
//		LocalDate startDate = LocalDate.parse("14-07-2025", formatter);
//
//		LocalDate endDate = startDate;
//
//		for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
//
//			String formattedDate = date.format(formatter);
//
//			long startEpoch = date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
//
//			long endEpoch = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli() - 1;
//
//			List<DataItem> dataItems = PropertyRepository.getUniqueWards(startEpoch, endEpoch);
//
//			if (CollectionUtils.isEmpty(dataItems)) {
//				continue;
//			}
//
//			for (DataItem dataItem : dataItems) {
//
//				try {
//
//					DataItem processed = buildDataItemMetrics(dataItem, formattedDate, slaDays);
//
//					response.add(processed);
//
//				} catch (Exception e) {
//
//					e.printStackTrace();
//
//					System.out.println("Failed ward: " + dataItem.getWard());
//				}
//			}
//		}
//
//		return response;
//	}
// paging 
	public List<DataItem> prepareDataMetrics(RequestInfoWrapper requestInfoWrapper, int page, int size) {

		List<DataItem> response = new ArrayList<>();

		int slaDays = Optional.ofNullable(propertyConfiguration.getUmeedDashboardSlaDays()).orElse(7);

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

		LocalDate startDate = LocalDate.parse("18-07-2025", formatter);

		LocalDate endDate = startDate;

		for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {

			String formattedDate = date.format(formatter);

			long startEpoch = date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();

			long endEpoch = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli() - 1;

			List<DataItem> dataItems = PropertyRepository.getUniqueWards(startEpoch, endEpoch);

			if (CollectionUtils.isEmpty(dataItems)) {
				continue;
			}

			// ADD HERE

			int start = page * size;

			int end = Math.min(start + size, dataItems.size());

			if (start >= dataItems.size()) {
				return Collections.emptyList();
			}

			List<DataItem> pagedList = dataItems.subList(start, end);

			// PROCESS ONLY PAGED DATA

			for (DataItem dataItem : pagedList) {

				try {

					DataItem processed = buildDataItemMetrics(dataItem, formattedDate, slaDays);

					response.add(processed);

				} catch (Exception e) {

					e.printStackTrace();
				}
			}
		}

		return response;
	}
	
	
	// chunk

//	private final Map<String, Metrics> metricsCache = new ConcurrentHashMap<>();

	private DataItem buildDataItemMetrics(DataItem dataItem, String date, int slaDays) {

		DataItem returnObj = DataItem.builder().date(date).module("PT").state("Himachal Pradesh")
				.ward(dataItem.getWard().matches("^\\d+$") ? "Ward" + dataItem.getWard() : dataItem.getWard())
				.region(dataItem.getRegion()).ulb(ULBMappings.getCode(dataItem.getUlb())).ulbCode("123456").build();

		long[] epochRange = getEpochRange(date);
		long startEpoch = epochRange[0];
		long endEpoch = epochRange[1];

		List<String> usageCategories = PropertyRepository.getAllUsageCategory(startEpoch, endEpoch,
				returnObj.getWard());

		// String cacheKey = date + "_" + returnObj.getWard();
//
//		Metrics metrics = metricsCache.get(cacheKey);
//
//		if (metrics == null) {
//			metrics = PropertyRepository.getDataMetrics(startEpoch, endEpoch, returnObj.getWard(), slaDays);
//			metricsCache.put(cacheKey, metrics);
//			
//		}

		Metrics metrics = PropertyRepository.getDataMetrics(startEpoch, endEpoch, returnObj.getWard(), slaDays);

		metrics.setTodaysMovedApplications(buildTodaysMovedApplication(startEpoch, endEpoch, returnObj.getWard()));

		metrics.setPropertiesRegistered(buildPropertyRegistered(startEpoch, endEpoch, returnObj.getWard()));

		metrics.setAssessedProperties(
				buildAssessedProperties(startEpoch, endEpoch, returnObj.getWard(), usageCategories));

		metrics.setTransactions(buildTransaction(startEpoch, endEpoch, returnObj.getWard(), usageCategories));

		metrics.setTodaysCollection(buildTodayCollection(startEpoch, endEpoch, returnObj.getWard(), usageCategories));

		List<TaxMetricsDTO> taxMetrics = PropertyRepository.getTaxMetrics(startEpoch, endEpoch, returnObj.getWard());

		Map<String, BigDecimal> propertyTaxMap = new HashMap<>();
		Map<String, BigDecimal> cessMap = new HashMap<>();
		Map<String, BigDecimal> penaltyMap = new HashMap<>();
		Map<String, BigDecimal> interestMap = new HashMap<>();
		Map<String, BigDecimal> rebateMap = new HashMap<>();

		for (TaxMetricsDTO dto : taxMetrics) {

			propertyTaxMap.put(dto.getUsageCategory(), dto.getPropertyTax());

			cessMap.put(dto.getUsageCategory(), dto.getCess());

			penaltyMap.put(dto.getUsageCategory(), dto.getPenalty());

			interestMap.put(dto.getUsageCategory(), dto.getInterest());

			rebateMap.put(dto.getUsageCategory(), dto.getRebate());
		}

		metrics.setPropertyTax(buildPropertiesMetricsDecimalValue(propertyTaxMap, "usageCategory", usageCategories));

		metrics.setCess(buildPropertiesMetricsDecimalValue(cessMap, "usageCategory", usageCategories));

		metrics.setPenalty(buildPropertiesMetricsDecimalValue(penaltyMap, "usageCategory", usageCategories));

		metrics.setInterest(buildPropertiesMetricsDecimalValue(interestMap, "usageCategory", usageCategories));

		metrics.setRebate(buildPropertiesMetricsDecimalValue(rebateMap, "usageCategory", usageCategories));

		returnObj.setMetrics(metrics);

		return returnObj;
	}
//	private GroupedData buildGenericMetrics(Map<String, BigDecimal> data, String groupBy, List<String> masterList) {
//
//		final Map<String, BigDecimal> safeData = Optional.ofNullable(data).orElse(Collections.emptyMap());
//
//		List<Bucket> buckets = masterList.stream()
//				.map(item -> Bucket.builder().name(item).value(safeData.getOrDefault(item, BigDecimal.ZERO)).build())
//				.collect(Collectors.toList());
//
//		return GroupedData.builder().groupBy(groupBy).buckets(buckets).build();
//	}

	private GroupedData buildGenericMetrics(Map<String, BigDecimal> data, String groupBy, List<String> categories) {

		List<Bucket> buckets = new ArrayList<>();

		for (Map.Entry<String, BigDecimal> entry : data.entrySet()) {

			Bucket bucket = new Bucket();

			bucket.setName(entry.getKey());
			bucket.setValue(entry.getValue());
			buckets.add(bucket);
		}

		GroupedData groupedData = new GroupedData();
		groupedData.setGroupBy(groupBy);
		groupedData.setBuckets(buckets);

		return groupedData;
	}

	// All Application Status
	private List<GroupedData> buildApplicationStatusMetrics(Map<String, Long> deptWiseData, String groupBy,
			long epochStart, long epochEnd, String wardName) {

		final Map<String, Long> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());

		List<String> allStatus = PropertyRepository.getAllStatuses(epochStart, epochEnd, wardName);

		List<Bucket> buckets = allStatus.stream().map(
				dept -> Bucket.builder().name(dept).value(BigDecimal.valueOf(safeData.getOrDefault(dept, 0L))).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
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

	private List<GroupedData> buildPropertiesMetrics(Map<String, Long> deptWiseData, String groupBy,
			List<String> usageCategories) {

		final Map<String, Long> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());

		List<String> allStatus = Optional.ofNullable(usageCategories).orElse(Collections.emptyList());

		List<Bucket> buckets = allStatus.stream().map(
				dept -> Bucket.builder().name(dept).value(BigDecimal.valueOf(safeData.getOrDefault(dept, 0L))).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
	}

	private List<GroupedData> buildPropertiesMetricsDecimalValue(Map<String, BigDecimal> deptWiseData, String groupBy,
			List<String> usageCategories) {

		final Map<String, BigDecimal> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());

		// List<String> allStatus = PropertyRepository.getAllUsageCategory(epochStart,
		// epochEnd, wardName);
//		List<String> allStatus = usageCategories;

		List<String> allStatus = Optional.ofNullable(usageCategories).orElse(Collections.emptyList());
		List<Bucket> buckets = allStatus.stream()
				.map(dept -> Bucket.builder().name(dept).value(safeData.getOrDefault(dept, BigDecimal.ZERO)).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);

	}

//--------------------Group data-------------------------------------
	// Today Moved Applications
	private List<GroupedData> buildTodaysMovedApplication(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getTodayMovedApplication(epochStart, epochEnd, wardName);

		return buildApplicationStatusMetrics(data, "applicationStatus", epochStart, epochEnd, wardName);
	}

	private List<GroupedData> buildPropertyRegistered(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getPropertiesRegisteredByFinancialYear(epochStart, epochEnd,
				wardName);

		return buildFYMetrics(data, "financialYear");
	}

	private List<GroupedData> buildAssessedProperties(long epochStart, long epochEnd, String wardName,
			List<String> usageCategories) {

		Map<String, Long> data = PropertyRepository.getAssessedProperties(epochStart, epochEnd, wardName);

		return buildPropertiesMetrics(data, "usageCategory", usageCategories);
	}

	// Today Collection
	private List<GroupedData> buildTodayCollection(long epochStart, long epochEnd, String wardName,
			List<String> usageCategories) {
		List<GroupedData> response = new ArrayList<>();

		Map<String, BigDecimal> data = PropertyRepository.getTodayCollection(epochStart, epochEnd, wardName);
		response.add(buildGenericMetrics(data, "usageCategory", usageCategories));
		// PropertyRepository.getAllUsageCategory(epochStart, epochEnd, wardName)));

		Map<String, BigDecimal> channelData = PropertyRepository.getTodayCollectionPaymentModeQuery(epochStart,
				epochEnd, wardName);
		// response.add(buildGenericMetrics(channelData, "paymentChannelType",
		// PAYMENT_MODES()));

		response.add(buildGenericMetrics(channelData, "paymentChannelType", PAYMENT_MODES));

		return response;
	}

	private static final List<String> PAYMENT_MODES = Arrays.asList("Digital", "Non Digital");

	private List<GroupedData> buildTransaction(long epochStart, long epochEnd, String wardName,
			List<String> usageCategories) {

		Map<String, Long> data = PropertyRepository.getTransactions(epochStart, epochEnd, wardName);

		return buildPropertiesMetrics(data, "usageCategory", usageCategories);
	}
}