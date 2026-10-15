/*
 *    eGov  SmartCity eGovernance suite aims to improve the internal efficiency,transparency,
 *    accountability and the service delivery of the government  organizations.
 *
 *     Copyright (C) 2017  eGovernments Foundation
 *
 *     The updated version of eGov suite of products as by eGovernments Foundation
 *     is available at http://www.egovernments.org
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program. If not, see http://www.gnu.org/licenses/ or
 *     http://www.gnu.org/licenses/gpl.html .
 *
 *     In addition to the terms of the GPL license to be adhered to in using this
 *     program, the following additional terms are to be complied with:
 *
 *         1) All versions of this program, verbatim or modified must carry this
 *            Legal Notice.
 *            Further, all user interfaces, including but not limited to citizen facing interfaces,
 *            Urban Local Bodies interfaces, dashboards, mobile applications, of the program and any
 *            derived works should carry eGovernments Foundation logo on the top right corner.
 *
 *            For the logo, please refer http://egovernments.org/html/logo/egov_logo.png.
 *            For any further queries on attribution, including queries on brand guidelines,
 *            please contact contact@egovernments.org
 *
 *         2) Any misrepresentation of the origin of the material is prohibited. It
 *            is required that all modified versions of this material be marked in
 *            reasonable ways as different from the original version.
 *
 *         3) This license does not grant any rights to any user of the program
 *            with regards to rights under trademark law for use of the trade names
 *            or trademarks of eGovernments Foundation.
 *
 *   In case of any queries, you can reach eGovernments Foundation at contact@egovernments.org.
 *
 */
package org.egov.infra.microservice.models;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;

import org.apache.commons.collections.CollectionUtils;
import org.egov.infra.validation.SanitizeHtml;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BillV2 {

    @SanitizeHtml
    @JsonProperty("id")
    private String id;

    @SanitizeHtml
    @JsonProperty("userId")
    private String userId;

    @SanitizeHtml
    @JsonProperty("mobileNumber")
    private String mobileNumber;

    @SanitizeHtml
    @JsonProperty("paidBy")
    private String paidBy;

    @SanitizeHtml
    @JsonProperty("payerName")
    private String payerName;

    @SanitizeHtml
    @JsonProperty("payerAddress")
    private String payerAddress;

    @SanitizeHtml
    @JsonProperty("payerEmail")
    private String payerEmail;

    @SanitizeHtml
    @JsonProperty("payerId")
    private String payerId;

    @JsonProperty("status")
    private StatusEnum status;

    @SanitizeHtml
    @JsonProperty("reasonForCancellation")
    private String reasonForCancellation;

    @JsonProperty("isCancelled")
    private Boolean isCancelled;

    @JsonProperty("additionalDetails")
    private JsonNode additionalDetails;

    @JsonProperty("billDetails")
    @Valid
    private List<BillDetailV2> billDetails;

    @SanitizeHtml
    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

    @JsonProperty("collectionModesNotAllowed")
    private List<String> collectionModesNotAllowed;

    @JsonProperty("partPaymentAllowed")
    private Boolean partPaymentAllowed;

    @JsonProperty("isAdvanceAllowed")
    private Boolean isAdvanceAllowed;

    @JsonProperty("minimumAmountToBePaid")
    private BigDecimal minimumAmountToBePaid;

    @JsonProperty("businessService")
    private String businessService;

    @JsonProperty("totalAmount")
    private BigDecimal totalAmount;

    @SanitizeHtml
    @JsonProperty("consumerCode")
    private String consumerCode;

    @SanitizeHtml
    @JsonProperty("billNumber")
    private String billNumber;

    @JsonProperty("billDate")
    private Long billDate;

    @JsonProperty("amountPaid")
    private BigDecimal amountPaid;

    @SanitizeHtml
    @JsonProperty("fileStoreId")
    private String fileStoreId;

    public enum StatusEnum {
        ACTIVE("ACTIVE"),
        CANCELLED("CANCELLED"),
        PAID("PAID"),
        EXPIRED("EXPIRED");

        private String value;

        StatusEnum(String value) {
            this.value = value;
        }

        @Override
        @JsonValue
        public String toString() {
            return String.valueOf(value);
        }

        public static boolean contains(String test) {
            for (StatusEnum val : StatusEnum.values()) {
                if (val.name().equalsIgnoreCase(test)) {
                    return true;
                }
            }
            return false;
        }

        @JsonCreator
        public static StatusEnum fromValue(String text) {
            for (StatusEnum b : StatusEnum.values()) {
                if (String.valueOf(b.value).equals(text)) {
                    return b;
                }
            }
            return null;
        }
    }

    public Boolean addBillDetail(BillDetailV2 billDetail) {
        if (CollectionUtils.isEmpty(billDetails)) {
            billDetails = new ArrayList<>();
            return billDetails.add(billDetail);
        } else {
            if (!billDetails.contains(billDetail))
                return billDetails.add(billDetail);
            else
                return false;
        }
    }
}