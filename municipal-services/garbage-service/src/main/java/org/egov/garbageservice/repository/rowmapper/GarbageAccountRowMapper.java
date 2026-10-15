package org.egov.garbageservice.repository.rowmapper;

<<<<<<< HEAD
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.egov.garbageservice.model.AuditDetails;
import org.egov.garbageservice.model.GarbageAccount;
import org.egov.garbageservice.model.GarbageBill;
import org.egov.garbageservice.model.GrbgAddress;
import org.egov.garbageservice.model.GrbgApplication;
import org.egov.garbageservice.model.GrbgCollectionUnit;
import org.egov.garbageservice.model.GrbgCommercialDetails;
import org.egov.garbageservice.model.GrbgDocument;
import org.egov.garbageservice.model.GrbgOldDetails;
import org.egov.garbageservice.service.GarbageAccountService;
=======
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.egov.garbageservice.web.models.*;
>>>>>>> niua-upstream/niua-dev-2.0
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

<<<<<<< HEAD
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class GarbageAccountRowMapper implements ResultSetExtractor<List<GarbageAccount>> {
	
	@Autowired
	private ObjectMapper objectMapper;
	
=======
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ResultSet extractor that maps SQL query results into a list of GarbageAccount domain objects, including nested addresses, units, applications, and child accounts.
 */
@Component
public class GarbageAccountRowMapper implements ResultSetExtractor<List<GarbageAccount>> {

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Maps JDBC ResultSet rows into domain model objects.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Iterates through the JDBC {@link java.sql.ResultSet}.</li>
     *   <li>Extracts column values and maps database attributes to object properties.</li>
     *   <li>Populates nested child domain models and collection attributes.</li>
     *   <li>Returns the mapped domain entity object or collection.</li>
     * </ol>
     *
     * @param rs the rs parameter for this operation
     * @return the output result of type {@link List{@code <GarbageAccount>}}
     */

>>>>>>> niua-upstream/niua-dev-2.0
    @Override
    public List<GarbageAccount> extractData(ResultSet rs) throws SQLException, DataAccessException {

        Map<Long, GarbageAccount> accountsMap = new LinkedHashMap<>();

        while (rs.next()) {

            Long accountId = rs.getLong("id");
            GarbageAccount garbageAccount = accountsMap.get(accountId);

            if (null == garbageAccount) {

                AuditDetails audit = AuditDetails.builder()
                        .createdBy(rs.getString("created_by"))
                        .createdDate(rs.getLong("created_date"))
                        .lastModifiedBy(rs.getString("last_modified_by"))
                        .lastModifiedDate(rs.getLong("last_modified_date"))
                        .build();

                garbageAccount = GarbageAccount.builder()
                        .id(rs.getLong("id"))
                        .uuid(rs.getString("uuid"))
                        .garbageId(rs.getLong("garbage_id"))
                        .propertyId(rs.getString("property_id"))
                        .type(rs.getString("type"))
                        .name(rs.getString("name"))
                        .mobileNumber(rs.getString("mobile_number"))
                        .gender(rs.getString("gender"))
                        .emailId(rs.getString("email_id"))
                        .isOwner(rs.getBoolean("is_owner"))
                        .userUuid(rs.getString("user_uuid"))
                        .declarationUuid(rs.getString("declaration_uuid"))
<<<<<<< HEAD
//                        .grbgCollectionAddressUuid(rs.getString("grbg_coll_address_uuid"))
=======
>>>>>>> niua-upstream/niua-dev-2.0
                        .status(rs.getString("status"))
                        .additionalDetail(getAdditionalDetail(rs, "additional_detail"))
                        .tenantId(rs.getString("tenant_id"))
                        .parentAccount(rs.getString("parent_account"))
                        .isActive(rs.getBoolean("is_active"))
                        .subAccountCount(rs.getLong("sub_account_count"))
                        .documents(new ArrayList<>())
<<<<<<< HEAD
                        .garbageBills(new ArrayList<>())
=======
>>>>>>> niua-upstream/niua-dev-2.0
                        .childGarbageAccounts(new ArrayList<>())
                        .grbgCollectionUnits(new ArrayList<>())
                        .addresses(new ArrayList<>())
                        .created_by(rs.getString("created_by"))
                        .auditDetails(audit)
<<<<<<< HEAD
=======
                        .businessService(rs.getString("business_service"))
                        .approvalDate(rs.getLong("approval_date"))
                        .channel(rs.getString("channel"))
                        .dueDate(rs.getDate("due_date") != null ? rs.getDate("due_date").toLocalDate() : null)
>>>>>>> niua-upstream/niua-dev-2.0
                        .build();

                accountsMap.put(accountId, garbageAccount);
            }

<<<<<<< HEAD
            
            if (null != rs.getString("app_uuid")
            		&& null == garbageAccount.getGrbgApplication()) {
                	GrbgApplication garbageApplication = populateGarbageApplication(rs, "app_");
                    garbageAccount.setGrbgApplication(garbageApplication);
            }

            if (null != rs.getString("comm_uuid")
            		&& null == garbageAccount.getGrbgCommercialDetails()) {
            	GrbgCommercialDetails garbageCommDetails = populateGrbgCommercialDetails(rs, "comm_");
                    garbageAccount.setGrbgCommercialDetails(garbageCommDetails);
            }

            if (null != rs.getString("old_dtl_uuid")
            		&& null == garbageAccount.getGrbgOldDetails()) {
            	GrbgOldDetails grbgOldDetails = populateGrbgOldDetails(rs, "old_dtl_");
                    garbageAccount.setGrbgOldDetails(grbgOldDetails);
            }
            
            
=======

            if (null != rs.getString("app_uuid")
                    && null == garbageAccount.getGrbgApplication()) {
                GrbgApplication garbageApplication = populateGarbageApplication(rs, "app_");
                garbageAccount.setGrbgApplication(garbageApplication);
                garbageAccount.setGrbgApplicationNumber(
                        null != garbageApplication.getApplicationNo() ? garbageApplication.getApplicationNo()
                                : null);
            }


            if (null != rs.getString("old_dtl_uuid")
                    && null == garbageAccount.getGrbgOldDetails()) {
                GrbgOldDetails grbgOldDetails = populateGrbgOldDetails(rs, "old_dtl_");
                garbageAccount.setGrbgOldDetails(grbgOldDetails);
            }


>>>>>>> niua-upstream/niua-dev-2.0
            if (null != rs.getString("unit_uuid")) {
                String unitUuid = rs.getString("unit_uuid");
                GrbgCollectionUnit grbgCollectionUnit = findUnitByUuid(garbageAccount.getGrbgCollectionUnits(), unitUuid);
                if (null == grbgCollectionUnit) {
<<<<<<< HEAD
                	GrbgCollectionUnit GrbgCollectionUnit1 = populateGarbageUnit(rs, "unit_");
                    garbageAccount.getGrbgCollectionUnits().add(GrbgCollectionUnit1);
                }
            }
            
            
=======
                    GrbgCollectionUnit GrbgCollectionUnit1 = populateGarbageUnit(rs, "unit_");
                    garbageAccount.getGrbgCollectionUnits().add(GrbgCollectionUnit1);
                }
            }


>>>>>>> niua-upstream/niua-dev-2.0
            if (null != rs.getString("address_uuid")) {
                String addressUuid = rs.getString("address_uuid");
                GrbgAddress grbgAddress = findAddressByUuid(garbageAccount.getAddresses(), addressUuid);
                if (null == grbgAddress) {
<<<<<<< HEAD
                	GrbgAddress grbgAddress1 = populateAddress(rs, "address_");
                    garbageAccount.getAddresses().add(grbgAddress1);
                }
            }
            
            
            if (null != rs.getString("bill_id")) {
                String billId = rs.getString("bill_id");
                GarbageBill garbageBill = findBillByUuid(garbageAccount.getGarbageBills(), billId);
                if (null == garbageBill) {
                    GarbageBill garbageBill1 = populateGarbageBill(rs, "bill_");
                    garbageAccount.getGarbageBills().add(garbageBill1);
                }
            }

            
=======
                    GrbgAddress grbgAddress1 = populateAddress(rs, "address_");
                    garbageAccount.getAddresses().add(grbgAddress1);
                }
            }


