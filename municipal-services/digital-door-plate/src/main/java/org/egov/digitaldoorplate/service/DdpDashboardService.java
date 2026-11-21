package org.egov.digitaldoorplate.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.digitaldoorplate.model.DdpDashboardRequest;
import org.egov.digitaldoorplate.model.DdpDashboardResponse;
import org.egov.digitaldoorplate.repository.DdpDashboardRepository;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * Builds the role-scoped DDP dashboard payload. No numbers are hardcoded here:
 * SLAs, thresholds and targets come from eg_grbg_ddp_stage_sla and
 * eg_grbg_ddp_dashboard_config; roles come from application properties.
 */
@Slf4j
@Service
public class DdpDashboardService {

	private static final long HOUR_MS = 3600000L;
	private static final long DAY_MS = 86400000L;

	/** stage cards in lifecycle order; REJECTED aggregates both rejection stages. */
	private static final List<String> CARD_ORDER = Arrays.asList("READY", "PRINTED", "PRINT_VERIFIED", "REJECTED",
			"DISPATCHED", "RECEIVED", "INSTALLED");

	private static final Map<String, List<String>> DEFAULT_SECTIONS = new HashMap<>();
	static {
		DEFAULT_SECTIONS.put("VENDOR", Arrays.asList("ageing", "rejections", "batches", "trend"));
		DEFAULT_SECTIONS.put("ULB", Arrays.asList("batches", "progress", "attention", "wards", "geo"));
		DEFAULT_SECTIONS.put("STATE",
				Arrays.asList("ulbProgress", "turnaround", "trend", "vendorPerformance"));
	}

	@Autowired
	private DdpDashboardRepository repository;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	@Value("${ddp.dashboard.role.state}")
	private String stateRoles;

	@Value("${ddp.dashboard.role.vendor}")
	private String vendorRoles;

	@Value("${ddp.dashboard.role.ulb}")
	private String ulbRoles;

