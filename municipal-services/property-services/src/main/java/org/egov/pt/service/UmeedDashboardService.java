package org.egov.pt.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

	public UmeedDashboardResponse prepareDataMetrics(RequestInfoWrapper requestInfoWrapper) {

		List<DataItem> response = new ArrayList<>();

		int slaDays = Optional.ofNullable(propertyConfiguration.getUmeedDashboardSlaDays()).orElse(7);

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
//------Single Date 
		LocalDate startDate = LocalDate.parse("19-07-2025", formatter);
		LocalDate endDate = startDate;
		
// -----Fetch data between From Date and To Date
//		LocalDate startDate = LocalDate.parse("07-05-2025", formatter);
//		LocalDate endDate = LocalDate.parse("20-05-2025", formatter);

		for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {

			String formattedDate = date.format(formatter);

			long startEpoch = date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();

			long endEpoch = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli() - 1;

			List<DataItem> dataItems = PropertyRepository.getUniqueWards(startEpoch, endEpoch);

			if (CollectionUtils.isEmpty(dataItems)) {
				continue;
			}

			for (DataItem dataItem : dataItems) {

				DataItem processed = buildDataItemMetrics(dataItem, formattedDate, slaDays);

				response.add(processed);
			}
		}

		return UmeedDashboardResponse.builder().data(response).build();
	}

	private DataItem buildDataItemMetrics(DataItem dataItem, String date, int slaDays) {

		DataItem returnObj = DataItem.builder().date(date).module("PT").state("Himachal Pradesh")
				.ward(dataItem.getWard().matches("^\\d+$") ? "Ward" + dataItem.getWard() : dataItem.getWard())
				.region(dataItem.getRegion()).ulb(ULBMappings.getCode(dataItem.getUlb())).build();

		long[] epochRange = getEpochRange(date);
		long startEpoch = epochRange[0];
		long endEpoch = epochRange[1];

		Metrics metrics = PropertyRepository.getDataMetrics(startEpoch, endEpoch, returnObj.getWard(), slaDays);

		metrics.setTodaysMovedApplications(buildTodaysMovedApplication(startEpoch, endEpoch, returnObj.getWard()));

		metrics.setPropertiesRegistered(buildPropertyRegistered(startEpoch, endEpoch, returnObj.getWard()));

		metrics.setAssessedProperties(buildAssessedProperties(startEpoch, endEpoch, returnObj.getWard()));

		metrics.setTransactions(buildTransaction(startEpoch, endEpoch, returnObj.getWard()));

		metrics.setTodaysCollection(buildTodayCollection(startEpoch, endEpoch, returnObj.getWard()));

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

		metrics.setPropertyTax(buildPropertiesMetricsDecimalValue(propertyTaxMap, "usageCategory"));

		metrics.setCess(buildPropertiesMetricsDecimalValue(cessMap, "usageCategory"));

		metrics.setPenalty(buildPropertiesMetricsDecimalValue(penaltyMap, "usageCategory"));

		metrics.setInterest(buildPropertiesMetricsDecimalValue(interestMap, "usageCategory"));

		metrics.setRebate(buildPropertiesMetricsDecimalValue(rebateMap, "usageCategory"));

		returnObj.setMetrics(metrics);
		return returnObj;
	}

	private GroupedData buildGenericMetrics(Map<String, BigDecimal> data, String groupBy) {

		List<Bucket> buckets = data.entrySet().stream().map(entry -> {
			Bucket bucket = new Bucket();
			bucket.setName(entry.getKey());
			bucket.setValue(entry.getValue());
			return bucket;
		}).collect(Collectors.toList());

		GroupedData groupedData = new GroupedData();
		groupedData.setGroupBy(groupBy);
		groupedData.setBuckets(buckets);

		return groupedData;
	}
	// All Application Status
	private List<GroupedData> buildApplicationStatusMetrics(Map<String, Long> deptWiseData, String groupBy) {

		final Map<String, Long> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());

		List<Bucket> buckets = safeData.entrySet().stream()
				.map(entry -> Bucket.builder().name(entry.getKey()).value(BigDecimal.valueOf(entry.getValue())).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
	}

	private List<GroupedData> buildFYMetrics(Map<String, Long> FYData, String groupBy) {

		final Map<String, Long> safeData = Optional.ofNullable(FYData).orElse(Collections.emptyMap());

		List<Bucket> buckets = safeData.entrySet().stream()
				.map(entry -> Bucket.builder().name(entry.getKey()).value(BigDecimal.valueOf(entry.getValue())).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
	}

	private List<GroupedData> buildPropertiesMetrics(Map<String, Long> deptWiseData, String groupBy) {

		final Map<String, Long> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());

		List<Bucket> buckets = safeData.entrySet().stream()
				.map(entry -> Bucket.builder().name(entry.getKey()).value(BigDecimal.valueOf(entry.getValue())).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
	}

	private List<GroupedData> buildPropertiesMetricsDecimalValue(Map<String, BigDecimal> deptWiseData, String groupBy) {

		final Map<String, BigDecimal> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());

		List<Bucket> buckets = safeData.entrySet().stream()
				.map(entry -> Bucket.builder().name(entry.getKey()).value(entry.getValue()).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
	}
	
	private List<GroupedData> buildTodaysMovedApplication(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getTodayMovedApplication(epochStart, epochEnd, wardName);

		return buildApplicationStatusMetrics(data, "applicationStatus");
	}

	private List<GroupedData> buildPropertyRegistered(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getPropertiesRegisteredByFinancialYear(epochStart, epochEnd,
				wardName);

		return buildFYMetrics(data, "financialYear");
	}

	private List<GroupedData> buildAssessedProperties(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getAssessedProperties(epochStart, epochEnd, wardName);

		return buildPropertiesMetrics(data, "usageCategory");
	}
	// Today Collection
	private List<GroupedData> buildTodayCollection(long epochStart, long epochEnd, String wardName) {
		List<GroupedData> response = new ArrayList<>();

		Map<String, BigDecimal> data = PropertyRepository.getTodayCollection(epochStart, epochEnd, wardName);
		response.add(buildGenericMetrics(data, "usageCategory"));

		Map<String, BigDecimal> channelData = PropertyRepository.getTodayCollectionPaymentModeQuery(epochStart,
				epochEnd, wardName);

		response.add(buildGenericMetrics(channelData, "paymentChannelType"));

		return response;
	}
	private List<GroupedData> buildTransaction(long epochStart, long epochEnd, String wardName) {

		Map<String, Long> data = PropertyRepository.getTransactions(epochStart, epochEnd, wardName);

		return buildPropertiesMetrics(data, "usageCategory");
	}
}