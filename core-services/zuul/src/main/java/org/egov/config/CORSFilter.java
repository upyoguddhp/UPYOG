package org.egov.config;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CORSFilter implements Filter {

	/** Comma separated list of exact origins (scheme://host[:port]) allowed to call the APIs cross-origin. */
	private final Set<String> allowedOrigins;

	public CORSFilter(@Value("${cors.allowed.origins:}") String origins) {
		this.allowedOrigins = Arrays.stream(origins.split(","))
				.map(String::trim)
				.filter(o -> !o.isEmpty())
				.collect(Collectors.toSet());
	}

	@Override
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
			throws IOException, ServletException {

		HttpServletRequest request = (HttpServletRequest) req;
		HttpServletResponse response = (HttpServletResponse) res;

		String origin = request.getHeader("Origin");
		boolean originAllowed = origin != null && allowedOrigins.contains(origin);

		// Only echo back origins that are explicitly allow-listed (never reflect arbitrary Origin
		// together with Allow-Credentials: true).
		if (originAllowed) {
			response.setHeader("Access-Control-Allow-Origin", origin);
			response.setHeader("Access-Control-Allow-Credentials", "true");
			response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			response.setHeader("Access-Control-Max-Age", "3600");
			response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With");
			response.addHeader("Vary", "Origin");
		}
		response.setHeader("X-Content-Type-Options", "nosniff");
		response.setHeader("X-Frame-Options", "SAMEORIGIN");
		response.setHeader("Content-Security-Policy", "default-src 'self';");
		response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
		response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
		response.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
		response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
		response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
		response.setHeader("Pragma", "no-cache");

		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			// CORS preflight is answered only for allow-listed origins; plain OPTIONS probes are rejected.
			response.setStatus(originAllowed ? HttpServletResponse.SC_OK : HttpServletResponse.SC_METHOD_NOT_ALLOWED);
		} else if ("TRACE".equalsIgnoreCase(request.getMethod())) {
			response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
		} else {
            chain.doFilter(req, res);
        }
		
	}

	@Override
	public void init(FilterConfig filterConfig) {
	}

	@Override
	public void destroy() {
	}

}