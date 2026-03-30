package org.egov.pt.models.data;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Metrics {
	 private long assessments;
		private long todaysTotalApplications;
		private long todaysClosedApplications;
		private long noOfPropertiesPaidToday;
		private long todaysApprovedApplications;
		private long todaysApprovedApplicationsWithinSLA;
		private long pendingApplicationsBeyondTimeline;
		private double avgDaysForApplicationApproval;
		private long stipulatedDays;
		//groupdata
	
	private List<GroupedData> todaysMovedApplications;
	private List<GroupedData> propertiesRegistered;
	private List<GroupedData> assessedProperties;
	private List<GroupedData> transactions;
	private List<GroupedData> todayCollection;
	private List<GroupedData> propertyTax;
	private List<GroupedData> cess;
	private List<GroupedData> rebate;
	private List<GroupedData> penalty;
	private List<GroupedData> interest;
	
}
