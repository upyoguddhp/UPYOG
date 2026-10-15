package org.egov.infra.mdms.service;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.infra.mdms.model.*;
import org.egov.infra.mdms.repository.MdmsDataRepository;
import org.egov.infra.mdms.service.enrichment.MdmsDataEnricher;
import org.egov.infra.mdms.service.validator.MdmsDataValidator;
import org.egov.infra.mdms.utils.FallbackUtil;
import org.egov.infra.mdms.utils.SchemaUtil;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
public class MDMSServiceV2 {

    private MdmsDataValidator mdmsDataValidator;
    private MdmsDataEnricher mdmsDataEnricher;
    private MdmsDataRepository mdmsDataRepository;
    private SchemaUtil schemaUtil;
    private MultiStateInstanceUtil multiStateInstanceUtil;

    @Autowired
    public MDMSServiceV2(
            MdmsDataValidator mdmsDataValidator,
            MdmsDataEnricher mdmsDataEnricher,
            MdmsDataRepository mdmsDataRepository,
            SchemaUtil schemaUtil,
            MultiStateInstanceUtil multiStateInstanceUtil) {

        this.mdmsDataValidator = mdmsDataValidator;
        this.mdmsDataEnricher = mdmsDataEnricher;
        this.mdmsDataRepository = mdmsDataRepository;
        this.schemaUtil = schemaUtil;
        this.multiStateInstanceUtil = multiStateInstanceUtil;
    }

    /**
     * Processes requests for master data creation.
     */
    public List<Mdms> create(MdmsRequest mdmsRequest) {

        // Fetch the schema against which data is being created.
        JSONObject schemaObject = schemaUtil.getSchema(mdmsRequest);

        // Validate the incoming request.
        mdmsDataValidator.validateCreateRequest(
                mdmsRequest, schemaObject);

        // Enrich the master data.
        mdmsDataEnricher.enrichCreateRequest(
                mdmsRequest, schemaObject);

        // Mark the operation for audit tracking.
        mdmsRequest.getMdms()
                .setOperation(Operation.CREATE.name());

        // Publish the create event.
        mdmsDataRepository.create(mdmsRequest);

        return Arrays.asList(mdmsRequest.getMdms());
    }

    /**
     * Processes master data search requests.
     */
    public List<Mdms> search(MdmsCriteriaReqV2 mdmsCriteriaReqV2) {

        /*
         * Search the requested tenant and its fallback tenants.
         */
        String tenantId = mdmsCriteriaReqV2
                .getMdmsCriteria()
                .getTenantId();

        List<Mdms> masterDataList = new ArrayList<>();

        List<String> subTenantListForFallback =
                FallbackUtil.getSubTenantListForFallBack(tenantId);

        for (String subTenantId : subTenantListForFallback) {

            mdmsCriteriaReqV2.getMdmsCriteria()
                    .setTenantId(subTenantId);

            masterDataList = mdmsDataRepository.searchV2(
                    mdmsCriteriaReqV2.getMdmsCriteria());

            if (!CollectionUtils.isEmpty(masterDataList)) {
                break;
            }
        }

        return masterDataList;
    }

    /**
     * Processes master data delete requests.
     * The persister handles audit logging and deletion.
     */
    public List<Mdms> delete(
            MdmsRequest mdmsRequest,
            String schemaCode) {

        String tenantId = multiStateInstanceUtil.getStateLevelTenant(
                mdmsRequest.getMdms().getTenantId());

        Mdms existing = mdmsDataRepository.getById(
                tenantId,
                mdmsRequest.getMdms().getId());

        if (existing == null) {
            throw new RuntimeException("Master data not found");
        }

        // Preserve the existing record details.
        mdmsRequest.getMdms()
                .setTenantId(existing.getTenantId());

        mdmsRequest.getMdms()
                .setSchemaCode(existing.getSchemaCode());

        mdmsRequest.getMdms()
                .setUniqueIdentifier(existing.getUniqueIdentifier());

        // Mark the operation for audit tracking.
        mdmsRequest.getMdms()
                .setOperation(Operation.DELETE.name());

        // Publish the delete event.
        mdmsDataRepository.delete(mdmsRequest);

        return Arrays.asList(mdmsRequest.getMdms());
    }

    /**
     * Processes master data update requests.
     */
    public List<Mdms> update(MdmsRequest mdmsRequest) {

        // Fetch the schema against which data is being updated.
        JSONObject schemaObject = schemaUtil.getSchema(mdmsRequest);

        // Validate the update request.
        mdmsDataValidator.validateUpdateRequest(
                mdmsRequest, schemaObject);

        // Enrich the update request.
        mdmsDataEnricher.enrichUpdateRequest(mdmsRequest);

        String tenantId = multiStateInstanceUtil.getStateLevelTenant(
                mdmsRequest.getMdms().getTenantId());

        // Fetch the existing master data.
        Mdms existing = mdmsDataRepository.getById(
                tenantId,
                mdmsRequest.getMdms().getId());

        if (existing == null) {
            throw new RuntimeException("Master data not found");
        }

        // Preserve existing record details.
        mdmsRequest.getMdms()
                .setTenantId(existing.getTenantId());

        mdmsRequest.getMdms()
                .setSchemaCode(existing.getSchemaCode());

        mdmsRequest.getMdms()
                .setUniqueIdentifier(existing.getUniqueIdentifier());

        // Preserve creation audit details.
        if (existing.getAuditDetails() != null
                && mdmsRequest.getMdms().getAuditDetails() != null) {

            mdmsRequest.getMdms().getAuditDetails()
                    .setCreatedBy(
                            existing.getAuditDetails().getCreatedBy());

            mdmsRequest.getMdms().getAuditDetails()
                    .setCreatedTime(
                            existing.getAuditDetails().getCreatedTime());
        }

        // Mark the operation for audit tracking.
        mdmsRequest.getMdms()
                .setOperation(Operation.UPDATE.name());

        // Publish the update event.
        mdmsDataRepository.update(mdmsRequest);

        return Arrays.asList(mdmsRequest.getMdms());
    }
}