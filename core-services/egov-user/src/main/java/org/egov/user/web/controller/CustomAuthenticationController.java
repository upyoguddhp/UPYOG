package org.egov.user.web.controller;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.user.domain.model.SecureUser;
import org.egov.user.domain.model.User;
import org.egov.user.domain.model.enums.UserType;
import org.egov.user.domain.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/oauth")
@Slf4j
public class CustomAuthenticationController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Autowired
    private UserService userService;

    @Autowired
    private org.egov.user.domain.service.TokenIssuanceService tokenIssuanceService;

    @Value("${access.token.validity.in.minutes}")
    private int accessTokenValidityInMinutes;

    @Value("${refresh.token.validity.in.minutes}")
    private int refreshTokenValidityInMinutes;

    @Value("${oauth2.token.format:jwt}")
    private String tokenFormat;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @PostMapping("/token")
    public ResponseEntity<?> authenticate(@RequestParam("grant_type") String grantType,
                                        @RequestParam(value = "username", required = false) String username,
                                        @RequestParam(value = "password", required = false) String password,
                                        @RequestParam(value = "tenantId", required = false) String tenantId,
                                        @RequestParam(value = "userType", required = false) String userType,
                                        @RequestParam(value = "scope", required = false) String scope,
                                        @RequestParam(value = "isInternal", required = false) String isInternal,
                                        HttpServletRequest request) {

        log.info("Custom token endpoint called with grant_type: {}", grantType);

        try {
            if ("password".equals(grantType)) {
                return handlePasswordGrant(username, password, tenantId, userType, scope, request);
            } else if ("client_credentials".equals(grantType)) {
                return handleClientCredentialsGrant(scope);
            } else {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("unsupported_grant_type", "Grant type not supported: " + grantType));
            }
        } catch (BadCredentialsException e) {
            log.error("Authentication failed for user: {}", username, e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(createErrorResponse("invalid_grant", "Invalid username or password"));
        } catch (Exception e) {
            log.error("Token generation failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("server_error", "Token generation failed: " + e.getMessage()));
        }
    }

    private ResponseEntity<?> handlePasswordGrant(String username, String password,
                                                String tenantId, String userType,
                                                String scope, HttpServletRequest request) {

        // CRITICAL FIX: Fallback to HttpServletRequest parameters if @RequestParam didn't capture them
        // This handles cases where parameters might be in different encoding or Content-Type
        // Pattern already proven working in line 114 of this same controller
        if (username == null) {
            username = request.getParameter("username");
            // Support citizen login with mobileNumber parameter (common in UPYOG frontends)
            if (username == null) {
                username = request.getParameter("mobileNumber");
                if (username != null) {
                    log.info("Using mobileNumber parameter as username for login");
                }
            }
        }
        if (password == null) {
            password = request.getParameter("password");
        }
        if (tenantId == null) {
            tenantId = request.getParameter("tenantId");
        }
        if (userType == null) {
            userType = request.getParameter("userType");
        }
        if (scope == null) {
            scope = request.getParameter("scope");
        }

        log.info("Handling password grant for user: {} in tenant: {} with userType: {}", username, tenantId, userType);

        if (username == null || password == null || tenantId == null || userType == null) {
            log.error("Missing required parameters after fallback - username: {}, password: {}, tenantId: {}, userType: {}",
                     username != null, password != null, tenantId, userType);
            return ResponseEntity.badRequest()
                .body(createErrorResponse("invalid_request", "Missing required parameters"));
        }

        try {
            // Create authentication token with details
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(username, password);
            
            // Set additional details for custom authentication provider
            Map<String, Object> details = new HashMap<>();
            details.put("tenantId", tenantId);
            details.put("userType", userType);
            // Only set isInternal if it was explicitly passed as a parameter
            // Never hardcode it to "true" for regular user login
            if (request.getParameter("isInternal") != null) {
                details.put("isInternal", request.getParameter("isInternal"));
            }
            authToken.setDetails(details);
            
            // Authenticate using existing providers
            Authentication authentication = authenticationManager.authenticate(authToken);
            
            if (authentication.isAuthenticated() && authentication.getPrincipal() instanceof SecureUser) {
                SecureUser secureUser = (SecureUser) authentication.getPrincipal();
                
                // Reset failed login attempts - SecureUser.getUser() returns contract User
                if (secureUser.getUser() != null && secureUser.getUser().getUuid() != null) {
                    try {
                        // SecureUser.getUser() already returns the contract User type
                        userService.resetFailedLoginAttempts(secureUser.getUser());
                    } catch (Exception e) {
                        log.warn("Could not reset failed login attempts for user: {} - {}", username, e.getMessage());
                    }
                }
                
                // Generate tokens
                Map<String, Object> response = tokenIssuanceService.issueTokensFor(secureUser, scope);

                log.info("Successfully generated tokens for user: {}", username);
                return ResponseEntity.ok(response);
            } else {
                throw new BadCredentialsException("Authentication failed - invalid user type");
            }
            
        } catch (AuthenticationException e) {
            log.warn("Authentication failed for user: {} - {}", username, e.getMessage());
            
            // Handle failed login using existing service
            try {
                RequestInfo requestInfo = RequestInfo.builder()
                    .action("authenticate")
                    .ts(System.currentTimeMillis())
                    .build();
                User user = userService.getUniqueUser(username, tenantId, UserType.fromValue(userType), requestInfo);
                if (user != null) {
                    userService.handleFailedLogin(user, getClientIpAddress(request), requestInfo);
                }
            } catch (Exception ex) {
                log.warn("Could not handle failed login for user: {} - {}", username, ex.getMessage());
            }
            
            throw new BadCredentialsException("Invalid username or password");
        } catch (Exception e) {
            log.error("Unexpected error during password grant", e);
            throw new RuntimeException("Authentication failed", e);
        }
    }

    private ResponseEntity<?> handleClientCredentialsGrant(String scope) {
        log.info("Handling client credentials grant");
        
        try {
            String accessToken = generateClientCredentialsToken(scope);
            
            Map<String, Object> response = new HashMap<>();
            response.put("access_token", accessToken);
            response.put("token_type", "Bearer");
            response.put("expires_in", accessTokenValidityInMinutes * 60);
            response.put("scope", scope != null ? scope : "read write");
            
            Map<String, Object> responseInfo = createResponseInfo("Client Access Token generated successfully");
            response.put("ResponseInfo", responseInfo);
            response.put("grant_type", "client_credentials");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating client credentials token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("server_error", "Failed to generate client credentials token"));
        }
    }

    private String generateClientCredentialsToken(String scope) {
        if ("opaque".equals(tokenFormat)) {
            return generateOpaqueClientCredentialsToken(scope);
        } else {
            return generateJwtClientCredentialsToken(scope);
        }
    }

    private String generateOpaqueClientCredentialsToken(String scope) {
        String tokenValue = java.util.UUID.randomUUID().toString();

        Map<String, Object> tokenMetadata = new HashMap<>();
        tokenMetadata.put("scope", scope != null ? scope : "read write");
        tokenMetadata.put("grant_type", "client_credentials");
        tokenMetadata.put("token_type", "access_token");
        tokenMetadata.put("subject", "egov-user-client");

        Map<String, Object> responseInfo = createResponseInfo("Client Access Token generated successfully");
        tokenMetadata.put("ResponseInfo", responseInfo);

        String key = "access_token:" + tokenValue;
        redisTemplate.opsForValue().set(key, tokenMetadata, accessTokenValidityInMinutes, java.util.concurrent.TimeUnit.MINUTES);

        return tokenValue;
    }

    private String generateJwtClientCredentialsToken(String scope) {
        java.time.Instant now = java.time.Instant.now();
        java.time.Instant expiry = now.plus(accessTokenValidityInMinutes, java.time.temporal.ChronoUnit.MINUTES);

        org.springframework.security.oauth2.jwt.JwtClaimsSet claims = org.springframework.security.oauth2.jwt.JwtClaimsSet.builder()
            .issuer("http://localhost:8080")
            .subject("egov-user-client")
            .audience(java.util.List.of("egov-user-client"))
            .issuedAt(now)
            .expiresAt(expiry)
            .claim("scope", scope != null ? scope : "read write")
            .claim("grant_type", "client_credentials")
            .claim("token_type", "access_token")
            .build();

        return this.jwtEncoder.encode(org.springframework.security.oauth2.jwt.JwtEncoderParameters.from(claims)).getTokenValue();
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

    private Map<String, Object> createErrorResponse(String error, String description) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", error);
        errorResponse.put("error_description", description);
        return errorResponse;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }

    /**
     * Token introspection endpoint for opaque tokens
     */
    @PostMapping("/introspect")
    public ResponseEntity<?> introspectToken(@RequestParam("token") String token,
                                           @RequestParam(value = "token_type_hint", required = false) String tokenTypeHint) {
        try {
            if ("opaque".equals(tokenFormat)) {
                // Handle opaque token introspection
                Map<String, Object> tokenMetadata;
                
                if ("refresh_token".equals(tokenTypeHint)) {
                    String key = "refresh_token:" + token;
                    tokenMetadata = (Map<String, Object>) redisTemplate.opsForValue().get(key);
                } else {
                    // Default to access token
                    String key = "access_token:" + token;
                    tokenMetadata = (Map<String, Object>) redisTemplate.opsForValue().get(key);
                }
                
                if (tokenMetadata != null) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("active", true);
                    response.putAll(tokenMetadata);
                    return ResponseEntity.ok(response);
                } else {
                    Map<String, Object> response = new HashMap<>();
                    response.put("active", false);
                    return ResponseEntity.ok(response);
                }
            } else {
                // For JWT tokens, return active=false as they are self-contained
                Map<String, Object> response = new HashMap<>();
                response.put("active", false);
                response.put("error", "JWT tokens do not require introspection");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("Error during token introspection", e);
            Map<String, Object> response = new HashMap<>();
            response.put("active", false);
            response.put("error", "introspection_failed");
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Token revocation endpoint
     */
    @PostMapping("/revoke")
    public ResponseEntity<?> revokeToken(@RequestParam("token") String token,
                                       @RequestParam(value = "token_type_hint", required = false) String tokenTypeHint) {
        try {
            if ("opaque".equals(tokenFormat)) {
                if ("refresh_token".equals(tokenTypeHint)) {
                    String key = "refresh_token:" + token;
                    redisTemplate.delete(key);
                } else {
                    // Default to access token
                    String key = "access_token:" + token;
                    redisTemplate.delete(key);
                }
            }
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error during token revocation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("server_error", "Failed to revoke token"));
        }
    }
}