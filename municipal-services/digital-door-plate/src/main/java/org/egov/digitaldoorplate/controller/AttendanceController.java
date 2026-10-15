package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.AttendanceRequest;
import org.egov.digitaldoorplate.model.AttendanceResponse;
import org.egov.digitaldoorplate.model.AttendanceSummaryRequest;
import org.egov.digitaldoorplate.model.AttendanceSummaryResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaAttendanceRequest;
import org.egov.digitaldoorplate.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/attendance")
public class AttendanceController {

	@Autowired
	private AttendanceService attendanceService;

	@PostMapping("/_startDuty")
	public ResponseEntity<AttendanceResponse> startDuty(@RequestBody AttendanceRequest attendanceRequest) {
		return ResponseEntity.ok(attendanceService.startDuty(attendanceRequest));
	}

	@PostMapping("/_endDuty")
	public ResponseEntity<AttendanceResponse> endDuty(@RequestBody AttendanceRequest attendanceRequest) {
		return ResponseEntity.ok(attendanceService.endDuty(attendanceRequest));
	}

	@PostMapping("/_search")
	public ResponseEntity<AttendanceResponse> search(
			@RequestBody SearchCriteriaAttendanceRequest searchCriteriaAttendanceRequest) {
		return ResponseEntity.ok(attendanceService.search(searchCriteriaAttendanceRequest));
	}

	@PostMapping("/_summary")
	public ResponseEntity<AttendanceSummaryResponse> summary(
			@RequestBody AttendanceSummaryRequest attendanceSummaryRequest) {
		return ResponseEntity.ok(attendanceService.summary(attendanceSummaryRequest));
	}
}
