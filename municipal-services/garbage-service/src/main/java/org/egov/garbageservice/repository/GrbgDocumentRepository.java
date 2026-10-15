package org.egov.garbageservice.repository;

<<<<<<< HEAD
import org.egov.garbageservice.model.GrbgDocument;
=======
import org.egov.garbageservice.web.models.GrbgDocument;
>>>>>>> niua-upstream/niua-dev-2.0
import org.egov.garbageservice.repository.builder.GrbgDocumentQueryBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

<<<<<<< HEAD
=======
/**
 * Repository for persisting and updating garbage document records in the database.
 */
>>>>>>> niua-upstream/niua-dev-2.0
@Repository
public class GrbgDocumentRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private GrbgDocumentQueryBuilder queryBuilder;

<<<<<<< HEAD
    public void create(GrbgDocument grbgDocument) {
        jdbcTemplate.update(queryBuilder.CREATE_QUERY,
                grbgDocument.getUuid(),
                grbgDocument.getDocRefId(),
                grbgDocument.getDocName(),
                grbgDocument.getDocType(),
                grbgDocument.getDocCategory(),
                grbgDocument.getTblRefUuid());
    }

    public void update(GrbgDocument grbgDocument) {
        jdbcTemplate.update(queryBuilder.UPDATE_QUERY,
                grbgDocument.getDocRefId(),
                grbgDocument.getDocName(),
                grbgDocument.getDocType(),
                grbgDocument.getDocCategory(),
                grbgDocument.getTblRefUuid(),
                grbgDocument.getUuid());
    }
}
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
     * @param grbgDocument the grbgDocument parameter for this operation
     */

    public void create(GrbgDocument grbgDocument) {
        jdbcTemplate.update(queryBuilder.CREATE_QUERY,
                grbgDocument.getUuid(),
                grbgDocument.getDocumentUid(),
                grbgDocument.getFileStoreId(),
                grbgDocument.getDocumentType(),
                grbgDocument.getTblRefUuid(),
                grbgDocument.getGarbageId());
    }

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
     * @param grbgDocument the grbgDocument parameter for this operation
     */

    public void update(GrbgDocument grbgDocument) {
        jdbcTemplate.update(queryBuilder.UPDATE_QUERY,
                grbgDocument.getDocumentUid(),
                grbgDocument.getFileStoreId(),
                grbgDocument.getDocumentType(),
                grbgDocument.getTblRefUuid(),
                grbgDocument.getGarbageId(),
                grbgDocument.getUuid());
    }
}
>>>>>>> niua-upstream/niua-dev-2.0
