package org.egov.financedashboard.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.egov.financedashboard.service.FinanceSummaryService.Aggregator;
import org.egov.financedashboard.service.FinanceSummaryService.UlbData;
import org.junit.jupiter.api.Test;

class FinanceSummaryServiceTest {

	private static Map<String, Object> m(Object... kv) {
		return Aggregator.row(kv);
	}

	private static UlbData ulb(String name, double balance, double collected, double prev, int unreconciled, Timestamp last) {
		UlbData u = new UlbData();
		u.ulb = name;
		u.inactiveAccounts = 1;
		u.banks = Collections.singletonList(m("bank", "SBI", "type", "Savings A/c", "accounts", 2, "balance", balance));
		u.collections = Collections.singletonList(m("month", "2026-05", "service", "Property Tax", "receipts", 10L, "amount", collected, "online_amount", collected / 2));
		u.prevCollections = Collections.singletonList(m("service", "Property Tax", "receipts", 8L, "amount", prev, "online_amount", 0.0));
		u.reconciliation = m("unreconciled", unreconciled, "last_receipt", last);
		u.schemes = Collections.singletonList(m("scheme", "AMRUT", "fund", "Capital", "received", 100e7, "utilised", 40e7));
		return u;
	}

	@Test
	@SuppressWarnings("unchecked")
	void rollsUpInCrore() {
		LocalDateTime now = LocalDateTime.of(2026, 7, 10, 10, 0);
		List<UlbData> ulbs = Arrays.asList(
				ulb("Shimla", 50e7, 20e7, 10e7, 5, Timestamp.valueOf(now.minusHours(3))),
				ulb("Solan", 30e7, 10e7, 10e7, 50, null));
		Map<String, Object> out = Aggregator.aggregate(ulbs, 3, 2026, now);

		Map<String, Object> kpis = (Map<String, Object>) ((Map<String, Object>) out.get("overview")).get("kpis");
		assertEquals(80.0, kpis.get("bankBalance"));
		assertEquals(30.0, kpis.get("collections"));
		assertEquals(50.0, kpis.get("collectionsDeltaPct"));
		assertEquals(2, kpis.get("ulbsReporting"));
		assertEquals(3, kpis.get("ulbsTotal"));
		assertEquals(4, kpis.get("bankAccounts"));

		List<Map<String, Object>> monthly = (List<Map<String, Object>>) ((Map<String, Object>) out.get("overview")).get("monthly");
		assertEquals(4, monthly.size()); // Apr..Jul
		assertEquals("May", monthly.get(1).get("month"));
		assertEquals(30.0, monthly.get(1).get("amount"));

		List<Map<String, Object>> rows = (List<Map<String, Object>>) ((Map<String, Object>) out.get("overview")).get("ulbs");
		assertEquals(0, rows.get(0).get("lastSyncDays"));
		assertEquals(null, rows.get(1).get("lastSyncDays"));

		Map<String, Object> scheme = ((List<Map<String, Object>>) ((Map<String, Object>) out.get("schemes")).get("bySchemes")).get(0);
		assertEquals(200.0, scheme.get("received"));
		assertEquals(80.0, scheme.get("utilised"));
		assertEquals(null, scheme.get("allocated"));

		List<Map<String, Object>> types = (List<Map<String, Object>>) ((Map<String, Object>) out.get("banks")).get("byType");
		assertEquals("Savings", types.get(0).get("type"));
	}

	@Test
	void parsesFinancialYear() {
		assertEquals(2026, FinanceSummaryService.parseStartYear("2026-27"));
		assertEquals(1999, FinanceSummaryService.parseStartYear("1999-00"));
		assertThrows(IllegalArgumentException.class, () -> FinanceSummaryService.parseStartYear("2026-28"));
		assertThrows(IllegalArgumentException.class, () -> FinanceSummaryService.parseStartYear("x"));
		assertTrue(FinanceSummaryService.currentFinancialYear().matches("\\d{4}-\\d{2}"));
	}
}
