package org.egov.garbageservice.model;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ToString
@EqualsAndHashCode(of = {"code", "tenantId"})
public class RoleV2 {
    private static final String CITIZEN = "CITIZEN";
    private String name;
    private String code;
    private String description;
    private Long createdBy;
    private Date createdDate;
    private Long lastModifiedBy;
    private Date lastModifiedDate;
    private String tenantId;

    public static RoleV2 getCitizenRole() {
        return RoleV2.builder().code(CITIZEN).build();
    }
}