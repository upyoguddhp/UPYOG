package org.egov.infra.mdms.repository.impl;

import lombok.extern.slf4j.Slf4j;
import org.egov.infra.mdms.config.ApplicationConfig;
import org.egov.infra.mdms.model.SchemaDefCriteria;
import org.egov.infra.mdms.model.SchemaDefinition;
import org.egov.infra.mdms.model.SchemaDefinitionRequest;
import org.egov.infra.mdms.model.SchemaDeleteRequest;
import org.egov.infra.mdms.producer.Producer;
import org.egov.infra.mdms.repository.SchemaDefinitionRepository;
import org.egov.infra.mdms.repository.querybuilder.SchemaDefinitionQueryBuilder;
import org.egov.infra.mdms.repository.rowmapper.SchemaDefinitionRowMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@Slf4j
public class SchemaDefinitionDbRepositoryImpl
        implements SchemaDefinitionRepository {

    private Producer producer;
    private JdbcTemplate jdbcTemplate;
    private ApplicationConfig applicationConfig;
    private SchemaDefinitionQueryBuilder schemaDefinitionQueryBuilder;
    private SchemaDefinitionRowMapper rowMapper;

    @Autowired
    public SchemaDefinitionDbRepositoryImpl(
            Producer producer,
            JdbcTemplate jdbcTemplate,
            ApplicationConfig applicationConfig,
            SchemaDefinitionRowMapper rowMapper,
            SchemaDefinitionQueryBuilder schemaDefinitionQueryBuilder) {

        this.producer = producer;
        this.jdbcTemplate = jdbcTemplate;
        this.applicationConfig = applicationConfig;
        this.rowMapper = rowMapper;
        this.schemaDefinitionQueryBuilder = schemaDefinitionQueryBuilder;
    }

    /**
     * Emits schema definition create request on Kafka
     * for asynchronous persistence.
     */
    @Override
    public void create(SchemaDefinitionRequest schemaDefinitionRequest) {
        producer.push(
                applicationConfig.getSaveSchemaDefinitionTopicName(),
                schemaDefinitionRequest
        );
    }

    /**
     * Queries the database and returns schema definitions
     * matching the provided criteria.
     */
    @Override
    public List<SchemaDefinition> search(
            SchemaDefCriteria schemaDefCriteria) {

        List<Object> preparedStatementList = new ArrayList<>();

        String query = schemaDefinitionQueryBuilder.getSchemaSearchQuery(
                schemaDefCriteria,
                preparedStatementList
        );

        log.info("Schema definition search query: {}", query);

        return jdbcTemplate.query(
                query,
                preparedStatementList.toArray(),
                rowMapper
        );
    }

    /**
     * Publishes schema delete request to Kafka.
     * The persister is responsible for audit logging and deletion.
     */
    @Override
    public void delete(SchemaDeleteRequest request) {
        producer.push(
                applicationConfig.getDeleteSchemaTopicName(),
                request
        );
    }

    /**
     * Returns the count of distinct master codes for a tenant.
     */
    @Override
    public Integer getTotalMastersCount(String tenantId) {

        String query =
                "SELECT COUNT(DISTINCT split_part(code, '.', 1)) " +
                "FROM eg_mdms_schema_definition " +
                "WHERE tenantid = ?";

        return jdbcTemplate.queryForObject(
                query,
                new Object[]{tenantId},
                Integer.class
        );
    }

    /**
     * Update API has not yet been implemented.
     */
    @Override
    public void update(
            SchemaDefinitionRequest schemaDefinitionRequest) {
        // Not implemented yet.
    }
}