package org.egov.user.web.controller;
import javax.validation.Valid;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.user.domain.model.UpdateRequest;
import org.egov.user.domain.model.UpdateResponse;
import org.egov.user.domain.model.User;
import org.egov.user.domain.model.UserDetail;
import org.egov.user.domain.model.UserSearchCriteria;
import org.egov.user.domain.service.LoginService;
import org.egov.user.domain.service.SsoService;
import org.egov.user.domain.service.TokenService;
import org.egov.user.domain.service.UserService;
import org.egov.user.web.contract.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.CollectionUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@RestController
@Slf4j
public class UserController {

    private UserService userService;
    private TokenService tokenService;

    @Value("${mobile.number.validation.workaround.enabled}")
    private String mobileValidationWorkaroundEnabled;

    @Value("${otp.validation.register.mandatory}")
    private boolean IsValidationMandatory;

    @Value("${citizen.registration.withlogin.enabled}")
    private boolean isRegWithLoginEnabled;

    @Value("${egov.user.search.default.size}")
    private Integer defaultSearchSize;

    @Autowired
    private SsoService ssoService;

    @Autowired
    private LoginService loginService;

    @Value("${digilocker.register}")
    private boolean isDigiLockerRegistration;

    @Value("${digilocker.search}")
    private boolean isDigiLockerSearch;

    @Value("${requester.service.host}")
    private String requesterServiceHost;

    @Value("${requester.service.endpoint}")
    private String requesterServiceEndpoint;

    @Autowired
    public UserController(UserService userService, TokenService tokenService) {
        this.userService = userService;
        this.tokenService = tokenService;
    }

    /**
     * Creates a citizen with OTP validation.
     */
    @PostMapping("/citizen/_create")
    public Object createCitizen(
            @RequestBody @Valid CreateUserRequest createUserRequest) {

        log.info("Received Citizen Registration Request {}", createUserRequest);

        User user = createUserRequest.toDomain(true);
        user.setOtpValidationMandatory(IsValidationMandatory);

        if (isRegWithLoginEnabled) {
            Object object = userService.registerWithLogin(
                    user, createUserRequest.getRequestInfo());
            return new ResponseEntity<>(object, HttpStatus.OK);
        }

        User createdUser = userService.createCitizen(
                user, createUserRequest.getRequestInfo());

        return createResponse(createdUser);
    }

    /**
     * Creates a user without OTP validation.
     */
    @PostMapping("/users/_createnovalidate")
    public UserDetailResponse createUserWithoutValidation(
            @RequestBody @Valid CreateUserRequest createUserRequest,
            @RequestHeader HttpHeaders headers) {

        User user = createUserRequest.toDomain(true);
        user.setMobileValidationMandatory(isMobileValidationRequired(headers));
        user.setOtpValidationMandatory(false);

        User newUser = userService.createUser(
                user, createUserRequest.getRequestInfo());

        return createResponse(newUser);
    }

    /**
     * Searches users. Defaults to active users when active is not supplied.
     */
    @PostMapping("/_search")
    public UserSearchResponse get(
            @RequestBody @Valid UserSearchRequest request,
            @RequestHeader HttpHeaders headers) {

        log.info("Received User search Request {}", request);

        if (request.getActive() == null) {
            request.setActive(true);
        }

        return searchUsers(request, headers);
    }

    /**
     * Searches active and inactive users according to the supplied criteria.
     */
    @PostMapping("/v1/_search")
    public UserSearchResponse getV1(
            @RequestBody UserSearchRequest request,
            @RequestHeader HttpHeaders headers) {

        return searchUsers(request, headers);
    }