	public DdpDashboardResponse search(DdpDashboardRequest request) {
		RequestInfo requestInfo = request.getRequestInfo();
		if (requestInfo == null || requestInfo.getUserInfo() == null) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
		User user = requestInfo.getUserInfo();
		String role = resolveRole(user);
		String tenantId = request.getTenantId();
		if ("ULB".equals(role)) {
			String userTenant = user.getTenantId();
			tenantId = StringUtils.hasText(userTenant) && userTenant.contains(".") ? userTenant : tenantId;
			if (!StringUtils.hasText(tenantId)) {
				throw new CustomException("INVALID_REQUEST", "TenantId is required for ULB users.");
			}
		}
		String ward = request.getWard();
		long now = System.currentTimeMillis();
		int limit = request.getLimit() != null && request.getLimit() > 0 ? request.getLimit() : 8;

		Map<String, String> config = repository.getConfig();
		List<Map<String, Object>> sla = repository.getSla();
		Map<String, Long> slaHours = new HashMap<>();
		for (Map<String, Object> row : sla) {
			slaHours.put(String.valueOf(row.get("stage")), ((Number) row.get("slaHours")).longValue());
		}

		List<Map<String, Object>> stageRows = repository.stageCounts(tenantId, ward, now);
		long total = stageRows.stream().mapToLong(r -> ((Number) r.get("count")).longValue()).sum();

		List<String> sections = CollectionUtils.isEmpty(request.getSections()) ? DEFAULT_SECTIONS.get(role)
				: request.getSections();
		long trendDays = cfgLong(config, "trend.default.days", 30);
		long from = request.getFromDate() != null ? request.getFromDate() : now - trendDays * DAY_MS;
		long to = request.getToDate() != null ? request.getToDate() : now;

		Map<String, Object> out = new LinkedHashMap<>();
		for (String section : sections) {
			switch (section) {
			case "ageing":
				out.put(section, ageing(repository.readyAgeDays(tenantId, ward, now), config));
				break;
			case "rejections":
				out.put(section, rejections(repository.rejections(tenantId, ward, limit * 2, now), stageRows));
				break;
			case "batches":
				out.put(section, batches(repository.batches("ULB".equals(role) ? tenantId : request.getTenantId(),
						limit), slaHours, now));
				break;
			case "progress":
				out.put(section, progress(stageRows, total, config));
				break;
			case "attention":
				out.put(section, attention(tenantId, ward, now, config, slaHours));
				break;
			case "wards":
				out.put(section, repository.wardProgress(tenantId, limit + 4, now));
				break;
			case "geo":
				out.put(section, repository.installedGeo(tenantId, ward, 500));
				break;
			case "trend":
				out.put(section, trend(repository.trend(tenantId, from, to), from, to));
				break;
			case "ulbProgress":
				out.put(section, ulbProgress(repository.ulbProgress(tenantId, limit, now), config));
				break;
			case "turnaround":
				out.put(section, turnaround(repository.turnaround(tenantId, from, to), sla));
				break;
			case "vendorPerformance":
				out.put(section, vendorPerformance(repository.vendorPerformance(tenantId, from, to), slaHours, config));
				break;
			default:
				log.warn("Unknown DDP dashboard section requested: {}", section);
			}
		}

		return DdpDashboardResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true)).role(role)
				.tenantId(tenantId).generatedAt(now).total(total).stages(stageCards(stageRows, total, slaHours))
				.sla(sla).config(config).sections(out).build();
	}

	private String resolveRole(User user) {
		Set<String> codes = user.getRoles() == null ? java.util.Collections.emptySet()
				: user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
		if (hasAny(codes, stateRoles)) {
			return "STATE";
		}
		if (hasAny(codes, vendorRoles)) {
			return "VENDOR";
		}
		if (hasAny(codes, ulbRoles)) {
			return "ULB";
		}
		throw new CustomException("UNAUTHORIZED", "User is not allowed to view the DDP dashboard.");
	}

	private boolean hasAny(Set<String> codes, String csv) {
		return Arrays.stream(csv.split(",")).map(String::trim).anyMatch(codes::contains);
	}

	private List<Map<String, Object>> stageCards(List<Map<String, Object>> rows, long total,
			Map<String, Long> slaHours) {
		Map<String, long[]> by = new HashMap<>(); // stage -> {count, overdue}
		for (Map<String, Object> r : rows) {
			by.put(String.valueOf(r.get("stage")), new long[] { ((Number) r.get("count")).longValue(),
					((Number) r.get("overdue")).longValue() });
		}
		List<Map<String, Object>> cards = new ArrayList<>();
		for (String key : CARD_ORDER) {
			Map<String, Object> card = new LinkedHashMap<>();
			long count;
			long overdue;
			if ("REJECTED".equals(key)) {
				long[] a = by.getOrDefault("REJECTED_REPRINT", new long[2]);
				long[] b = by.getOrDefault("REJECTED_REVALIDATE", new long[2]);
				count = a[0] + b[0];
				overdue = a[1] + b[1];
				Map<String, Object> breakdown = new LinkedHashMap<>();
				breakdown.put("REPRINT", a[0]);
				breakdown.put("REVALIDATE", b[0]);
				card.put("breakdown", breakdown);
			} else {
				long[] v = by.getOrDefault(key, new long[2]);
				count = v[0];
				overdue = v[1];
				if (slaHours.containsKey(key)) {
					card.put("slaHours", slaHours.get(key));
				}
			}
			card.put("stage", key);
			card.put("count", count);
			card.put("percent", total == 0 ? 0 : round1(count * 100.0 / total));
			card.put("overdue", slaHours.containsKey(key) || "REJECTED".equals(key) ? (Object) overdue : null);
			cards.add(card);
		}
		return cards;
	}

	private Map<String, Object> ageing(List<Map<String, Object>> rows, Map<String, String> config) {
		List<Long> edges = Arrays.stream(config.getOrDefault("ageing.bucket.days", "2,7,14").split(","))
				.map(String::trim).filter(s -> !s.isEmpty()).map(Long::parseLong).collect(Collectors.toList());
		long[] counts = new long[edges.size() + 1];
		for (Map<String, Object> r : rows) {
			long days = ((Number) r.get("days")).longValue();
			long c = ((Number) r.get("count")).longValue();
			int idx = edges.size();
			for (int i = 0; i < edges.size(); i++) {
				if (days <= edges.get(i)) {
					idx = i;
					break;
				}
			}
			counts[idx] += c;
		}
		String[] tones = { "ok", "info", "warn", "critical" };
		List<Map<String, Object>> buckets = new ArrayList<>();
		long prev = -1;
		for (int i = 0; i <= edges.size(); i++) {
			Map<String, Object> b = new LinkedHashMap<>();
			boolean last = i == edges.size();
			b.put("label", last ? ">" + edges.get(i - 1) + " d" : (prev + 1) + "–" + edges.get(i) + " d");
			b.put("fromDays", prev + 1);
			b.put("toDays", last ? null : edges.get(i));
			b.put("count", counts[i]);
			b.put("tone", tones[Math.min(i, tones.length - 1)]);
			buckets.add(b);
			if (!last) {
				prev = edges.get(i);
			}
		}
		Map<String, Object> out = new LinkedHashMap<>();
		out.put("buckets", buckets);
		return out;
	}

	private Map<String, Object> rejections(List<Map<String, Object>> items, List<Map<String, Object>> stageRows) {
		long open = stageRows.stream().filter(r -> String.valueOf(r.get("stage")).startsWith("REJECTED"))
				.mapToLong(r -> ((Number) r.get("count")).longValue()).sum();
		List<Map<String, Object>> rows = new ArrayList<>();
		for (Map<String, Object> r : items) {
			Map<String, Object> row = new LinkedHashMap<>(r);
			row.put("action", "REJECTED_REVALIDATE".equals(r.get("stage")) ? "REVALIDATE" : "REPRINT");
			rows.add(row);
		}
		Map<String, Object> out = new LinkedHashMap<>();
		out.put("open", open);
		out.put("items", rows);
		return out;
	}

	private List<Map<String, Object>> batches(List<Map<String, Object>> rows, Map<String, Long> slaHours,
			long now) {
		long dispatchedSla = slaHours.getOrDefault("DISPATCHED", 0L);
		List<Map<String, Object>> out = new ArrayList<>();
		for (Map<String, Object> r : rows) {
			Map<String, Object> b = new LinkedHashMap<>(r);
			String status = String.valueOf(r.get("status"));
			long plates = ((Number) r.get("plates")).longValue();
			long verified = ((Number) r.get("verifiedPlates")).longValue();
			String display;
			if ("SUBMITTED".equals(status)) {
				display = "IN_TRANSIT";
			} else if (plates > 0 && verified >= plates) {
				display = "VERIFIED";
			} else if (verified > 0) {
				display = "PARTIALLY_VERIFIED";
			} else {
				display = "RECEIVED";
			}
			b.put("displayStatus", display);
			Object dispatchDate = r.get("dispatchDate");
			if (dispatchDate != null && !"VERIFIED".equals(display)) {
				long deadline = ((Number) dispatchDate).longValue() + dispatchedSla * HOUR_MS;
				long hoursLeft = Math.floorDiv(deadline - now, HOUR_MS);
				b.put("hoursLeft", hoursLeft);
				b.put("overdue", hoursLeft < 0);
			}
			out.add(b);
		}
		return out;
	}

	private Map<String, Object> progress(List<Map<String, Object>> stageRows, long total, Map<String, String> config) {
		long installed = stageRows.stream().filter(r -> "INSTALLED".equals(r.get("stage")))
				.mapToLong(r -> ((Number) r.get("count")).longValue()).sum();
		Map<String, Object> out = new LinkedHashMap<>();
		out.put("installed", installed);
		out.put("total", total);
		out.put("percent", total == 0 ? 0 : round1(installed * 100.0 / total));
		out.put("targetPercent", cfgLong(config, "install.target.percent", 0));
		out.put("targetDate", config.get("install.target.date"));
		return out;
	}

	private Map<String, Object> attention(String tenantId, String ward, long now, Map<String, String> config,
			Map<String, Long> slaHours) {
		int stuckDays = (int) cfgLong(config, "attention.stuck.days", 7);
		Map<String, Object> counts = repository.attention(tenantId, ward, now, stuckDays);
		long dispatchedSla = slaHours.getOrDefault("DISPATCHED", 0L);
		long overdueBatches = repository.batches(tenantId, 200).stream()
				.filter(b -> b.get("dispatchDate") != null
						&& !"VERIFIED".equals(batchDisplay(b))
						&& now > ((Number) b.get("dispatchDate")).longValue() + dispatchedSla * HOUR_MS)
				.count();
		Map<String, Object> out = new LinkedHashMap<>(counts);
		out.put("stuckDays", stuckDays);
		out.put("overdueBatches", overdueBatches);
		return out;
	}

	private String batchDisplay(Map<String, Object> b) {
		long plates = ((Number) b.get("plates")).longValue();
		long verified = ((Number) b.get("verifiedPlates")).longValue();
		return plates > 0 && verified >= plates ? "VERIFIED" : "OPEN";
	}

	private Map<String, Object> trend(List<Map<String, Object>> rows, long from, long to) {
		java.time.ZoneId zone = java.time.ZoneId.systemDefault();
		java.time.LocalDate start = java.time.Instant.ofEpochMilli(from).atZone(zone).toLocalDate();
		java.time.LocalDate end = java.time.Instant.ofEpochMilli(to).atZone(zone).toLocalDate();
		List<String> days = new ArrayList<>();
		for (java.time.LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
			days.add(d.toString());
		}
		Map<String, long[]> series = new LinkedHashMap<>();
		for (String a : Arrays.asList("PRINTED", "PRINT_VERIFIED", "DISPATCHED", "ULB_VERIFIED", "INSTALLED")) {
			series.put(a, new long[days.size()]);
		}
		for (Map<String, Object> r : rows) {
			long[] arr = series.get(String.valueOf(r.get("action")));
			int idx = days.indexOf(String.valueOf(r.get("day")));
			if (arr != null && idx >= 0) {
				arr[idx] += ((Number) r.get("count")).longValue();
			}
		}
		Map<String, Object> out = new LinkedHashMap<>();
		out.put("days", days);
		out.put("series", series);
		return out;
	}

	private List<Map<String, Object>> ulbProgress(List<Map<String, Object>> rows, Map<String, String> config) {
		long onTrack = cfgLong(config, "progress.ontrack.min.percent", 60);
		long atRisk = cfgLong(config, "progress.atrisk.min.percent", 40);
		List<Map<String, Object>> out = new ArrayList<>();
		for (Map<String, Object> r : rows) {
			long total = ((Number) r.get("total")).longValue();
			long installed = ((Number) r.get("installed")).longValue();
			double pct = total == 0 ? 0 : installed * 100.0 / total;
			Map<String, Object> row = new LinkedHashMap<>(r);
			String tenant = String.valueOf(r.get("tenantId"));
			String name = tenant.contains(".") ? tenant.substring(tenant.indexOf('.') + 1) : tenant;
			row.put("ulb", name.isEmpty() ? tenant
					: name.substring(0, 1).toUpperCase(Locale.ROOT) + name.substring(1));
			row.put("percent", round1(pct));
			row.put("status", pct >= onTrack ? "ON_TRACK" : pct >= atRisk ? "AT_RISK" : "DELAYED");
			out.add(row);
		}
		return out;
	}

	private Map<String, Object> turnaround(List<Map<String, Object>> rows, List<Map<String, Object>> sla) {
		Map<String, Double> median = new HashMap<>();
		for (Map<String, Object> r : rows) {
			if (r.get("medianHours") != null) {
				median.put(String.valueOf(r.get("stage")), ((Number) r.get("medianHours")).doubleValue());
			}
		}
		List<Map<String, Object>> items = new ArrayList<>();
		String bottleneck = null;
		double worst = 1.0;
		for (Map<String, Object> s : sla) {
			String stage = String.valueOf(s.get("stage"));
			if (!median.containsKey(stage)) {
				continue;
			}
			double sh = ((Number) s.get("slaHours")).doubleValue();
			double med = median.get(stage);
			Map<String, Object> i = new LinkedHashMap<>();
			i.put("stage", stage);
			i.put("label", s.get("label"));
			i.put("medianHours", round1(med));
			i.put("slaHours", (long) sh);
			i.put("breached", med > sh);
			items.add(i);
			if (sh > 0 && med / sh > worst) {
				worst = med / sh;
				bottleneck = stage;
			}
		}
		Map<String, Object> out = new LinkedHashMap<>();
		out.put("items", items);
		out.put("bottleneck", bottleneck);
		out.put("breachedCount", items.stream().filter(i -> Boolean.TRUE.equals(i.get("breached"))).count());
		return out;
	}

	private List<Map<String, Object>> vendorPerformance(List<Map<String, Object>> rows, Map<String, Long> slaHours,
			Map<String, String> config) {
		double sla = slaHours.getOrDefault("READY", 0L);
		double factor = 1.25;
		try {
			factor = Double.parseDouble(config.getOrDefault("vendor.atrisk.factor", "1.25"));
		} catch (NumberFormatException e) {
			log.warn("Invalid vendor.atrisk.factor, using default");
		}
		List<Map<String, Object>> out = new ArrayList<>();
		for (Map<String, Object> r : rows) {
			long verified = ((Number) r.get("verified")).longValue();
			long rejected = ((Number) r.get("rejected")).longValue();
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("vendor", r.get("vendor"));
			Double avg = r.get("avgPrintHours") == null ? null : ((Number) r.get("avgPrintHours")).doubleValue();
			row.put("avgPrintHours", avg == null ? null : round1(avg));
			row.put("verified", verified);
			row.put("rejected", rejected);
			row.put("rejectPercent", verified + rejected == 0 ? 0 : round1(rejected * 100.0 / (verified + rejected)));
			row.put("sla", avg == null || sla == 0 ? null : avg <= sla ? "MET" : avg <= sla * factor ? "AT_RISK" : "BREACHED");
			out.add(row);
		}
		return out;
	}

	private long cfgLong(Map<String, String> config, String key, long def) {
		try {
			return Long.parseLong(config.getOrDefault(key, String.valueOf(def)).trim());
		} catch (NumberFormatException e) {
			return def;
		}
	}

	private double round1(double v) {
		return Math.round(v * 10.0) / 10.0;
	}
}