>>>>>>> niua-upstream/niua-dev-2.0
            if (null != rs.getString("doc_uuid")) {
                String docUuid = rs.getString("doc_uuid");
                GrbgDocument garbageDocument = findDocumentByUuid(garbageAccount.getDocuments(), docUuid);
                if (null == garbageDocument) {
<<<<<<< HEAD
                	GrbgDocument garbageDocument1 = populateGarbageDocument(rs, "doc_");
=======
                    GrbgDocument garbageDocument1 = populateGarbageDocument(rs, "doc_");
>>>>>>> niua-upstream/niua-dev-2.0
                    garbageAccount.getDocuments().add(garbageDocument1);
                }
            }

<<<<<<< HEAD
            
            if (StringUtils.isEmpty(garbageAccount.getParentAccount())
            		&& null != rs.getString("sub_acc_id")
            		&& !StringUtils.isEmpty(rs.getString("sub_acc_parent_account"))) {
=======
            if (hasColumn(rs, "sub_acc_id") && StringUtils.isEmpty(garbageAccount.getParentAccount())
                    && null != rs.getString("sub_acc_id")
                    && !StringUtils.isEmpty(rs.getString("sub_acc_parent_account"))) {
>>>>>>> niua-upstream/niua-dev-2.0
                Long subAccId = rs.getLong("sub_acc_id");
                GarbageAccount subGarbageAccount = findSubAccById(garbageAccount.getChildGarbageAccounts(), subAccId);
                if (null == subGarbageAccount) {
                    subGarbageAccount = populateGarbageAccount(rs, "sub_acc_");
                    garbageAccount.getChildGarbageAccounts().add(subGarbageAccount);
                }

                if (null != rs.getString("sub_app_uuid")
<<<<<<< HEAD
                		&& null == subGarbageAccount.getGrbgApplication()) {
                    	GrbgApplication subGarbageApplication = populateGarbageApplication(rs, "sub_app_");
                    	subGarbageAccount.setGrbgApplication(subGarbageApplication);
                }
                
                if (null != rs.getString("sub_comm_uuid")
                		&& null == subGarbageAccount.getGrbgCommercialDetails()) {
                	GrbgCommercialDetails garbageCommDetails = populateGrbgCommercialDetails(rs, "sub_comm_");
                	subGarbageAccount.setGrbgCommercialDetails(garbageCommDetails);
                }

                if (null != rs.getString("sub_old_dtl_uuid")
                		&& null == subGarbageAccount.getGrbgOldDetails()) {
                	GrbgOldDetails grbgOldDetails = populateGrbgOldDetails(rs, "sub_old_dtl_");
                	subGarbageAccount.setGrbgOldDetails(grbgOldDetails);
                }
                
                
=======
                        && null == subGarbageAccount.getGrbgApplication()) {
                    GrbgApplication subGarbageApplication = populateGarbageApplication(rs, "sub_app_");
                    subGarbageAccount.setGrbgApplication(subGarbageApplication);
                }


                if (null != rs.getString("sub_old_dtl_uuid")
                        && null == subGarbageAccount.getGrbgOldDetails()) {
                    GrbgOldDetails grbgOldDetails = populateGrbgOldDetails(rs, "sub_old_dtl_");
                    subGarbageAccount.setGrbgOldDetails(grbgOldDetails);
                }


>>>>>>> niua-upstream/niua-dev-2.0
                if (null != rs.getString("sub_unit_uuid")) {
                    String unitUuid = rs.getString("sub_unit_uuid");
                    GrbgCollectionUnit grbgCollectionUnit = findUnitByUuid(garbageAccount.getGrbgCollectionUnits(), unitUuid);
                    if (null == grbgCollectionUnit) {
<<<<<<< HEAD
                    	GrbgCollectionUnit GrbgCollectionUnit1 = populateGarbageUnit(rs, "sub_unit_");
                    	subGarbageAccount.getGrbgCollectionUnits().add(GrbgCollectionUnit1);
                    }
                }
                
                if (null != rs.getString("sub_doc_uuid")) {
                    String subDocUuid = rs.getString("sub_doc_uuid");
                    GrbgDocument subGarbageDocument = findDocumentByUuid(subGarbageAccount.getDocuments(), subDocUuid);
                    if (null == subGarbageDocument) {
                    	GrbgDocument subGarbageDocument1 = populateGarbageDocument(rs, "sub_doc_");
                    	subGarbageAccount.getDocuments().add(subGarbageDocument1);
                    }
                }
                
                if (null != rs.getString("sub_acc_bill_id")) {
                    String subAccBillId = rs.getString("sub_acc_bill_id");
                    GarbageBill subAccGarbageBill = findBillByUuid(subGarbageAccount.getGarbageBills(), subAccBillId);
                    if (null == subAccGarbageBill) {
                        GarbageBill subAccGarbageBill1 = populateGarbageBill(rs, "sub_acc_bill_");
                        subGarbageAccount.getGarbageBills().add(subAccGarbageBill1);
                    }
                }

                
=======
                        GrbgCollectionUnit GrbgCollectionUnit1 = populateGarbageUnit(rs, "sub_unit_");
                        subGarbageAccount.getGrbgCollectionUnits().add(GrbgCollectionUnit1);
                    }
                }