    /**
     * Fetches user details by access token.
     */
    @PostMapping("/_details")
    public org.egov.common.contract.request.User getUser(
            @RequestParam(value = "access_token") String accessToken) {

        log.info(
                "/_details endpoint called with token: {}...",
                accessToken.substring(0, Math.min(8, accessToken.length())));

        UserDetail userDetail = tokenService.getUser(accessToken);

        log.info(
                "TokenService returned userDetail: {}",
                userDetail != null ? "not null" : "NULL");

        org.egov.user.web.contract.auth.User authUser =
                userDetail.getSecureUser().getUser();

        log.info(
                "AuthUser extracted - id: {}, uuid: {}, userName: {}",
                authUser.getId(),
                authUser.getUuid(),
                authUser.getUserName());

        log.info(
                "AuthUser roles: {} (size: {})",
                authUser.getRoles(),
                authUser.getRoles() != null
                        ? authUser.getRoles().size()
                        : "NULL");

        if (authUser.getRoles() != null && !authUser.getRoles().isEmpty()) {
            authUser.getRoles().forEach(role ->
                    log.info(
                            "Role - code: {}, name: {}, tenantId: {}",
                            role.getCode(),
                            role.getName(),
                            role.getTenantId()));
        }

        org.egov.common.contract.request.User commonUser =
                org.egov.common.contract.request.User.builder()
                        .id(authUser.getId())
                        .uuid(authUser.getUuid())
                        .userName(authUser.getUserName())
                        .name(authUser.getName())
                        .mobileNumber(authUser.getMobileNumber())
                        .emailId(authUser.getEmailId())
                        .type(authUser.getType())
                        .tenantId(authUser.getTenantId())
                        .roles(
                                authUser.getRoles() != null
                                        ? authUser.getRoles().stream()
                                                .map(role ->
                                                        org.egov.common.contract.request.Role
                                                                .builder()
                                                                .code(role.getCode())
                                                                .name(role.getName())
                                                                .tenantId(role.getTenantId())
                                                                .build())
                                                .collect(Collectors.toList())
                                        : Collections.emptyList())
                        .build();

        log.info(
                "/_details endpoint returning commonUser {} with {} roles",
                commonUser.getUuid(),
                commonUser.getRoles().size());

        if (commonUser.getRoles().isEmpty()) {
            log.warn(
                    "WARNING: User {} has no roles - this may cause RBAC authorization failures!",
                    commonUser.getUuid());
        }

        return commonUser;
    }

    /**
     * Updates user details without OTP validation.
     */
    @PostMapping("/users/_updatenovalidate")
    public UpdateResponse updateUserWithoutValidation(
            @RequestBody @Valid CreateUserRequest createUserRequest,
            @RequestHeader HttpHeaders headers) {

        User user = createUserRequest.toDomain(false);
        user.setMobileValidationMandatory(isMobileValidationRequired(headers));

        User updatedUser = userService.updateWithoutOtpValidation(
                user, createUserRequest.getRequestInfo());

        return createResponseforUpdate(updatedUser);
    }

    /**
     * Updates the user profile.
     */
    @PostMapping("/profile/_update")
    public UpdateResponse patch(
            @RequestBody @Valid CreateUserRequest createUserRequest) {

        log.info("Received Profile Update Request {}", createUserRequest);

        User user = createUserRequest.toDomain(false);

        User updatedUser = userService.partialUpdate(
                user, createUserRequest.getRequestInfo());

        return createResponseforUpdate(updatedUser);
    }

    /**
     * Validates DigiLocker identity and creates or updates the user.
     */
    @PostMapping("/digilocker/oauth/token")
    public Object authDigiLocker(
            @RequestBody @Valid CreateUserRequest createUserRequest,
            @RequestHeader HttpHeaders headers) {

        RestTemplate restTemplate = new RestTemplate();

        UserSearchRequest request = new UserSearchRequest();

        TokenReq tokenReq = TokenReq.builder()
                .authToken(createUserRequest.getUser().getAccess_token())
                .build();

        TokenRequest tokenRequest = TokenRequest.builder()
                .requestInfo(createUserRequest.getRequestInfo())
                .tokenReq(tokenReq)
                .build();

        HttpEntity<TokenRequest> entity =
                new HttpEntity<>(tokenRequest, headers);

        ResponseEntity<String> validationApiResponse;

        try {
            validationApiResponse = restTemplate.exchange(
                    requesterServiceHost + requesterServiceEndpoint,
                    HttpMethod.POST,
                    entity,
                    String.class);
        } catch (HttpClientErrorException e) {
            throw new RuntimeException(
                    "Validation failed: " + e.getResponseBodyAsString(), e);
        }

        String validationApiResponseBody = validationApiResponse.getBody();

        if (validationApiResponseBody == null) {
            throw new RuntimeException(
                    "DigiLocker validation returned an empty response");
        }

        JSONObject jsonResponse = new JSONObject(validationApiResponseBody);
        JSONObject userRes = jsonResponse.getJSONObject("UserRes");

        String validationMobileNumber = userRes.getString("mobile");
        String mobileNumber = createUserRequest.getUser().getMobileNumber();

        log.info("Validation mobile number received");
        log.info("Comparing validated mobile number with requested mobile number");

        if (validationMobileNumber.equalsIgnoreCase(mobileNumber)) {

            request.setUserName(mobileNumber);
            request.setTenantId(createUserRequest.getUser().getTenantId());

            List<UserSearchResponseContent> userContracts =
                    searchUsers(request, headers)
                            .getUserSearchResponseContent();

            if (!CollectionUtils.isEmpty(userContracts)) {

                User existingUser = userContracts.get(0).toUser();
                User user = new User().toUser(existingUser);

                user.setDigilockerid(
                        createUserRequest.getUser().getDigilockerid());
                user.setDigilockerRegistration(isDigiLockerRegistration);

                Object updatedUser = userService.updateDigilockerID(
                        user,
                        existingUser,
                        createUserRequest.getRequestInfo());

                return new ResponseEntity<>(updatedUser, HttpStatus.OK);

            } else {

                User user = createUserRequest.toDomain(true);
                user.setUsername(user.getMobileNumber());
                user.setDigilockerRegistration(isDigiLockerRegistration);
                user.setDigilockerid(
                        createUserRequest.getUser().getDigilockerid());

                Object createdUser = userService.registerWithLogin(
                        user, createUserRequest.getRequestInfo());

                return new ResponseEntity<>(createdUser, HttpStatus.OK);
            }
        }

        return new ResponseEntity<>(
                "Mobile number validation failed",
                HttpStatus.BAD_REQUEST);
    }

