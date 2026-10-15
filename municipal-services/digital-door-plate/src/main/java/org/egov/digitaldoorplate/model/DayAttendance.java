package org.egov.digitaldoorplate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class DayAttendance {

	private String date;

	private Boolean present;

	private Long startTime;

	private Long endTime;

	private Long durationMillis;

	private String dutyStatus;
}
