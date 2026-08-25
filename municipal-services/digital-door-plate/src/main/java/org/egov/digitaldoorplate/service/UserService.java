package org.egov.digitaldoorplate.service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.Contractor;
import org.egov.digitaldoorplate.model.GarbageCollector;
import org.egov.digitaldoorplate.model.GarbageSupervisor;
import org.egov.digitaldoorplate.model.contract.Assignment;
import org.egov.digitaldoorplate.model.contract.Employee;
import org.egov.digitaldoorplate.model.contract.EmployeeRequest;
import org.egov.digitaldoorplate.model.contract.EmployeeResponse;
import org.egov.digitaldoorplate.model.contract.Role;
import org.egov.digitaldoorplate.model.contract.User;
import org.egov.digitaldoorplate.model.contract.UserDetailResponse;
import org.egov.digitaldoorplate.model.contract.UserSearchRequest;
import org.egov.digitaldoorplate.repository.ServiceRequestRepository;
import org.egov.digitaldoorplate.util.DdpConstants;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * Looks up existing logins via egov-user directly, but creates new ones
 * through egov-hrms's {@code /egov-hrms/employees/_create} (which in turn
 * provisions the underlying egov-user account) rather than calling egov-user
 * directly, so every DDP-onboarded person shows up as an HRMS employee.
 */
@Service
@Slf4j
public class UserService {

	@Value("${egov.user.host}")
	private String userServiceHostUrl;

	@Value("${egov.user.search.endpoint}")
	private String userSearchEndpoint;

	@Value("${egov.hrms.host}")
	private String hrmsServiceHostUrl;

	@Value("${egov.hrms.context.path}")
	private String hrmsContextPath;

	@Value("${egov.hrms.create.path}")
	private String hrmsCreateEndpoint;

	@Autowired
	private DdpConstants ddpConstants;

	@Autowired
	private ServiceRequestRepository serviceRequestRepository;

	@Autowired
	private ObjectMapper mapper;

	/**
	 * Returns the collector's existing egov-user account for their mobile
	 * number/tenant, or onboards them as a new HRMS employee (role
	 * {@code EMPLOYEE} + {@code DDP_GRBG_COLLECTOR}) if none exists yet.
	 */
	public User createOrGetCollectorUser(RequestInfo requestInfo, GarbageCollector collector) {

		User existingUser = findExistingUser(requestInfo, collector.getMobileNumber(), collector.getTenantId());
		if (existingUser != null) {
			return existingUser;
		}

		return createEmployeeUser(requestInfo, collector.getCollectorName(), collector.getMobileNumber(),
				collector.getEmailId(), collector.getGender(), collector.getDob(), collector.getTenantId(),
				collector.getJoiningDate(), DdpConstants.USER_ROLE_GARBAGE_COLLECTOR, "Garbage Collector",
				buildWardAdditionalDetail(collector.getTenantId(), collector.getWardNumber()));
	}

	/**
	 * Returns the supervisor's existing egov-user account for their mobile
	 * number/tenant, or onboards them as a new HRMS employee (role
	 * {@code EMPLOYEE} + {@code DDP_SUPERVISOR}) if none exists yet.
	 */
	public User createOrGetSupervisorUser(RequestInfo requestInfo, GarbageSupervisor supervisor) {

		User existingUser = findExistingUser(requestInfo, supervisor.getMobileNumber(), supervisor.getTenantId());
		if (existingUser != null) {
			return existingUser;
		}

		return createEmployeeUser(requestInfo, supervisor.getSupervisorName(), supervisor.getMobileNumber(),
				supervisor.getEmailId(), supervisor.getGender(), supervisor.getDob(), supervisor.getTenantId(),
				supervisor.getJoiningDate(), DdpConstants.USER_ROLE_GARBAGE_SUPERVISOR, "Garbage Supervisor",
				buildWardAdditionalDetail(supervisor.getTenantId(), supervisor.getWardNumber()));
	}

