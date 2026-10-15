package org.egov.garbageservice.repository;

<<<<<<< HEAD
import org.egov.garbageservice.model.GrbgOldDetails;
=======
import org.egov.garbageservice.web.models.GrbgOldDetails;
>>>>>>> niua-upstream/niua-dev-2.0
import org.egov.garbageservice.repository.builder.GrbgOldDetailsQueryBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

<<<<<<< HEAD
=======
/**
 * Repository for creating, updating, and deleting old garbage ID mapping records in the database.
 */
>>>>>>> niua-upstream/niua-dev-2.0
@Repository
public class GrbgOldDetailsRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private GrbgOldDetailsQueryBuilder queryBuilder;

<<<<<<< HEAD
=======
    /**
     * Persists a new entity record into the database.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Validates the incoming request payload and audit details.</li>
     *   <li>Constructs the parameterized SQL insert query for entity persistence.</li>
     *   <li>Executes the database insert using {@link org.springframework.jdbc.core.JdbcTemplate}.</li>
     *   <li>Returns the created entity instance with populated audit metadata.</li>
     * </ol>
     *
     * @param grbgOldDetails the grbgOldDetails parameter for this operation
     */

>>>>>>> niua-upstream/niua-dev-2.0
    public void create(GrbgOldDetails grbgOldDetails) {
        jdbcTemplate.update(queryBuilder.CREATE_QUERY,
                grbgOldDetails.getUuid(),
                grbgOldDetails.getGarbageId(),
                grbgOldDetails.getOldGarbageId());
    }

<<<<<<< HEAD
=======
    /**
     * Updates existing entity details in the persistent repository.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Extracts updated entity attributes and audit timestamps.</li>
     *   <li>Constructs the parameterized SQL update query.</li>
     *   <li>Executes the update statement against the persistent store.</li>
     *   <li>Returns the modified entity state.</li>
     * </ol>
     *
     * @param grbgOldDetails the grbgOldDetails parameter for this operation
     */

>>>>>>> niua-upstream/niua-dev-2.0
    public void update(GrbgOldDetails grbgOldDetails) {
        jdbcTemplate.update(queryBuilder.UPDATE_QUERY,
                grbgOldDetails.getGarbageId(),
                grbgOldDetails.getOldGarbageId(),
                grbgOldDetails.getUuid());
    }
<<<<<<< HEAD
=======

    /**
     * Executes the delete database operation.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Validates method parameters.</li>
     *   <li>Executes repository database operation.</li>
     *   <li>Processes and returns the resulting output.</li>
     * </ol>
     *
     * @param garbageId the garbageId parameter for this operation
     */

    public void delete(Long garbageId) {
        jdbcTemplate.update(queryBuilder.DELETE_QUERY, garbageId);
    }
>>>>>>> niua-upstream/niua-dev-2.0
}
