package org.egov.user.domain.service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.util.CollectionUtils;

import java.util.HashMap;
import java.util.Map;

import org.egov.common.contract.response.ResponseInfo;
import org.egov.user.domain.model.AuditDetails;
import org.egov.user.domain.model.Role;
import org.egov.user.domain.model.SecureUser;
import org.egov.user.domain.model.User;
import org.egov.user.domain.model.UserSearchCriteria;
import org.egov.user.domain.model.UserSso;
import org.egov.user.domain.model.enums.Gender;
import org.egov.user.domain.model.enums.UserType;
import org.egov.user.persistence.repository.UserSsoRepository;
import org.egov.user.persistence.repository.UserRepository;
import org.egov.user.web.contract.HpSsoValidateToken;
import org.egov.user.web.contract.HpSsoValidateTokenResponse;
import org.egov.user.web.errorhandlers.Error;
import org.egov.user.web.errorhandlers.ErrorResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;
import org.egov.user.domain.service.utils.Constants;

@Service
@Slf4j
public class SsoService {

	@Autowired
	private RestTemplate restTemplate;

	@Autowired
	private UserService userService;

	@Autowired
	private UserSsoRepository userSsoRepository;

	@Autowired
	private Constants constants;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	@Qualifier("customAuthenticationManager")
	private AuthenticationManager authenticationManager;

	@Autowired
	private TokenIssuanceService tokenIssuanceService;

	public ResponseEntity<?> getHpSsoValidateTokenResponse(String token) {

		ResponseEntity<?> response = null;

		HpSsoValidateToken hpSsoValidateToken = HpSsoValidateToken.builder().token(token)
				.secret_key(constants.getSecretKey()).service_id(constants.getServiceId()).build();
		HpSsoValidateTokenResponse hpSsoValidateTokenResponse = getHpSsoValidateTokenResponse(hpSsoValidateToken);

		if (null != hpSsoValidateTokenResponse) {

			User user = getUserFromSsoTokenResponse(hpSsoValidateTokenResponse);

			log.info("getUserFromSsoTokenResponse Request {}", user);

			User dbUser = checkAndCreateUserSso(hpSsoValidateTokenResponse, user);

			// Real password-grant authentication against the fixed CITIZEN_PASSWORD every
			// SSO-created citizen is given (see getUserFromSsoTokenResponse) - this goes
			// through the same authentication path as a normal login, rather than a custom
			// bypass, since the old in-process token-issuance shortcut no longer exists in
			// the Spring Authorization Server stack.
			UsernamePasswordAuthenticationToken authToken =
					new UsernamePasswordAuthenticationToken(
							// the stored username can differ from the SSO one (update never changes it), so log in as the stored user
							dbUser != null && dbUser.getUsername() != null ? dbUser.getUsername() : user.getUsername(),
							user.getPassword());
			Map<String, String> details = new HashMap<>();
			details.put("tenantId", constants.getStateLevelTenantId());
			details.put("userType", UserType.CITIZEN.name());
			// The HP SSO token was validated above, so the OTP check (citizen.login.password.otp.enabled)
			// must not run against the fixed SSO password. Set in-process only, never from request data.
			details.put("isInternal", "true");
			authToken.setDetails(details);

			Authentication authentication = authenticationManager.authenticate(authToken);
			SecureUser secureUser = (SecureUser) authentication.getPrincipal();
			Object loginResponse = tokenIssuanceService.issueTokensFor(secureUser, "read");

			response = new ResponseEntity<Object>(loginResponse, HttpStatus.OK);

		} else {
			response = generateErrorResponse(HttpStatus.UNAUTHORIZED, HttpStatus.UNAUTHORIZED.toString(),
					"Login failed.", null);
		}

		return response;
	}

	private ResponseEntity<?> generateErrorResponse(HttpStatus unauthorized, String message, String description,
			ResponseInfo responseInfo) {

		org.egov.user.web.errorhandlers.Error error = Error.builder().code(unauthorized.value()).message(message)
				.description(description).build();
		ErrorResponse errorResponse = new ErrorResponse(responseInfo, error);

		return new ResponseEntity<ErrorResponse>(errorResponse, unauthorized);
	}