    /**
     * Creates the standard user response.
     */
    private UserDetailResponse createResponse(User newUser) {

        UserRequest userRequest = new UserRequest(newUser);

        ResponseInfo responseInfo = ResponseInfo.builder()
                .status(String.valueOf(HttpStatus.OK.value()))
                .build();

        return new UserDetailResponse(
                responseInfo,
                Collections.singletonList(userRequest));
    }

    /**
     * Creates the standard update response.
     */
    private UpdateResponse createResponseforUpdate(User newUser) {

        UpdateRequest updateRequest = new UpdateRequest(newUser);

        ResponseInfo responseInfo = ResponseInfo.builder()
                .status(String.valueOf(HttpStatus.OK.value()))
                .build();

        return new UpdateResponse(
                responseInfo,
                Collections.singletonList(updateRequest));
    }

    /**
     * Searches users using the supplied request criteria.
     */
    private UserSearchResponse searchUsers(
            UserSearchRequest request,
            HttpHeaders headers) {

        UserSearchCriteria searchCriteria = request.toDomain();

        log.info("Search criteria in controller: {}", searchCriteria);
        log.debug("Request headers: {}", headers);

        boolean interServiceCall = isInterServiceCall(headers);

        if (!interServiceCall) {
            if ((isEmpty(searchCriteria.getId())
                    && isEmpty(searchCriteria.getUuid()))
                    && (searchCriteria.getLimit() > defaultSearchSize
                    || searchCriteria.getLimit() == 0)) {

                searchCriteria.setLimit(defaultSearchSize);
            }
        }

        List<User> userModels = userService.searchUsers(
                searchCriteria,
                interServiceCall,
                request.getRequestInfo());

        List<UserSearchResponseContent> userContracts =
                userModels.stream()
                        .map(UserSearchResponseContent::new)
                        .collect(Collectors.toList());

        ResponseInfo responseInfo = ResponseInfo.builder()
                .status(String.valueOf(HttpStatus.OK.value()))
                .build();

        return new UserSearchResponse(responseInfo, userContracts);
    }

    /**
     * Determines whether mobile validation is required.
     */
    private boolean isMobileValidationRequired(HttpHeaders headers) {

        boolean xPassThroughGateway = !isInterServiceCall(headers);

        if (mobileValidationWorkaroundEnabled != null
                && Boolean.parseBoolean(mobileValidationWorkaroundEnabled)
                && !xPassThroughGateway) {
            return false;
        }

        return true;
    }

    /**
     * Validates an employee SSO token for the landing page.
     */
    @PostMapping("/_landingPage")
    public ResponseEntity<?> landingPage(
            @RequestBody Map<String, String> tokenMap) {

        String token = tokenMap.get("token");

        log.info("Landing page token validation requested");

        ResponseEntity<?> response =
                ssoService.getHpSsoValidateTokenResponse(token);

        return response;
    }

    /**
     * Performs employee login.
     */
    @PostMapping("/_login")
    public Object employeeUserLogin(@RequestBody LoginRequest loginRequest) {

        if (StringUtils.isEmpty(loginRequest.getUserType())) {
            throw new RuntimeException("Employee login failed.");
        }

        return loginService.employeeUserLogin(loginRequest);
    }

