package org.egov.asset.repository.querybuilder;

<<<<<<< HEAD
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;

import org.egov.asset.config.AssetConfiguration;
import org.egov.asset.web.models.AssetSearchCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class AssetQueryBuilder {
	
	@Autowired
    private AssetConfiguration config;

	private static final String LEFT_OUTER_JOIN_STRING = " LEFT OUTER JOIN ";

    private static final String QUERY = "SELECT * FROM eg_asset_assetdetails asset" 
    		+ LEFT_OUTER_JOIN_STRING + "eg_asset_addressdetails address on asset.id = address.asset_id"
    		+ LEFT_OUTER_JOIN_STRING + "eg_asset_document doc on asset.id = doc.assetid"
    		+ LEFT_OUTER_JOIN_STRING + "eg_asset_assignmentdetails assign on asset.id = assign.assetid ";
    		//+ " ORDER BY eg_asset_assetdetails.createdtime DESC";

    private static final String LIMITED_DATA_QUERY = "SELECT asset.id, "
    		+ "asset.tenantid, "
=======
import org.egov.asset.config.AssetConfiguration;
import org.egov.asset.web.models.AssetSearchCriteria;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;

@Component
public class AssetQueryBuilder {

    private static final String LEFT_OUTER_JOIN_STRING = " LEFT OUTER JOIN ";
    private static final String APPLICATION_NO_IN_CLAUSE = " asset.applicationNo IN (";
    private static final String AND_CLAUSE = " AND ";

    private static final String QUERY = "SELECT asset.id, "
            + "asset.bookrefno, asset.name, asset.description, asset.classification, "
            + "asset.parentcategory, asset.category, asset.subcategory, asset.department, "
            + "asset.applicationno, asset.approvalno, asset.tenantid, asset.status, "
            + "asset.businessservice, asset.additionaldetails, asset.createdtime, "
            + "asset.lastmodifiedtime, asset.approvaldate, asset.applicationdate, "
            + "asset.accountid, asset.createdby, asset.lastmodifiedby, asset.remarks, "
            + "asset.financialyear, asset.sourceoffinance, "
            + "asset.invoicedate, asset.invoicenumber, asset.purchasedate, "
            + "asset.purchaseordernumber, asset.location, asset.purchasecost, "
            + "asset.acquisitioncost, asset.bookvalue, asset.lifeofasset, "
            + "asset.modeofpossessionoracquisition, asset.assettype, "
            + "asset.assetusage, asset.assetstatus, asset.originalbookvalue, asset.assetAssignable, "
            + "address.doorno, address.latitude, address.longitude, address.addressid, "
            + "address.addressnumber, address.type, address.addressline1, address.addressline2, "
            + "address.landmark, address.city, address.pincode, address.detail, "
            + "address.buildingname, address.street, address.locality_code, address.locality_name, "
            + "address.locality_label, address.locality_latitude, address.locality_longitude, "
            + "doc.documentid, doc.documenttype, doc.filestoreid, doc.documentuid, doc.docdetails, "
            + "assign.isassigned, assign.assignedusername, assign.employeecode, assign.designation, "
            + "assign.department, assign.assigneddate, assign.returndate, assign.assignmentId "
            + "FROM eg_asset_assetdetails asset "
            + LEFT_OUTER_JOIN_STRING + "eg_asset_addressdetails address on asset.id = address.asset_id"
            + LEFT_OUTER_JOIN_STRING + "eg_asset_document doc on asset.id = doc.assetid"
            + LEFT_OUTER_JOIN_STRING + "eg_asset_assignmentdetails assign on asset.id = assign.assetid ";

    private static final String LIMITED_DATA_QUERY = "SELECT asset.id, "
            + "asset.tenantid, "
            + "asset.bookrefno, "
>>>>>>> niua-upstream/niua-dev-2.0
            + "asset.applicationno, "
            + "asset.classification, "
            + "asset.parentcategory, "
            + "asset.category, "
            + "asset.subcategory, "
            + "asset.name, "
            + "asset.department, "
            + "asset.status, "
<<<<<<< HEAD
            + "assign.isassigned, "  
            + "assign.assignedusername, "
           + "assign.employeecode, "  
            + "assign.designation, " 
            + "assign.department, "
            + "assign.assigneddate, "
            + "assign.returndate, "
            + "assign.assignmentId "  
            + "FROM eg_asset_assetdetails asset "
            + LEFT_OUTER_JOIN_STRING + "eg_asset_assignmentdetails assign on asset.id = assign.assetid";

    
    private final String paginationWrapper = "SELECT * FROM "
            + "(SELECT *, DENSE_RANK() OVER () offset_ FROM " + "({})"
            + " result) result_offset " + "WHERE offset_ > ? AND offset_ <= ?";
    
    //private final String countWrapper = "SELECT COUNT(DISTINCT(bpa_id)) FROM ({INTERNAL_QUERY}) as asset_count";
	
    /**
     * To give the Search query based on the requirements.
     * 
     * @param criteria ASSET search criteria
     * @param preparedStmtList values to be replaced on the query
     * @return Final Search Query
     */
	public String getAssetSearchQuery(AssetSearchCriteria criteria, List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder(QUERY);
		//String query = "SELECT * FROM public.eg_asset_assetdetails ORDER BY createdtime DESC;";
		
		if (criteria.getTenantId() != null) {
            if (criteria.getTenantId().split("\\.").length == 1) {

                addClauseIfRequired(preparedStmtList, builder);
                builder.append(" asset.tenantid like ?");
                preparedStmtList.add('%' + criteria.getTenantId() + '%');
            } else {
                addClauseIfRequired(preparedStmtList, builder);
                builder.append(" asset.tenantid=? ");
                preparedStmtList.add(criteria.getTenantId());
            }
        }
		
		List<String> ids = criteria.getIds();
        if (!CollectionUtils.isEmpty(ids)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.id IN (").append(createQuery(ids)).append(")");
            addToPreparedStatement(preparedStmtList, ids);
        }
        
        String applicationNo = criteria.getApplicationNo();
        if (applicationNo != null) {
            List<String> applicationNos = Arrays.asList(applicationNo.split(","));
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.applicationNo IN (").append(createQuery(applicationNos)).append(")");
            addToPreparedStatement(preparedStmtList, applicationNos);
        }
        
        // createdby search criteria 
        List<String> createdBy = criteria.getCreatedBy();
		if (!CollectionUtils.isEmpty(createdBy)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.createdby IN (").append(createQuery(createdBy)).append(")");
            addToPreparedStatement(preparedStmtList, createdBy);
        }
		
		// Status wise search criteria 
        String status = criteria.getStatus();
        if (status != null) {
            List<String> statusList = Arrays.asList(status.split(","));
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.status IN (").append(createQuery(statusList)).append(")");
            addToPreparedStatement(preparedStmtList, statusList);
        }
        
        // ParentCategory wise search criteria 
        String assetParentCategoryList = criteria.getAssetParentCategory();
        if (assetParentCategoryList != null) {
            List<String>  assetParentCategory = Arrays.asList(assetParentCategoryList.split(","));
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" UPPER(asset.parentCategory) IN (").append(createQuery(assetParentCategory)).append(")");
            addToPreparedStatement(preparedStmtList, assetParentCategory);
        }
        
        // Classification wise search criteria 
        String classification = criteria.getAssetClassification();
        if (classification != null) {
            List<String>  classificationList = Arrays.asList(classification.split(","));
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" UPPER(asset.classification) IN (").append(createQuery(classificationList)).append(")");
            addToPreparedStatement(preparedStmtList, classificationList);
        }
		
        
		// Approval from approvaldate and to approvaldate search criteria 
		Long approvalDt = criteria.getApprovalDate();
        if (approvalDt != null) {

            Calendar approvalDate = Calendar.getInstance();
            approvalDate.setTimeInMillis(approvalDt);

            int year = approvalDate.get(Calendar.YEAR);
            int month = approvalDate.get(Calendar.MONTH);
            int day = approvalDate.get(Calendar.DATE);

            Calendar approvalStrDate = Calendar.getInstance();
            approvalStrDate.setTimeInMillis(0);
            approvalStrDate.set(year, month, day, 0, 0, 0);

            Calendar approvalEndDate = Calendar.getInstance();
            approvalEndDate.setTimeInMillis(0);
            approvalEndDate.set(year, month, day, 23, 59, 59);
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.approvalDate BETWEEN ").append(approvalStrDate.getTimeInMillis()).append(" AND ")
                    .append(approvalEndDate.getTimeInMillis());
        }
        
        // Approval from createddate and to createddate search criteria 
        if (criteria.getFromDate() != null && criteria.getToDate() != null) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.createdtime BETWEEN ").append(criteria.getFromDate()).append(" AND ")
                    .append(criteria.getToDate());
        } else if (criteria.getFromDate() != null && criteria.getToDate() == null) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.createdtime >= ").append(criteria.getFromDate());
        }
        return addPaginationWrapper(builder.toString(), preparedStmtList, criteria);
	}
	
	
    /**
     * To give the Search query based on the requirements.
     * 
     * @param criteria ASSET search criteria
     * @param preparedStmtList values to be replaced on the query
     * @return Final Search Query
     */
	public String getAssetSearchQueryForLimitedData(AssetSearchCriteria criteria, List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder(LIMITED_DATA_QUERY);
		//String query = "SELECT * FROM public.eg_asset_assetdetails ORDER BY createdtime DESC;";
		
		if (criteria.getTenantId() != null) {
            if (criteria.getTenantId().split("\\.").length == 1) {

                addClauseIfRequired(preparedStmtList, builder);
                builder.append(" asset.tenantid like ?");
                preparedStmtList.add('%' + criteria.getTenantId() + '%');
            } else {
                addClauseIfRequired(preparedStmtList, builder);
                builder.append(" asset.tenantid=? ");
                preparedStmtList.add(criteria.getTenantId());
            }
        }
		
		List<String> ids = criteria.getIds();
        if (!CollectionUtils.isEmpty(ids)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.id IN (").append(createQuery(ids)).append(")");
            addToPreparedStatement(preparedStmtList, ids);
        }
        
        String applicationNo = criteria.getApplicationNo();
        if (applicationNo != null) {
            List<String> applicationNos = Arrays.asList(applicationNo.split(","));
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.applicationNo IN (").append(createQuery(applicationNos)).append(")");
            addToPreparedStatement(preparedStmtList, applicationNos);
        }
        
        // createdby search criteria 
        List<String> createdBy = criteria.getCreatedBy();
		if (!CollectionUtils.isEmpty(createdBy)) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.createdby IN (").append(createQuery(createdBy)).append(")");
            addToPreparedStatement(preparedStmtList, createdBy);
        }
		
		// Status wise search criteria 
        String status = criteria.getStatus();
        if (status != null) {
            List<String> statusList = Arrays.asList(status.split(","));
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.status IN (").append(createQuery(statusList)).append(")");
            addToPreparedStatement(preparedStmtList, statusList);
        }
        
        // ParentCategory wise search criteria 
        String assetParentCategoryList = criteria.getAssetParentCategory();
        if (assetParentCategoryList != null) {
            List<String>  assetParentCategory = Arrays.asList(assetParentCategoryList.split(","));
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" UPPER(asset.parentCategory) IN (").append(createQuery(assetParentCategory)).append(")");
            addToPreparedStatement(preparedStmtList, assetParentCategory);
        }
        
        // Classification wise search criteria 
        String classification = criteria.getAssetClassification();
        if (classification != null) {
            List<String>  classificationList = Arrays.asList(classification.split(","));
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" UPPER(asset.classification) IN (").append(createQuery(classificationList)).append(")");
            addToPreparedStatement(preparedStmtList, classificationList);
        }
		
        
		// Approval from approvaldate and to approvaldate search criteria 
		Long approvalDt = criteria.getApprovalDate();
        if (approvalDt != null) {

            Calendar approvalDate = Calendar.getInstance();
            approvalDate.setTimeInMillis(approvalDt);

            int year = approvalDate.get(Calendar.YEAR);
            int month = approvalDate.get(Calendar.MONTH);
            int day = approvalDate.get(Calendar.DATE);

            Calendar approvalStrDate = Calendar.getInstance();
            approvalStrDate.setTimeInMillis(0);
            approvalStrDate.set(year, month, day, 0, 0, 0);

            Calendar approvalEndDate = Calendar.getInstance();
            approvalEndDate.setTimeInMillis(0);
            approvalEndDate.set(year, month, day, 23, 59, 59);
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.approvalDate BETWEEN ").append(approvalStrDate.getTimeInMillis()).append(" AND ")
                    .append(approvalEndDate.getTimeInMillis());
        }
        
        // Approval from createddate and to createddate search criteria 
        if (criteria.getFromDate() != null && criteria.getToDate() != null) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.createdtime BETWEEN ").append(criteria.getFromDate()).append(" AND ")
                    .append(criteria.getToDate());
        } else if (criteria.getFromDate() != null && criteria.getToDate() == null) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.createdtime >= ").append(criteria.getFromDate());
        }
        return addPaginationWrapper(builder.toString(), preparedStmtList, criteria);
	}
	/**
     * add if clause to the Statement if required or else AND
=======
            + "asset.assetusage, "
            + "asset.bookvalue, "
            + "asset.location, "
            + "asset.assetstatus, "
            + "asset.createdtime, "
            + "asset.assetAssignable, "
            + "asset.additionaldetails, "
            + "assign.isassigned, "
            + "assign.assignedusername, "
            + "assign.employeecode, "
            + "assign.designation, "
            + "assign.department, "
            + "assign.assigneddate, "
            + "assign.returndate, "
            + "assign.assignmentId "
            + "FROM eg_asset_assetdetails asset "
            + LEFT_OUTER_JOIN_STRING + "eg_asset_assignmentdetails assign on asset.id = assign.assetid";

    private static final String PAGINATION_WRAPPER = "SELECT * FROM "
            + "(SELECT *, DENSE_RANK() OVER (ORDER BY result.applicationno DESC) AS offset_ FROM " + "({})"
            + " result) result_offset " + "WHERE offset_ > ? AND offset_ <= ?";

    public static final String ASSIGNMENT_DETAILS = """
            SELECT
                details.assignmentid,
                details.applicationno,
                details.tenantid,
                details.assignedusername,
                details.designation,
                details.department,
                details.assigneddate,
                details.returndate,
                details.assetid,
                details.isassigned,
                details.employeecode,
                history.assignedusername,
                history.assigneddate,
                history.returndate
            FROM
                public.eg_asset_assignmentdetails details
            LEFT JOIN
                public.eg_asset_assignment_history history
            ON
                details.assetid = history.assetid
            WHERE
                details.assetid = ?
            ORDER BY
                history.assigneddate DESC
            """;

    private final AssetConfiguration config;

    public AssetQueryBuilder(AssetConfiguration config) {
        this.config = config;
    }

    /**
     * To give the Search query based on the requirements.
     *
     * @param criteria         ASSET search criteria
     * @param preparedStmtList values to be replaced on the query
     * @return Final Search Query
     */
    public String getAssetSearchQuery(AssetSearchCriteria criteria, List<Object> preparedStmtList) {
        StringBuilder builder = new StringBuilder(QUERY);
        appendCommonSearchFilters(criteria, preparedStmtList, builder);
        return addPaginationWrapper(builder.toString(), preparedStmtList, criteria);
    }

    /**
     * To give the Search query based on the requirements.
     *
     * @param criteria         ASSET search criteria
     * @param preparedStmtList values to be replaced on the query
     * @return Final Search Query
     */
    public String getAssetSearchQueryForLimitedData(AssetSearchCriteria criteria, List<Object> preparedStmtList) {
        StringBuilder builder = new StringBuilder(LIMITED_DATA_QUERY);
        appendCommonSearchFilters(criteria, preparedStmtList, builder);
        appendAcknowledgementIdsFilter(criteria, preparedStmtList, builder);
        return addPaginationWrapper(builder.toString(), preparedStmtList, criteria);
    }

    private void appendCommonSearchFilters(AssetSearchCriteria criteria, List<Object> preparedStmtList,
                                           StringBuilder builder) {
        appendTenantIdFilter(criteria, preparedStmtList, builder);
        appendIdsFilter(criteria.getIds(), preparedStmtList, builder);
        appendApplicationNoFilter(criteria.getApplicationNo(), preparedStmtList, builder);
        appendCreatedByFilter(criteria.getCreatedBy(), preparedStmtList, builder);
        appendStatusFilter(criteria.getStatus(), preparedStmtList, builder);
        appendParentCategoryFilter(criteria.getAssetParentCategory(), preparedStmtList, builder);
        appendClassificationFilter(criteria.getAssetClassification(), preparedStmtList, builder);
        appendApprovalDateFilter(criteria.getApprovalDate(), preparedStmtList, builder);
        appendCreatedTimeFilter(criteria, preparedStmtList, builder);
    }

    private void appendTenantIdFilter(AssetSearchCriteria criteria, List<Object> preparedStmtList,
                                      StringBuilder builder) {
        if (criteria.getTenantId() == null) {
            return;
        }
        addClauseIfRequired(preparedStmtList, builder);
        if (criteria.getTenantId().split("\\.").length == 1) {
            builder.append(" asset.tenantid like ?");
            preparedStmtList.add('%' + criteria.getTenantId() + '%');
        } else {
            builder.append(" asset.tenantid=? ");
            preparedStmtList.add(criteria.getTenantId());
        }
    }

    private void appendIdsFilter(List<String> ids, List<Object> preparedStmtList, StringBuilder builder) {
        if (CollectionUtils.isEmpty(ids)) {
            return;
        }
        addClauseIfRequired(preparedStmtList, builder);
        builder.append(" asset.id IN (").append(createQuery(ids)).append(")");
        addToPreparedStatement(preparedStmtList, ids);
    }

    private void appendApplicationNoFilter(String applicationNo, List<Object> preparedStmtList, StringBuilder builder) {
        if (applicationNo == null) {
            return;
        }
        List<String> applicationNos = Arrays.asList(applicationNo.split(","));
        addClauseIfRequired(preparedStmtList, builder);
        builder.append(APPLICATION_NO_IN_CLAUSE).append(createQuery(applicationNos)).append(")");
        addToPreparedStatement(preparedStmtList, applicationNos);
    }

    private void appendAcknowledgementIdsFilter(AssetSearchCriteria criteria, List<Object> preparedStmtList,
                                                StringBuilder builder) {
        List<String> acknowledgementIds = criteria.getAcknowledgementIds();
        if (CollectionUtils.isEmpty(acknowledgementIds)) {
            return;
        }
        addClauseIfRequired(preparedStmtList, builder);
        builder.append(APPLICATION_NO_IN_CLAUSE).append(createQuery(acknowledgementIds)).append(")");
        addToPreparedStatement(preparedStmtList, acknowledgementIds);
    }

    private void appendCreatedByFilter(List<String> createdBy, List<Object> preparedStmtList, StringBuilder builder) {
        if (CollectionUtils.isEmpty(createdBy)) {
            return;
        }
        addClauseIfRequired(preparedStmtList, builder);
        builder.append(" asset.createdby IN (").append(createQuery(createdBy)).append(")");
        addToPreparedStatement(preparedStmtList, createdBy);
    }

    private void appendStatusFilter(String status, List<Object> preparedStmtList, StringBuilder builder) {
        if (status == null) {
            return;
        }
        List<String> statusList = Arrays.asList(status.split(","));
        addClauseIfRequired(preparedStmtList, builder);
        builder.append(" asset.status IN (").append(createQuery(statusList)).append(")");
        addToPreparedStatement(preparedStmtList, statusList);
    }

    private void appendParentCategoryFilter(String assetParentCategoryList, List<Object> preparedStmtList,
                                            StringBuilder builder) {
        if (assetParentCategoryList == null) {
            return;
        }
        List<String> assetParentCategory = Arrays.asList(assetParentCategoryList.split(","));
        addClauseIfRequired(preparedStmtList, builder);
        builder.append(" UPPER(asset.parentCategory) IN (").append(createQuery(assetParentCategory)).append(")");
        addToPreparedStatement(preparedStmtList, assetParentCategory);
    }

    private void appendClassificationFilter(String classification, List<Object> preparedStmtList,
                                            StringBuilder builder) {
        if (classification == null) {
            return;
        }
        List<String> classificationList = Arrays.asList(classification.split(","));
        addClauseIfRequired(preparedStmtList, builder);
        builder.append(" UPPER(asset.classification) IN (").append(createQuery(classificationList)).append(")");
        addToPreparedStatement(preparedStmtList, classificationList);
    }

    private void appendApprovalDateFilter(Long approvalDt, List<Object> preparedStmtList, StringBuilder builder) {
        if (approvalDt == null) {
            return;
        }
        LocalDate approvalDate = Instant.ofEpochMilli(approvalDt).atZone(ZoneId.systemDefault()).toLocalDate();
        long approvalStart = approvalDate.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
        long approvalEnd = approvalDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli() - 1;
        addClauseIfRequired(preparedStmtList, builder);
        builder.append(" asset.approvalDate BETWEEN ").append(approvalStart).append(AND_CLAUSE)
                .append(approvalEnd);
    }

    private void appendCreatedTimeFilter(AssetSearchCriteria criteria, List<Object> preparedStmtList,
                                         StringBuilder builder) {
        if (criteria.getFromDate() != null && criteria.getToDate() != null) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.createdtime BETWEEN ").append(criteria.getFromDate()).append(AND_CLAUSE)
                    .append(criteria.getToDate());
        } else if (criteria.getFromDate() != null) {
            addClauseIfRequired(preparedStmtList, builder);
            builder.append(" asset.createdtime >= ").append(criteria.getFromDate());
        }
    }

    /**
     * add if clause to the Statement if required or else AND
     *
>>>>>>> niua-upstream/niua-dev-2.0
     * @param values
     * @param queryString
     */
    private void addClauseIfRequired(List<Object> values, StringBuilder queryString) {
        if (values.isEmpty())
            queryString.append(" WHERE ");
        else {
            queryString.append(" AND");
        }
    }
