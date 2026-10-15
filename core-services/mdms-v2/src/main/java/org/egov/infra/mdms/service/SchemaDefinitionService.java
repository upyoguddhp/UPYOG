package org.egov.infra.mdms.service;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.infra.mdms.config.ApplicationConfig;
import org.egov.infra.mdms.model.*;
import org.egov.infra.mdms.repository.SchemaDefinitionRepository;
import org.egov.infra.mdms.service.enrichment.SchemaDefinitionEnricher;
import org.egov.infra.mdms.service.validator.SchemaDefinitionValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@Builder
@Slf4j
public class SchemaDefinitionService {

    private SchemaDefinitionRepository schemaDefinitionRepository;
    private ApplicationConfig applicationConfig;
    private SchemaDefinitionEnricher schemaDefinitionEnricher;
    private SchemaDefinitionValidator schemaDefinitionValidator;
    private MultiStateInstanceUtil multiStateInstanceUtil;

    @Autowired
    public SchemaDefinitionService(
            SchemaDefinitionRepository schemaDefinitionRepository,
            ApplicationConfig applicationConfig,
            SchemaDefinitionEnricher schemaDefinitionEnricher,
            SchemaDefinitionValidator schemaDefinitionValidator,
            MultiStateInstanceUtil multiStateInstanceUtil) {

        this.schemaDefinitionRepository = schemaDefinitionRepository;
        this.applicationConfig = applicationConfig;
        this.schemaDefinitionEnricher = schemaDefinitionEnricher;
        this.schemaDefinitionValidator = schemaDefinitionValidator;
        this.multiStateInstanceUtil = multiStateInstanceUtil;
    }

    /**
     * Processes requests for schema definition creation.
     */
    public List<SchemaDefinition> create(
            SchemaDefinitionRequest schemaDefinitionRequest) {

        String tenantId = schemaDefinitionRequest
                .getSchemaDefinition()
                .getTenantId();

        // Resolve the state-level tenant.
        schemaDefinitionRequest.getSchemaDefinition()
                .setTenantId(
                        multiStateInstanceUtil.getStateLevelTenant(tenantId)
                );

        schemaDefinitionValidator.validateCreateRequest(
                schemaDefinitionRequest
        );

        schemaDefinitionEnricher.enrichCreateRequest(
                schemaDefinitionRequest
        );

        // Mark operation for audit tracking.
        schemaDefinitionRequest.getSchemaDefinition()
                .setOperation(Operation.CREATE.name());

        schemaDefinitionRepository.create(schemaDefinitionRequest);

        return Arrays.asList(
                schemaDefinitionRequest.getSchemaDefinition()
        );
    }

    /**
     * Processes schema definition delete requests.
     * The persister handles audit logging and deletion.
     */
    public List<SchemaDefinition> delete(SchemaDeleteRequest request) {

        String tenantId = multiStateInstanceUtil.getStateLevelTenant(
                request.getTenantId()
        );

        SchemaDefCriteria criteria = SchemaDefCriteria.builder()
                .tenantId(tenantId)
                .codes(Arrays.asList(request.getCode()))
                .build();

        List<SchemaDefinition> schemaDefinitions =
                schemaDefinitionRepository.search(criteria);

        if (schemaDefinitions.isEmpty()) {
            throw new RuntimeException("Schema definition not found");
        }

        // Ensure the delete request uses the resolved tenant.
        request.setTenantId(tenantId);

        // Mark operation for audit tracking.
        request.setOperation(Operation.DELETE.name());

        // Publish the delete request to Kafka.
        schemaDefinitionRepository.delete(request);

        return Arrays.asList(
                SchemaDefinition.builder()
                        .tenantId(tenantId)
                        .code(request.getCode())
                        .build()
        );
    }

    /**
     * Processes schema definition search requests.
     */
    public List<SchemaDefinition> search(
            SchemaDefSearchRequest schemaDefSearchRequest) {

        String tenantId = schemaDefSearchRequest
                .getSchemaDefCriteria()
                .getTenantId();

        // Resolve the state-level tenant.
        schemaDefSearchRequest.getSchemaDefCriteria()
                .setTenantId(
                        multiStateInstanceUtil.getStateLevelTenant(tenantId)
                );

        List<SchemaDefinition> schemaDefinitions =
                schemaDefinitionRepository.search(
                        schemaDefSearchRequest.getSchemaDefCriteria()
                );

        // Return unique module codes when requested.
        if (Boolean.TRUE.equals(
                schemaDefSearchRequest.getSchemaDefCriteria()
                        .getIsGetAllCodes())) {

            Map<String, SchemaDefinition> uniqueCodes = new TreeMap<>();

            schemaDefinitions.forEach(schemaDefinition -> {
                String code = schemaDefinition.getCode();

                if (code != null && !code.isEmpty()) {
                    String moduleName = code.split("\\.")[0];

                    if (!uniqueCodes.containsKey(moduleName)) {
                        schemaDefinition.setCode(moduleName);
                        schemaDefinition.setDefinition(null);
                        schemaDefinition.setDescription(null);
                        schemaDefinition.setAuditDetails(null);
                        schemaDefinition.setId(null);
                        schemaDefinition.setTenantId(null);
                        schemaDefinition.setIsActive(null);

                        uniqueCodes.put(moduleName, schemaDefinition);
                    }
                }
            });

            schemaDefinitions = new ArrayList<>(
                    uniqueCodes.values()
            );
        }

        return schemaDefinitions;
    }
}