package org.egov.digitaldoorplate.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoField;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.Attendance;
import org.egov.digitaldoorplate.model.AttendanceRequest;
import org.egov.digitaldoorplate.model.AttendanceResponse;
import org.egov.digitaldoorplate.model.AttendanceSummaryRequest;
import org.egov.digitaldoorplate.model.AttendanceSummaryResponse;
import org.egov.digitaldoorplate.model.DayAttendance;
import org.egov.digitaldoorplate.model.SearchCriteriaAttendance;
import org.egov.digitaldoorplate.model.SearchCriteriaAttendanceRequest;
import org.egov.digitaldoorplate.repository.AttendanceRepository;
import org.egov.digitaldoorplate.util.DdpConstants;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AttendanceService {

	@Autowired
	private AttendanceRepository attendanceRepository;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	public AttendanceResponse startDuty(AttendanceRequest attendanceRequest) {

		Attendance attendance = validateAndEnrichStaffDetails(attendanceRequest);

		if (null == attendance.getLatitude() || null == attendance.getLongitude()) {
			throw new CustomException("INVALID_REQUEST",
					"Latitude and longitude of the garbage collector are mandatory to start the duty.");
		}

		// return the already running duty instead of creating a duplicate
		List<Attendance> openAttendances = findOpenAttendancesForToday(attendance);
		if (!CollectionUtils.isEmpty(openAttendances)) {
			return AttendanceResponse.builder()
					.responseInfo(responseInfoFactory
							.createResponseInfoFromRequestInfo(attendanceRequest.getRequestInfo(), true))
					.attendances(openAttendances).build();
		}

		Long now = System.currentTimeMillis();
		String userUuid = attendanceRequest.getRequestInfo().getUserInfo().getUuid();

		attendance.setUuid(UUID.randomUUID().toString());
		attendance.setDutyStatus(DdpConstants.DUTY_STATUS_STARTED);
		attendance.setStartTime(now);
		attendance.setEndTime(null);
		attendance.setIsActive(Boolean.TRUE);
		attendance.setCreatedBy(userUuid);
		attendance.setCreatedDate(now);
		attendance.setLastModifiedBy(userUuid);
		attendance.setLastModifiedDate(now);

		attendanceRepository.create(attendance);

		return AttendanceResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(attendanceRequest.getRequestInfo(), true))
				.attendances(Collections.singletonList(attendance)).build();
	}

	public AttendanceResponse endDuty(AttendanceRequest attendanceRequest) {

		Attendance attendance = validateAndEnrichStaffDetails(attendanceRequest);

		List<Attendance> openAttendances;
		if (StringUtils.isNotEmpty(attendance.getUuid())) {
			openAttendances = attendanceRepository.search(SearchCriteriaAttendance.builder()
					.uuid(Collections.singletonList(attendance.getUuid()))
					.dutyStatus(Collections.singletonList(DdpConstants.DUTY_STATUS_STARTED)).build());
		} else {
			openAttendances = findOpenAttendancesForToday(attendance);
		}

		if (CollectionUtils.isEmpty(openAttendances)) {
			throw new CustomException("ATTENDANCE_NOT_FOUND",
					"No running duty found for the staff. Start the duty first.");
		}

		Long now = System.currentTimeMillis();
		String userUuid = attendanceRequest.getRequestInfo().getUserInfo().getUuid();

		Attendance openAttendance = openAttendances.get(0);
		openAttendance.setDutyStatus(DdpConstants.DUTY_STATUS_ENDED);
		openAttendance.setEndTime(now);
		if (StringUtils.isNotEmpty(attendance.getRemarks())) {
			openAttendance.setRemarks(attendance.getRemarks());
		}
		openAttendance.setLastModifiedBy(userUuid);
		openAttendance.setLastModifiedDate(now);

		attendanceRepository.endDuty(openAttendance);

		return AttendanceResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(attendanceRequest.getRequestInfo(), true))
				.attendances(Collections.singletonList(openAttendance)).build();
	}

	public AttendanceResponse search(SearchCriteriaAttendanceRequest searchRequest) {

		SearchCriteriaAttendance criteria = searchRequest.getSearchCriteriaAttendance();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search attendances.");
		}

		List<Attendance> attendances = attendanceRepository.search(criteria);

		return AttendanceResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(),
						true))
				.attendances(attendances).build();
	}

	/**
	 * Monthly + weekly attendance summary of an individual garbage collector
	 * for the mobile application. Defaults to the logged in user and the
	 * current month when staffUuid/month/year are not provided.
	 */
	public AttendanceSummaryResponse summary(AttendanceSummaryRequest summaryRequest) {

		if (null == summaryRequest.getRequestInfo() || null == summaryRequest.getRequestInfo().getUserInfo()
				|| StringUtils.isEmpty(summaryRequest.getRequestInfo().getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}

		String staffUuid = StringUtils.isNotEmpty(summaryRequest.getStaffUuid()) ? summaryRequest.getStaffUuid()
				: summaryRequest.getRequestInfo().getUserInfo().getUuid();
		String tenantId = StringUtils.isNotEmpty(summaryRequest.getTenantId()) ? summaryRequest.getTenantId()
				: summaryRequest.getRequestInfo().getUserInfo().getTenantId();
		if (StringUtils.isEmpty(tenantId)) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory to fetch the attendance summary.");
		}

		ZoneId zone = ZoneId.of(DdpConstants.TIMEZONE);
		LocalDate today = LocalDate.now(zone);

		int month = null != summaryRequest.getMonth() ? summaryRequest.getMonth() : today.getMonthValue();
		int year = null != summaryRequest.getYear() ? summaryRequest.getYear() : today.getYear();
		if (month < 1 || month > 12) {
			throw new CustomException("INVALID_REQUEST", "Month must be between 1 and 12.");
		}

		YearMonth yearMonth = YearMonth.of(year, month);
		Long monthStart = yearMonth.atDay(1).atStartOfDay(zone).toInstant().toEpochMilli();
		Long monthEnd = yearMonth.plusMonths(1).atDay(1).atStartOfDay(zone).toInstant().toEpochMilli() - 1;

		List<Attendance> monthAttendances = attendanceRepository.search(SearchCriteriaAttendance.builder()
				.staffUuid(Collections.singletonList(staffUuid)).tenantId(tenantId)
				.fromDate(monthStart).toDate(monthEnd).isActive(Boolean.TRUE).build());

		Map<LocalDate, DayAttendance> dayWiseAttendance = groupByDay(monthAttendances, zone);

		List<DayAttendance> dailyAttendances = new ArrayList<>();
		long monthlyDuration = 0L;
		for (int day = 1; day <= yearMonth.lengthOfMonth(); day++) {
			LocalDate date = yearMonth.atDay(day);
			DayAttendance dayAttendance = dayWiseAttendance.get(date);
			if (null == dayAttendance) {
				dayAttendance = DayAttendance.builder().date(date.format(DateTimeFormatter.ISO_LOCAL_DATE))
						.present(Boolean.FALSE).build();
			} else {
				monthlyDuration += null != dayAttendance.getDurationMillis() ? dayAttendance.getDurationMillis() : 0L;
			}
			dailyAttendances.add(dayAttendance);
		}

		// current week (Monday to Sunday) is fetched separately as it can span
		// across two months
		LocalDate weekStartDate = today.with(ChronoField.DAY_OF_WEEK, 1);
		Long weekStart = weekStartDate.atStartOfDay(zone).toInstant().toEpochMilli();
		Long weekEnd = weekStartDate.plusDays(7).atStartOfDay(zone).toInstant().toEpochMilli() - 1;

		List<Attendance> weekAttendances = attendanceRepository.search(SearchCriteriaAttendance.builder()
				.staffUuid(Collections.singletonList(staffUuid)).tenantId(tenantId)
				.fromDate(weekStart).toDate(weekEnd).isActive(Boolean.TRUE).build());

		Map<LocalDate, DayAttendance> weekDayWiseAttendance = groupByDay(weekAttendances, zone);
		long weeklyDuration = 0L;
		for (DayAttendance dayAttendance : weekDayWiseAttendance.values()) {
			weeklyDuration += null != dayAttendance.getDurationMillis() ? dayAttendance.getDurationMillis() : 0L;
		}

		return AttendanceSummaryResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(summaryRequest.getRequestInfo(), true))
				.staffUuid(staffUuid)
				.tenantId(tenantId)
				.month(month)
				.year(year)
				.totalDaysInMonth(yearMonth.lengthOfMonth())
				.monthlyDaysPresent(dayWiseAttendance.size())
				.weeklyDaysPresent(weekDayWiseAttendance.size())
				.monthlyDutyDurationMillis(monthlyDuration)
				.weeklyDutyDurationMillis(weeklyDuration)
				.dailyAttendances(dailyAttendances)
				.build();
	}

	private Map<LocalDate, DayAttendance> groupByDay(List<Attendance> attendances, ZoneId zone) {
		Map<LocalDate, DayAttendance> dayWiseAttendance = new LinkedHashMap<>();

		attendances.forEach(attendance -> {
			if (null == attendance.getStartTime()) {
				return;
			}
			LocalDate date = Instant.ofEpochMilli(attendance.getStartTime()).atZone(zone).toLocalDate();
			long duration = null != attendance.getEndTime() ? attendance.getEndTime() - attendance.getStartTime() : 0L;

			DayAttendance dayAttendance = dayWiseAttendance.get(date);
			if (null == dayAttendance) {
				dayWiseAttendance.put(date, DayAttendance.builder()
						.date(date.format(DateTimeFormatter.ISO_LOCAL_DATE))
						.present(Boolean.TRUE)
						.startTime(attendance.getStartTime())
						.endTime(attendance.getEndTime())
						.durationMillis(duration)
						.dutyStatus(attendance.getDutyStatus())
						.build());
			} else {
				// multiple duties in a day: keep earliest start, latest end and
				// add up the durations
				if (attendance.getStartTime() < dayAttendance.getStartTime()) {
					dayAttendance.setStartTime(attendance.getStartTime());
				}
				if (null != attendance.getEndTime() && (null == dayAttendance.getEndTime()
						|| attendance.getEndTime() > dayAttendance.getEndTime())) {
					dayAttendance.setEndTime(attendance.getEndTime());
				}
				dayAttendance.setDurationMillis(dayAttendance.getDurationMillis() + duration);
				if (DdpConstants.DUTY_STATUS_STARTED.equals(attendance.getDutyStatus())) {
					dayAttendance.setDutyStatus(attendance.getDutyStatus());
				}
			}
		});

		return dayWiseAttendance;
	}

	private Attendance validateAndEnrichStaffDetails(AttendanceRequest attendanceRequest) {

		if (null == attendanceRequest.getRequestInfo() || null == attendanceRequest.getRequestInfo().getUserInfo()
				|| StringUtils.isEmpty(attendanceRequest.getRequestInfo().getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}

		Attendance attendance = attendanceRequest.getAttendance();
		if (null == attendance) {
			attendance = new Attendance();
			attendanceRequest.setAttendance(attendance);
		}

		if (StringUtils.isEmpty(attendance.getStaffUuid())) {
			attendance.setStaffUuid(attendanceRequest.getRequestInfo().getUserInfo().getUuid());
		}
		if (StringUtils.isEmpty(attendance.getStaffName())) {
			attendance.setStaffName(attendanceRequest.getRequestInfo().getUserInfo().getUserName());
		}
		if (StringUtils.isEmpty(attendance.getTenantId())) {
			attendance.setTenantId(attendanceRequest.getRequestInfo().getUserInfo().getTenantId());
		}
		if (StringUtils.isEmpty(attendance.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory to mark the attendance.");
		}

		return attendance;
	}

	private List<Attendance> findOpenAttendancesForToday(Attendance attendance) {
		return attendanceRepository.search(SearchCriteriaAttendance.builder()
				.staffUuid(Collections.singletonList(attendance.getStaffUuid()))
				.tenantId(attendance.getTenantId())
				.dutyStatus(Collections.singletonList(DdpConstants.DUTY_STATUS_STARTED))
				.fromDate(getStartOfDay())
				.isActive(Boolean.TRUE)
				.build());
	}

	private Long getStartOfDay() {
		ZoneId zone = ZoneId.of(DdpConstants.TIMEZONE);
		return ZonedDateTime.now(zone).toLocalDate().atStartOfDay(zone).toInstant().toEpochMilli();
	}
}
