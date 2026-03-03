package org.egov.pt.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
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

			List<DataItem> processedItems = dataItems.stream()
					.map(dataItem -> buildDataItemMetrics(dataItem, formattedDate, slaDays))
					.collect(Collectors.toList());

			allProcessedItems.addAll(processedItems);

		}
		// List<DataItem> processedItems = dataItems.stream()
		// .map(dataItem -> buildDataItemMetrics(dataItem, yesterday,
		// slaDays)).collect(Collectors.toList());

		return UmeedDashboardResponse.builder().data(allProcessedItems).build();
	}

	private DataItem buildDataItemMetrics(DataItem dataItem, String date, int slaDays) {

		DataItem returnObj = DataItem.builder().date(date).module("PT").state("Himachal Pradesh")
				// .ward(dataItem.getWard())
				.ward(dataItem.getWard().matches("^\\d+$") ? "Ward" + dataItem.getWard() : dataItem.getWard())
				.region(dataItem.getRegion()).ulb(ULBMappings.getCode(dataItem.getUlb())).ulbCode("123456").build();

		
		Metrics metrics = PropertyRepository.getDataMetrics(date, returnObj.getWard(), slaDays);

		//Today Moved Application
		metrics.setTodaysMovedApplications(buildTodaysMovedApplication(date,returnObj.getWard()));
//
//		// PropertyRegistered
		//metrics.setPropertiesRegistered(buildPropertyRegistered( returnObj.getWard()));
//
//		// Assessed Properties
		metrics.setAssessedProperties(buildAssessedProperties(date, returnObj.getWard()));
//
//		// Transactions
		metrics.setTransactions(buildTransaction(date, returnObj.getWard()));
//
//		// Today Open Complaints
//		metrics.setTodaysOpenComplaints(buildTodayOpenComplaints(date, returnObj.getWard()));
//
//		// Today Assigned Complaints
//		metrics.setTodaysAssisgnedComaplaints(buildTodaysAssignedComaplaints(date, returnObj.getWard()));
//
//		// Average Solution Time
//		metrics.setAverageSolutionTime(buildAverageSolutionTime(date, returnObj.getWard()));
//
//		// Today Rejected Complaints
//		metrics.setTodaysRejectedComplaints(buildTodayRejectedComplaints(date, returnObj.getWard()));
//
//		// Today Reassign Complaints
//		metrics.setTodaysReassignComplaints(buildTodayReassingComplaints(date, returnObj.getWard()));
//
//		// Today Reassign Requested Complaints
//		metrics.setTodaysReassignRequestedComplaints(buildTodayReassingRequestedComplaints(date, returnObj.getWard()));
//
//		// Today Closed Complaints
//		metrics.setTodaysClosedComplaints(buildTodayClosedComplaints(date, returnObj.getWard()));
//
//		// Today Resolved Complaints
//		metrics.setTodaysResolvedComplaints(buildTodayResolvedComplaints(date, returnObj.getWard()));
		returnObj.setMetrics(metrics);
		return returnObj;

		// Departments Data
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
	
	
//	private List<GroupedData> buildAssessedProperties(Map<String, Long> categoryData, String groupBy) {
//
//		final Map<String, Long> safeData = Optional.ofNullable(categoryData).orElse(Collections.emptyMap());
//
//		List<String> allCategories = PropertyRepository.getAllusagecategory();
//
//		List<Bucket> buckets = allCategories.stream().map(
//				dept -> Bucket.builder().name(dept).value(BigDecimal.valueOf(safeData.getOrDefault(dept, 0L))).build())
//				.collect(Collectors.toList());
//
//		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();
//
//		return Collections.singletonList(groupedData);
//	}
//	private List<GroupedData> buildPropertyRegisteredMetrics(Map<String, Long> deptWiseData, String groupBy) {
//
//		final Map<String, Long> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());
//
//		List<String> allStatus = PropertyRepository.getAllStatuses();
//
//		List<Bucket> buckets = allStatus.stream().map(
//				dept -> Bucket.builder().name(dept).value(BigDecimal.valueOf(safeData.getOrDefault(dept, 0L))).build())
//				.collect(Collectors.toList());
//
//		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();
//
//		return Collections.singletonList(groupedData);
//	}
	
	
//	private List<GroupedData> buildPropertyRegisteredMetrics(
//	        Map<String, Long> financialYearData,
//	        String groupBy) {
//
//	    final Map<String, Long> safeData =
//	            Optional.ofNullable(financialYearData)
//	                    .orElse(Collections.emptyMap());
//
//	    List<Bucket> buckets = safeData.entrySet()
//	            .stream()
//	            .sorted(Map.Entry.comparingByKey())   // Sort FY ascending
//	            .map(entry -> Bucket.builder()
//	                    .name(entry.getKey())
//	                    .value(BigDecimal.valueOf(entry.getValue()))
//	                    .build())
//	            .collect(Collectors.toList());
//
//	    GroupedData groupedData = GroupedData.builder()
//	            .groupBy(groupBy)      // should be "financialYear"
//	            .buckets(buckets)
//	            .build();
//
//	    return Collections.singletonList(groupedData);
//	}
	
	

//// GenericMetrics
//	private GroupedData buildGenericMetrics(Map<String, Long> data, String groupBy, List<String> masterList) {
//
//		final Map<String, Long> safeData = Optional.ofNullable(data).orElse(Collections.emptyMap());
//
//		List<Bucket> buckets = masterList.stream().map(
//				item -> Bucket.builder().name(item).value(BigDecimal.valueOf(safeData.getOrDefault(item, 0L))).build())
//				.collect(Collectors.toList());
//
//		return GroupedData.builder().groupBy(groupBy).buckets(buckets).build();
//	}

//	// Decimal Data
//	private List<GroupedData> buildDepartmentWiseDecimalMetrics(Map<String, BigDecimal> deptWiseData, String groupBy) {
//
//		final Map<String, BigDecimal> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());
//
//		List<String> allDepartments = PropertyRepository.getAllDepartments();
//
//		List<Bucket> buckets = allDepartments.stream()
//				.map(dept -> Bucket.builder().name(dept).value(safeData.getOrDefault(dept, BigDecimal.ZERO)).build())
//				.collect(Collectors.toList());
//
//		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();
//
//		return Collections.singletonList(groupedData);
//	}
//--------------------Group data-------------------------------------
	// Today Moved Applications 
	private List<GroupedData> buildTodaysMovedApplication(String date, String wardName) {

		Map<String, Long> data = PropertyRepository.getTodayMovedApplication(date, wardName);

		return buildApplicationStatusMetrics(data, "ApplicationStatus");
	}
	
	private List<GroupedData> buildPropertyRegistered( String wardName) {

		Map<String, Long> data = PropertyRepository.getPropertiesRegisteredByFinancialYear( wardName);

		return buildFYMetrics(data, "FinancialYear");
	}
	
	
	private List<GroupedData>buildAssessedProperties(String date, String wardName) {

		Map<String, Long> data = PropertyRepository.getAssessedProperties(date, wardName);

		return buildAssessedPropertiesMetrics(data, "usageCategory");
	}
	//Transaction
	private List<GroupedData>buildTransaction(String date, String wardName) {

		Map<String, Long> data = PropertyRepository.getAssessedProperties(date, wardName);

		return buildAssessedPropertiesMetrics(data, "usageCategory");
	}
	

//	 Completion Rate
//		private List<GroupedData> buildPropertyRegisteredMetrics( String wardName) {
//
//			Map<String, BigDecimal> data = PropertyRepository.getPropertiesRegisteredByFinancialYear(wardName);
//
//			return buildDepartmentWiseDecimalMetrics(data, "department");
//		}
		
//		
//		private List<GroupedData> buildPropertyRegisteredMetrics(String wardName) {
//
//		    List<Bucket> buckets =
//		            PropertyRepository.getPropertiesRegisteredByFinancialYear(wardName);
//
//		    GroupedData groupedData = GroupedData.builder()
//		            .groupBy("financialYear")
//		            .buckets(buckets)
//		            .build();
//
//		    return Collections.singletonList(groupedData);
//		}

	// Today complaints
//	private List<GroupedData> buildTodayComplaint(String date, String wardName) {
//
//		List<GroupedData> response = new ArrayList<>();
//
//		// Status Wise
//		Map<String, Long> statusData = PropertyRepository.getStatus(date, wardName);
//		response.add(buildGenericMetrics(statusData, "status", PropertyRepository.getAllStatuses()));
//
//		// Channel Wise
//		Map<String, Long> channelData = PropertyRepository.getChannel(date, wardName);
//		response.add(buildGenericMetrics(channelData, "channel", PropertyRepository.getAllChannelsSource()));
//
//		// Department Wise
//		Map<String, Long> deptData = PropertyRepository.getTodaysComplaints(date, wardName);
//		response.add(buildGenericMetrics(deptData, "department", PropertyRepository.getAllDepartments()));
//
//		// Category Wise
//		Map<String, Long> categoryData = PropertyRepository.getCategory(date, wardName);
//		response.add(buildGenericMetrics(categoryData, "category", PropertyRepository.getAllCategories()));
//
//		return response;
//	}

//	// Today Reopened Complaints
//	private List<GroupedData> buildTodayReopenedComplaints(String date, String wardName) {
//
//		Map<String, Long> data = PropertyRepository.getTodaysReopenedComplaints(date, wardName);
//
//		return buildDepartmentWiseMetrics(data, "department");
//	}

//	// Today Open Complaints
//	private List<GroupedData> buildTodayOpenComplaints(String date, String wardName) {
//
//		Map<String, Long> data = PropertyRepository.getTodayOpenComplaints(date, wardName);
//
//		return buildDepartmentWiseMetrics(data, "department");
//	}

//	// Today Assigned Complaints
//	private List<GroupedData> buildTodaysAssignedComaplaints(String date, String wardName) {
//
//		Map<String, Long> data = PropertyRepository.getTodayAssisgnedComplaints(date, wardName);
//
//		return buildDepartmentWiseMetrics(data, "department");
//	}

	// Average Solution Time
//	private List<GroupedData> buildAverageSolutionTime(String date, String wardName) {
//
//		Map<String, BigDecimal> data = PropertyRepository.getAverageSolutionTime(date, wardName);
//
//		return buildDepartmentWiseDecimalMetrics(data, "department");
//	}

//	// Today Reject Complaints
//	private List<GroupedData> buildTodayRejectedComplaints(String date, String wardName) {
//
//		Map<String, Long> data = PropertyRepository.getTodaysRejectedComplaints(date, wardName);
//
//		return buildDepartmentWiseMetrics(data, "department");
	//}

	// Today Reassign Complaints
//	private List<GroupedData> buildTodayReassingComplaints(String date, String wardName) {
//
//		Map<String, Long> data = PropertyRepository.getTodaysReassignComplaints(date, wardName);
//
//		return buildDepartmentWiseMetrics(data, "department");
//	}

	// Today Reassign Request Complaints
//	private List<GroupedData> buildTodayReassingRequestedComplaints(String date, String wardName) {
//
//		Map<String, Long> data = PropertyRepository.getTodaysReassignrequestComplaints(date, wardName);
//
//		return buildDepartmentWiseMetrics(data, "department");
//	}

	// Today Closed Complaints
//	private List<GroupedData> buildTodayClosedComplaints(String date, String wardName) {
//
//		Map<String, Long> data = PropertyRepository.getTodaysClosedComplaints(date, wardName);
//
//		return buildDepartmentWiseMetrics(data, "department");
//	}

	// Today Resolved Complaints
//	private List<GroupedData> buildTodayResolvedComplaints(String date, String wardName) {
//
//		Map<String, Long> data = PropertyRepository.getTodaysResolvedComplaints(date, wardName);
//
//		return buildDepartmentWiseMetrics(data, "department");
//	}
	
}
//------------------------