	/**
	 * Returns the contractor's existing egov-user account for their contact
	 * person's mobile number/tenant, or onboards them as a new HRMS employee
	 * (role {@code EMPLOYEE} + {@code DDP_CONTRACTOR}) if none exists yet. The
	 * login identity is the individual named in {@code contractorDetails} (the
	 * organisation's contact person), not the organisation itself.
	 */
	public User createOrGetContractorUser(RequestInfo requestInfo, Contractor contractor) {

		String mobileNumber = contractor.getContractorDetails().getContactNumber();

		User existingUser = findExistingUser(requestInfo, mobileNumber, contractor.getTenantId());
		if (existingUser != null) {
			return existingUser;
		}

		return createEmployeeUser(requestInfo, contractor.getContractorDetails().getName(), mobileNumber,
				contractor.getContractorDetails().getEmail(), contractor.getGender(),
				contractor.getContractorDetails().getDob(), contractor.getTenantId(), contractor.getStartDate(),
				DdpConstants.USER_ROLE_CONTRACTOR, "Contractor",
				buildWardAdditionalDetail(contractor.getTenantId(), contractor.getWard()));
	}

	/**
	 * Onboards a new HRMS employee and returns the egov-user account HRMS
	 * created for them. Every DDP employee gets the generic {@code EMPLOYEE}
	 * role plus the role specific to their onboarding flow, both scoped to the
	 * state-level tenant (matching how HRMS registers employee logins), and a
	 * single current assignment against the record's own (ULB-level) tenant.
	 */
	private User createEmployeeUser(RequestInfo requestInfo, String name, String mobileNumber, String emailId,
			String gender, Long dob, String ulbTenantId, Long dateOfAppointment, String roleCode, String roleName,
			Object additionalDetail) {

		String stateTenantId = ddpConstants.getStateLevelTenantId();
		Long now = System.currentTimeMillis();

		User user = User.builder()
				.name(name)
				.mobileNumber(mobileNumber)
				.emailId(emailId)
				.gender(gender)
				.active(true)
				.type(DdpConstants.USER_TYPE_EMPLOYEE)
				.tenantId(stateTenantId)
				.dob(null == dob ? DdpConstants.DEFAULT_DOB : dob)
				.password(DdpConstants.DEFAULT_EMPLOYEE_PASSWORD)
				.roles(Arrays.asList(
						Role.builder().code(DdpConstants.USER_ROLE_EMPLOYEE).name("Employee")
								.tenantId(stateTenantId).build(),
						Role.builder().code(roleCode).name(roleName).tenantId(stateTenantId).build()))
				.build();

		Assignment assignment = Assignment.builder()
				.tenantid(ulbTenantId)
				.fromDate(now)
				.isCurrentAssignment(true)
				.department(DdpConstants.DDP_DEFAULT_DEPARTMENT)
				.designation(DdpConstants.DDP_DEFAULT_DESIGNATION)
				.build();

		Employee employee = Employee.builder()
				.employeeType(DdpConstants.EMPLOYEE_TYPE_PERMANENT)
				.isActive(true)
				.tenantId(stateTenantId)
				.dateOfAppointment(dateOfAppointment)
				.assignments(Collections.singletonList(assignment))
				.user(user)
				.additionalDetail(additionalDetail)
				.build();

		EmployeeRequest employeeRequest = EmployeeRequest.builder().requestInfo(requestInfo)
				.employees(Collections.singletonList(employee)).build();

		StringBuilder uri = new StringBuilder(hrmsServiceHostUrl).append(hrmsContextPath).append(hrmsCreateEndpoint);
		EmployeeResponse response = createEmployee(employeeRequest, uri);

		if (ObjectUtils.isEmpty(response) || CollectionUtils.isEmpty(response.getEmployees())
				|| null == response.getEmployees().get(0).getUser()
				|| ObjectUtils.isEmpty(response.getEmployees().get(0).getUser().getUuid())) {
			throw new CustomException("EMPLOYEE_CREATE_FAILED",
					"Failed to create HRMS employee account, mobileNumber: " + mobileNumber);
		}

		return response.getEmployees().get(0).getUser();
	}

	/**
	 * Builds the {@code additionalDetail.wards} block HRMS stores against the
	 * employee (free-form JSON on the HRMS side, not validated); mirrors the
	 * shape used by the rest of the platform for ward-scoped employees.
	 */
	private Object buildWardAdditionalDetail(String tenantId, List<String> wards) {
		Map<String, Object> wardEntry = new LinkedHashMap<>();
		wardEntry.put("tenantId", tenantId);
		wardEntry.put("role", Collections.emptyMap());
		wardEntry.put("wards", wards);

		Map<String, Object> additionalDetail = new LinkedHashMap<>();
		additionalDetail.put("wards", Collections.singletonList(wardEntry));
		return additionalDetail;
	}

