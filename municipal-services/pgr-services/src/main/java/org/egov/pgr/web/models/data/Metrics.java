package org.egov.pgr.web.models.data;

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
	private double avgDaysForApplicationApproval;
	private long stipulatedDays;
	
	private List<GroupedData> slaAchievement;
	private List<GroupedData> completionRate;
	private long uniqueCitizen;
	private List<GroupedData> todaysComplaints;
	private List<GroupedData> todaysReopenedComplaints;
	private List<GroupedData> todaysOpenComplaints;
	private List<GroupedData> todaysAssisgnedComaplaints;
	private List<GroupedData> averageSolutionTime;
	private List<GroupedData> todaysRejectedComplaints;
	private List<GroupedData> todaysReassignComplaints;
	private List<GroupedData> todaysReassignRequestedComplaints;
	private List<GroupedData> todaysClosedComplaints;
	private List<GroupedData> todaysResolvedComplaints;
	

}
