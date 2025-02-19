package org.egov.garbageservice.repository;

import org.egov.garbageservice.model.GrbgCollectionStaff;
import org.egov.garbageservice.repository.builder.GrbgCollectionStaffQueryBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GrbgCollectionStaffRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private GrbgCollectionStaffQueryBuilder queryBuilder;

    public void create(GrbgCollectionStaff grbgCollectionStaff) {
        jdbcTemplate.update(queryBuilder.CREATE_QUERY,
                grbgCollectionStaff.getUuid(),
                grbgCollectionStaff.getGrbgCollectionUnitUuid(),
                grbgCollectionStaff.getEmployeeId(),
                grbgCollectionStaff.getRole(),
                grbgCollectionStaff.getIsActive());
    }

    public void update(GrbgCollectionStaff grbgCollectionStaff) {
        jdbcTemplate.update(queryBuilder.UPDATE_QUERY,
                grbgCollectionStaff.getGrbgCollectionUnitUuid(),
                grbgCollectionStaff.getEmployeeId(),
                grbgCollectionStaff.getRole(),
                grbgCollectionStaff.getIsActive(),
                grbgCollectionStaff.getUuid());
    }
}