	private User getUserFromSsoTokenResponse(HpSsoValidateTokenResponse hpSsoValidateTokenResponse) {

		Date dob = null;
		try {
			dob = (new SimpleDateFormat("dd-MM-yyyy"))
					.parse(null != hpSsoValidateTokenResponse.getDob() ? hpSsoValidateTokenResponse.getDob() : null);
		} catch (ParseException e) {
			log.error("Error parsing dob from SSO response: {}", hpSsoValidateTokenResponse.getDob(), e);
		}

		List<Role> rolesList = Arrays.asList(Role.builder().name(null).code(constants.CITIZEN_ROLE)
				.tenantId(constants.getStateLevelTenantId()).build());
		Set<Role> rolesSet = rolesList.stream().collect(Collectors.toSet());

		String guardian = null;
		if (hpSsoValidateTokenResponse.getCo() != null) {
			String[] coParts = hpSsoValidateTokenResponse.getCo().split(":");
			if (coParts.length > 1) {
				guardian = coParts[1];
			}
		}

		User user = User.builder().username(hpSsoValidateTokenResponse.getUsername())
				.name(hpSsoValidateTokenResponse.getName()).mobileNumber(hpSsoValidateTokenResponse.getMobile())
				.emailId(hpSsoValidateTokenResponse.getEmail())
				.gender(Gender.valueOf(hpSsoValidateTokenResponse.getGender().toUpperCase())).dob(dob)
				.guardian(guardian).active(true).type(UserType.valueOf(constants.CITIZEN_ROLE))
				.password(constants.CITIZEN_PASSWORD).tenantId(constants.getStateLevelTenantId()).roles(rolesSet)
				.build();
		return user;
	}

	private User checkAndCreateUserSso(HpSsoValidateTokenResponse hpSsoValidateTokenResponse, User user) {
		// check ssoid exist
		UserSso userSso = userSsoRepository.getCountBySsoId(hpSsoValidateTokenResponse.getSsoId());

		UserSearchCriteria searchCriteria = UserSearchCriteria.builder().type(UserType.CITIZEN).active(true)
				.tenantId("hp").build();
		if (userSso != null) {
			searchCriteria.setUuid(Collections.singletonList(userSso.getUserUuid()));
		}
		else {
			searchCriteria.setMobileNumber(user.getMobileNumber());
		}
		List<User> userInDb = userService.searchUsers(searchCriteria, false, null);
		User newUser;
		if (CollectionUtils.isEmpty(userInDb)) {
			newUser = userService.createUser(user, null);
		} else {

			newUser = userInDb.get(0);
			Boolean update = false;
			// The stored username is never changed by an update, so it is not synced here; login uses the stored one.
			// If decryption failed the stored name/mobile are still ciphertext; comparing them to plain values
			// would force a pointless (and corrupting) update on every login.
			boolean storedEncrypted = isEncryptedValue(newUser.getName()) || isEncryptedValue(newUser.getMobileNumber());
			if (storedEncrypted) {
				log.warn("Stored user details for {} could not be decrypted; skipping SSO profile sync", newUser.getUuid());
			}
			if (!storedEncrypted && !Objects.equals(newUser.getName(), user.getName())) {
				newUser.setName(user.getName());
				update = true;
			}
			if (!storedEncrypted && !Objects.equals(newUser.getMobileNumber(), user.getMobileNumber())) {
				newUser.setMobileNumber(user.getMobileNumber());
				update = true;
			}
			if (update) {
				userService.updateWithoutOtpValidation(newUser, null);
			}
		}
		if (userSso == null || userSso.getUserUuid() == null) {

			UserSso newUserSso = enrichCreateUserSso(hpSsoValidateTokenResponse, newUser);
			userSsoRepository.create(newUserSso);
		}
		return newUser;
	}

	private boolean isEncryptedValue(String value) {
		return value != null && value.matches("^\\d+\\|.+");
	}

	private UserSso enrichCreateUserSso(HpSsoValidateTokenResponse hpSsoValidateTokenResponse, User newUser) {
		Long time = new Date().getTime();
		AuditDetails auditDetails = AuditDetails.builder().createdBy(newUser.getUuid()).createdDate(time)
				.lastModifiedBy(newUser.getUuid()).lastModifiedDate(time).build();
		return UserSso.builder().ssoId(hpSsoValidateTokenResponse.getSsoId()).userUuid(newUser.getUuid())
				.auditDetails(auditDetails).build();
	}

	public HpSsoValidateTokenResponse getHpSsoValidateTokenResponse(HpSsoValidateToken hpSsoValidateToken) {

		StringBuilder uri = new StringBuilder(constants.getSsoHpHost());
		uri.append(constants.getSsoHpEndpoint());

		HpSsoValidateTokenResponse hpSsoValidateTokenResponse;
		try {
			hpSsoValidateTokenResponse = restTemplate.postForObject(uri.toString(), hpSsoValidateToken,
					HpSsoValidateTokenResponse.class);
		} catch (RestClientException e) {
			log.error("Error occurred while rest call to SSO HP service.", e);
			return null;
		}

		return hpSsoValidateTokenResponse;
	}

}
