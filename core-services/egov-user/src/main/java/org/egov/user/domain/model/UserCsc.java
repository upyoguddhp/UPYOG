package org.egov.user.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCsc {
    private Long id;
    private String cscId;
    private String userUuid;
    private String owner;
    private String vleCheck;
    private String stateCode;
    private String activeStatus;
    private String userType;
    private String lastActive;
    private String lgStateCode;
    private String lgDistrictCode;
    private String rap;
    private String pos;
    private String pager;
    private String address;
    private AuditDetails auditDetails;
}
