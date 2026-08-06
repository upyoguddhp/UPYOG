package org.egov.user.domain.service;


import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.egov.user.domain.model.AuditDetails;
import org.egov.user.domain.model.Role;
import org.egov.user.domain.model.User;
import org.egov.user.domain.model.UserCsc;
import org.egov.user.domain.model.UserSearchCriteria;
import org.egov.user.domain.model.enums.UserType;
import org.egov.user.domain.service.utils.Constants;
import org.egov.user.persistence.repository.UserCscRepository;
import org.egov.user.web.contract.CscValidateTokenApiResponse;
import org.egov.user.web.contract.CscValidateTokenResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;



@Service
@Slf4j
public class CscConnectService {
	@Autowired
	private Constants constants;

	@Autowired
	private RestTemplate restTemplate;

	@Autowired
	private UserService userService;

	@Autowired
	private UserCscRepository userCscRepository;
	
	    public ResponseEntity<?> getCscValidateTokenResponse(String accessToken) {
	        if (accessToken == null || accessToken.trim().isEmpty()) {
	            return buildErrorResponse(HttpStatus.BAD_REQUEST,
	                    "CSC_TOKEN_MISSING", "Token is required");
	        }

	        //CscValidateTokenResponse cscValidateTokenResponse = getCscValidateToken(accessToken);
	        CscValidateTokenResponse cscValidateTokenResponse =   new CscValidateTokenResponse();
	        cscValidateTokenResponse.setUsername("500100100014");
	        cscValidateTokenResponse.setEmail("vipin1.mangla@csc.gov.in");
	        cscValidateTokenResponse.setCscId("500100100014");
	        cscValidateTokenResponse.setFullName("CSC Test");
	        cscValidateTokenResponse.setOwner("500100100014");
	        cscValidateTokenResponse.setVleCheck("01");
	        cscValidateTokenResponse.setStateCode("AS");
	        cscValidateTokenResponse.setActiveStatus("1");
	        cscValidateTokenResponse.setUserType("LMK");
	        cscValidateTokenResponse.setLastActive("2025-05-30 15:36:03");
	        cscValidateTokenResponse.setLgStateCode("18");
	        cscValidateTokenResponse.setLgDistrictCode("587");
	        cscValidateTokenResponse.setRap("12345");
	        cscValidateTokenResponse.setPos("157236210012");
	        
	        if (cscValidateTokenResponse == null) {
	            return buildErrorResponse(HttpStatus.UNAUTHORIZED,
	                    "CSC_INVALID_TOKEN",
	                    "CSC rejected the token or returned no user details");
	        }
	        if (isBlank(cscValidateTokenResponse.getCscId())
	                || isBlank(cscValidateTokenResponse.getUsername())) {
	            return buildErrorResponse(HttpStatus.BAD_GATEWAY,
	                    "CSC_INVALID_USER_RESPONSE",
	                    "CSC response does not contain csc_id and username");
	        }

	        User user = findOrCreateCscUser(cscValidateTokenResponse);
	        Object loginResponse = userService.getLoginAccess(user, constants.LMK_PASSWORD);
	        return ResponseEntity.ok(loginResponse);
	    }

	    private User findOrCreateCscUser(CscValidateTokenResponse cscResponse) {
	        UserCsc existingCsc = userCscRepository.findByCscId(cscResponse.getCscId());
	        UserSearchCriteria criteria = UserSearchCriteria.builder()
	                .type(UserType.LMK)
	                .active(true)
	                .tenantId(constants.getStateLevelTenantId())
	                .build();

	        if (existingCsc != null && existingCsc.getUserUuid() != null) {
	            criteria.setUuid(Collections.singletonList(existingCsc.getUserUuid()));
	        } else {
	            criteria.setUserName(cscResponse.getUsername());
	        }

	        List<User> users = userService.searchUsers(criteria, false, null);
	        User user;
	        if (CollectionUtils.isEmpty(users)) {
	            Set<Role> roles = Collections.singleton(Role.builder()
	                    .code(constants.LMK_ROLE)
	                    .tenantId(constants.getStateLevelTenantId())
	                    .build());

	            user = User.builder()
	                    .username(cscResponse.getUsername())
	                    .name(cscResponse.getFullName())
	                    .emailId(cscResponse.getEmail())
	                    .mobileNumber(getCscMobileNumber(cscResponse))
	                    .active(true)
	                    .type(UserType.LMK)
	                    .password(constants.LMK_PASSWORD)
	                    .tenantId(constants.getStateLevelTenantId())
	                    .roles(roles)
	                    .mobileValidationMandatory(true)
	                    .build();
	            user = userService.createUser(user, null);
	        } else {
	            user = users.get(0);
	        }

	        saveCscDetails(cscResponse, user);
	        return user;
	    }

