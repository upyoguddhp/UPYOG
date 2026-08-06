package org.egov.user.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.user.domain.model.UserCsc;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class UserCscRowMapper implements RowMapper<UserCsc> {
    @Override
    public UserCsc mapRow(ResultSet rs, int rowNum) throws SQLException {
        return UserCsc.builder()
                .id(rs.getLong("id"))
                .cscId(rs.getString("csc_id"))
                .userUuid(rs.getString("user_uuid"))
                .owner(rs.getString("owner"))
                .vleCheck(rs.getString("vle_check"))
                .stateCode(rs.getString("state_code"))
                .activeStatus(rs.getString("active_status"))
                .userType(rs.getString("user_type"))
                .lastActive(rs.getString("last_active"))
                .lgStateCode(rs.getString("lg_state_code"))
                .lgDistrictCode(rs.getString("lg_district_code"))
                .rap(rs.getString("rap"))
                .pos(rs.getString("pos"))
                .pager(rs.getString("pager"))
                .address(rs.getString("address"))
                .build();
    }
}
