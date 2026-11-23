package org.hpud.web.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Issues Superset "guest tokens" for embedded dashboards.
 *
 * The Superset service-account credentials live ONLY in this service's configuration (never in the browser), and the
 * row-level-security (tenant) filter is derived here from the authenticated user's roles - the caller cannot choose
 * its own filter.
 *
 * The gateway authenticates the request (auth-token header) and forwards the user as the x-user-info header.
 */
@RestController
@RequestMapping("/superset")
public class SupersetController {

    private static final Logger log = LoggerFactory.getLogger(SupersetController.class);

    private static final Pattern DASHBOARD_ID = Pattern.compile("^[0-9a-zA-Z-]{1,64}$");
    private static final Pattern TENANT = Pattern.compile("^[a-z0-9_]{1,64}$");

    @Value("${superset.url:}")
    private String supersetUrl;
    @Value("${superset.username:}")
    private String supersetUsername;
    @Value("${superset.password:}")
    private String supersetPassword;
    @Value("${superset.state.tenant:hp}")
    private String stateTenant;

    @Autowired
    private RestTemplate restTemplate;

    private final ObjectMapper mapper = new ObjectMapper();

    @GetMapping("/guest-token")
    public ResponseEntity<?> guestToken(@RequestParam("id") String dashboardId,
                                        @RequestParam(value = "tenantId", required = false) String requestedTenant,
                                        @RequestHeader(value = "x-user-info", required = false) String userInfoHeader) {
        if (supersetUrl.isEmpty() || supersetUsername.isEmpty() || supersetPassword.isEmpty()) {
            log.error("Superset is not configured (superset.url / superset.username / superset.password)");
            return error(HttpStatus.SERVICE_UNAVAILABLE, "Dashboards are not available");
        }
        if (!DASHBOARD_ID.matcher(dashboardId).matches()) {
            return error(HttpStatus.BAD_REQUEST, "Invalid dashboard id");
        }

        // ---- who is calling? (must be a logged-in employee; the anonymous/system user is rejected)
        JsonNode user;
        try {
            user = userInfoHeader == null ? null : mapper.readTree(userInfoHeader);
        } catch (Exception e) {
            user = null;
        }
        if (user == null || !"EMPLOYEE".equalsIgnoreCase(user.path("type").asText())) {
            log.warn("Superset guest-token denied: x-user-info {} / type='{}'", user == null ? "missing or unparsable" : "present", user == null ? "" : user.path("type").asText());
            return error(HttpStatus.FORBIDDEN, "You are not authorized to access this resource");
        }

        // ---- which tenants may this user see?
        boolean stateLevel = false;
        Set<String> ulbs = new LinkedHashSet<>();
        for (JsonNode role : user.path("roles")) {
            String t = role.path("tenantId").asText("");
            if (t.isEmpty()) continue;
            if (t.equalsIgnoreCase(stateTenant)) {
                stateLevel = true;
            } else if (t.contains(".")) {
                ulbs.add(t.substring(t.indexOf('.') + 1).toLowerCase()); // hp.shimla -> shimla
            }
        }
        List<Map<String, String>> rls = new ArrayList<>();
        if (requestedTenant != null && !requestedTenant.isEmpty()) {
            String ulb = requestedTenant.contains(".") ? requestedTenant.substring(requestedTenant.indexOf('.') + 1) : requestedTenant;
            ulb = ulb.toLowerCase();
            if (!TENANT.matcher(ulb).matches() || !(stateLevel && !ulb.equals(stateTenant) || ulbs.contains(ulb))) {
                log.warn("Superset guest-token denied: requested ulb='{}' not in user's ulbs={} stateLevel={}", ulb, ulbs, stateLevel);
                return error(HttpStatus.FORBIDDEN, "You are not authorized to access this resource");
            }
            rls.add(Collections.singletonMap("clause", "tenantid = '" + ulb + "'"));
        } else if (!stateLevel) {
            if (ulbs.isEmpty()) return error(HttpStatus.FORBIDDEN, "You are not authorized to access this resource");
            List<String> quoted = new ArrayList<>();
            for (String u : ulbs) if (TENANT.matcher(u).matches()) quoted.add("'" + u + "'");
            if (quoted.isEmpty()) return error(HttpStatus.FORBIDDEN, "You are not authorized to access this resource");
            rls.add(Collections.singletonMap("clause", "tenantid IN (" + String.join(",", quoted) + ")"));
        } // state-level user with no tenant requested: no row filter

        try {
            String api = supersetUrl.replaceAll("/+$", "") + "/api/v1/security";

            // 1. login
            Map<String, Object> login = new LinkedHashMap<>();
            login.put("username", supersetUsername);
            login.put("password", supersetPassword);
            login.put("provider", "db");
            login.put("refresh", true);
            ResponseEntity<JsonNode> loginResp = restTemplate.exchange(api + "/login", HttpMethod.POST,
                    new HttpEntity<>(login, json(null)), JsonNode.class);
            String access = loginResp.getBody().path("access_token").asText();

            // 2. csrf token (+ session cookie, which Superset ties the csrf token to)
            ResponseEntity<JsonNode> csrfResp = restTemplate.exchange(api + "/csrf_token/", HttpMethod.GET,
                    new HttpEntity<>(json(access)), JsonNode.class);
            String csrf = csrfResp.getBody().path("result").asText();
            List<String> cookies = csrfResp.getHeaders().get(HttpHeaders.SET_COOKIE);

            // 3. guest token
            Map<String, Object> body = new LinkedHashMap<>();
            Map<String, String> resource = new LinkedHashMap<>();
            resource.put("type", "dashboard");
            resource.put("id", dashboardId);
            body.put("resources", Collections.singletonList(resource));
            body.put("rls", rls);
            Map<String, String> guest = new LinkedHashMap<>();
            guest.put("username", "report-viewer");
            guest.put("first_name", "report-viewer");
            guest.put("last_name", "report-viewer");
            body.put("user", guest);

            HttpHeaders h = json(access);
            h.set("X-CSRFToken", csrf);
            if (cookies != null && !cookies.isEmpty()) {
                List<String> pairs = new ArrayList<>();
                for (String c : cookies) pairs.add(c.split(";", 2)[0]);
                h.set(HttpHeaders.COOKIE, String.join("; ", pairs));
            }
            ResponseEntity<JsonNode> tokenResp = restTemplate.exchange(api + "/guest_token/", HttpMethod.POST,
                    new HttpEntity<>(body, h), JsonNode.class);

            Map<String, String> out = new LinkedHashMap<>();
            out.put("token", tokenResp.getBody().path("token").asText());
            return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(out);
        } catch (Exception e) {
            log.error("Could not obtain Superset guest token: {}", e.getMessage());
            return error(HttpStatus.BAD_GATEWAY, "Dashboards are temporarily unavailable");
        }
    }

    private HttpHeaders json(String bearer) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
        if (bearer != null) h.setBearerAuth(bearer);
        return h;
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Collections.singletonMap("message", message));
    }
}