<<<<<<< HEAD
    
    /**
     * add values to the preparedStatment List
=======

    /**
     * add values to the preparedStatment List
     *
>>>>>>> niua-upstream/niua-dev-2.0
     * @param preparedStmtList
     * @param ids
     */
    private void addToPreparedStatement(List<Object> preparedStmtList, List<String> ids) {
<<<<<<< HEAD
        ids.forEach(id -> {
            preparedStmtList.add(id);
        });
    }
    
    /**
     * produce a query input for the multiple values
=======
        ids.forEach(preparedStmtList::add);
    }

    /**
     * produce a query input for the multiple values
     *
>>>>>>> niua-upstream/niua-dev-2.0
     * @param ids
     * @return
     */
    private Object createQuery(List<String> ids) {
        StringBuilder builder = new StringBuilder();
        int length = ids.size();
        for (int i = 0; i < length; i++) {
            builder.append(" ?");
            if (i != length - 1)
                builder.append(",");
        }
        return builder.toString();
    }
<<<<<<< HEAD
    
    /**
     * 
     * @param query prepared Query
     * @param preparedStmtList values to be replased on the query
     * @param criteria bpa search criteria
=======

    /**
     * @param query            prepared Query
     * @param preparedStmtList values to be replased on the query
     * @param criteria         bpa search criteria
>>>>>>> niua-upstream/niua-dev-2.0
     * @return the query by replacing the placeholders with preparedStmtList
     */
    private String addPaginationWrapper(String query, List<Object> preparedStmtList, AssetSearchCriteria criteria) {

        int limit = config.getDefaultLimit();
        int offset = config.getDefaultOffset();
<<<<<<< HEAD
        String finalQuery = paginationWrapper.replace("{}", query);

        if(criteria.getLimit() == null && criteria.getOffset() == null) {
        	limit = config.getMaxSearchLimit();
        } 
        
=======
        String finalQuery = PAGINATION_WRAPPER.replace("{}", query);

        if (criteria.getLimit() == null && criteria.getOffset() == null) {
            limit = config.getMaxSearchLimit();
        }

>>>>>>> niua-upstream/niua-dev-2.0
        if (criteria.getLimit() != null && criteria.getLimit() <= config.getMaxSearchLimit())
            limit = criteria.getLimit();

        if (criteria.getLimit() != null && criteria.getLimit() > config.getMaxSearchLimit()) {
            limit = config.getMaxSearchLimit();
        }

        if (criteria.getOffset() != null)
            offset = criteria.getOffset();

        if (limit == -1) {
            finalQuery = finalQuery.replace("WHERE offset_ > ? AND offset_ <= ?", "");
        } else {
            preparedStmtList.add(offset);
            preparedStmtList.add(limit + offset);
        }

        return finalQuery;

    }

}
