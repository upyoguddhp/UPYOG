package org.egov.financedashboard.service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.egov.financedashboard.repository.UlbFinanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Builds the State finance summary by querying every ULB schema and rolling the results up.
 * Output shape matches the OldTheme dashboard (see sampleData.js there). Amounts are in Rs. crore.
 */
@Service
public class FinanceSummaryService {

	private static final Logger log = LoggerFactory.getLogger(FinanceSummaryService.class);
	private static final double CRORE = 1.0e7;
	private static final Pattern FY = Pattern.compile("^(\\d{4})-(\\d{2})$");

	@Autowired
	private UlbFinanceRepository repository;

	@Value("${finance.dashboard.parallelism:8}")
	private int parallelism;

	@Value("${finance.dashboard.cache-ttl-seconds:600}")
	private long cacheTtlSeconds;

	private final Map<String, CachedSummary> cache = new ConcurrentHashMap<>();

	private static class CachedSummary {
		final long at = System.currentTimeMillis();
		final Map<String, Object> value;

		CachedSummary(Map<String, Object> value) {
			this.value = value;
		}
	}

	/** Raw per-ULB rows, in rupees. */
	static class UlbData {
		String ulb;
		List<Map<String, Object>> banks;
		int inactiveAccounts;
		List<Map<String, Object>> collections;
		List<Map<String, Object>> prevCollections;
		Map<String, Object> reconciliation;
		List<Map<String, Object>> schemes;
	}

	public Map<String, Object> getSummary(String financialYear) {
		String fy = financialYear == null || financialYear.trim().isEmpty() ? currentFinancialYear() : financialYear.trim();
		CachedSummary hit = cache.get(fy);
		if (hit != null && System.currentTimeMillis() - hit.at < cacheTtlSeconds * 1000) {
			return hit.value;
		}
		Map<String, Object> summary = build(fy);
		cache.put(fy, new CachedSummary(summary));
		return summary;
	}

	private Map<String, Object> build(String fy) {
		int startYear = parseStartYear(fy);
		LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
		Timestamp from = Timestamp.valueOf(LocalDate.of(startYear, 4, 1).atStartOfDay());
		Timestamp to = Timestamp.valueOf(LocalDate.of(startYear + 1, 4, 1).atStartOfDay());
		Timestamp prevFrom = Timestamp.valueOf(LocalDate.of(startYear - 1, 4, 1).atStartOfDay());
		LocalDateTime prevToLocal = LocalDate.of(startYear, 4, 1).atStartOfDay();
		LocalDateTime sameDayLastYear = now.minusYears(1);
		if (sameDayLastYear.isBefore(prevToLocal)) {
			prevToLocal = sameDayLastYear;
		}
		Timestamp prevTo = Timestamp.valueOf(prevToLocal);

		List<String> schemas = repository.findUlbSchemas();
		List<UlbData> loaded = loadAll(schemas, from, to, prevFrom, prevTo);
		return Aggregator.aggregate(loaded, schemas.size(), startYear, now);
	}

	private List<UlbData> loadAll(List<String> schemas, Timestamp from, Timestamp to, Timestamp prevFrom, Timestamp prevTo) {
		ExecutorService pool = Executors.newFixedThreadPool(Math.max(1, parallelism));
		try {
			List<Future<UlbData>> futures = new ArrayList<>();
			for (String schema : schemas) {
				futures.add(pool.submit(() -> {
					UlbData d = new UlbData();
					d.ulb = displayName(schema);
					d.banks = repository.bankBalances(schema);
					d.inactiveAccounts = repository.inactiveAccounts(schema);
					d.collections = repository.collections(schema, from, to);
					d.prevCollections = repository.collections(schema, prevFrom, prevTo);
					d.reconciliation = repository.reconciliation(schema, from, to);
					d.schemes = repository.schemeFlows(schema, from, to);
					return d;
				}));
			}
			List<UlbData> out = new ArrayList<>();
			for (int i = 0; i < futures.size(); i++) {
				try {
					out.add(futures.get(i).get());
				} catch (Exception e) {
					// One broken ULB schema must not take the State view down; it is simply not "reporting".
					log.warn("Skipping ULB schema {}: {}", schemas.get(i), e.getMessage());
				}
			}
			return out;
		} finally {
			pool.shutdown();
		}
	}

	static int parseStartYear(String fy) {
		Matcher m = FY.matcher(fy);
		if (!m.matches()) {
			throw new IllegalArgumentException("financialYear must look like 2026-27");
		}
		int start = Integer.parseInt(m.group(1));
		if ((start + 1) % 100 != Integer.parseInt(m.group(2))) {
			throw new IllegalArgumentException("financialYear must look like 2026-27");
		}
		return start;
	}

