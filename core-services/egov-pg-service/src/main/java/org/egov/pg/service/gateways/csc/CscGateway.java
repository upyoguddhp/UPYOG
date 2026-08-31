package org.egov.pg.service.gateways.csc;

import java.math.BigDecimal;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

import org.apache.commons.lang3.StringUtils;
import org.egov.pg.models.Transaction;
import org.egov.pg.models.TransferWrapper;
import org.egov.pg.service.Gateway;
import org.egov.tracer.model.CustomException;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Payment gateway used when a payment is collected by a CSC operator.
 *
 * <p>Creation only creates the eGov transaction in PENDING state. Once CSC has
 * collected the payment, the regular transaction update API is called with the
 * eGov transaction id and the payment result.</p>
 */
@Component
public class CscGateway implements Gateway {

    private static final String GATEWAY_NAME = "CSC";
    private static final String TXN_ID = "txn_id";
    private static final String TXN_STATUS = "txn_status";
    private static final String TXN_AMOUNT = "txn_amount";
    private static final String GATEWAY_TXN_ID = "gateway_txn_id";

    private final boolean active;

    public CscGateway(Environment environment) {
        this.active = Boolean.parseBoolean(environment.getProperty("csc.active", "true"));
    }

    @Override
    public URI generateRedirectURI(Transaction transaction) {
        // CSC has no external redirect/order creation step. TransactionService
        // persists the generated eGov txnId with PENDING status.
        return URI.create(StringUtils.EMPTY);
    }

    @Override
    public Transaction fetchStatus(Transaction currentStatus, Map<String, String> params) {
        Map<String, String> values = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        values.putAll(params);

        String statusValue = firstNonBlank(values, TXN_STATUS, "status", "payment_status");
        if (StringUtils.isBlank(statusValue)) {
            throw new CustomException("MISSING_CSC_TXN_STATUS",
                    "txn_status is mandatory for a CSC transaction update");
        }

        Transaction.TxnStatusEnum status = Transaction.TxnStatusEnum.fromValue(statusValue.toUpperCase());
        if (status == null) {
            throw new CustomException("INVALID_CSC_TXN_STATUS",
                    "txn_status must be SUCCESS, FAILURE or PENDING");
        }

        String amount = firstNonBlank(values, TXN_AMOUNT, "amount", "txnAmount");
        if (StringUtils.isBlank(amount)) {
            amount = currentStatus.getTxnAmount();
        } else {
            validateAmount(amount);
        }

        String gatewayTxnId = firstNonBlank(values, GATEWAY_TXN_ID, "csc_txn_id", "gatewayTxnId");
        if (StringUtils.isBlank(gatewayTxnId)) {
            gatewayTxnId = values.get(TXN_ID);
        }

        return Transaction.builder()
                .txnId(currentStatus.getTxnId())
                .txnAmount(amount)
                .txnStatus(status)
                .gatewayTxnId(gatewayTxnId)
                .gatewayPaymentMode(GATEWAY_NAME)
                .gatewayStatusCode(status.toString())
                .gatewayStatusMsg(firstNonBlank(values, "status_message", "status_msg", "message"))
                .responseJson(new LinkedHashMap<>(params))
                .build();
    }

    private void validateAmount(String amount) {
        try {
            if (new BigDecimal(amount).compareTo(BigDecimal.ZERO) < 0) {
                throw new NumberFormatException("negative amount");
            }
        } catch (NumberFormatException exception) {
            throw new CustomException("INVALID_CSC_TXN_AMOUNT", "txn_amount must be a valid non-negative amount");
        }
    }

    private String firstNonBlank(Map<String, String> values, String... keys) {
        for (String key : keys) {
            String value = values.get(key);
            if (StringUtils.isNotBlank(value)) {
                return value;
            }
        }
        return null;
    }

    @Override
    public boolean isActive() {
        return active;
    }

    @Override
    public String gatewayName() {
        return GATEWAY_NAME;
    }

    @Override
    public String transactionIdKeyInResponse() {
        return TXN_ID;
    }

    @Override
    public String generateRedirectFormData(Transaction transaction) {
        return null;
    }

    @Override
    public Object transferAmount(TransferWrapper transferWrapper) {
        throw new CustomException("CSC_TRANSFER_NOT_SUPPORTED", "CSC does not support payment transfers");
    }

    @Override
    public Object getSettlementStatus(String gatewayTxnId) {
        throw new CustomException("CSC_SETTLEMENT_NOT_SUPPORTED", "CSC does not support settlement lookup");
    }
}