	private User findExistingUser(RequestInfo requestInfo, String mobileNumber, String tenantId) {

		UserSearchRequest searchRequest = UserSearchRequest.builder()
				.requestInfo(requestInfo)
				.mobileNumber(mobileNumber)
				.tenantId(tenantId)
				.userType(DdpConstants.USER_TYPE_EMPLOYEE)
				.active(true)
				.build();

		StringBuilder uri = new StringBuilder(userServiceHostUrl).append(userSearchEndpoint);
		UserDetailResponse response = callUserService(searchRequest, uri);

		if (response != null && !CollectionUtils.isEmpty(response.getUser())) {
			return response.getUser().get(0);
		}
		return null;
	}

	@SuppressWarnings("unchecked")
	private UserDetailResponse callUserService(Object request, StringBuilder uri) {
		try {
			Optional<Object> response = serviceRequestRepository.fetchResult(uri, request);
			if (!response.isPresent()) {
				return new UserDetailResponse();
			}

			LinkedHashMap<String, Object> responseMap = (LinkedHashMap<String, Object>) response.get();
			parseUserDates(responseMap);
			return mapper.convertValue(responseMap, UserDetailResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("USER_SERVICE_ERROR",
					"Unable to parse response from egov-user: " + e.getMessage());
		}
	}

	@SuppressWarnings("unchecked")
	private EmployeeResponse createEmployee(Object request, StringBuilder uri) {
		try {
			Optional<Object> response = serviceRequestRepository.fetchResult(uri, request);
			if (!response.isPresent()) {
				return new EmployeeResponse();
			}

			LinkedHashMap<String, Object> responseMap = (LinkedHashMap<String, Object>) response.get();
			parseEmployeeDates(responseMap);
			return mapper.convertValue(responseMap, EmployeeResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("HRMS_SERVICE_ERROR",
					"Unable to parse response from egov-hrms: " + e.getMessage());
		}
	}

	@SuppressWarnings("unchecked")
	private void parseUserDates(LinkedHashMap<String, Object> responseMap) {
		List<LinkedHashMap<String, Object>> users = (List<LinkedHashMap<String, Object>>) responseMap.get("user");
		if (users == null) {
			return;
		}
		users.forEach(this::parseUserDateFields);
	}

	@SuppressWarnings("unchecked")
	private void parseEmployeeDates(LinkedHashMap<String, Object> responseMap) {
		List<LinkedHashMap<String, Object>> employees = (List<LinkedHashMap<String, Object>>) responseMap
				.get("Employees");
		if (employees == null) {
			return;
		}
		employees.forEach(employeeMap -> {
			LinkedHashMap<String, Object> userMap = (LinkedHashMap<String, Object>) employeeMap.get("user");
			if (userMap != null) {
				parseUserDateFields(userMap);
			}
		});
	}

	private void parseUserDateFields(LinkedHashMap<String, Object> userMap) {
		String dateTimeFormat = "dd-MM-yyyy HH:mm:ss";
		userMap.put("createdDate", toEpochMillis((String) userMap.get("createdDate"), dateTimeFormat));
		userMap.put("lastModifiedDate", toEpochMillis((String) userMap.get("lastModifiedDate"), dateTimeFormat));
		if (userMap.get("pwdExpiryDate") != null) {
			userMap.put("pwdExpiryDate", toEpochMillis((String) userMap.get("pwdExpiryDate"), dateTimeFormat));
		}
		if (userMap.get("dob") != null) {
			userMap.put("dob", toEpochMillis(String.valueOf(userMap.get("dob")), "dd/MM/yyyy"));
		}
	}

	private Long toEpochMillis(String date, String format) {
		if (date == null) {
			return null;
		}
		try {
			return new SimpleDateFormat(format).parse(date).getTime();
		} catch (ParseException e) {
			log.warn("Unable to parse date '{}' with format '{}' from service response", date, format);
			return null;
		}
	}
}
