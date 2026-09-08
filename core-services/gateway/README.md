Gateway service — quick reference

What it is: replaces the old Netflix Zuul gateway (core-services/zuul) with Spring Cloud Gateway (core-services/gateway), reactive/WebFlux-based. Single entry point for all client traffic; routes to every backend service by path.

Where things live

┌──────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────┐
│           Concern            │                                             File                                              │
├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Routing table (114 routes)   │ core-services/gateway/src/main/resources/routes.properties                                    │
├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Auth/whitelist/tenant config │ core-services/gateway/src/main/resources/application.properties                               │
├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Rate-limit key strategies    │ .../ratelimiters/RateLimiterConfiguration.java (ipKeyResolver, userKeyResolver)               │
├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Auth/RBAC/enrichment logic   │ .../filters/pre/*.java (AuthFilter, RbacFilter, RequestEnrichmentFilter, CorrelationIdFilter) │
├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Multipart upload size cap    │ .../config/MultipartGatewayConfig.java (bumped to 500MB)                                      │
├──────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Local port override          │ .upyog-env/gateway.env (SERVER_PORT=8082, same port zuul used)                                │
└──────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────────┘

How to manage it day to day
- Add a new route: append a new spring.cloud.gateway.routes[N] block (id, uri, predicates[0]=Path=...) to routes.properties. No code change needed.
- Add a route-specific rate limit: either add the RequestRateLimiter filter directly to that route if the whole route should be limited, or — if only a sub-path should be — add a narrower route above the broader one (Gateway matches top-to-bottom, first match wins) with just that filter.
- Change what bypasses auth: edit egov.open-endpoints-whitelist (no auth at all) or egov.mixed-mode-endpoints-whitelist (auth optional) in application.properties.
- Restart it locally: upyogctl restart gateway (it auto-discovers the module by folder name + SpringApplication.run).
- Full behind-the-scenes rationale for every judgment call made during the migration (dead/overwritten old rate-limit rules, the corrupted whitelist value I cleaned up, the pb→hp tenant fix, the Redis property-name change for Boot 3, etc.) — I had a notes file half-written when you interrupted; want me to finish writing it to upyog/migration-notes/gateway-migration-notes.md so it's there for reference, or skip it?