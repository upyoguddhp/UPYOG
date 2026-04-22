package org.egov.pgr.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.egov.pgr.config.PGRConfiguration;
import org.egov.pgr.repository.PGRRepository;
import org.egov.pgr.web.models.RequestInfoWrapper;
import org.egov.pgr.web.models.UmeedDashboardResponse;
import org.egov.pgr.web.models.data.Bucket;
import org.egov.pgr.web.models.data.DataItem;
import org.egov.pgr.web.models.data.GroupedData;
import org.egov.pgr.web.models.data.Metrics;
import org.egov.pgr.web.models.data.ULBMappings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UmeedDashboardService {

	@Autowired
	private PGRConfiguration pgrConfiguration;

	@Autowired
	private PGRRepository PGRRepository;

	public UmeedDashboardResponse prepareDataMetrics(RequestInfoWrapper requestInfoWrapper) {

		int slaDays = Optional.ofNullable(pgrConfiguration.getUmeedDashboardSlaDays()).orElse(7);

		// get yesterday's date
		// String yesterday =
		// LocalDate.now().minusDays(1).format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
		// LocalDate yesterday = LocalDate.now().minusDays(1); // this is a LocalDate

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

		// String yesterday = "30-08-2025";
		
		LocalDate startDate = LocalDate.parse("01-04-2025", formatter);
		LocalDate endDate = startDate;

		// Define the month (August 2025)
//    		LocalDate startDate = yesterday;
//    		LocalDate endDate = yesterday;
		// LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

		List<DataItem> allProcessedItems = new ArrayList<>();

		for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
			String formattedDate = date.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

			List<DataItem> dataItems = PGRRepository.getUniqueWards(formattedDate);

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

		DataItem returnObj = DataItem.builder().date(date).module("PGR").state("Himachal Pradesh")
				// .ward(dataItem.getWard())
				.ward(dataItem.getWard().matches("^\\d+$") ? "Ward" + dataItem.getWard() : dataItem.getWard())
				.region(dataItem.getRegion()).ulb(ULBMappings.getCode(dataItem.getUlb())).build();

		// dataItem.setDate(date);

		// dataItem.setModule("TL");
		// dataItem.setState("Himachal Pradesh");
		// get ulb data mappings
		// //dataItem.setUlb(ULBMappings.getCode(dataItem.getUlb()));
		// TODO map ulb if required
		
		
		Metrics metrics = PGRRepository.getDataMetrics(date, returnObj.getWard(), slaDays);

		// Add today's collection data
		metrics.setSlaAchievement(buildSlaAchivement(date,returnObj.getWard(), slaDays));

		// Completion Rate
		metrics.setCompletionRate(buildCompletionRate(date, returnObj.getWard()));

		// Today Complaints
		metrics.setTodaysComplaints(buildTodayComplaint(date, returnObj.getWard()));

		// Today Reopened Complaints
		metrics.setTodaysReopenedComplaints(buildTodayReopenedComplaints(date, returnObj.getWard()));

		// Today Open Complaints
		metrics.setTodaysOpenComplaints(buildTodayOpenComplaints(date, returnObj.getWard()));

		// Today Assigned Complaints
		metrics.setTodaysAssignedComplaints(buildTodaysAssignedComaplaints(date, returnObj.getWard()));

		// Average Solution Time
		metrics.setAverageSolutionTime(buildAverageSolutionTime(date, returnObj.getWard()));

		// Today Rejected Complaints
		metrics.setTodaysRejectedComplaints(buildTodayRejectedComplaints(date, returnObj.getWard()));

		// Today Reassign Complaints
		metrics.setTodaysReassignedComplaints(buildTodayReassingComplaints(date, returnObj.getWard()));

		// Today Reassign Requested Complaints
		metrics.setTodaysReassignRequestedComplaints(buildTodayReassingRequestedComplaints(date, returnObj.getWard()));

		// Today Closed Complaints
		metrics.setTodaysClosedComplaints(buildTodayClosedComplaints(date, returnObj.getWard()));

		// Today Resolved Complaints
		metrics.setTodaysResolvedComplaints(buildTodayResolvedComplaints(date, returnObj.getWard()));
		returnObj.setMetrics(metrics);
		return returnObj;

		// Departments Data
	}

	// All Department
	private List<GroupedData> buildDepartmentWiseMetrics(Map<String, Long> deptWiseData, String groupBy) {

		final Map<String, Long> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());

		List<String> allDepartments = PGRRepository.getAllDepartments();

		List<Bucket> buckets = allDepartments.stream().map(
				dept -> Bucket.builder().name(dept).value(BigDecimal.valueOf(safeData.getOrDefault(dept, 0L))).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
	}

// GenericMetrics
	private GroupedData buildGenericMetrics(Map<String, Long> data, String groupBy, List<String> masterList) {

		final Map<String, Long> safeData = Optional.ofNullable(data).orElse(Collections.emptyMap());

		List<Bucket> buckets = masterList.stream().map(
				item -> Bucket.builder().name(item).value(BigDecimal.valueOf(safeData.getOrDefault(item, 0L))).build())
				.collect(Collectors.toList());

		return GroupedData.builder().groupBy(groupBy).buckets(buckets).build();
	}

	// Decimal Data
	private List<GroupedData> buildDepartmentWiseDecimalMetrics(Map<String, BigDecimal> deptWiseData, String groupBy) {

		final Map<String, BigDecimal> safeData = Optional.ofNullable(deptWiseData).orElse(Collections.emptyMap());

		List<String> allDepartments = PGRRepository.getAllDepartments();

		List<Bucket> buckets = allDepartments.stream()
				.map(dept -> Bucket.builder().name(dept).value(safeData.getOrDefault(dept, BigDecimal.ZERO)).build())
				.collect(Collectors.toList());

		GroupedData groupedData = GroupedData.builder().groupBy(groupBy).buckets(buckets).build();

		return Collections.singletonList(groupedData);
	}
//--------------------Group data-------------------------------------
	// SlaAchivement
	private List<GroupedData> buildSlaAchivement(String date, String wardName,  Integer slaDays) {

		Map<String, Long> data = PGRRepository.getDepartmentWiseSlaAchivement(date, wardName, slaDays);

		return buildDepartmentWiseMetrics(data, "department");
	}

	// Completion Rate
		private List<GroupedData> buildCompletionRate(String date, String wardName) {

			Map<String, BigDecimal> data = PGRRepository.getDepartmentWiseCompletionRate(date, wardName);

			return buildDepartmentWiseDecimalMetrics(data, "department");
		}

	// Today complaints
	private List<GroupedData> buildTodayComplaint(String date, String wardName) {

		List<GroupedData> response = new ArrayList<>();

		// Status Wise
		Map<String, Long> statusData = PGRRepository.getStatus(date, wardName);
		response.add(buildGenericMetrics(statusData, "status", PGRRepository.getAllStatuses()));

		// Channel Wise
		Map<String, Long> channelData = PGRRepository.getChannel(date, wardName);
		response.add(buildGenericMetrics(channelData, "channel", PGRRepository.getAllChannelsSource()));

		// Department Wise
		Map<String, Long> deptData = PGRRepository.getTodaysComplaints(date, wardName);
		response.add(buildGenericMetrics(deptData, "department", PGRRepository.getAllDepartments()));

		// Category Wise
		Map<String, Long> categoryData = PGRRepository.getCategory(date, wardName);
		response.add(buildGenericMetrics(categoryData, "category", PGRRepository.getAllCategories()));

		return response;
	}

	// Today Reopened Complaints
	private List<GroupedData> buildTodayReopenedComplaints(String date, String wardName) {

		Map<String, Long> data = PGRRepository.getTodaysReopenedComplaints(date, wardName);

		return buildDepartmentWiseMetrics(data, "department");
	}

	// Today Open Complaints
	private List<GroupedData> buildTodayOpenComplaints(String date, String wardName) {

		Map<String, Long> data = PGRRepository.getTodayOpenComplaints(date, wardName);

		return buildDepartmentWiseMetrics(data, "department");
	}

	// Today Assigned Complaints
	private List<GroupedData> buildTodaysAssignedComaplaints(String date, String wardName) {

		Map<String, Long> data = PGRRepository.getTodayAssisgnedComplaints(date, wardName);

		return buildDepartmentWiseMetrics(data, "department");
	}

	// Average Solution Time
	private List<GroupedData> buildAverageSolutionTime(String date, String wardName) {

		Map<String, BigDecimal> data = PGRRepository.getAverageSolutionTime(date, wardName);

		return buildDepartmentWiseDecimalMetrics(data, "department");
	}

	// Today Reject Complaints
	private List<GroupedData> buildTodayRejectedComplaints(String date, String wardName) {

		Map<String, Long> data = PGRRepository.getTodaysRejectedComplaints(date, wardName);

		return buildDepartmentWiseMetrics(data, "department");
	}

	// Today Reassign Complaints
	private List<GroupedData> buildTodayReassingComplaints(String date, String wardName) {

		Map<String, Long> data = PGRRepository.getTodaysReassignComplaints(date, wardName);

		return buildDepartmentWiseMetrics(data, "department");
	}

	// Today Reassign Request Complaints
	private List<GroupedData> buildTodayReassingRequestedComplaints(String date, String wardName) {

		Map<String, Long> data = PGRRepository.getTodaysReassignrequestComplaints(date, wardName);

		return buildDepartmentWiseMetrics(data, "department");
	}

	// Today Closed Complaints
	private List<GroupedData> buildTodayClosedComplaints(String date, String wardName) {

		Map<String, Long> data = PGRRepository.getTodaysClosedComplaints(date, wardName);

		return buildDepartmentWiseMetrics(data, "department");
	}

	// Today Resolved Complaints
	private List<GroupedData> buildTodayResolvedComplaints(String date, String wardName) {

		Map<String, Long> data = PGRRepository.getTodaysResolvedComplaints(date, wardName);

		return buildDepartmentWiseMetrics(data, "department");
	}
}
//------------------------