	    private String getCscMobileNumber(CscValidateTokenResponse cscResponse) {
	        String suppliedMobile = digitsOnly(cscResponse.getMobileNumber());
	        if (suppliedMobile.length() >= 10) {
	            String lastTenDigits = suppliedMobile.substring(suppliedMobile.length() - 10);
	            if (lastTenDigits.matches("[6-9][0-9]{9}")) {
	                return lastTenDigits;
	            }
	        }

	        String cscDigits = digitsOnly(cscResponse.getCscId());
	        if (cscDigits.length() > 9) {
	            cscDigits = cscDigits.substring(cscDigits.length() - 9);
	        }
	        while (cscDigits.length() < 9) {
	            cscDigits = "0" + cscDigits;
	        }
	        return "9" + cscDigits;
	    }

	    private String digitsOnly(String value) {
	        return value == null ? "" : value.replaceAll("[^0-9]", "");
	    }

	    private boolean isBlank(String value) {
	        return value == null || value.trim().isEmpty();
	    }

	    private void saveCscDetails(CscValidateTokenResponse response, User user) {
	        long now = new Date().getTime();
	        AuditDetails audit = AuditDetails.builder()
	                .createdBy(user.getUuid())
	                .createdDate(now)
	                .lastModifiedBy(user.getUuid())
	                .lastModifiedDate(now)
	                .build();

	        userCscRepository.save(UserCsc.builder()
	                .cscId(response.getCscId())
	                .userUuid(user.getUuid())
	                .owner(response.getOwner())
	                .vleCheck(response.getVleCheck())
	                .stateCode(response.getStateCode())
	                .activeStatus(response.getActiveStatus())
	                .userType(response.getUserType())
	                .lastActive(response.getLastActive())
	                .lgStateCode(response.getLgStateCode())
	                .lgDistrictCode(response.getLgDistrictCode())
	                .rap(response.getRap())
	                .pos(response.getPos())
	                .pager(response.getPager())
	                .address(response.getAddress())
	                .auditDetails(audit)
	                .build());
	    }

	    private ResponseEntity<Map<String, String>> buildErrorResponse(
	            HttpStatus status, String code, String message) {
	        Map<String, String> error = new HashMap<>();
	        error.put("code", code);
	        error.put("message", message);
	        return new ResponseEntity<>(error, status);
	    }
	    
		public CscValidateTokenResponse getCscValidateToken(String cscValidateToken) {

			StringBuilder uri = new StringBuilder(constants.getCscHost());
			
			uri.append(constants.getCscEndpoint());

			CscValidateTokenResponse cscValidateTokenResponse = null;
			try {
				
				HttpHeaders headers = new HttpHeaders();
				headers.set("Authorization", "Bearer " + cscValidateToken);
				HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

				ResponseEntity<String> response = restTemplate.exchange(
						uri.toString(),
						HttpMethod.GET,
						requestEntity,
						String.class
				);

				String rawResponse = response.getBody();
				log.info("CSC raw API response: {}", rawResponse);
				if (rawResponse == null || rawResponse.trim().isEmpty()) {
					log.warn("CSC API returned an empty response body");
					return null;
				}

				CscValidateTokenApiResponse apiResponse;
				try {
					apiResponse = new ObjectMapper().readValue(
							rawResponse, CscValidateTokenApiResponse.class);
				} catch (Exception e) {
					log.error("Unable to deserialize CSC response: {}", rawResponse, e);
					return null;
				}

				cscValidateTokenResponse = apiResponse != null ? apiResponse.getUser() : null;
				log.info("userInfo {}", cscValidateTokenResponse);
				
			} catch (HttpStatusCodeException e) {
				log.error("CSC API returned HTTP {} with raw body: {}",
						e.getStatusCode(), e.getResponseBodyAsString());
				return null;
			} catch (RestClientException e) {
				log.error("Error occurred while calling CSC API", e);
				return null;
			}
			return cscValidateTokenResponse;

		}

	   

	
}
