package org.egov.pg.repository;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.egov.pg.web.models.FeePaymentTransaction;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Repository
public class FeePaymentTransactionRepository {

    private static final String SEARCH_QUERY = "SELECT * FROM eg_pg_fee_transactions WHERE 1=1";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final JdbcTemplate jdbcTemplate;

    public FeePaymentTransactionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<FeePaymentTransaction> search(String uuid, String consumerCode,
            String serviceUuid, String module) {
        StringBuilder query = new StringBuilder(SEARCH_QUERY);
        List<Object> parameters = new ArrayList<>();
        addFilter(query, parameters, "uuid", uuid);
        addFilter(query, parameters, "consumer_code", consumerCode);
        addFilter(query, parameters, "service_uuid", serviceUuid);
        addFilter(query, parameters, "module", module);
        query.append(" ORDER BY created_time DESC");
        return jdbcTemplate.query(query.toString(), parameters.toArray(), new FeePaymentRowMapper());
    }

    private void addFilter(StringBuilder query, List<Object> parameters, String column, String value) {
        if (value != null && !value.trim().isEmpty()) {
            query.append(" AND ").append(column).append(" = ?");
            parameters.add(value.trim());
        }
    }

    private static class FeePaymentRowMapper implements RowMapper<FeePaymentTransaction> {
        @Override
        public FeePaymentTransaction mapRow(ResultSet resultSet, int rowNum) throws SQLException {
            return FeePaymentTransaction.builder()
                    .uuid(resultSet.getString("uuid"))
                    .cscTxnId(resultSet.getString("gateway_txn_id"))
                    .module(resultSet.getString("module"))
                    .tenantId(resultSet.getString("tenant_id"))
                    .consumerCode(resultSet.getString("consumer_code"))
                    .merchantTxnId(resultSet.getString("order_id"))
                    .merchantId(resultSet.getString("merchant_id"))
                    .productId(resultSet.getString("product_id"))
                    .txnAmount(resultSet.getBigDecimal("txn_amount"))
                    .txnStatus(resultSet.getString("txn_status"))
                    .txnMode(resultSet.getString("txn_mode"))
                    .txnType(resultSet.getString("txn_type"))
                    .txnStatusMessage(resultSet.getString("gateway_status_msg"))
                    .responseStatus(resultSet.getString("gateway_status_code"))
                    .merchantReceiptNo(resultSet.getString("merchant_receipt_no"))
                    .ccfTds(resultSet.getBigDecimal("ccf_tds"))
                    .serviceUuid(resultSet.getString("service_uuid"))
                    .gateway(resultSet.getString("gateway"))
                    .receipt(resultSet.getString("receipt"))
                    .additionalDetails(readAdditionalDetails(resultSet.getObject("additional_details")))
                    .cscId(resultSet.getString("created_by"))
                    .createdTime(getNullableLong(resultSet, "created_time"))
                    .lastModifiedTime(getNullableLong(resultSet, "last_modified_time"))
                    .lastModifiedBy(resultSet.getString("last_modified_by"))
                    .build();
        }

        private Map<String, String> readAdditionalDetails(Object value) {
            if (value == null) return null;
            String json = value instanceof PGobject ? ((PGobject) value).getValue() : value.toString();
            try {
                return OBJECT_MAPPER.readValue(json, new TypeReference<Map<String, String>>() { });
            } catch (IOException exception) {
                throw new CustomException("FEE_PAYMENT_PARSE_FAILED", "Unable to parse additional details");
            }
        }

        private Long getNullableLong(ResultSet resultSet, String column) throws SQLException {
            long value = resultSet.getLong(column);
            return resultSet.wasNull() ? null : value;
        }
    }
}
