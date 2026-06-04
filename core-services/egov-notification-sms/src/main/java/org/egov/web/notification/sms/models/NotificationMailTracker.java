package org.egov.web.notification.sms.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import lombok.Data;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationMailTracker {

    private String uuid;

    private BigDecimal amount;

    private String applicationNo;

    private String tenantId;

    private String service;

    private String month;

    private String year;

    private String financialYear;

    private String fromDate;

    private String toDate;

    private String createdBy;

    private Long createdTime;

    private String lastModifiedBy;

    private Long lastModifiedTime;

    private String ward;

    private String billId;

    private Object additionalDetail;

    private String ownerMobileNo;

    private String ownerName;

    private Object mailRequest;

    private Boolean status;
}
