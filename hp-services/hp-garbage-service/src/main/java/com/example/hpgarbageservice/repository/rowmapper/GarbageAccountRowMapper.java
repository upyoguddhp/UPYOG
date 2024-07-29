package com.example.hpgarbageservice.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import com.example.hpgarbageservice.model.AuditDetails;
import com.example.hpgarbageservice.model.GarbageAccount;
import com.example.hpgarbageservice.model.GarbageBill;
import com.example.hpgarbageservice.model.GrbgApplication;
import com.example.hpgarbageservice.model.GrbgCommercialDetails;
import com.example.hpgarbageservice.model.GrbgDocument;

@Component
public class GarbageAccountRowMapper implements ResultSetExtractor<List<GarbageAccount>> {

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
                        .propertyId(rs.getLong("property_id"))
                        .type(rs.getString("type"))
                        .name(rs.getString("name"))
                        .mobileNumber(rs.getString("mobile_number"))
                        .isOwner(rs.getBoolean("is_owner"))
                        .userUuid(rs.getString("user_uuid"))
                        .declarationUuid(rs.getString("declaration_uuid"))
                        .grbgCollectionAddressUuid(rs.getString("grbg_coll_address_uuid"))
                        .status(rs.getString("status"))
//                        .parentId(rs.getLong("parent_id"))
                        .documents(new ArrayList<>())
                        .garbageBills(new ArrayList<>())
                        .childGarbageAccounts(new ArrayList<>())
                        .auditDetails(audit)
                        .build();

                accountsMap.put(accountId, garbageAccount);
            }

            
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
            
            
            if (null != rs.getString("bill_id")) {
                String billId = rs.getString("bill_id");
                GarbageBill garbageBill = findBillByUuid(garbageAccount.getGarbageBills(), billId);
                if (null == garbageBill) {
                    GarbageBill garbageBill1 = populateGarbageBill(rs, "bill_");
                    garbageAccount.getGarbageBills().add(garbageBill1);
                }
            }

            
            if (null != rs.getString("doc_uuid")) {
                String docUuid = rs.getString("doc_uuid");
                GrbgDocument garbageDocument = findDocumentByUuid(garbageAccount.getDocuments(), docUuid);
                if (null == garbageDocument) {
                	GrbgDocument garbageDocument1 = populateGarbageDocument(rs, "doc_");
                    garbageAccount.getDocuments().add(garbageDocument1);
                }
            }

            
            if (null != rs.getString("sub_acc_id")
            		&& BooleanUtils.isNotTrue(rs.getBoolean("sub_acc_is_owner"))) {
                Long subAccId = rs.getLong("sub_acc_id");
                GarbageAccount subGarbageAccount = findSubAccById(garbageAccount.getChildGarbageAccounts(), subAccId);
                if (null == subGarbageAccount) {
                    subGarbageAccount = populateGarbageAccount(rs, "sub_acc_");
                    garbageAccount.getChildGarbageAccounts().add(subGarbageAccount);
                }

                if (null != rs.getString("sub_app_uuid")
                		&& null == subGarbageAccount.getGrbgApplication()) {
                    	GrbgApplication subGarbageApplication = populateGarbageApplication(rs, "sub_app_");
                    	subGarbageAccount.setGrbgApplication(subGarbageApplication);
                }
                
                if (null != rs.getString("sub_comm_uuid")
                		&& null == subGarbageAccount.getGrbgCommercialDetails()) {
                	GrbgCommercialDetails garbageCommDetails = populateGrbgCommercialDetails(rs, "sub_comm_");
                	subGarbageAccount.setGrbgCommercialDetails(garbageCommDetails);
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
            }
        }

        return new ArrayList<>(accountsMap.values());
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
            return documents.stream()
                    .filter(doc -> StringUtils.equals(doc.getUuid(), docUuid))
                    .findFirst()
                    .orElse(null);
        }
        return null;
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

        GarbageAccount garbageAccount = GarbageAccount.builder()
                .id(rs.getLong(prefix + "id"))
                .uuid(rs.getString(prefix + "uuid"))
                .garbageId(rs.getLong(prefix + "garbage_id"))
                .propertyId(rs.getLong(prefix + "property_id"))
                .type(rs.getString(prefix + "type"))
                .name(rs.getString(prefix + "name"))
                .mobileNumber(rs.getString(prefix + "mobile_number"))
                .isOwner(rs.getBoolean(prefix + "is_owner"))
                .userUuid(rs.getString(prefix + "user_uuid"))
                .declarationUuid(rs.getString(prefix + "declaration_uuid"))
                .grbgCollectionAddressUuid(rs.getString(prefix + "grbg_coll_address_uuid"))
                .status(rs.getString(prefix + "status"))
//                .parentId(rs.getLong(prefix + "parent_id"))
                .documents(new ArrayList<>())
                .garbageBills(new ArrayList<>())
                .auditDetails(AuditDetails.builder()
                        .createdBy(rs.getString(prefix + "created_by"))
                        .createdDate(rs.getLong(prefix + "created_date"))
                        .lastModifiedBy(rs.getString(prefix + "last_modified_by"))
                        .lastModifiedDate(rs.getLong(prefix + "last_modified_date"))
                        .build())
                .build();

        return garbageAccount;
    }

    private GarbageAccount findSubAccById(List<GarbageAccount> subGarbageAccounts, Long subAccId) {

        if (!CollectionUtils.isEmpty(subGarbageAccounts)) {
            return subGarbageAccounts.stream()
                    .filter(acc -> acc.getId().equals(subAccId))
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

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
