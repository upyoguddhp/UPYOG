package digit.service;

import static digit.constants.MDMSMigrationToolkitConstants.DOT_SEPARATOR;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saasquatch.jsonschemainferrer.*;

import digit.repository.ServiceRequestRepository;
import digit.util.FileReader;
import digit.util.FileWriter;
import digit.web.models.SchemaDefinition;
import digit.web.models.SchemaDefinitionRequest;
import digit.web.models.SchemaMigrationRequest;
import net.minidev.json.JSONArray;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SchemaDefinitionMigrationService {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FileWriter fileWriter;

    @Autowired
    private FileReader fileReader;

    @Autowired
    private JsonSchemaInferrer inferrer;

    @Value("${master.schema.files.dir}")
    public String schemaFilesDirectory;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    private Map<String, JsonNode> schemaCodeToSchemaJsonMap;

    public void beginMigration(SchemaMigrationRequest schemaMigrationRequest) {
        // Fetch schema code to schema definition map
        Map<String, JsonNode> schemaCodeVsSchemaDefinitionMap = fileReader.readFiles(schemaFilesDirectory);

        List<SchemaDefinition> schemaDefinitionPOJOs = new ArrayList<>();

        // Go through each schemas and generate SchemaDefinition DTOs
        schemaCodeVsSchemaDefinitionMap.keySet().forEach(schemaCode -> {
            SchemaDefinition schemaDefinition = SchemaDefinition.builder()
                    .tenantId(schemaMigrationRequest.getSchemaMigrationCriteria().getTenantId())
                    .isActive(Boolean.TRUE)
                    .code(schemaCode)
                    .definition(schemaCodeVsSchemaDefinitionMap.get(schemaCode))
                    .id(UUID.randomUUID().toString())
                    .build();
            schemaDefinitionPOJOs.add(schemaDefinition);
        });

        int[] successCount = {0};
        java.util.Map<String, String> failures = new java.util.TreeMap<>();
        schemaDefinitionPOJOs.forEach(schemaDefinition -> {
            SchemaDefinitionRequest schemaDefinitionRequest = SchemaDefinitionRequest.builder()
                    .requestInfo(schemaMigrationRequest.getRequestInfo())
                    .schemaDefinition(schemaDefinition)
                    .build();

            // Send it to kafka/make API calls to MDMS service schema APIs
            // HP's mdms-v2 runs on 9080 (not the hardcoded 8094, which is egov-mdms-service's port).
            // Wrapped in try/catch: a schema that already exists for this tenant (DUPLICATE_SCHEMA_CODE)
            // or fails validation must not abort every other schema in this batch.
            try {
                serviceRequestRepository.fetchResult(new StringBuilder("http://localhost:9080/mdms-v2/schema/v1/_create"), schemaDefinitionRequest);
                successCount[0]++;
            } catch (org.egov.tracer.model.ServiceCallException e) {
                failures.put(schemaDefinition.getCode(), e.getError());
            } catch (Exception e) {
                failures.put(schemaDefinition.getCode(), String.valueOf(e.getMessage()));
            }
        });
        log.info("Schema migration summary for tenantId={}: {} succeeded, {} failed. Failures: {}",
                schemaMigrationRequest.getSchemaMigrationCriteria().getTenantId(), successCount[0], failures.size(), failures);
    }


    public void generateSchemaDefinition() {
        Map<String, Map<String, Map<String, JSONArray>>> tenantMap = MDMSApplicationRunnerImpl.getTenantMap();

        schemaCodeToSchemaJsonMap = new HashMap<>();

        // Traverse tenantMap across the tenants, modules and masters to generate schema for each master
        tenantMap.keySet().forEach(tenantId -> {
            tenantMap.get(tenantId).keySet().forEach(module -> {
                tenantMap.get(tenantId).get(module).keySet().forEach(master -> {
                    JSONArray masterDataJsonArray = MDMSApplicationRunnerImpl
                            .getTenantMap()
                            .get(tenantId)
                            .get(module)
                            .get(master);

                    if (!masterDataJsonArray.isEmpty()) {
                        // Convert master data to JsonNode
                        JsonNode jsonNode = objectMapper.convertValue(masterDataJsonArray.get(0), JsonNode.class);

                        // Feed the converted master data to jsonSchemaInferrer for generating schema
                        JsonNode schemaNode = inferrer.inferForSample(jsonNode);

                        // mdms-v2's SchemaDefinitionValidator requires a non-empty "x-unique" array
                        // that is a subset of "required" - the inferrer only produces "required".
                        // No safe way to auto-pick which fields should uniquely identify a record for
                        // an arbitrary master, so default x-unique to the full required list (satisfies
                        // validation; can be hand-tightened later for masters that need a narrower key).
                        if (schemaNode.isObject() && schemaNode.has("required")) {
                            ((com.fasterxml.jackson.databind.node.ObjectNode) schemaNode)
                                    .set("x-unique", schemaNode.get("required").deepCopy());
                        }

                        // Populate schemaCodeToSchemaJsonMap
                        schemaCodeToSchemaJsonMap.put(module + DOT_SEPARATOR + master, schemaNode);

                        // Write generated schema definition to files with the name in module.master format
                        fileWriter.writeJsonToFile(schemaNode, module + DOT_SEPARATOR + master);
                    }

                });
            });
        });
    }
}