	static String currentFinancialYear() {
		LocalDate today = LocalDate.now();
		int start = today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
		return start + "-" + String.format("%02d", (start + 1) % 100);
	}

	private static String displayName(String schema) {
		String s = schema.replace('_', ' ');
		return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
	}

	/** Pure roll-up logic, kept static so it can be tested without a database. */
	static class Aggregator {

		static Map<String, Object> aggregate(List<UlbData> ulbs, int ulbsTotal, int startYear, LocalDateTime now) {
			Map<String, Object> out = new LinkedHashMap<>();
			out.put("asOf", now.atZone(ZoneId.systemDefault()).toInstant().toString());

			// ---- banks
			Map<String, double[]> byBank = new HashMap<>(); // [accounts, balance]
			Map<String, Double> byType = new HashMap<>();
			Map<String, Map<String, Double>> ulbBank = new LinkedHashMap<>();
			Map<String, Double> ulbBalance = new LinkedHashMap<>();
			int accounts = 0;
			int inactive = 0;
			double totalBalance = 0;
			for (UlbData u : ulbs) {
				inactive += u.inactiveAccounts;
				Map<String, Double> row = new HashMap<>();
				for (Map<String, Object> r : u.banks) {
					String bank = str(r.get("bank"));
					int n = ((Number) r.get("accounts")).intValue();
					double bal = num(r.get("balance"));
					double[] agg = byBank.computeIfAbsent(bank, k -> new double[2]);
					agg[0] += n;
					agg[1] += bal;
					byType.merge(typeLabel(str(r.get("type"))), bal, Double::sum);
					row.merge(bank, bal, Double::sum);
					accounts += n;
					totalBalance += bal;
					ulbBalance.merge(u.ulb, bal, Double::sum);
				}
				ulbBank.put(u.ulb, row);
			}
			List<String> bankOrder = sortedKeys(byBank, (a, b) -> Double.compare(b.getValue()[1], a.getValue()[1]));

			List<Map<String, Object>> byBankList = new ArrayList<>();
			for (String bank : bankOrder) {
				byBankList.add(row("bank", bank, "accounts", (int) byBank.get(bank)[0], "balance", cr(byBank.get(bank)[1])));
			}
			List<Map<String, Object>> byTypeList = new ArrayList<>();
			for (Map.Entry<String, Double> e : byType.entrySet()) {
				byTypeList.add(row("type", e.getKey(), "balance", cr(e.getValue())));
			}
			byTypeList.sort((a, b) -> Double.compare(num(b.get("balance")), num(a.get("balance"))));

			List<String> topBanks = new ArrayList<>(bankOrder.subList(0, Math.min(5, bankOrder.size())));
			List<String> bankColumns = new ArrayList<>(topBanks);
			if (bankOrder.size() > topBanks.size()) {
				bankColumns.add("Others");
			}
			List<Map<String, Object>> bankMatrixRows = new ArrayList<>();
			for (String ulb : topKeys(ulbBalance, 12)) {
				List<Double> values = new ArrayList<>();
				double others = 0;
				for (Map.Entry<String, Double> e : ulbBank.get(ulb).entrySet()) {
					if (!topBanks.contains(e.getKey())) {
						others += e.getValue();
					}
				}
				for (String b : topBanks) {
					values.add(cr(ulbBank.get(ulb).getOrDefault(b, 0.0)));
				}
				if (bankOrder.size() > topBanks.size()) {
					values.add(cr(others));
				}
				bankMatrixRows.add(row("label", ulb, "values", values));
			}

			// ---- collections / services
			Map<String, Double> monthTotal = new HashMap<>();
			Map<String, Map<String, Double>> monthService = new HashMap<>();
			Map<String, Double> serviceTotal = new HashMap<>();
			Map<String, Double> servicePrev = new HashMap<>();
			Map<String, Double> ulbCollection = new LinkedHashMap<>();
			Map<String, Map<String, Double>> ulbService = new LinkedHashMap<>();
			double collections = 0;
			double prevCollections = 0;
			double online = 0;
			double prevOnline = 0;
			long receipts = 0;
			long prevReceipts = 0;
			for (UlbData u : ulbs) {
				Map<String, Double> row = new HashMap<>();
				for (Map<String, Object> r : u.collections) {
					String month = str(r.get("month"));
					String service = str(r.get("service"));
					double amt = num(r.get("amount"));
					monthTotal.merge(month, amt, Double::sum);
					monthService.computeIfAbsent(month, k -> new HashMap<>()).merge(service, amt, Double::sum);
					serviceTotal.merge(service, amt, Double::sum);
					row.merge(service, amt, Double::sum);
					ulbCollection.merge(u.ulb, amt, Double::sum);
					collections += amt;
					online += num(r.get("online_amount"));
					receipts += ((Number) r.get("receipts")).longValue();
				}
				ulbService.put(u.ulb, row);
				for (Map<String, Object> r : u.prevCollections) {
					double amt = num(r.get("amount"));
					servicePrev.merge(str(r.get("service")), amt, Double::sum);
					prevCollections += amt;
					prevOnline += num(r.get("online_amount"));
					prevReceipts += ((Number) r.get("receipts")).longValue();
				}
			}

			List<String> months = fyMonths(startYear, now);
			List<Map<String, Object>> monthly = new ArrayList<>();
			List<Map<String, Object>> serviceMonthly = new ArrayList<>();
			for (String m : months) {
				monthly.add(row("month", monthLabel(m), "amount", cr(monthTotal.getOrDefault(m, 0.0))));
				Map<String, Object> values = new LinkedHashMap<>();
				for (Map.Entry<String, Double> e : monthService.getOrDefault(m, new HashMap<>()).entrySet()) {
					values.put(e.getKey(), cr(e.getValue()));
				}
				serviceMonthly.add(row("month", monthLabel(m), "values", values));
			}

			List<String> serviceOrder = sortedKeys(serviceTotal, (a, b) -> Double.compare(b.getValue(), a.getValue()));
			List<Map<String, Object>> byService = new ArrayList<>();
			for (String s : serviceOrder) {
				byService.add(row("service", s, "amount", cr(serviceTotal.get(s)), "yoyPct", pct(serviceTotal.get(s), servicePrev.get(s))));
			}
			List<String> matrixServices = new ArrayList<>(serviceOrder.subList(0, Math.min(6, serviceOrder.size())));
			List<Map<String, Object>> serviceMatrixRows = new ArrayList<>();
			for (String ulb : topKeys(ulbCollection, 12)) {
				List<Double> values = new ArrayList<>();
				for (String s : matrixServices) {
					values.add(cr(ulbService.get(ulb).getOrDefault(s, 0.0)));
				}
				serviceMatrixRows.add(row("label", ulb, "values", values, "total", cr(ulbCollection.get(ulb))));
			}

			// ---- schemes
			Map<String, double[]> scheme = new HashMap<>(); // [received, utilised]
			Map<String, String> schemeFund = new HashMap<>();
			Map<String, Map<String, Double>> ulbUnused = new LinkedHashMap<>();
			Map<String, Double> ulbUnusedTotal = new LinkedHashMap<>();
			for (UlbData u : ulbs) {
				Map<String, Double> row = new HashMap<>();
				for (Map<String, Object> r : u.schemes) {
					String name = str(r.get("scheme"));
					double received = num(r.get("received"));
					double utilised = num(r.get("utilised"));
					double[] agg = scheme.computeIfAbsent(name, k -> new double[2]);
					agg[0] += received;
					agg[1] += utilised;
					schemeFund.putIfAbsent(name, str(r.get("fund")));
					double unused = Math.max(0, received - utilised);
					row.merge(name, unused, Double::sum);
					ulbUnusedTotal.merge(u.ulb, unused, Double::sum);
				}
				ulbUnused.put(u.ulb, row);
			}
			List<String> schemeOrder = sortedKeys(scheme, (a, b) -> Double.compare(b.getValue()[0], a.getValue()[0]));
			List<Map<String, Object>> bySchemes = new ArrayList<>();
			for (String s : schemeOrder) {
				// allocated is null: egov-finance holds no sanctioned amount per scheme.
				bySchemes.add(row("scheme", s, "fund", schemeFund.get(s), "allocated", null,
						"received", cr(scheme.get(s)[0]), "utilised", cr(Math.min(scheme.get(s)[0], scheme.get(s)[1]))));
			}
			List<String> matrixSchemes = new ArrayList<>(schemeOrder.subList(0, Math.min(7, schemeOrder.size())));
			List<Map<String, Object>> schemeMatrixRows = new ArrayList<>();
			for (String ulb : topKeys(ulbUnusedTotal, 6)) {
				List<Double> values = new ArrayList<>();
				for (String s : matrixSchemes) {
					values.add(cr(ulbUnused.get(ulb).getOrDefault(s, 0.0)));
				}
				schemeMatrixRows.add(row("label", ulb, "values", values));
			}

			// ---- overview ulb table
			List<Map<String, Object>> ulbRows = new ArrayList<>();
			for (UlbData u : ulbs) {
				Object last = u.reconciliation.get("last_receipt");
				Integer syncDays = null;
				if (last instanceof Timestamp) {
					syncDays = (int) ChronoUnit.DAYS.between(((Timestamp) last).toLocalDateTime(), now);
				}
				ulbRows.add(row("ulb", u.ulb, "bankBalance", cr(ulbBalance.getOrDefault(u.ulb, 0.0)),
						"collection", cr(ulbCollection.getOrDefault(u.ulb, 0.0)),
						"unreconciled", ((Number) u.reconciliation.get("unreconciled")).intValue(), "lastSyncDays", syncDays));
			}

			Map<String, Object> overviewKpis = row("bankBalance", cr(totalBalance), "bankBalanceDeltaPct", null,
					"collections", cr(collections), "collectionsDeltaPct", pct(collections, prevCollections),
					"bankAccounts", accounts, "banks", byBank.size(), "activeSchemes", scheme.size(),
					"ulbsReporting", ulbs.size(), "ulbsTotal", ulbsTotal);
			out.put("overview", row("kpis", overviewKpis, "monthly", monthly, "ulbs", ulbRows));
			out.put("banks", row(
					"kpis", row("totalBalance", cr(totalBalance), "deltaPct", null, "banks", byBank.size(), "accounts", accounts,
							"inactiveAccounts", inactive),
					"byBank", byBankList, "byType", byTypeList,
					"matrix", row("columns", bankColumns, "rows", bankMatrixRows)));
			out.put("schemes", row("bySchemes", bySchemes, "matrix", row("columns", matrixSchemes, "rows", schemeMatrixRows)));
			double onlinePct = collections == 0 ? 0 : online * 100 / collections;
			double prevOnlinePct = prevCollections == 0 ? 0 : prevOnline * 100 / prevCollections;
			out.put("services", row(
					"kpis", row("collections", cr(collections), "collectionsDeltaPct", pct(collections, prevCollections),
							"receipts", receipts, "receiptsDeltaPct", pct(receipts, (double) prevReceipts),
							"onlineSharePct", Math.round(onlinePct),
							"onlineShareDeltaPct", prevCollections == 0 ? null : (Object) round1(onlinePct - prevOnlinePct)),
					"byService", byService, "monthly", serviceMonthly,
					"matrix", row("columns", matrixServices, "rows", serviceMatrixRows)));
			return out;
		}

