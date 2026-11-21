package org.egov.filters.pre;

import java.net.InetAddress;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;

/**
 * Some endpoints (scheduler / batch / admin jobs) are whitelisted as "open" (no auth token) because they are
 * called by in-cluster jobs. They must never be reachable from the internet.
 *
 * A request that arrives through the public ingress always carries the client's address in X-Forwarded-For /
 * X-Real-IP. If ANY address found there is public, the request is rejected with 403. In-cluster callers (no
 * forwarding headers, or only private addresses) are unaffected.
 */
@Component
public class InternalOnlyEndpointFilter extends ZuulFilter {

    private static final Logger logger = LoggerFactory.getLogger(InternalOnlyEndpointFilter.class);
    private static final String[] FORWARD_HEADERS = {"X-Forwarded-For", "X-Real-IP", "Forwarded", "True-Client-IP", "CF-Connecting-IP"};

    private final Set<String> internalOnly;

    public InternalOnlyEndpointFilter(@Value("${egov.internal-only-endpoints:}") String endpoints) {
        this.internalOnly = Arrays.stream(endpoints.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).collect(Collectors.toSet());
    }

    @Override
    public String filterType() {
        return "pre";
    }

    @Override
    public int filterOrder() {
        return 0; // before AuthPreCheckFilter (1)
    }

    @Override
    public boolean shouldFilter() {
        return !internalOnly.isEmpty() && internalOnly.contains(RequestContext.getCurrentContext().getRequest().getRequestURI());
    }

    @Override
    public Object run() {
        RequestContext ctx = RequestContext.getCurrentContext();
        HttpServletRequest request = ctx.getRequest();
        if (hasPublicClientAddress(request)) {
            logger.warn("Blocked external call to internal-only endpoint {}", request.getRequestURI());
            ctx.setSendZuulResponse(false);
            ctx.setResponseStatusCode(403);
            ctx.getResponse().setContentType("application/json");
            ctx.setResponseBody("{\"Errors\":[{\"code\":\"Forbidden\",\"message\":\"You are not authorized to access this resource\"}]}");
        }
        return null;
    }

    private boolean hasPublicClientAddress(HttpServletRequest request) {
        for (String header : FORWARD_HEADERS) {
            String value = request.getHeader(header);
            if (value == null) continue;
            for (String part : value.split("[,;]")) {
                String ip = part.trim().replaceFirst("(?i)^for=", "").replace("\"", "");
                if (ip.isEmpty() || ip.equalsIgnoreCase("unknown")) continue;
                if (ip.startsWith("[")) ip = ip.substring(1, ip.indexOf(']') > 0 ? ip.indexOf(']') : ip.length());
                else if (ip.indexOf(':') > 0 && ip.indexOf(':') == ip.lastIndexOf(':')) ip = ip.substring(0, ip.indexOf(':')); // strip :port
                if (!isPrivate(ip)) return true; // public or unparsable => treat as external (fail closed)
            }
        }
        return false;
    }

    private boolean isPrivate(String ip) {
        if (!ip.matches("[0-9a-fA-F:.]+")) return false; // hostnames / garbage are not trusted
        try {
            InetAddress a = InetAddress.getByName(ip);
            return a.isLoopbackAddress() || a.isSiteLocalAddress() || a.isLinkLocalAddress()
                    || (a.getAddress().length == 16 && (a.getAddress()[0] & 0xFE) == 0xFC); // fc00::/7
        } catch (Exception e) {
            return false;
        }
    }
}
