package com.example.gateway.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.web.reactive.config.WebFluxConfigurer;

/**
 * Spring Boot 3.x Gateway Configuration for Multipart File Uploads
 *
 * This configuration ensures proper handling of multipart/form-data requests
 * through the API Gateway without corruption or truncation.
 *
 * Increases max in-memory size (from default 256KB) to support large file
 * uploads through the gateway, matching the old zuul gateway's
 * spring.servlet.multipart.max-file-size=500MB (used by hpud-dms-service).
 *
 * Required for Spring Boot 3.x compatibility with large file uploads.
 */
@Configuration
public class MultipartGatewayConfig implements WebFluxConfigurer {

    // 500MB in bytes
    private static final int MAX_IN_MEMORY_SIZE = 524288000;

    /**
     * Configure HTTP message codecs to handle large multipart requests
     *
     * Spring Boot 3.x has stricter memory limits by default.
     * We increase the max in-memory size here to support file uploads up to 100MB.
     *
     * @param configurer the ServerCodecConfigurer to configure
     */
    @Override
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        // Set overall codec max in-memory size for all codecs
        // This applies to multipart requests as well
        configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE);
    }
}
