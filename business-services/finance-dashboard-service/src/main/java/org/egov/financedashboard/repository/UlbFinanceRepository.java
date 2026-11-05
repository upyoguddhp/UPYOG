package org.egov.financedashboard.repository;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Read-only queries against one ULB finance schema. The schema name is never taken from a request:
 * it comes from information_schema and is additionally checked against {@link #SAFE_NAME} before being
 * placed (quoted) into SQL.
 */
@Repository
public class UlbFinanceRepository {

	private static final Pattern SAFE_NAME = Pattern.compile("^[a-z0-9_]+$");

	@Autowired
	private JdbcTemplate jdbc;

	@Value("${finance.dashboard.excluded-schemas}")
	private List<String> excludedSchemas;

	@Value("${finance.dashboard.voucher-cancelled-status:4}")
	private int voucherCancelledStatus;

	public List<String> findUlbSchemas() {
		List<String> all = jdbc.queryForList(
				"SELECT t1.table_schema FROM information_schema.tables t1 "
						+ "JOIN information_schema.tables t2 ON t2.table_schema = t1.table_schema AND t2.table_name = 'egcl_collectionheader' "
						+ "WHERE t1.table_name = 'bankaccount' ORDER BY t1.table_schema",
				String.class);
		List<String> result = new ArrayList<>();
		for (String schema : all) {
			if (!excludedSchemas.contains(schema) && SAFE_NAME.matcher(schema).matches()) {
				result.add(schema);
			}
		}
		return result;
	}

	/** Active accounts grouped by bank and account type. Balance in rupees. */
	public List<Map<String, Object>> bankBalances(String schema) {
		return jdbc.queryForList("SELECT b.name AS bank, COALESCE(ba.type, 'Others') AS type, COUNT(ba.id) AS accounts, "
				+ "COALESCE(SUM(ba.currentbalance), 0) AS balance FROM " + q(schema) + ".bankaccount ba "
				+ "JOIN " + q(schema) + ".bankbranch br ON br.id = ba.branchid JOIN " + q(schema) + ".bank b ON b.id = br.bankid "
				+ "WHERE ba.isactive = 1 GROUP BY b.name, COALESCE(ba.type, 'Others')");
	}

	public int inactiveAccounts(String schema) {
		Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM " + q(schema) + ".bankaccount WHERE isactive <> 1", Integer.class);
		return n == null ? 0 : n;
	}

	/** Non-cancelled receipts in [from, to) by month and service. Amounts in rupees. */
	public List<Map<String, Object>> collections(String schema, Timestamp from, Timestamp to) {
		return jdbc.queryForList("SELECT to_char(ch.receiptdate, 'YYYY-MM') AS month, sd.name AS service, "
				+ "COUNT(*) AS receipts, COALESCE(SUM(ch.totalamount), 0) AS amount, "
				+ "COALESCE(SUM(CASE WHEN ch.collectiontype = 'O' THEN ch.totalamount ELSE 0 END), 0) AS online_amount "
				+ "FROM " + q(schema) + ".egcl_collectionheader ch JOIN " + q(schema) + ".egcl_servicedetails sd ON sd.id = ch.servicedetails "
				+ "JOIN " + q(schema) + ".egw_status st ON st.id = ch.status "
				+ "WHERE st.code <> 'CANCELLED' AND ch.receiptdate >= ? AND ch.receiptdate < ? "
				+ "GROUP BY to_char(ch.receiptdate, 'YYYY-MM'), sd.name", from, to);
	}

	/** Receipts not yet reconciled and the date of the latest receipt, as a proxy for ULB activity. */
	public Map<String, Object> reconciliation(String schema, Timestamp from, Timestamp to) {
		return jdbc.queryForMap("SELECT COUNT(*) FILTER (WHERE ch.isreconciled IS NOT TRUE) AS unreconciled, "
				+ "MAX(ch.receiptdate) AS last_receipt FROM " + q(schema) + ".egcl_collectionheader ch "
				+ "JOIN " + q(schema) + ".egw_status st ON st.id = ch.status "
				+ "WHERE st.code <> 'CANCELLED' AND ch.receiptdate >= ? AND ch.receiptdate < ?", from, to);
	}

	/**
	 * Money received into / paid out of bank GL codes, per scheme, from non-cancelled vouchers in [from, to).
	 * Received = debits on bank accounts (money in); utilised = credits on bank accounts (money out). Rupees.
	 */
	public List<Map<String, Object>> schemeFlows(String schema, Timestamp from, Timestamp to) {
		return jdbc.queryForList("SELECT sc.name AS scheme, COALESCE(f.name, 'Unmapped') AS fund, "
				+ "COALESCE(SUM(gl.debitamount), 0) AS received, COALESCE(SUM(gl.creditamount), 0) AS utilised "
				+ "FROM " + q(schema) + ".scheme sc LEFT JOIN " + q(schema) + ".fund f ON f.id = sc.fundid "
				+ "LEFT JOIN " + q(schema) + ".vouchermis vm ON vm.schemeid = sc.id "
				+ "LEFT JOIN " + q(schema) + ".voucherheader vh ON vh.id = vm.voucherheaderid AND vh.status <> ? "
				+ "AND vh.voucherdate >= ? AND vh.voucherdate < ? "
				+ "LEFT JOIN " + q(schema) + ".generalledger gl ON gl.voucherheaderid = vh.id "
				+ "AND gl.glcodeid IN (SELECT glcodeid FROM " + q(schema) + ".bankaccount WHERE glcodeid IS NOT NULL) "
				+ "WHERE sc.isactive = true GROUP BY sc.name, COALESCE(f.name, 'Unmapped')",
				voucherCancelledStatus, from, to);
	}

	private static String q(String schema) {
		if (!SAFE_NAME.matcher(schema).matches()) {
			throw new IllegalArgumentException("Unsafe schema name");
		}
		return "\"" + schema + "\"";
	}
}
