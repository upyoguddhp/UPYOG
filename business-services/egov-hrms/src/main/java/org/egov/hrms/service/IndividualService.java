package org.egov.hrms.service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.core.Role;
import org.egov.common.models.individual.Address;
import org.egov.common.models.individual.AddressType;
import org.egov.common.models.individual.Gender;
import org.egov.common.models.individual.Individual;
import org.egov.common.models.individual.IndividualBulkResponse;
import org.egov.common.models.individual.IndividualRequest;
import org.egov.common.models.individual.IndividualResponse;
import org.egov.common.models.individual.IndividualSearch;
import org.egov.common.models.individual.IndividualSearchRequest;
import org.egov.common.models.individual.Name;
import org.egov.common.models.individual.UserDetails;
import org.egov.hrms.config.PropertiesManager;
import org.egov.hrms.repository.RestCallRepository;
import org.egov.hrms.utils.HRMSConstants;
import org.egov.hrms.web.contract.User;
import org.egov.hrms.web.contract.UserRequest;
import org.egov.hrms.web.contract.UserResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class IndividualService {

    private final PropertiesManager propertiesManager;
    private final RestCallRepository restCallRepository;

    @Autowired
    public IndividualService(PropertiesManager propertiesManager,
                             RestCallRepository restCallRepository) {
        this.propertiesManager = propertiesManager;
        this.restCallRepository = restCallRepository;
    }

    public UserResponse createUser(UserRequest userRequest) {
        IndividualRequest request = mapToIndividualRequest(userRequest);
        StringBuilder uri = new StringBuilder();
        uri.append(propertiesManager.getIndividualHost());
        uri.append(propertiesManager.getIndividualCreateEndpoint());
        IndividualResponse response = restCallRepository.fetchResult(uri, request, IndividualResponse.class);
        return response != null && response.getIndividual() != null ? mapToUserResponse(response) : new UserResponse();
    }

    public UserResponse updateUser(UserRequest userRequest) {
        IndividualRequest request = mapToIndividualRequest(userRequest);
        StringBuilder uri = new StringBuilder();
        uri.append(propertiesManager.getIndividualHost());
        uri.append(propertiesManager.getIndividualUpdateEndpoint());
        IndividualResponse response = restCallRepository.fetchResult(uri, request, IndividualResponse.class);
        return response != null && response.getIndividual() != null ? mapToUserResponse(response) : new UserResponse();
    }

    public UserResponse getUser(RequestInfo requestInfo, Map<String, Object> userSearchCriteria) {
        IndividualSearchRequest request = IndividualSearchRequest.builder()
                .requestInfo(requestInfo)
                .individual(IndividualSearch.builder()
                        .mobileNumber((String) userSearchCriteria.get(HRMSConstants.HRMS_USER_SEARCH_CRITERA_MOBILENO))
                        .id((List<String>) userSearchCriteria.get(HRMSConstants.HRMS_USER_SEARCH_CRITERA_UUID))
                        .roleCodes((List<String>) userSearchCriteria.get(HRMSConstants.HRMS_USER_SEARCH_CRITERA_ROLECODES))
                        .username((String) userSearchCriteria.get(HRMSConstants.HRMS_USER_SEARCH_CRITERA_USERNAME))
                        .individualName((String) userSearchCriteria.get(HRMSConstants.HRMS_USER_SEARCH_CRITERA_NAME))
                        .build())
                .build();

        IndividualBulkResponse response = getIndividualResponse(
                (String) userSearchCriteria.get(HRMSConstants.HRMS_USER_SEARCH_CRITERA_TENANTID), request);

        if (response != null && response.getIndividual() != null && !response.getIndividual().isEmpty()) {
            return mapToUserResponse(response);
        }
        return new UserResponse();
    }

    private IndividualBulkResponse getIndividualResponse(String tenantId, IndividualSearchRequest individualSearchRequest) {
        return restCallRepository.fetchResult(
                new StringBuilder(propertiesManager.getIndividualHost())
                        .append(propertiesManager.getIndividualSearchEndpoint())
                        .append("?limit=1000&offset=0&tenantId=")
                        .append(tenantId),
                individualSearchRequest,
                IndividualBulkResponse.class);
    }

    private static Date convertMillisecondsToDate(long milliseconds) {
        SimpleDateFormat formatter = new SimpleDateFormat("dd/MM/yyyy");
        formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
        String dateString = formatter.format(new Date(milliseconds));
        try {
            return formatter.parse(dateString);
        } catch (ParseException e) {
            log.error("Unable to convert milliseconds {} to date", milliseconds, e);
            return null;
        }
    }

    private static IndividualRequest mapToIndividualRequest(UserRequest userRequest) {
        Individual individual = Individual.builder()
                .id(userRequest.getUser().getUuid())
                .userId(userRequest.getUser().getId() != null ? String.valueOf(userRequest.getUser().getId()) : null)
                .userUuid(userRequest.getUser().getUserServiceUuid())
                .isSystemUser(true)
                .isSystemUserActive(userRequest.getUser().getActive())
                .name(Name.builder()
                        .givenName(userRequest.getUser().getName())
                        .build())
                .gender(userRequest.getUser().getGender() != null ? Gender.fromValue(userRequest.getUser().getGender()) : null)
                .email(userRequest.getUser().getEmailId())
                .mobileNumber(userRequest.getUser().getMobileNumber())
                .dateOfBirth(userRequest.getUser().getDob() != null ? convertMillisecondsToDate(userRequest.getUser().getDob()) : null)
                .tenantId(userRequest.getUser().getTenantId())
                .address(Collections.singletonList(Address.builder()
                        .type(AddressType.CORRESPONDENCE)
                        .addressLine1(userRequest.getUser().getCorrespondenceAddress())
                        .isDeleted(Boolean.FALSE)
                        .build()))
                .userDetails(UserDetails.builder()
                        .username(userRequest.getUser().getUserName())
                        .password(userRequest.getUser().getPassword())
                        .tenantId(userRequest.getUser().getTenantId())
                        .roles(userRequest.getUser().getRoles().stream().map(role -> Role.builder()
                                .code(role.getCode())
                                .name(role.getName())
                                .tenantId(userRequest.getUser().getTenantId())
                                .description(role.getDescription())
                                .build()).collect(Collectors.toList()))
                        .userType(org.egov.common.models.user.UserType.fromValue(userRequest.getUser().getType()))
                        .build())
                .isDeleted(Boolean.FALSE)
                .rowVersion(userRequest.getUser().getRowVersion())
                .build();

        return IndividualRequest.builder()
                .requestInfo(userRequest.getRequestInfo())
                .individual(individual)
                .build();
    }

    private static UserResponse mapToUserResponse(IndividualResponse response) {
        return UserResponse.builder()
                .responseInfo(response.getResponseInfo())
                .user(Collections.singletonList(getUser(response.getIndividual())))
                .build();
    }

    private static UserResponse mapToUserResponse(IndividualBulkResponse response) {
        return UserResponse.builder()
                .responseInfo(response.getResponseInfo())
                .user(response.getIndividual().stream()
                        .map(IndividualService::getUser)
                        .collect(Collectors.toList()))
                .build();
    }

    private static User getUser(Individual individual) {
        return User.builder()
                .id(individual.getUserId() != null ? Long.parseLong(individual.getUserId()) : null)
                .mobileNumber(individual.getMobileNumber())
                .name(individual.getName() != null ? individual.getName().getGivenName() : null)
                .uuid(individual.getId())
                .userServiceUuid(individual.getUserUuid())
                .active(individual.getIsSystemUserActive())
                .gender(individual.getGender() != null ? individual.getGender().name() : null)
                .userName(individual.getUserDetails() != null ? individual.getUserDetails().getUsername() : null)
                .emailId(individual.getEmail())
                .correspondenceAddress(individual.getAddress() != null && !individual.getAddress().isEmpty()
                        ? individual.getAddress().stream()
                                .filter(address -> AddressType.CORRESPONDENCE.equals(address.getType()))
                                .findFirst().orElse(Address.builder().build()).getAddressLine1()
                        : null)
                .dob(individual.getDateOfBirth() != null ? individual.getDateOfBirth().getTime() : null)
                .tenantId(individual.getTenantId())
                .createdBy(individual.getAuditDetails() != null ? individual.getAuditDetails().getCreatedBy() : null)
                .createdDate(individual.getAuditDetails() != null ? individual.getAuditDetails().getCreatedTime() : null)
                .lastModifiedBy(individual.getAuditDetails() != null ? individual.getAuditDetails().getLastModifiedBy() : null)
                .lastModifiedDate(individual.getAuditDetails() != null ? individual.getAuditDetails().getLastModifiedTime() : null)
                .rowVersion(individual.getRowVersion())
                .roles(individual.getUserDetails() != null && individual.getUserDetails().getRoles() != null
                        ? individual.getUserDetails().getRoles().stream().map(role -> org.egov.hrms.model.Role.builder()
                                .code(role.getCode())
                                .tenantId(role.getTenantId())
                                .name(role.getName())
                                .build()).collect(Collectors.toList())
                        : Collections.emptyList())
                .build();
    }
}