		private static List<String> fyMonths(int startYear, LocalDateTime now) {
			List<String> months = new ArrayList<>();
			LocalDate cursor = LocalDate.of(startYear, 4, 1);
			LocalDate end = LocalDate.of(startYear + 1, 3, 1);
			LocalDate cap = now.toLocalDate().withDayOfMonth(1);
			while (!cursor.isAfter(end) && !cursor.isAfter(cap)) {
				months.add(String.format("%04d-%02d", cursor.getYear(), cursor.getMonthValue()));
				cursor = cursor.plusMonths(1);
			}
			if (months.isEmpty()) {
				months.add(String.format("%04d-04", startYear));
			}
			return months;
		}

		private static String monthLabel(String yyyyMm) {
			return java.time.Month.of(Integer.parseInt(yyyyMm.substring(5))).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
		}

		private static String typeLabel(String raw) {
			String t = raw == null ? "" : raw.trim().toLowerCase(Locale.ENGLISH);
			if (t.startsWith("saving")) {
				return "Savings";
			}
			if (t.startsWith("current")) {
				return "Current";
			}
			if (t.contains("fixed") || t.equals("fd")) {
				return "Fixed deposit";
			}
			return "Others";
		}

		private static <V> List<String> sortedKeys(Map<String, V> map, Comparator<Map.Entry<String, V>> order) {
			List<Map.Entry<String, V>> entries = new ArrayList<>(map.entrySet());
			entries.sort(order);
			List<String> keys = new ArrayList<>();
			for (Map.Entry<String, V> e : entries) {
				keys.add(e.getKey());
			}
			return keys;
		}

		private static List<String> topKeys(Map<String, Double> totals, int n) {
			List<String> keys = sortedKeys(totals, (a, b) -> Double.compare(b.getValue(), a.getValue()));
			return keys.subList(0, Math.min(n, keys.size()));
		}

		static Map<String, Object> row(Object... kv) {
			Map<String, Object> m = new LinkedHashMap<>();
			for (int i = 0; i < kv.length; i += 2) {
				m.put((String) kv[i], kv[i + 1]);
			}
			return m;
		}

		static double cr(double rupees) {
			return Math.round(rupees / CRORE * 1000.0) / 1000.0;
		}

		static double round1(double v) {
			return Math.round(v * 10.0) / 10.0;
		}

		static Object pct(double current, Double previous) {
			return previous == null || previous == 0 ? null : (Object) round1((current - previous) * 100 / previous);
		}

		static double num(Object o) {
			return o == null ? 0 : ((Number) o).doubleValue();
		}

		static String str(Object o) {
			return o == null ? "Unknown" : o.toString();
		}
	}
}
