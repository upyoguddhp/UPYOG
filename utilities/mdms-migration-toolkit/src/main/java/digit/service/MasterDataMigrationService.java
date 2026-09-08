package digit.service;

import static digit.constants.ErrorCodes.MASTER_DATA_MIGRATION_ERROR_CODE;
import static digit.constants.ErrorCodes.MASTER_DATA_MIGRATION_TENANTID_DOES_NOT_EXIST_ERROR_MESSAGE;
import static digit.constants.MDMSMigrationToolkitConstants.DOT_SEPARATOR;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.validation.Valid;

import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import digit.models.coremodels.AuditDetails;
import digit.util.FileReader;
import digit.web.models.MasterDataMigrationRequest;
import digit.web.models.Mdms;
import digit.web.models.MdmsRequest;
import net.minidev.json.JSONArray;

@Service
@Slf4j
public class MasterDataMigrationService {

    @Autowired
    private FileReader fileReader;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${master.schema.files.dir}")
    public String schemaFilesDirectory;

    /**
     * This methods accepts master data migration request and triggers
     * creation of MDMS objects
     * @param masterDataMigrationRequest
     */
    public void migrateMasterData(@Valid MasterDataMigrationRequest masterDataMigrationRequest) {

        // Get Master Data map
        Map<String, Map<String, Map<String, JSONArray>>> tenantMap = MDMSApplicationRunnerImpl.getTenantMap();

        // Get tenantId from request
        String tenantId = masterDataMigrationRequest.getMasterDataMigrationCriteria().getTenantId();

        // Build audit details for mdms objects creation
        RequestInfo requestInfo = masterDataMigrationRequest.getRequestInfo();
        String userUuid = (requestInfo != null && requestInfo.getUserInfo() != null)
                ? requestInfo.getUserInfo().getUuid() : "mdms-migration-toolkit";
        long now = System.currentTimeMillis();
        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy(userUuid)
                .lastModifiedBy(userUuid)
                .createdTime(now)
                .lastModifiedTime(now)
                .build();

        List<Mdms> masterDataList = new ArrayList<>();
        int[] successCount = {0};
        int[] failureCount = {0};
        java.util.Set<String> failedSchemaCodes = new java.util.TreeSet<>();

        // Check if master data is present for the incoming tenantId.
        if (tenantMap.containsKey(tenantId)) {
            tenantMap.get(tenantId).keySet().forEach(module -> {
                tenantMap.get(tenantId).get(module).keySet().forEach(master -> {

                    // Get master data array for current module and master
                    JSONArray masterDataJsonArray = MDMSApplicationRunnerImpl
                            .getTenantMap()
                            .get(tenantId)
                            .get(module)
                            .get(master);

                    // Build MDMS objects
                    masterDataJsonArray.forEach(masterDatum -> {
                        // Convert JSONArray member to JsonNode
                        JsonNode masterDatumJsonNode = objectMapper.valueToTree(masterDatum);

                        // Build MDMS objects
                        Mdms mdms = Mdms.builder()
                                .schemaCode(module + DOT_SEPARATOR + master)
                                .data(masterDatumJsonNode)
                                .isActive(Boolean.TRUE)
                                .tenantId(tenantId)
                                .uniqueIdentifier(UUID.randomUUID().toString())
                                .auditDetails(auditDetails)
                                .build();

                        MdmsRequest mdmsRequest = MdmsRequest.builder()
                                .mdms(mdms)
                                .requestInfo(requestInfo)
                                .build();

                        // HP's mdms-v2 runs on 9080 (not the hardcoded 8094, which is egov-mdms-service's port).
                        // Wrapped in try/catch: one bad record (e.g. missing schema) must not abort the
                        // whole tenant's migration - collect failures and keep going.
                        try {
                            restTemplate.postForObject("http://localhost:9080/mdms-v2/v2/_create/" + mdmsRequest.getMdms().getSchemaCode(), mdmsRequest, Map.class);
                            successCount[0]++;
                        } catch (HttpStatusCodeException e) {
                            failureCount[0]++;
                            failedSchemaCodes.add(mdmsRequest.getMdms().getSchemaCode());
                            log.error("Failed to migrate record for tenantId={} schemaCode={}: {}",
                                    tenantId, mdmsRequest.getMdms().getSchemaCode(), e.getResponseBodyAsString());
                        }
                    });
                });
            });
            log.info("Migration summary for tenantId={}: {} succeeded, {} failed. Failed schema codes: {}",
                    tenantId, successCount[0], failureCount[0], failedSchemaCodes);
        } else {
            throw new CustomException(MASTER_DATA_MIGRATION_ERROR_CODE, MASTER_DATA_MIGRATION_TENANTID_DOES_NOT_EXIST_ERROR_MESSAGE + masterDataMigrationRequest.getMasterDataMigrationCriteria().getTenantId());
        }

    }

}
