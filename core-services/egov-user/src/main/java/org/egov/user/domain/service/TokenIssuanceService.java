package org.egov.user.domain.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.user.domain.model.SecureUser;
import org.egov.user.domain.model.User;
import org.egov.user.domain.model.enums.UserType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Token minting extracted out of CustomAuthenticationController so it can be reused
 * by flows that need to issue a token for an already-verified user without going
 * through the password grant HTTP endpoint - the SSO login flow (SsoService) and the
 * post-OTP UUID handoff (UserController#getTokenAfterOtp). This is the replacement
 * for the old (pre-Spring-Authorization-Server) UserService#getLoginAccess.
 */
@Service
@Slf4j
public class TokenIssuanceService {

    @Autowired
    private JwtEncoder jwtEncoder;

    @Autowired
    private UserService userService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Value("${access.token.validity.in.minutes}")
    private int accessTokenValidityInMinutes;

    @Value("${refresh.token.validity.in.minutes}")
    private int refreshTokenValidityInMinutes;

    @Value("${oauth2.token.format:jwt}")
    private String tokenFormat;

    public Map<String, Object> issueTokensFor(SecureUser secureUser, String scope) {
        String accessToken = generateAccessToken(secureUser, scope);
        String refreshToken = generateRefreshToken(secureUser);
        return createSuccessResponse(accessToken, refreshToken, scope, secureUser);
    }

    private String generateAccessToken(SecureUser secureUser, String scope) {
        if ("opaque".equals(tokenFormat)) {
            return generateOpaqueAccessToken(secureUser, scope);
        } else {
            return generateJwtAccessToken(secureUser, scope);
        }
    }

    private String generateOpaqueAccessToken(SecureUser secureUser, String scope) {
        String tokenValue = UUID.randomUUID().toString();
        Map<String, Object> tokenMetadata = new HashMap<>();

        org.egov.user.web.contract.auth.User user = secureUser.getUser();
        if (user != null) {
            org.egov.user.web.contract.auth.User userToStore = user;
            try {
                User domainUser = convertContractToDomainUser(user);
                User decryptedDomainUser = userService.decryptUserWithContext(domainUser, user);
                userToStore = convertToContractUser(decryptedDomainUser);
            } catch (Exception e) {
                log.warn("Failed to decrypt user data, storing encrypted data. Error: {} - {}",
                        e.getClass().getSimpleName(), e.getMessage());
                userToStore = user;
            }

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", userToStore.getId());
            userInfo.put("uuid", userToStore.getUuid());
            userInfo.put("userName", userToStore.getUserName());
            userInfo.put("name", userToStore.getName());
            userInfo.put("mobileNumber", userToStore.getMobileNumber());
            userInfo.put("emailId", userToStore.getEmailId());
            userInfo.put("locale", userToStore.getLocale());
            userInfo.put("type", userToStore.getType());
            userInfo.put("tenantId", userToStore.getTenantId());
            userInfo.put("active", userToStore.isActive());
            userInfo.put("isDataProtectionAccepted", userToStore.getIsDataProtectionAccepted());

            if (userToStore.getRoles() != null && !userToStore.getRoles().isEmpty()) {
                java.util.List<Map<String, String>> rolesList = userToStore.getRoles().stream()
                        .map(role -> {
                            Map<String, String> roleMap = new HashMap<>();
                            roleMap.put("code", role.getCode());
                            roleMap.put("name", role.getName());
                            roleMap.put("tenantId", role.getTenantId());
                            return roleMap;
                        })
                        .collect(Collectors.toList());
                userInfo.put("roles", rolesList);
            } else {
                userInfo.put("roles", new java.util.ArrayList<>());
            }

            tokenMetadata.put("UserRequest", userInfo);
            tokenMetadata.put("userId", userToStore.getId());
            tokenMetadata.put("userName", userToStore.getUserName());
            tokenMetadata.put("userType", userToStore.getType());
            tokenMetadata.put("tenantId", userToStore.getTenantId());
        }

        Map<String, Object> responseInfo = createResponseInfo("Access Token generated successfully");
        tokenMetadata.put("ResponseInfo", responseInfo);
        tokenMetadata.put("scope", scope != null ? scope : "read write");
        tokenMetadata.put("token_type", "access_token");

        String key = "access_token:" + tokenValue;
        redisTemplate.opsForValue().set(key, tokenMetadata, accessTokenValidityInMinutes, TimeUnit.MINUTES);

        return tokenValue;
    }

    private String generateJwtAccessToken(SecureUser secureUser, String scope) {
        Instant now = Instant.now();
        Instant expiry = now.plus(accessTokenValidityInMinutes, ChronoUnit.MINUTES);

        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer("http://localhost:8080")
                .subject(secureUser.getUsername())
                .audience(java.util.List.of("egov-user-client"))
                .issuedAt(now)
                .expiresAt(expiry)
                .claim("scope", scope != null ? scope : "read write")
                .claim("token_type", "access_token");

        org.egov.user.web.contract.auth.User user = secureUser.getUser();
        if (user != null) {
            claimsBuilder
                    .claim("userId", user.getId())
                    .claim("userName", user.getUserName())
                    .claim("userType", user.getType())
                    .claim("tenantId", user.getTenantId())
                    .claim("UserRequest", user);
        }

        Map<String, Object> responseInfo = createResponseInfo("Access Token generated successfully");
        claimsBuilder.claim("ResponseInfo", responseInfo);

        JwtClaimsSet claims = claimsBuilder.build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    private String generateRefreshToken(SecureUser secureUser) {
        if ("opaque".equals(tokenFormat)) {
            return generateOpaqueRefreshToken(secureUser);
        } else {
            return generateJwtRefreshToken(secureUser);
        }
    }

    private String generateOpaqueRefreshToken(SecureUser secureUser) {
        String tokenValue = UUID.randomUUID().toString();
        Map<String, Object> tokenMetadata = new HashMap<>();
        tokenMetadata.put("tokenType", "refresh_token");
        tokenMetadata.put("issuedAt", Instant.now().toEpochMilli());

        if (secureUser != null) {
            tokenMetadata.put("subject", secureUser.getUsername());
            org.egov.user.web.contract.auth.User user = secureUser.getUser();
            if (user != null) {
                tokenMetadata.put("userId", user.getId());
                tokenMetadata.put("tenantId", user.getTenantId());
            }
        }

        String key = "refresh_token:" + tokenValue;
        redisTemplate.opsForValue().set(key, tokenMetadata, refreshTokenValidityInMinutes, TimeUnit.MINUTES);

        return tokenValue;
    }

    private String generateJwtRefreshToken(SecureUser secureUser) {
        Instant now = Instant.now();
        Instant expiry = now.plus(refreshTokenValidityInMinutes, ChronoUnit.MINUTES);

        org.egov.user.web.contract.auth.User user = secureUser.getUser();
        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer("http://localhost:8080")
                .subject(secureUser.getUsername())
                .audience(java.util.List.of("egov-user-client"))
                .issuedAt(now)
                .expiresAt(expiry)
                .claim("token_type", "refresh_token");

        if (user != null) {
            claimsBuilder
                    .claim("userId", user.getId())
                    .claim("tenantId", user.getTenantId());
        }

        JwtClaimsSet claims = claimsBuilder.build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    public Map<String, Object> createSuccessResponse(String accessToken, String refreshToken,
                                                       String scope, SecureUser secureUser) {
        Map<String, Object> response = new HashMap<>();
        response.put("access_token", accessToken);
        response.put("refresh_token", refreshToken);
        response.put("token_type", "Bearer");
        response.put("expires_in", accessTokenValidityInMinutes * 60);
        response.put("scope", scope != null ? scope : "read write");

        Map<String, Object> responseInfo = createResponseInfo("Access Token generated successfully");
        response.put("ResponseInfo", responseInfo);

        org.egov.user.web.contract.auth.User contractUser = secureUser.getUser();
        if (contractUser != null) {
            boolean needsDecryption = contractUser.getMobileNumber() != null
                    && contractUser.getMobileNumber().contains("|");

            if (needsDecryption) {
                try {
                    User domainUser = convertContractToDomainUser(contractUser);
                    User decryptedDomainUser = userService.decryptUserWithContext(domainUser, contractUser);
                    org.egov.user.web.contract.auth.User decryptedUser = convertToContractUser(decryptedDomainUser);
                    response.put("UserRequest", decryptedUser);
                } catch (Exception e) {
                    log.error("Failed to decrypt user data: {}", e.getMessage(), e);
                    response.put("UserRequest", contractUser);
                }
            } else {
                response.put("UserRequest", contractUser);
            }
        }

        return response;
    }

    private User convertContractToDomainUser(org.egov.user.web.contract.auth.User contractUser) {
        if (contractUser == null) {
            return null;
        }

        return User.builder()
                .id(contractUser.getId())
                .uuid(contractUser.getUuid())
                .username(contractUser.getUserName())
                .name(contractUser.getName())
                .mobileNumber(contractUser.getMobileNumber())
                .emailId(contractUser.getEmailId())
                .locale(contractUser.getLocale())
                .active(contractUser.isActive())
                .type(contractUser.getType() != null ? UserType.fromValue(contractUser.getType()) : null)
                .tenantId(contractUser.getTenantId())
                .isdataprotectionaccepted(contractUser.getIsDataProtectionAccepted())
                .roles(contractUser.getRoles() != null
                        ? contractUser.getRoles().stream()
                        .map(role -> org.egov.user.domain.model.Role.builder()
                                .name(role.getName())
                                .code(role.getCode())
                                .tenantId(role.getTenantId())
                                .build())
                        .collect(Collectors.toSet())
                        : new HashSet<>())
                .build();
    }

    public org.egov.user.web.contract.auth.User convertToContractUser(User domainUser) {
        if (domainUser == null) {
            return null;
        }

        return org.egov.user.web.contract.auth.User.builder()
                .id(domainUser.getId())
                .uuid(domainUser.getUuid())
                .userName(domainUser.getUsername())
                .name(domainUser.getName())
                .mobileNumber(domainUser.getMobileNumber())
                .emailId(domainUser.getEmailId())
                .locale(domainUser.getLocale())
                .active(domainUser.getActive())
                .type(domainUser.getType() != null ? domainUser.getType().name() : null)
                .tenantId(domainUser.getTenantId())
                .isDataProtectionAccepted(domainUser.getIsdataprotectionaccepted())
                .roles(domainUser.getRoles() != null
                        ? domainUser.getRoles().stream()
                        .map(role -> new org.egov.user.web.contract.auth.Role(role))
                        .collect(Collectors.toSet())
                        : new HashSet<>())
                .build();
    }

    private Map<String, Object> createResponseInfo(String status) {
        Map<String, Object> responseInfo = new LinkedHashMap<>();
        responseInfo.put("api_id", "");
        responseInfo.put("ver", "1.0");
        responseInfo.put("ts", System.currentTimeMillis());
        responseInfo.put("res_msg_id", "");
        responseInfo.put("msg_id", "");
        responseInfo.put("status", status);
        return responseInfo;
    }
}
