package org.egov.pg.service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.egov.pg.config.AppProperties;
import org.egov.pg.producer.Producer;
import org.egov.pg.repository.FeePaymentTransactionRepository;
import org.egov.pg.web.models.FeePaymentCreateRequest;
import org.egov.pg.web.models.FeePaymentStatusUpdateRequest;
import org.egov.pg.web.models.FeePaymentTransaction;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

@Service
public class FeePaymentTransactionService {

    private final Producer producer;
    private final AppProperties appProperties;
    private final FeePaymentTransactionRepository repository;

    public FeePaymentTransactionService(Producer producer, AppProperties appProperties,
            FeePaymentTransactionRepository repository) {
        this.producer = producer;
        this.appProperties = appProperties;
        this.repository = repository;
    }

    public FeePaymentTransaction create(FeePaymentCreateRequest request) {
        long now = System.currentTimeMillis();
        FeePaymentTransaction transaction = FeePaymentTransaction.builder()
                .uuid(UUID.randomUUID().toString())
                .module(request.getModule().trim())
                .tenantId(request.getTenantId().trim())
                .consumerCode(request.getConsumerCode().trim())
                .txnAmount(request.getAmount())
                .serviceUuid(request.getServiceUuid())
                .txnStatus("PENDING")
                .createdTime(now)
                .lastModifiedTime(now)
                .build();
        producer.push(appProperties.getSaveFeePaymentTxnTopic(),
                Collections.singletonMap("FeePaymentTransaction", transaction));
        return transaction;
    }

    public List<FeePaymentTransaction> search(String uuid, String consumerCode,
            String serviceUuid, String module) {
        if (isBlank(uuid) && isBlank(consumerCode) && isBlank(serviceUuid) && isBlank(module)) {
            throw new CustomException("INVALID_SEARCH_CRITERIA",
                    "At least one of uuid, consumerCode, serviceUuid or module is required");
        }
        return repository.search(uuid, consumerCode, serviceUuid, module);
    }

    public FeePaymentTransaction updateStatus(FeePaymentStatusUpdateRequest request) {
  
        Map<String, String> values = parse(request.getParameters());
        FeePaymentTransaction transaction = FeePaymentTransaction.builder()
                .cscTxnId(clean(values.get("csc_txn")))
                .merchantTxnId(clean(values.get("merchant_txn")))
                .merchantId(clean(values.get("merchant_id")))
                .cscId(clean(values.get("csc_id")))
                .productId(clean(values.get("product_id")))
                .txnStatus(clean(values.get("txn_status_message")))
                .serviceUuid(clean(values.get("param_1")))
                .txnStatusMessage(clean(values.get("txn_status_message")))
                .responseStatus(clean(values.get("response_status")))
                .txnMode(clean(values.get("txn_mode")))
                .txnType(clean(values.get("txn_type")))
                .merchantReceiptNo(clean(values.get("merchant_receipt_no")))
                .ccfTds(optionalDecimal(values.get("ccf_tds"), "ccf_tds"))
                .serviceUuid(clean(values.get("param_1")))
                .gateway(clean(values.get("gateway")))
                .receipt(clean(values.get("receipt")))
                .additionalDetails(values)
                .lastModifiedTime(System.currentTimeMillis())
                .lastModifiedBy(clean(values.get("csc_id")))
                .build();
        producer.push(appProperties.getUpdateFeePaymentTxnTopic(),
                Collections.singletonMap("FeePaymentTransaction", transaction));
        return transaction;
    }

    private Map<String, String> parse(List<String> parameters) {
        Map<String, String> values = new HashMap<>();
        for (String parameter : parameters) {
            if (parameter == null || parameter.trim().isEmpty()) continue;
            int separator = parameter.indexOf('=');
            if (separator <= 0) {
                throw new CustomException("INVALID_FEE_PAYMENT_RESPONSE", "Invalid gateway parameter: " + parameter);
            }
            values.put(parameter.substring(0, separator).trim(), parameter.substring(separator + 1).trim());
        }
        return values;
    }

    private String clean(String value) {
        if (value == null || value.trim().isEmpty() || "NA".equalsIgnoreCase(value.trim())) return null;
        return value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String defaultValue(String value, String fallback) {
        return value == null ? fallback : value;
    }

    private BigDecimal optionalDecimal(String value, String field) {
        value = clean(value);
        if (value == null) return null;
        try { return new BigDecimal(value); }
        catch (NumberFormatException exception) {
            throw new CustomException("INVALID_FEE_PAYMENT_RESPONSE", "Invalid decimal value for " + field);
        }
    }

}
