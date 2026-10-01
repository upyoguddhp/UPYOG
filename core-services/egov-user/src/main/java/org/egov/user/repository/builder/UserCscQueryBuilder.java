package org.egov.user.repository.builder;

import org.springframework.stereotype.Component;

@Component
public class UserCscQueryBuilder {

    public static final String SELECT_BY_CSC_ID =
            "SELECT id, csc_id, user_uuid, owner, vle_check, state_code, active_status, "
            + "user_type, last_active, lg_state_code, lg_district_code, rap, pos, pager, address "
            + "FROM ud_user_csc WHERE csc_id = :cscId";

    public static final String INSERT =
            "INSERT INTO ud_user_csc (csc_id, user_uuid, owner, vle_check, state_code, "
            + "active_status, user_type, last_active, lg_state_code, lg_district_code, rap, pos, "
            + "pager, address, createddate, createdby, lastmodifieddate, lastmodifiedby) VALUES "
            + "(:cscId, :userUuid, :owner, :vleCheck, :stateCode, :activeStatus, :userType, "
            + ":lastActive, :lgStateCode, :lgDistrictCode, :rap, :pos, :pager, :address, "
            + ":createdDate, :createdBy, :lastModifiedDate, :lastModifiedBy)";

    public static final String UPDATE =
            "UPDATE ud_user_csc SET user_uuid = :userUuid, owner = :owner, vle_check = :vleCheck, "
            + "state_code = :stateCode, active_status = :activeStatus, user_type = :userType, "
            + "last_active = :lastActive, lg_state_code = :lgStateCode, "
            + "lg_district_code = :lgDistrictCode, rap = :rap, pos = :pos, pager = :pager, "
            + "address = :address, lastmodifieddate = :lastModifiedDate, "
            + "lastmodifiedby = :lastModifiedBy WHERE csc_id = :cscId";
}
