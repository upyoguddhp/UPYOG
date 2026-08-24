package org.egov.digitaldoorplate.service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.GarbageCollector;
import org.egov.digitaldoorplate.model.GarbageSupervisor;
import org.egov.digitaldoorplate.model.contract.CreateUserRequest;
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
 * Talks to egov-user the same way every other service in this platform does
 * (see garbage-service's UserService): a plain REST call through
 * {@code ServiceRequestRepository}, no user-service SDK.
 */
@Service
@Slf4j
public class UserService {

	@Value("${egov.user.host}")
	private String userServiceHostUrl;

	@Value("${egov.user.context.path}")
	private String userContextPath;

	@Value("${egov.user.search.endpoint}")
	private String userSearchEndpoint;

	@Value("${egov.user.create.path}")
	private String userCreateEndpoint;

	@Autowired
	private ServiceRequestRepository serviceRequestRepository;

	@Autowired
	private ObjectMapper mapper;

	/**
	 * Returns the collector's existing egov-user account for their mobile
	 * number/tenant, or creates a new EMPLOYEE user with the
	 * GARBAGE_COLLECTOR role if none exists yet.
	 */
	public User createOrGetCollectorUser(RequestInfo requestInfo, GarbageCollector collector) {

		User existingUser = findExistingUser(requestInfo, collector);
		if (existingUser != null) {
			return existingUser;
		}

		User newUser = User.builder()
				.name(collector.getCollectorName())
				.userName(collector.getMobileNumber())
				.mobileNumber(collector.getMobileNumber())
				.emailId(collector.getEmailId())
				.gender(collector.getGender())
				.tenantId(collector.getTenantId())
				.type(DdpConstants.USER_TYPE_EMPLOYEE)
				.active(true)
				.roles(Collections.singletonList(Role.builder()
						.code(DdpConstants.USER_ROLE_GARBAGE_COLLECTOR)
						.name("Garbage Collector")
						.build()))
				.build();

		UserDetailResponse response = createUser(requestInfo, newUser);

		if (ObjectUtils.isEmpty(response) || CollectionUtils.isEmpty(response.getUser())
				|| ObjectUtils.isEmpty(response.getUser().get(0).getUuid())) {
			throw new CustomException("USER_CREATE_FAILED",
					"Failed to create egov-user account for garbage collector, mobileNumber: "
							+ collector.getMobileNumber());
		}

		return response.getUser().get(0);
	}

	private User findExistingUser(RequestInfo requestInfo, GarbageCollector collector) {
		return findExistingUser(requestInfo, collector.getMobileNumber(), collector.getTenantId());
	}

	/**
	 * Returns the supervisor's existing egov-user account for their mobile
	 * number/tenant, or creates a new EMPLOYEE user with the
	 * GARBAGE_SUPERVISOR role if none exists yet.
	 */
	public User createOrGetSupervisorUser(RequestInfo requestInfo, GarbageSupervisor supervisor) {

		User existingUser = findExistingUser(requestInfo, supervisor.getMobileNumber(), supervisor.getTenantId());
		if (existingUser != null) {
			return existingUser;
		}

		User newUser = User.builder()
				.name(supervisor.getSupervisorName())
				.userName(supervisor.getMobileNumber())
				.mobileNumber(supervisor.getMobileNumber())
				.emailId(supervisor.getEmailId())
				.gender(supervisor.getGender())
				.tenantId(supervisor.getTenantId())
				.type(DdpConstants.USER_TYPE_EMPLOYEE)
				.active(true)
				.roles(Collections.singletonList(Role.builder()
						.code(DdpConstants.USER_ROLE_GARBAGE_SUPERVISOR)
						.name("Garbage Supervisor")
						.build()))
				.build();

		UserDetailResponse response = createUser(requestInfo, newUser);

		if (ObjectUtils.isEmpty(response) || CollectionUtils.isEmpty(response.getUser())
				|| ObjectUtils.isEmpty(response.getUser().get(0).getUuid())) {
			throw new CustomException("USER_CREATE_FAILED",
					"Failed to create egov-user account for garbage supervisor, mobileNumber: "
							+ supervisor.getMobileNumber());
		}

		return response.getUser().get(0);
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

	private UserDetailResponse createUser(RequestInfo requestInfo, User user) {
		StringBuilder uri = new StringBuilder(userServiceHostUrl).append(userContextPath).append(userCreateEndpoint);
		CreateUserRequest createUserRequest = CreateUserRequest.builder().requestInfo(requestInfo).user(user).build();
		return callUserService(createUserRequest, uri);
	}

	@SuppressWarnings("unchecked")
	private UserDetailResponse callUserService(Object request, StringBuilder uri) {
		try {
			Optional<Object> response = serviceRequestRepository.fetchResult(uri, request);
			if (!response.isPresent()) {
				return new UserDetailResponse();
			}

			LinkedHashMap<String, Object> responseMap = (LinkedHashMap<String, Object>) response.get();
			parseDates(responseMap);
			return mapper.convertValue(responseMap, UserDetailResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("USER_SERVICE_ERROR",
					"Unable to parse response from egov-user: " + e.getMessage());
		}
	}

	@SuppressWarnings("unchecked")
	private void parseDates(LinkedHashMap<String, Object> responseMap) {
		List<LinkedHashMap<String, Object>> users = (List<LinkedHashMap<String, Object>>) responseMap.get("user");
		if (users == null) {
			return;
		}
		String dateTimeFormat = "dd-MM-yyyy HH:mm:ss";
		users.forEach(userMap -> {
			userMap.put("createdDate", toEpochMillis((String) userMap.get("createdDate"), dateTimeFormat));
			userMap.put("lastModifiedDate", toEpochMillis((String) userMap.get("lastModifiedDate"), dateTimeFormat));
			if (userMap.get("pwdExpiryDate") != null) {
				userMap.put("pwdExpiryDate", toEpochMillis((String) userMap.get("pwdExpiryDate"), dateTimeFormat));
			}
			if (userMap.get("dob") != null) {
				userMap.put("dob", toEpochMillis((String) userMap.get("dob"), "dd/MM/yyyy"));
			}
		});
	}

	private Long toEpochMillis(String date, String format) {
		if (date == null) {
			return null;
		}
		try {
			return new SimpleDateFormat(format).parse(date).getTime();
		} catch (ParseException e) {
			log.warn("Unable to parse date '{}' with format '{}' from egov-user response", date, format);
			return null;
		}
	}
}