    /**
     * Creates an address for a user identified by UUID.
     */
    @PostMapping("/_createAddress")
    public ResponseEntity<AddressResponse> createAddress(
            @RequestBody AddressRequest addressRequest) {

        Address userAddress = userService.createAddress(
                addressRequest.getUserUuid(),
                addressRequest.getAddress());

        List<Address> userAddressList = new ArrayList<>();
        userAddressList.add(userAddress);

        ResponseInfo responseInfo = ResponseInfo.builder()
                .status(String.valueOf(HttpStatus.CREATED.value()))
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AddressResponse(responseInfo, userAddressList));
    }

    /**
     * Retrieves address details for a user based on UUID and tenant ID.
     */
    @PostMapping("/_getAddress")
    public AddressResponse getAddress(
            @RequestParam(value = "uuid") String uuid,
            @RequestParam(value = "tenantId") String tenantId) {

        List<Address> userAddresses = userService.getAddress(uuid, tenantId);

        ResponseInfo responseInfo = ResponseInfo.builder()
                .status(String.valueOf(HttpStatus.OK.value()))
                .build();

        return new AddressResponse(responseInfo, userAddresses);
    }

    /**
     * Updates an existing user address.
     */
    @PostMapping("/_updateAddress")
    public AddressResponse updateAddress(
            @RequestBody AddressRequest addressRequest) {

        Address userAddress =
                userService.updateAddress(addressRequest.getAddress());

        List<Address> userAddressList = new ArrayList<>();
        userAddressList.add(userAddress);

        ResponseInfo responseInfo = ResponseInfo.builder()
                .status(String.valueOf(HttpStatus.OK.value()))
                .build();

        return new AddressResponse(responseInfo, userAddressList);
    }

    /**
     * Creates a user with address details using V2.
     */
    @PostMapping("/users/v2/_create")
    public Object createUserWithAddress(
            @RequestBody @Valid CreateUserRequestV2 createUserRequest,
            @RequestHeader HttpHeaders headers) {

        log.info("Received User Registration Request {}", createUserRequest);

        User user = createUserRequest.toDomain(true);
        user.setMobileValidationMandatory(isMobileValidationRequired(headers));
        user.setOtpValidationMandatory(false);

        User newUser = userService.createUserWithAddressV2(
                user, createUserRequest.getRequestInfo());

        return createResponseV2(newUser);
    }

    /**
     * Updates user details and address information using V2.
     */
    @PostMapping("/users/v2/_update")
    public UpdateResponse updateUserV2(
            @RequestBody @Valid CreateUserRequestV2 createUserRequest,
            @RequestHeader HttpHeaders headers) {

        User user = createUserRequest.toDomain(false);
        user.setMobileValidationMandatory(isMobileValidationRequired(headers));

        User updatedUser = userService.updateUserV2(
                user, createUserRequest.getRequestInfo());

        return createResponseforUpdate(updatedUser);
    }

    /**
     * Searches users with address details using V2.
     */
    @PostMapping("/users/v2/_search")
    public UserSearchResponse getUsersV2(
            @RequestBody UserSearchRequestV2 request,
            @RequestHeader HttpHeaders headers) {

        UserSearchCriteria searchCriteria = request.toDomain();

        boolean interServiceCall = isInterServiceCall(headers);

        if (!interServiceCall) {
            if ((isEmpty(searchCriteria.getId())
                    && isEmpty(searchCriteria.getUuid()))
                    && (searchCriteria.getLimit() > defaultSearchSize
                    || searchCriteria.getLimit() == 0)) {

                searchCriteria.setLimit(defaultSearchSize);
            }
        }

        List<User> userModels = userService.searchUsersV2(
                searchCriteria,
                interServiceCall,
                request.getRequestInfo());

        List<UserSearchResponseContent> userContracts =
                userModels.stream()
                        .map(UserSearchResponseContent::new)
                        .collect(Collectors.toList());

        ResponseInfo responseInfo = ResponseInfo.builder()
                .status(String.valueOf(HttpStatus.OK.value()))
                .build();

        return new UserSearchResponse(responseInfo, userContracts);
    }

    /**
     * Creates the V2 user response.
     */
    private UserDetailResponseV2 createResponseV2(User newUser) {

        UserRequestV2 userRequestV2 = new UserRequestV2(newUser);

        ResponseInfo responseInfo = ResponseInfo.builder()
                .status(String.valueOf(HttpStatus.OK.value()))
                .build();

        return new UserDetailResponseV2(
                responseInfo,
                Collections.singletonList(userRequestV2));
    }
}