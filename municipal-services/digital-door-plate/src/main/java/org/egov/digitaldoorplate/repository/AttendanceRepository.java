package org.egov.digitaldoorplate.repository;

import java.sql.Date;
import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.Attendance;
import org.egov.digitaldoorplate.model.SearchCriteriaAttendance;
import org.egov.digitaldoorplate.repository.builder.AttendanceQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.AttendanceRowMapper;
import org.egov.digitaldoorplate.util.JsonbUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AttendanceRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private AttendanceQueryBuilder queryBuilder;

	@Autowired
	private AttendanceRowMapper rowMapper;

	@Autowired
	private JsonbUtil jsonbUtil;

	public void create(Attendance attendance) {
		jdbcTemplate.update(AttendanceQueryBuilder.CREATE_QUERY,
				attendance.getUuid(),
				attendance.getTenantId(),
				attendance.getStaffUuid(),
				attendance.getStaffName(),
				attendance.getMobileNumber(),
				attendance.getDutyStatus(),
				null != attendance.getDutyDate() ? Date.valueOf(attendance.getDutyDate()) : null,
				attendance.getStartTime(),
				attendance.getEndTime(),
				attendance.getLatitude(),
				attendance.getLongitude(),
				attendance.getRemarks(),
				jsonbUtil.toPGobject(attendance.getAdditionalDetails()),
				attendance.getIsActive(),
				attendance.getCreatedBy(),
				attendance.getCreatedDate(),
				attendance.getLastModifiedBy(),
				attendance.getLastModifiedDate());
	}

	public void endDuty(Attendance attendance) {
		jdbcTemplate.update(AttendanceQueryBuilder.END_DUTY_QUERY,
				attendance.getDutyStatus(),
				attendance.getEndTime(),
				attendance.getRemarks(),
				attendance.getLastModifiedBy(),
				attendance.getLastModifiedDate(),
				attendance.getUuid());
	}

	public List<Attendance> search(SearchCriteriaAttendance criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}
}
