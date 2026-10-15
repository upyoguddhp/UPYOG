package org.egov.digitaldoorplate.model;

import java.util.List;

import org.egov.common.contract.response.ResponseInfo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AttendanceSummaryResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo;

	private String staffUuid;

	private String tenantId;

	private Integer month;

	private Integer year;

	private Integer totalDaysInMonth;

	private Integer monthlyDaysPresent;

	private Integer weeklyDaysPresent;

	private Long monthlyDutyDurationMillis;

	private Long weeklyDutyDurationMillis;

	private List<DayAttendance> dailyAttendances;
}
