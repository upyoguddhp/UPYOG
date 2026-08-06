package org.egov.user.persistence.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egov.user.domain.model.AuditDetails;
import org.egov.user.domain.model.UserCsc;
import org.egov.user.repository.builder.UserCscQueryBuilder;
import org.egov.user.repository.rowmapper.UserCscRowMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserCscRepository {

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    private UserCscRowMapper rowMapper;

    public UserCsc findByCscId(String cscId) {
        Map<String, Object> params = new HashMap<>();
        params.put("cscId", cscId);
        List<UserCsc> records = jdbcTemplate.query(
                UserCscQueryBuilder.SELECT_BY_CSC_ID, params, rowMapper);
        return records.isEmpty() ? null : records.get(0);
    }

    public void save(UserCsc userCsc) {
        UserCsc existing = findByCscId(userCsc.getCscId());
        jdbcTemplate.update(existing == null ? UserCscQueryBuilder.INSERT : UserCscQueryBuilder.UPDATE,
                parameters(userCsc));
    }

    private Map<String, Object> parameters(UserCsc value) {
        AuditDetails audit = value.getAuditDetails();
        Map<String, Object> params = new HashMap<>();
        params.put("cscId", value.getCscId());
        params.put("userUuid", value.getUserUuid());
        params.put("owner", value.getOwner());
        params.put("vleCheck", value.getVleCheck());
        params.put("stateCode", value.getStateCode());
        params.put("activeStatus", value.getActiveStatus());
        params.put("userType", value.getUserType());
        params.put("lastActive", value.getLastActive());
        params.put("lgStateCode", value.getLgStateCode());
        params.put("lgDistrictCode", value.getLgDistrictCode());
        params.put("rap", value.getRap());
        params.put("pos", value.getPos());
        params.put("pager", value.getPager());
        params.put("address", value.getAddress());
        params.put("createdDate", audit.getCreatedDate());
        params.put("createdBy", audit.getCreatedBy());
        params.put("lastModifiedDate", audit.getLastModifiedDate());
        params.put("lastModifiedBy", audit.getLastModifiedBy());
        return params;
    }
}