>>>>>>> niua-upstream/niua-dev-2.0
                if (null != rs.getString("sub_address_uuid")) {
                    String addressUuid = rs.getString("sub_address_uuid");
                    GrbgAddress grbgAddress = findAddressByUuid(subGarbageAccount.getAddresses(), addressUuid);
                    if (null == grbgAddress) {
<<<<<<< HEAD
                    	GrbgAddress grbgAddress1 = populateAddress(rs, "sub_address_");
                    	subGarbageAccount.getAddresses().add(grbgAddress1);
=======
                        GrbgAddress grbgAddress1 = populateAddress(rs, "sub_address_");
                        subGarbageAccount.getAddresses().add(grbgAddress1);
>>>>>>> niua-upstream/niua-dev-2.0
                    }
                }
            }
        }

        return new ArrayList<>(accountsMap.values());
    }

<<<<<<< HEAD
    private GrbgAddress populateAddress(ResultSet rs, String prefix) throws SQLException {
    	GrbgAddress grbgAddress = GrbgAddress.builder()
					.uuid(rs.getString(prefix+"uuid"))
			        .garbageId(rs.getLong(prefix+"garbage_id"))
			        .addressType(rs.getString(prefix+"address_type"))
			        .address1(rs.getString(prefix+"address1"))
			        .address2(rs.getString(prefix+"address2"))
			        .city(rs.getString(prefix+"city"))
			        .state(rs.getString(prefix+"state"))
			        .pincode(rs.getString(prefix+"pincode"))
			        .isActive(rs.getBoolean(prefix+"is_active"))
			        .zone(rs.getString(prefix+"zone"))
			        .ulbName(rs.getString(prefix+"ulb_name"))
			        .ulbType(rs.getString(prefix+"ulb_type"))
			        .wardName(rs.getString(prefix+"ward_name"))
			        .additionalDetail(getAdditionalDetail(rs, prefix + "additional_detail"))
			        .build();
		return grbgAddress;
	}

	private GrbgAddress findAddressByUuid(List<GrbgAddress> addresses, String addressUuid) {
=======

    /**
     * Executes the hasColumn database operation.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Validates method parameters.</li>
     *   <li>Executes repository database operation.</li>
     *   <li>Processes and returns the resulting output.</li>
     * </ol>
     *
     * @param rs         the rs parameter for this operation
     * @param columnName the columnName parameter for this operation
     * @return the output result of type {@link boolean}
     */

    private boolean hasColumn(ResultSet rs, String columnName) throws SQLException {
        ResultSetMetaData rsmd = rs.getMetaData();
        int columns = rsmd.getColumnCount();
        for (int i = 1; i <= columns; i++) {
            if (columnName.equalsIgnoreCase(rsmd.getColumnName(i))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Maps JDBC ResultSet rows into domain model objects.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Iterates through the JDBC {@link java.sql.ResultSet}.</li>
     *   <li>Extracts column values and maps database attributes to object properties.</li>
     *   <li>Populates nested child domain models and collection attributes.</li>
     *   <li>Returns the mapped domain entity object or collection.</li>
     * </ol>
     *
     * @param rs     the rs parameter for this operation
     * @param prefix the prefix parameter for this operation
     * @return the output result of type {@link GrbgAddress}
     */

    private GrbgAddress populateAddress(ResultSet rs, String prefix) throws SQLException {
        GrbgAddress grbgAddress = GrbgAddress.builder()
                .uuid(rs.getString(prefix + "uuid"))
                .garbageId(rs.getLong(prefix + "garbage_id"))
                .addressType(rs.getString(prefix + "address_type"))
                .address1(rs.getString(prefix + "address1"))
                .address2(rs.getString(prefix + "address2"))
                .city(rs.getString(prefix + "city"))
                .state(rs.getString(prefix + "state"))
                .pincode(rs.getString(prefix + "pincode"))
                .isActive(rs.getBoolean(prefix + "is_active"))
                .zone(rs.getString(prefix + "zone"))
                .ulbName(rs.getString(prefix + "ulb_name"))
                .ulbType(rs.getString(prefix + "ulb_type"))
                .wardName(rs.getString(prefix + "ward_name"))
                .additionalDetail(getAdditionalDetail(rs, prefix + "additional_detail"))
                .build();
        return grbgAddress;
    }

    /**
     * Queries database for records matching the provided criteria.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Constructs a dynamic SQL query based on active search criteria parameters.</li>
     *   <li>Appends pagination boundaries (limit and offset) and sorting clauses.</li>
     *   <li>Executes the SQL query via JdbcTemplate using custom row mapping.</li>
     *   <li>Assembles and returns the resulting entity list.</li>
     * </ol>
     *
     * @param addresses   the addresses parameter for this operation
     * @param addressUuid the addressUuid parameter for this operation
     * @return the output result of type {@link GrbgAddress}
     */

    private GrbgAddress findAddressByUuid(List<GrbgAddress> addresses, String addressUuid) {
>>>>>>> niua-upstream/niua-dev-2.0

        if (!CollectionUtils.isEmpty(addresses)) {
            return addresses.stream()
                    .filter(address -> address.getUuid().toString().equals(addressUuid))
                    .findFirst()
                    .orElse(null);
        }
        return null;
<<<<<<< HEAD
	}

	private GrbgCollectionUnit populateGarbageUnit(ResultSet rs, String prefix) throws SQLException {
    	GrbgCollectionUnit grbgCollectionUnit = GrbgCollectionUnit.builder()
    			.uuid(rs.getString(prefix+"uuid"))
    	        .unitName(rs.getString(prefix+"unit_name"))
    	        .unitWard(rs.getString(prefix+"unit_ward"))
    	        .ulbName(rs.getString(prefix+"ulb_name"))
    	        .typeOfUlb(rs.getString(prefix+"type_of_ulb"))
    	        .garbageId(rs.getLong(prefix+"garbage_id"))
    	        .unitType(rs.getString(prefix+"unit_type"))
    	        .category(rs.getString(prefix+"category"))
    	        .subCategory(rs.getString(prefix+"sub_category"))
    	        .subCategoryType(rs.getString(prefix+"sub_category_type"))
    	        .isActive(rs.getBoolean(prefix+"is_active"))
    			.build();
		return grbgCollectionUnit;
	}

	private GrbgCollectionUnit findUnitByUuid(List<GrbgCollectionUnit> grbgCollectionUnits, String unitUuid) {
=======
    }

    /**
     * Maps JDBC ResultSet rows into domain model objects.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Iterates through the JDBC {@link java.sql.ResultSet}.</li>
     *   <li>Extracts column values and maps database attributes to object properties.</li>
     *   <li>Populates nested child domain models and collection attributes.</li>
     *   <li>Returns the mapped domain entity object or collection.</li>
     * </ol>
     *
     * @param rs     the rs parameter for this operation
     * @param prefix the prefix parameter for this operation
     * @return the output result of type {@link GrbgCollectionUnit}
     */

    private GrbgCollectionUnit populateGarbageUnit(ResultSet rs, String prefix) throws SQLException {
        GrbgCollectionUnit grbgCollectionUnit = GrbgCollectionUnit.builder()
                .uuid(rs.getString(prefix + "uuid"))
                .unitName(rs.getString(prefix + "unit_name"))
                .unitWard(rs.getString(prefix + "unit_ward"))
                .ulbName(rs.getString(prefix + "ulb_name"))
                .typeOfUlb(rs.getString(prefix + "type_of_ulb"))
                .garbageId(rs.getLong(prefix + "garbage_id"))
                .unitType(rs.getString(prefix + "unit_type"))
                .category(rs.getString(prefix + "category"))
                .subCategory(rs.getString(prefix + "sub_category"))
                .subCategoryType(rs.getString(prefix + "sub_category_type"))
                .isActive(rs.getBoolean(prefix + "is_active"))
                .isbplunit(rs.getBoolean(prefix + "isbplunit"))
                .isbulkgeneration(rs.getBoolean(prefix + "isbulkgeneration"))
                .isvariablecalculation(rs.getBoolean(prefix + "isvariablecalculation"))
                .no_of_units(rs.getInt(prefix + "no_of_units"))
                .ismonthlybilling(rs.getBoolean(prefix + "is_monthly_billing"))
                .ownerType(rs.getString(prefix + "owner_type"))
                .isInheritance(rs.getBoolean(prefix + "is_inheritance"))
                .specialCategory(rs.getString(prefix + "special_Category"))
                .build();
        return grbgCollectionUnit;
    }

    /**
     * Queries database for records matching the provided criteria.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Constructs a dynamic SQL query based on active search criteria parameters.</li>
     *   <li>Appends pagination boundaries (limit and offset) and sorting clauses.</li>
     *   <li>Executes the SQL query via JdbcTemplate using custom row mapping.</li>
     *   <li>Assembles and returns the resulting entity list.</li>
     * </ol>
     *
     * @param grbgCollectionUnits the grbgCollectionUnits parameter for this operation
     * @param unitUuid            the unitUuid parameter for this operation
     * @return the output result of type {@link GrbgCollectionUnit}
     */

    private GrbgCollectionUnit findUnitByUuid(List<GrbgCollectionUnit> grbgCollectionUnits, String unitUuid) {
>>>>>>> niua-upstream/niua-dev-2.0

        if (!CollectionUtils.isEmpty(grbgCollectionUnits)) {
            return grbgCollectionUnits.stream()
                    .filter(unit -> unit.getUuid().toString().equals(unitUuid))
                    .findFirst()
                    .orElse(null);
        }
        return null;
<<<<<<< HEAD
	}

	private GrbgOldDetails populateGrbgOldDetails(ResultSet rs, String prefix) throws SQLException {
		GrbgOldDetails grbgOldDetails = GrbgOldDetails.builder()
						.uuid(rs.getString(prefix+"uuid"))
						.garbageId(rs.getLong(prefix+"garbage_id"))
						.oldGarbageId(rs.getString(prefix+"old_garbage_id"))
						.build();
		return grbgOldDetails;
	}

	private JsonNode getAdditionalDetail(ResultSet rs, String columnLabel) {
    	JsonNode jsonNode = null;
    	try {
    		String jsonString = rs.getString(columnLabel);
            if (jsonString != null) {
                jsonNode = objectMapper.readTree(jsonString);
            }
		} catch (JsonMappingException e) {
			e.printStackTrace();
		} catch (JsonProcessingException e) {
			e.printStackTrace();
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return jsonNode;
	}

	private GrbgDocument populateGarbageDocument(ResultSet rs, String prefix) throws SQLException {
		
    	GrbgDocument garbageDocument = GrbgDocument.builder()
    			.uuid(rs.getString(prefix+"uuid"))
    			.docRefId(rs.getString(prefix+"doc_ref_id"))
    			.docName(rs.getString(prefix+"doc_name"))
    			.docType(rs.getString(prefix+"doc_type"))
    			.docCategory(rs.getString(prefix+"doc_category"))
    			.tblRefUuid(rs.getString(prefix+"tbl_ref_uuid"))
    			.build();
		return garbageDocument;
	}

	private GrbgDocument findDocumentByUuid(List<GrbgDocument> documents, String docUuid) {
    	if (!CollectionUtils.isEmpty(documents)) {
=======
    }

    /**
     * Maps JDBC ResultSet rows into domain model objects.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Iterates through the JDBC {@link java.sql.ResultSet}.</li>
     *   <li>Extracts column values and maps database attributes to object properties.</li>
     *   <li>Populates nested child domain models and collection attributes.</li>
     *   <li>Returns the mapped domain entity object or collection.</li>
     * </ol>
     *
     * @param rs     the rs parameter for this operation
     * @param prefix the prefix parameter for this operation
     * @return the output result of type {@link GrbgOldDetails}
     */

    private GrbgOldDetails populateGrbgOldDetails(ResultSet rs, String prefix) throws SQLException {
        GrbgOldDetails grbgOldDetails = GrbgOldDetails.builder()
                .uuid(rs.getString(prefix + "uuid"))
                .garbageId(rs.getLong(prefix + "garbage_id"))
                .oldGarbageId(rs.getString(prefix + "old_garbage_id"))
                .build();
        return grbgOldDetails;
    }

    /**
     * Queries database for records matching the provided criteria.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Constructs a dynamic SQL query based on active search criteria parameters.</li>
     *   <li>Appends pagination boundaries (limit and offset) and sorting clauses.</li>
     *   <li>Executes the SQL query via JdbcTemplate using custom row mapping.</li>
     *   <li>Assembles and returns the resulting entity list.</li>
     * </ol>
     *
     * @param rs          the rs parameter for this operation
     * @param columnLabel the columnLabel parameter for this operation
     * @return the output result of type {@link JsonNode}
     */

    private JsonNode getAdditionalDetail(ResultSet rs, String columnLabel) {
        JsonNode jsonNode = null;
        try {
            String jsonString = rs.getString(columnLabel);
            if (jsonString != null) {
                jsonNode = objectMapper.readTree(jsonString);
            }
        } catch (JsonMappingException e) {
            e.printStackTrace();
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return jsonNode;
    }

    /**
     * Maps JDBC ResultSet rows into domain model objects.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Iterates through the JDBC {@link java.sql.ResultSet}.</li>
     *   <li>Extracts column values and maps database attributes to object properties.</li>
     *   <li>Populates nested child domain models and collection attributes.</li>
     *   <li>Returns the mapped domain entity object or collection.</li>
     * </ol>
     *
     * @param rs     the rs parameter for this operation
     * @param prefix the prefix parameter for this operation
     * @return the output result of type {@link GrbgDocument}
     */

    private GrbgDocument populateGarbageDocument(ResultSet rs, String prefix) throws SQLException {

        GrbgDocument garbageDocument = GrbgDocument.builder()
                .uuid(rs.getString(prefix + "uuid"))
                .garbageId(rs.getLong(prefix + "garbage_id"))
                .documentUid(rs.getString(prefix + "document_uid"))
                .documentType(rs.getString(prefix + "document_type"))
                .fileStoreId(rs.getString(prefix + "file_store_id"))
                .build();
        return garbageDocument;
    }

    /**
     * Queries database for records matching the provided criteria.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Constructs a dynamic SQL query based on active search criteria parameters.</li>
     *   <li>Appends pagination boundaries (limit and offset) and sorting clauses.</li>
     *   <li>Executes the SQL query via JdbcTemplate using custom row mapping.</li>
     *   <li>Assembles and returns the resulting entity list.</li>
     * </ol>
     *
     * @param documents the documents parameter for this operation
     * @param docUuid   the docUuid parameter for this operation
     * @return the output result of type {@link GrbgDocument}
     */

    private GrbgDocument findDocumentByUuid(List<GrbgDocument> documents, String docUuid) {
        if (!CollectionUtils.isEmpty(documents)) {
>>>>>>> niua-upstream/niua-dev-2.0
            return documents.stream()
                    .filter(doc -> StringUtils.equals(doc.getUuid(), docUuid))
                    .findFirst()
                    .orElse(null);
        }
        return null;
<<<<<<< HEAD
	}

	private GrbgCommercialDetails populateGrbgCommercialDetails(ResultSet rs, String prefix) throws SQLException {
		GrbgCommercialDetails grbgCommercialDetails = GrbgCommercialDetails.builder()
				.uuid(rs.getString(prefix+"uuid"))
				.garbageId(rs.getLong(prefix+"garbage_id"))
				.businessName(rs.getString(prefix+"business_name"))
				.businessType(rs.getString(prefix+"business_type"))
				.ownerUserUuid(rs.getString(prefix+"owner_user_uuid"))
				.build();
		return grbgCommercialDetails;
	}

	private GrbgApplication populateGarbageApplication(ResultSet rs, String prefix) throws SQLException {
    	GrbgApplication grbgApplication = GrbgApplication.builder()
    			.uuid(rs.getString(prefix+"uuid"))
    			.applicationNo(rs.getString(prefix+"application_no"))
    			.status(rs.getString(prefix+"status"))
    			.garbageId(rs.getLong(prefix+"garbage_id"))
    			.build();
		return grbgApplication;
	}

	private GarbageAccount populateGarbageAccount(ResultSet rs, String prefix) throws SQLException {
=======
    }


    /**
     * Maps JDBC ResultSet rows into domain model objects.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Iterates through the JDBC {@link java.sql.ResultSet}.</li>
     *   <li>Extracts column values and maps database attributes to object properties.</li>
     *   <li>Populates nested child domain models and collection attributes.</li>
     *   <li>Returns the mapped domain entity object or collection.</li>
     * </ol>
     *
     * @param rs     the rs parameter for this operation
     * @param prefix the prefix parameter for this operation
     * @return the output result of type {@link GrbgApplication}
     */

    private GrbgApplication populateGarbageApplication(ResultSet rs, String prefix) throws SQLException {
        GrbgApplication grbgApplication = GrbgApplication.builder()
                .uuid(rs.getString(prefix + "uuid"))
                .applicationNo(rs.getString(prefix + "application_no"))
                .status(rs.getString(prefix + "status"))
                .garbageId(rs.getLong(prefix + "garbage_id"))
                .build();
        return grbgApplication;
    }

    /**
     * Maps JDBC ResultSet rows into domain model objects.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Iterates through the JDBC {@link java.sql.ResultSet}.</li>
     *   <li>Extracts column values and maps database attributes to object properties.</li>
     *   <li>Populates nested child domain models and collection attributes.</li>
     *   <li>Returns the mapped domain entity object or collection.</li>
     * </ol>
     *
     * @param rs     the rs parameter for this operation
     * @param prefix the prefix parameter for this operation
     * @return the output result of type {@link GarbageAccount}
     */

    private GarbageAccount populateGarbageAccount(ResultSet rs, String prefix) throws SQLException {
>>>>>>> niua-upstream/niua-dev-2.0

        GarbageAccount garbageAccount = GarbageAccount.builder()
                .id(rs.getLong(prefix + "id"))
                .uuid(rs.getString(prefix + "uuid"))
                .garbageId(rs.getLong(prefix + "garbage_id"))
                .propertyId(rs.getString(prefix + "property_id"))
                .type(rs.getString(prefix + "type"))
                .name(rs.getString(prefix + "name"))
                .mobileNumber(rs.getString(prefix + "mobile_number"))
                .gender(rs.getString(prefix + "gender"))
<<<<<<< HEAD
=======
                .grbgApplicationNumber(rs.getString("sub_app_application_no"))
>>>>>>> niua-upstream/niua-dev-2.0
                .emailId(rs.getString(prefix + "email_id"))
                .isOwner(rs.getBoolean(prefix + "is_owner"))
                .userUuid(rs.getString(prefix + "user_uuid"))
                .declarationUuid(rs.getString(prefix + "declaration_uuid"))
<<<<<<< HEAD
//                .grbgCollectionAddressUuid(rs.getString(prefix + "grbg_coll_address_uuid"))
=======
>>>>>>> niua-upstream/niua-dev-2.0
                .status(rs.getString(prefix + "status"))
                .additionalDetail(getAdditionalDetail(rs, prefix + "additional_detail"))
                .tenantId(rs.getString(prefix + "tenant_id"))
                .parentAccount(rs.getString(prefix + "parent_account"))
<<<<<<< HEAD
                .isActive(rs.getBoolean("is_active"))
                .subAccountCount(rs.getLong("sub_account_count"))
                .documents(new ArrayList<>())
                .garbageBills(new ArrayList<>())
=======
                .isActive(rs.getBoolean(prefix + "is_active"))
                .subAccountCount(rs.getLong("sub_account_count"))
                .businessService(rs.getString(prefix + "business_service"))
                .approvalDate(rs.getLong(prefix + "approval_date"))
                .channel(rs.getString(prefix + "channel"))
                .documents(new ArrayList<>())
>>>>>>> niua-upstream/niua-dev-2.0
                .grbgCollectionUnits(new ArrayList<>())
                .addresses(new ArrayList<>())
                .auditDetails(AuditDetails.builder()
                        .createdBy(rs.getString(prefix + "created_by"))
                        .createdDate(rs.getLong(prefix + "created_date"))
                        .lastModifiedBy(rs.getString(prefix + "last_modified_by"))
                        .lastModifiedDate(rs.getLong(prefix + "last_modified_date"))
                        .build())
                .build();

        return garbageAccount;
    }

<<<<<<< HEAD
=======
    /**
     * Queries database for records matching the provided criteria.
     *
     * <p>The operation performs the following steps:
     * <ol>
     *   <li>Constructs a dynamic SQL query based on active search criteria parameters.</li>
     *   <li>Appends pagination boundaries (limit and offset) and sorting clauses.</li>
     *   <li>Executes the SQL query via JdbcTemplate using custom row mapping.</li>
     *   <li>Assembles and returns the resulting entity list.</li>
     * </ol>
     *
     * @param subGarbageAccounts the subGarbageAccounts parameter for this operation
     * @param subAccId           the subAccId parameter for this operation
     * @return the output result of type {@link GarbageAccount}
     */

>>>>>>> niua-upstream/niua-dev-2.0
    private GarbageAccount findSubAccById(List<GarbageAccount> subGarbageAccounts, Long subAccId) {

        if (!CollectionUtils.isEmpty(subGarbageAccounts)) {
            return subGarbageAccounts.stream()
                    .filter(acc -> acc.getId().equals(subAccId))
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

<<<<<<< HEAD
    private GarbageBill findBillByUuid(List<GarbageBill> garbageBills, String bill_id) {

        if (!CollectionUtils.isEmpty(garbageBills)) {
            return garbageBills.stream()
                    .filter(bill -> bill.getId().toString().equals(bill_id)) // Adjusted to compare as string
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    private GarbageBill populateGarbageBill(ResultSet rs, String prefix) throws SQLException {

        GarbageBill bill = GarbageBill.builder()
                .id(rs.getLong(prefix + "id"))
                .billRefNo(rs.getString(prefix + "bill_ref_no"))
                .garbageId(rs.getLong(prefix + "garbage_id"))
                .billAmount(rs.getDouble(prefix + "bill_amount"))
                .arrearAmount(rs.getDouble(prefix + "arrear_amount"))
                .paneltyAmount(rs.getDouble(prefix + "panelty_amount"))
                .discountAmount(rs.getDouble(prefix + "discount_amount"))
                .totalBillAmount(rs.getDouble(prefix + "total_bill_amount"))
                .totalBillAmountAfterDueDate(rs.getDouble(prefix + "total_bill_amount_after_due_date"))
                .billGeneratedBy(rs.getString(prefix + "bill_generated_by"))
                .billGeneratedDate(rs.getLong(prefix + "bill_generated_date"))
                .billDueDate(rs.getLong(prefix + "bill_due_date"))
                .billPeriod(rs.getString(prefix + "bill_period"))
                .bankDiscountAmount(rs.getDouble(prefix + "bank_discount_amount"))
                .paymentId(rs.getString(prefix + "payment_id"))
                .paymentStatus(rs.getString(prefix + "payment_status"))
                .auditDetails(AuditDetails.builder()
                        .createdBy(rs.getString(prefix + "created_by"))
                        .createdDate(rs.getLong(prefix + "created_date"))
                        .lastModifiedBy(rs.getString(prefix + "last_modified_by"))
                        .lastModifiedDate(rs.getLong(prefix + "last_modified_date"))
                        .build())
                .build();

        return bill;
    }
}
=======

//
//                    .filter(bill -> bill.getId().toString().equals(bill_id)) // Adjusted to compare as string

//
//
}
>>>>>>> niua-upstream/niua-dev-2.0
