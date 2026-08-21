package org.egov.pg.web.models;

import java.math.BigDecimal;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FeePaymentTransaction {
    @JsonProperty("uuid") private String uuid;
    @JsonProperty("cscTxnId") private String cscTxnId;
    @JsonProperty("module") private String module;
    @JsonProperty("tenantId") private String tenantId;
    @JsonProperty("consumerCode") private String consumerCode;
    @JsonProperty("merchantTxnId") private String merchantTxnId;
    @JsonProperty("merchantId") private String merchantId;
    @JsonProperty("cscId") private String cscId;
    @JsonProperty("productId") private String productId;
    @JsonProperty("txnAmount") private BigDecimal txnAmount;
    @JsonProperty("txnStatus") private String txnStatus;
    @JsonProperty("txnStatusMessage") private String txnStatusMessage;
    @JsonProperty("responseStatus") private String responseStatus;
    @JsonProperty("txnMode") private String txnMode;
    @JsonProperty("txnType") private String txnType;
    @JsonProperty("merchantReceiptNo") private String merchantReceiptNo;
    @JsonProperty("ccfTds") private BigDecimal ccfTds;
    @JsonProperty("serviceUuid") private String serviceUuid;
    @JsonProperty("gateway") private String gateway;
    @JsonProperty("receipt") private String receipt;
    @JsonProperty("additionalDetails") private Map<String, String> additionalDetails;
    @JsonProperty("createdTime") private Long createdTime;
    @JsonProperty("lastModifiedTime") private Long lastModifiedTime;
    @JsonProperty("lastModifiedBy") private String lastModifiedBy;
}
