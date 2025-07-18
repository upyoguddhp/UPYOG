package org.egov.pt.repository.builder;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.pt.config.PropertyConfiguration;
import org.egov.pt.models.PropertyCriteria;
import org.egov.pt.models.PtTaxCalculatorTrackerSearchCriteria;
import org.egov.pt.models.enums.BillStatus;
import org.egov.pt.models.enums.Status;
import org.egov.pt.web.contracts.TotalCountRequest;
import org.egov.tracer.model.CustomException;
import org.jsoup.helper.StringUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class PropertyQueryBuilder {

	@Autowired
	private PropertyConfiguration config;
	
	private static final String PT_TAX_CALCULATOR_TRACKER_SEARCH_QUERY = "SELECT * FROM eg_pt_tax_calculator_tracker eptct";
	
	private static final String PT_TAX_CALCULATOR_TRACKER_TENANT_ID_SEARCH_QUERY = "SELECT distinct(eptct.tenantid) FROM eg_pt_tax_calculator_tracker eptct";

	private static final String SELECT = "SELECT ";
	private static final String INNER_JOIN = "INNER JOIN";
	private static final String LEFT_JOIN = "LEFT OUTER JOIN";
	private static final String AND_QUERY = " AND ";

	private static final String PROPERTY_DEFAULTER_SEARCH = "select * from (SELECT property.id as pid, property.propertyid, property.tenantid as ptenantid, surveyid, accountid, oldpropertyid, property.status as propertystatus, acknowldgementnumber, propertytype, ownershipcategory,property.usagecategory as pusagecategory, creationreason, nooffloors, landarea, property.superbuiltuparea as propertysbpa, linkedproperties, source, channel, property.createdby as pcreatedby, property.lastmodifiedby as plastmodifiedby, property.createdtime as pcreatedtime, property.lastmodifiedtime as plastmodifiedtime, property.additionaldetails as padditionaldetails, (CASE WHEN property.status='ACTIVE' then 0 WHEN property.status='INWORKFLOW' then 1 WHEN property.status='INACTIVE' then 2 ELSE 3 END) as statusorder, address.tenantid as adresstenantid, address.id as addressid, address.propertyid as addresspid, latitude, longitude, doorno, plotno, buildingname, street, landmark, city, pincode, locality, district, region, state, country, address.createdby as addresscreatedby, address.lastmodifiedby as addresslastmodifiedby, address.createdtime as addresscreatedtime, address.lastmodifiedtime as addresslastmodifiedtime, address.additionaldetails as addressadditionaldetails, owner.tenantid as owntenantid, ownerInfoUuid, owner.propertyid as ownpropertyid, userid, owner.status as ownstatus,owner.additionaldetails as oadditionaldetails, isprimaryowner, ownertype, ownershippercentage, owner.institutionid as owninstitutionid, relationship, owner.createdby as owncreatedby, owner.createdtime as owncreatedtime,owner.lastmodifiedby as ownlastmodifiedby, owner.lastmodifiedtime as ownlastmodifiedtime, unit.id as unitid, unit.tenantid as unittenantid, unit.propertyid as unitpid, floorno, unittype, unit.usagecategory as unitusagecategory, occupancytype, occupancydate, carpetarea, builtuparea, plintharea, unit.superbuiltuparea as unitspba, arv, constructiontype, constructiondate, dimensions, unit.active as isunitactive, unit.createdby as unitcreatedby, unit.createdtime as unitcreatedtime, unit.lastmodifiedby as unitlastmodifiedby, unit.lastmodifiedtime as unitlastmodifiedtime  FROM EG_PT_PROPERTY property INNER JOIN EG_PT_ADDRESS address         ON property.id = address.propertyid INNER JOIN EG_PT_OWNER owner             ON property.id = owner.propertyid  LEFT OUTER JOIN EG_PT_UNIT unit ON property.id =  unit.propertyid  WHERE  property.tenantId= ?  AND property.usagecategory like ? AND address.locality = ? AND owner.status = ? AND property.status = ?) as propertydata"
			+ " LEFT OUTER JOIN (select consumercode,sum(taxdue) as taxDue,STRING_AGG(year || '(Rs.' || taxdue || ')',',')  as taxDueYear from ( select d.consumercode, (to_char((To_timestamp(d.taxperiodfrom/1000) at time Zone 'Asia/Kolkata'),'YYYY') || '-' || to_char((To_timestamp(d.taxperiodto/1000) at time Zone 'Asia/Kolkata'),'YY')) as year ,  sum(dd.taxamount)-sum(dd.collectionamount) as taxdue from egbs_demanddetail_v1 dd, egbs_demand_v1 d "
			+ " where dd.demandid=d.id and d.status!='CANCELLED' and dd.tenantid='pg.citya' and d.tenantid='pg.citya' and (to_char((To_timestamp(d.taxperiodfrom/1000) at time Zone 'Asia/Kolkata'),'YYYY') || '-' || to_char((To_timestamp(d.taxperiodto/1000) at time Zone 'Asia/Kolkata'),'YY')) != ? group by d.consumercode,(to_char((To_timestamp(d.taxperiodfrom/1000) at time Zone 'Asia/Kolkata'),'YYYY') || '-' || to_char((To_timestamp(d.taxperiodto/1000) at time Zone 'Asia/Kolkata'),'YY'))) tax where taxDue>0 group by tax.consumercode) as taxdata on propertydata.propertyid=taxdata.consumercode";

	private static String PROEPRTY_AUDIT_QUERY = "select property from eg_pt_property_audit where propertyid=?";

	private static String PROPERTY_AUDIT_ENC_QUERY = "select * from eg_pt_property_audit where propertyid=?";

	private static String PROEPRTY_ID_QUERY = "select propertyid from eg_pt_property where id in (select propertyid from eg_pt_owner where userid IN {replace} AND status='ACTIVE') ";

	private static String REPLACE_STRING = "{replace}";

	private static String WITH_CLAUSE_QUERY = " WITH propertyresult AS ({replace}) SELECT * FROM propertyresult "
			+ "INNER JOIN (SELECT propertyid, min(statusorder) as minorder FROM propertyresult GROUP BY propertyid) as minresult "
			+ "ON minresult.propertyid=propertyresult.propertyid AND minresult.minorder=propertyresult.statusorder";

	// Select query

	private static String propertySelectValues = "property.id as pid, property.propertyid, property.tenantid as ptenantid, surveyid, accountid, oldpropertyid, property.status as propertystatus, acknowldgementnumber, propertytype, ownershipcategory,property.usagecategory as pusagecategory, creationreason, nooffloors, landarea, property.superbuiltuparea as propertysbpa, linkedproperties, source, channel, property.createdby as pcreatedby, property.lastmodifiedby as plastmodifiedby, property.createdtime as pcreatedtime,"
			+ " property.lastmodifiedtime as plastmodifiedtime, property.additionaldetails as padditionaldetails, property.business_service as pbusiness_service, (CASE WHEN property.status='ACTIVE' then 0 WHEN property.status='INWORKFLOW' then 1 WHEN property.status='INACTIVE' then 2 ELSE 3 END) as statusorder, ";

	private static String addressSelectValues = "address.tenantid as adresstenantid, address.id as addressid, address.propertyid as addresspid, latitude, longitude, doorno, plotno, buildingname, street, landmark, city, pincode, locality, district, region, state, country, address.createdby as addresscreatedby, address.lastmodifiedby as addresslastmodifiedby, address.createdtime as addresscreatedtime, address.lastmodifiedtime as addresslastmodifiedtime, address.additionaldetails as addressadditionaldetails, ";

	private static String institutionSelectValues = "institution.id as institutionid,institution.propertyid as institutionpid, institution.tenantid as institutiontenantid, institution.name as institutionname, institution.type as institutiontype, designation, nameofauthorizedperson, institution.createdby as institutioncreatedby, institution.lastmodifiedby as institutionlastmodifiedby, institution.createdtime as institutioncreatedtime, institution.lastmodifiedtime as institutionlastmodifiedtime, ";

	private static String propertyDocSelectValues = "pdoc.id as pdocid, pdoc.tenantid as pdoctenantid, pdoc.entityid as pdocentityid, pdoc.documenttype as pdoctype, pdoc.filestoreid as pdocfilestore, pdoc.documentuid as pdocuid, pdoc.status as pdocstatus, ";

	private static String ownerSelectValues = "owner.tenantid as owntenantid, ownerInfoUuid, owner.propertyid as ownpropertyid, userid, owner.status as ownstatus, isprimaryowner, ownertype, ownershippercentage, owner.institutionid as owninstitutionid, relationship, owner.createdby as owncreatedby, owner.createdtime as owncreatedtime,owner.lastmodifiedby as ownlastmodifiedby, owner.lastmodifiedtime as ownlastmodifiedtime,owner.additionaldetails as oadditionaldetails,owner.name as owname,  ";

	private static String ownerDocSelectValues = " owndoc.id as owndocid, owndoc.tenantid as owndoctenantid, owndoc.entityid as owndocentityId, owndoc.documenttype as owndoctype, owndoc.filestoreid as owndocfilestore, owndoc.documentuid as owndocuid, owndoc.status as owndocstatus, ";

	private static String UnitSelectValues = "unit.id as unitid, unit.tenantid as unittenantid, unit.propertyid as unitpid, floorno, unittype, unit.usagecategory as unitusagecategory, occupancytype, occupancydate, carpetarea, builtuparea, plintharea, unit.superbuiltuparea as unitspba, arv, constructiontype, constructiondate, dimensions, unit.active as isunitactive, unit.createdby as unitcreatedby, unit.createdtime as unitcreatedtime, unit.lastmodifiedby as unitlastmodifiedby, unit.lastmodifiedtime as unitlastmodifiedtime, unit.additional_details as unitadditional_details ";

	private static final String TOTAL_APPLICATIONS_COUNT_QUERY = "select count(*) from eg_pt_property where tenantid = ?;";
	
	private static final String BASE_QUERY = "SELECT \n"
			+"     property.id AS pid,\n"
			+ "    property.id AS property_id,\n"
			+ "    property.propertyid AS propertyid,\n"
			+ "    property.tenantid AS ptenantid,\n"
			+ "    property.surveyid,\n"
			+ "    property.accountid,\n"
			+ "    property.oldpropertyid,\n"
			+ "    property.status AS propertystatus,\n"
			+ "    property.acknowldgementnumber,\n"
			+ "    property.propertytype,\n"
			+ "    property.ownershipcategory,\n"
			+ "    property.usagecategory as pusagecategory,\n"
			+ "    property.creationreason,\n"
			+ "    property.nooffloors,\n"
			+ "    property.landarea,\n"
			+ "    property.superbuiltuparea as propertysbpa,\n"
			+ "    property.linkedproperties,\n"
			+ "    property.source AS source,\n"
			+ "    property.channel,\n"
			+ "    property.createdby AS pcreatedby,\n"
			+ "    property.lastmodifiedby AS plastmodifiedby,\n"
			+ "    property.createdtime AS pcreatedtime,\n"
			+ "    property.lastmodifiedtime AS plastmodifiedtime,\n"
			+ "    property.additionaldetails AS padditionaldetails,\n"
			+ "    a.id AS addressid,\n"
			+ "    a.propertyid AS address_propertyid,\n"
			+ "    a.tenantid AS address_tenantid,\n"
			+ "    a.doorno,\n"
			+ "    a.plotno,\n"
			+ "    a.buildingname,\n"
			+ "    a.street,\n"
			+ "    a.landmark,\n"
			+ "    a.city,\n"
			+ "    a.pincode,\n"
			+ "    a.locality,\n"
			+ "    a.district,\n"
			+ "    a.region,\n"
			+ "    a.state,\n"
			+ "    a.country,\n"
			+ "    a.latitude,\n"
			+ "    a.longitude,\n"
			+ "    a.createdby AS address_createdby,\n"
			+ "    a.createdtime AS address_createdtime,\n"
			+ "    a.lastmodifiedby AS address_lastmodifiedby,\n"
			+ "    a.lastmodifiedtime AS address_lastmodifiedtime,\n"
			+ "    a.additionaldetails AS addressadditionaldetails,\n"
			+ "    o.ownerinfouuid,\n"
			+ "    o.tenantid AS owntenantid,\n"
			+ "    o.propertyid AS owner_propertyid,\n"
			+ "    o.institutionid as owninstitutionid,\n"
			+ "    o.userid,\n"
			+ "    o.status AS ownstatus,\n"
			+ "    o.isprimaryowner,\n"
			+ "    o.ownertype,\n"
			+ "    o.ownershippercentage,\n"
			+ "    o.relationship,\n"
			+ "    o.createdby AS owner_createdby,\n"
			+ "    o.createdtime AS owner_createdtime,\n"
			+ "    o.lastmodifiedby AS owner_lastmodifiedby,\n"
			+ "    o.lastmodifiedtime AS owner_lastmodifiedtime,\n"
			+ "    o.additionaldetails AS oadditionaldetails\n"
			//+"     o.institutionid AS institution_id\n"
			+ "\n"
			+ "FROM \n"
			+ "    public.eg_pt_property property\n"
			+ "LEFT JOIN \n"
			+ "    public.eg_pt_address a ON property.id = a.propertyid\n"
			+ "LEFT JOIN \n"
			+ "    public.eg_pt_owner o ON property.id = o.propertyid\n"
			+"LEFT JOIN \n"
			+"     public.eg_pt_institution i ON property.id  = i.propertyid";

	private static final String QUERY = SELECT

			+ propertySelectValues

			+ addressSelectValues

			+ institutionSelectValues

			+ propertyDocSelectValues

			+ ownerSelectValues

			+ ownerDocSelectValues

			+ UnitSelectValues

			+ " FROM EG_PT_PROPERTY property "

			+ INNER_JOIN + " EG_PT_ADDRESS address         ON property.id = address.propertyid "

			+ LEFT_JOIN + " EG_PT_INSTITUTION institution ON property.id = institution.propertyid "

			+ LEFT_JOIN + " EG_PT_DOCUMENT pdoc           ON property.id = pdoc.entityid "

			+ INNER_JOIN + " EG_PT_OWNER owner             ON property.id = owner.propertyid "

			+ LEFT_JOIN + " EG_PT_DOCUMENT owndoc         ON owner.ownerinfouuid = owndoc.entityid "

			+ LEFT_JOIN + " EG_PT_UNIT unit		          ON property.id =  unit.propertyid ";

	private static final String ID_QUERY = SELECT

			+ " property.id FROM EG_PT_PROPERTY property "

			+ INNER_JOIN + " EG_PT_ADDRESS address         ON property.id = address.propertyid "

			+ LEFT_JOIN + " EG_PT_INSTITUTION institution ON property.id = institution.propertyid "

			+ LEFT_JOIN + " EG_PT_DOCUMENT pdoc           ON property.id = pdoc.entityid "

			+ INNER_JOIN + " EG_PT_OWNER owner             ON property.id = owner.propertyid "

			+ LEFT_JOIN + " EG_PT_DOCUMENT owndoc         ON owner.ownerinfouuid = owndoc.entityid "

			+ LEFT_JOIN + " EG_PT_UNIT unit		          ON property.id =  unit.propertyid ";

	private static final String COUNT_QUERY = SELECT

			+ " count(distinct property.id) FROM EG_PT_PROPERTY property "

			+ INNER_JOIN + " EG_PT_ADDRESS address         ON property.id = address.propertyid "

			+ LEFT_JOIN + " EG_PT_INSTITUTION institution ON property.id = institution.propertyid "

			+ LEFT_JOIN + " EG_PT_DOCUMENT pdoc           ON property.id = pdoc.entityid "

			+ INNER_JOIN + " EG_PT_OWNER owner             ON property.id = owner.propertyid "

			+ LEFT_JOIN + " EG_PT_DOCUMENT owndoc         ON owner.ownerinfouuid = owndoc.entityid "

			+ LEFT_JOIN + " EG_PT_UNIT unit		          ON property.id =  unit.propertyid ";

	private final String paginationWrapper = "SELECT * FROM "
			+ "(SELECT *, DENSE_RANK() OVER (ORDER BY plastmodifiedtime DESC, pid) offset_ FROM " + "({})"
			+ " result) result_offset " + "WHERE offset_ > ? AND offset_ <= ?";

	private static final String LATEST_EXECUTED_MIGRATION_QUERY = "select * from eg_pt_enc_audit where tenantid = ? order by createdTime desc limit 1;";
	
	private static final String COUNT_STATUS_BASED_QUERY = "SELECT COUNT(DISTINCT property.id) AS count,"
			+ "COUNT(DISTINCT CASE WHEN property.status = 'INITIATED' THEN property.id END) AS applicationInitiated,"
			+ "COUNT(DISTINCT CASE WHEN property.status = 'PENDINGFORVERIFICATION' THEN property.id END) AS applicationPendingForVerification,"
			+ "COUNT(distinct case when property.status = 'PENDINGFORMODIFICATION' then property.id end) as applicationPendingForModification,"
			+ "COUNT(distinct case when property.status = 'PENDINGFORAPPROVAL' then property.id end) as applicationPendingForApproval,"
			+ "COUNT(distinct case when property.status = 'APPROVED' then property.id end) as applicationApproved,"
			+ "COUNT(distinct case when property.status = 'REJECTED' then property.id end) as applicationRejected "
			+ "from EG_PT_PROPERTY property";
	
	private static final String PROPERTY_OWNERS_SEARCH_QUERY = "select * from eg_pt_owner epo where mobile_number is null limit 500";
	
	private static final String CHECK_PROPERTY_MASTER_STATUS_QUERY =
		      "SELECT "
		    + "  data->>'ulbName' AS ulb_name, "
		    + "  MAX(CASE WHEN schemacode = 'ULBS.Zones' THEN 'YES' ELSE 'NO' END) AS \"LocationFactor(F1)\", "
		    + "  MAX(CASE WHEN schemacode = 'ULBS.BuildingStructure' THEN 'YES' ELSE 'NO' END) AS \"BuildingType(F2)\", "
		    + "  MAX(CASE WHEN schemacode = 'ULBS.BuildingEstablishmentYear' THEN 'YES' ELSE 'NO' END) AS \"BuildingEstablishment(F3)\", "
		    + "  MAX(CASE WHEN schemacode = 'ULBS.BuildingPurpose' THEN 'YES' ELSE 'NO' END) AS \"OccupationFactor(F4)\", "
		    + "  MAX(CASE WHEN schemacode = 'ULBS.BuildingUse' THEN 'YES' ELSE 'NO' END) AS \"UsesOfBuilding(F5)\", "
		    + "  MAX(CASE WHEN schemacode = 'ULBS.OverAllRebate' THEN 'YES' ELSE 'NO' END) AS \"OverallRebateRate\", "
		    + "  MAX(CASE WHEN schemacode = 'ULBS.PenaltyRate' THEN 'YES' ELSE 'NO' END) AS \"PenaltyRate\", "
		    + "  MAX(CASE WHEN schemacode = 'ULBS.EarlyPaymentRebate' THEN 'YES' ELSE 'NO' END) AS \"EarlyPaymentRebate\", "
		    + "  MAX(CASE WHEN schemacode = 'PropertyTaxRate.PropertyTaxRate' THEN 'YES' ELSE 'NO' END) AS \"PropertyTaxCalculation\", "
		    + "  CASE "
		    + "    WHEN COUNT(DISTINCT schemacode) = 9 THEN 'YES' "
		    + "    ELSE 'NO' "
		    + "  END AS \"All_Complete\" "
		    + "FROM eg_mdms_data "
		    + "WHERE schemacode IN ( "
		    + "  'ULBS.Zones', "
		    + "  'ULBS.BuildingEstablishmentYear', "
		    + "  'ULBS.BuildingStructure', "
		    + "  'ULBS.BuildingPurpose', "
		    + "  'ULBS.BuildingUse', "
		    + "  'ULBS.OverAllRebate', "
		    + "  'ULBS.PenaltyRate', "
		    + "  'ULBS.EarlyPaymentRebate', "
		    + "  'PropertyTaxRate.PropertyTaxRate' "
		    + ") ";
		    


	private String addPaginationWrapper(String query, List<Object> preparedStmtList, PropertyCriteria criteria) {
		
		if (criteria.getIsSchedulerCall()) {
			return query;
		}

		Long limit = config.getDefaultLimit();
		Long offset = config.getDefaultOffset();
		String finalQuery = paginationWrapper.replace("{}", query);

		if (criteria.getLimit() != null && criteria.getLimit() <= config.getMaxSearchLimit())
			limit = criteria.getLimit();

		if (criteria.getLimit() != null && criteria.getLimit() > config.getMaxSearchLimit())
			limit = config.getMaxSearchLimit();

		if (criteria.getOffset() != null)
			offset = criteria.getOffset();

		preparedStmtList.add(offset);
		preparedStmtList.add(limit + offset);

		return finalQuery;
	}

	public String getPropertySearchQueryForDeafauterNotice(PropertyCriteria criteria, List<Object> preparedStmtList) {

		Boolean isEmpty = null == criteria.getLocality() || null == criteria.getPropertyType()
				|| criteria.getTenantId() == null;

		if (isEmpty)
			throw new CustomException("EG_PT_SEARCH_ERROR",
					" Please provide tenant, locality, propertyType for the property search for defaulter notice");
		String currYearS;

		int currYear = ((new Date().getYear()) + 1900);
		int currmonth = ((new Date().getMonth()) + 1);
		if (currmonth >= 1 && currmonth <= 3)
			currYearS = (String.valueOf(currYear - 1)) + "-" + (String.valueOf(currYear).substring(2, 4));
		else
			currYearS = (String.valueOf(currYear)) + "-" + (String.valueOf(currYear + 1).substring(2, 4));

		StringBuilder builder = new StringBuilder(PROPERTY_DEFAULTER_SEARCH);
		preparedStmtList.add(criteria.getTenantId());
		if (criteria.getPropertyType().equals("ALL"))
			preparedStmtList.add("%%");
		else
			preparedStmtList.add("%" + criteria.getPropertyType().toUpperCase() + "%");
		preparedStmtList.add(criteria.getLocality());
//		preparedStmtList.add(Status.ACTIVE.toString());
//		preparedStmtList.add(Status.ACTIVE.toString());
		preparedStmtList.add(currYearS);

		return builder.toString();
	}

	/**
	 * 
	 * @param criteria
	 * @param preparedStmtList
	 * @return
	 */
	public String getPropertySearchQuery(PropertyCriteria criteria, List<Object> preparedStmtList,
			Boolean isPlainSearch, Boolean onlyIds, Map<Integer, PropertyCriteria> propertyCriteriaMap) {

		Boolean isEmpty = CollectionUtils.isEmpty(criteria.getPropertyIds())
					&& CollectionUtils.isEmpty(criteria.getAcknowledgementIds())
					&& CollectionUtils.isEmpty(criteria.getOldpropertyids())
					&& CollectionUtils.isEmpty(criteria.getUuids())
					&& null == criteria.getMobileNumber()
					&& null == criteria.getName()
					&& null == criteria.getDoorNo()
					&& null == criteria.getOldPropertyId()
					&& null == criteria.getDocumentNumbers()
					&& null == criteria.getLocality()
					&& null == criteria.getPropertyType()
					&& (null == criteria.getFromDate() && null == criteria.getToDate())
					&& CollectionUtils.isEmpty(criteria.getCreationReason())
					&& StringUtils.isEmpty(criteria.getTenantId());
		
		if(isEmpty && !criteria.getIsSchedulerCall())
			throw new CustomException("EG_PT_SEARCH_ERROR"," No criteria given for the property search");
		
		StringBuilder builder = new StringBuilder();
		
		builder.append(QUERY);
		
		addClauseIfRequired(preparedStmtList, builder);
		builder.append(" 1 = ? ");
		preparedStmtList.add(1);
		
		String whereClause = "";
		if (null != propertyCriteriaMap && !propertyCriteriaMap.isEmpty()) {
			List<String> clause = new ArrayList<>();
			propertyCriteriaMap.entrySet().forEach(propertyCriteriaValue -> {
				clause.add(
						"(" + addWhereClause(propertyCriteriaValue.getValue(), preparedStmtList, isPlainSearch) + ")");
			});
			if (!CollectionUtils.isEmpty(clause) && !clause.contains("()")) {
				addClauseIfRequired(preparedStmtList, builder);
				whereClause = String.join(" OR ", clause);
			}
		} else {
			addClauseIfRequired(preparedStmtList, builder);
			whereClause = addWhereClause(criteria, preparedStmtList, isPlainSearch);
		}
		
		builder.append(whereClause);

		String withClauseQuery = WITH_CLAUSE_QUERY.replace(REPLACE_STRING, builder);
//		if (onlyIds || criteria.getIsRequestForCount() || StringUtils.isNotEmpty(criteria.getTenantId()))
//			return builder.toString();
//		else 
			return addPaginationWrapper(withClauseQuery, preparedStmtList, criteria);
	}

	private String addWhereClause(PropertyCriteria criteria, List<Object> preparedStmtList, Boolean isPlainSearch) {
		StringBuilder builder = new StringBuilder();
		builder.append(" 1 = ? ");
		preparedStmtList.add(1);
		if (isPlainSearch) {
			Set<String> tenantIds = criteria.getTenantIds();
			if (!CollectionUtils.isEmpty(tenantIds)) {
				addClauseIfRequired(preparedStmtList, builder);
				builder.append("property.tenantid IN (").append(createQuery(tenantIds)).append(")");
				addToPreparedStatement(preparedStmtList, tenantIds);
			}
		} else {
			String tenantId = criteria.getTenantId();

			if (tenantId != null) {
				if (tenantId.equalsIgnoreCase(config.getStateLevelTenantId())) {
					addClauseIfRequired(preparedStmtList, builder);
					builder.append(" property.tenantId LIKE ? ");
					preparedStmtList.add(tenantId + '%');
				} else {
					addClauseIfRequired(preparedStmtList, builder);
					builder.append(" property.tenantId= ? ");
					preparedStmtList.add(tenantId);
				}
			}
		}
		if (criteria.getFromDate() != null) {
			addClauseIfRequired(preparedStmtList, builder);
			// If user does NOT specify toDate, take today's date as the toDate by default
			if (criteria.getToDate() == null) {
				criteria.setToDate(Instant.now().toEpochMilli());
			}
			builder.append("property.createdTime BETWEEN ? AND ?");
			preparedStmtList.add(criteria.getFromDate());
			preparedStmtList.add(criteria.getToDate());
		} else {
			if (criteria.getToDate() != null) {
				throw new CustomException("INVALID SEARCH", "From Date should be mentioned first");
			}
		}

		Set<String> statusStringList = new HashSet<>();
		if (!CollectionUtils.isEmpty(criteria.getStatus())) {
			criteria.getStatus().forEach(status -> {
				statusStringList.add(status.toString());
			});
			addClauseIfRequired(preparedStmtList, builder);
			builder.append(" property.status IN ( ").append(createQuery(statusStringList)).append(" )");
			addToPreparedStatement(preparedStmtList, statusStringList);
		}

		Set<String> statusStringList2 = new HashSet<>();
		if (!CollectionUtils.isEmpty(criteria.getStatusList())) {
			criteria.getStatusList().forEach(status -> {
				statusStringList2.add(status.toString());
			});
			addClauseIfRequired(preparedStmtList, builder);
			builder.append(" property.status IN ( ").append(createQuery(statusStringList2)).append(" )");
			addToPreparedStatement(preparedStmtList, statusStringList2);
		}

		Set<String> channelStringList = new HashSet<>();
		if (!CollectionUtils.isEmpty(criteria.getChannels())) {
			criteria.getChannels().forEach(channel -> {
				channelStringList.add(channel.toString());
			});
			addClauseIfRequired(preparedStmtList, builder);
			builder.append(" property.channel IN ( ").append(createQuery(channelStringList)).append(" )");
			addToPreparedStatement(preparedStmtList, channelStringList);
		}

		Set<String> creationReasonsList = criteria.getCreationReason();
		if (!CollectionUtils.isEmpty(creationReasonsList)) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append("property.creationreason IN ( ").append(createQuery(creationReasonsList)).append(" )");
			addToPreparedStatement(preparedStmtList, creationReasonsList);
		}

		Set<String> documentNumberList = criteria.getDocumentNumbers();

		if (!CollectionUtils.isEmpty(documentNumberList)) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append(" property.status='ACTIVE' and owndoc.status='ACTIVE' and owndoc.documentuid  IN ( ")
					.append(createQuery(documentNumberList)).append(" )");
			addToPreparedStatement(preparedStmtList, documentNumberList);
		}

		if (null != criteria.getLocality()) {

			addClauseIfRequired(preparedStmtList, builder);
			builder.append("address.locality = ?");
			preparedStmtList.add(criteria.getLocality());
		}
		if (null != criteria.getDoorNo()) {

			addClauseIfRequired(preparedStmtList, builder);
			builder.append("address.doorno = ?");
			preparedStmtList.add(criteria.getDoorNo());
		}

		Set<String> propertyIds = criteria.getPropertyIds();
		if (!CollectionUtils.isEmpty(propertyIds)) {

			addClauseIfRequired(preparedStmtList, builder);
			builder.append("property.propertyid IN (").append(createQuery(propertyIds)).append(")");
			addToPreparedStatement(preparedStmtList, propertyIds);
		}

		Set<String> acknowledgementIds = criteria.getAcknowledgementIds();
		if (!CollectionUtils.isEmpty(acknowledgementIds)) {

			addClauseIfRequired(preparedStmtList, builder);
			builder.append("property.acknowldgementnumber IN (").append(createQuery(acknowledgementIds)).append(")");
			addToPreparedStatement(preparedStmtList, acknowledgementIds);
		}

		Set<String> uuids = criteria.getUuids();
		if (!CollectionUtils.isEmpty(uuids)) {

			addClauseIfRequired(preparedStmtList, builder);
			builder.append("property.id IN (").append(createQuery(uuids)).append(")");
			addToPreparedStatement(preparedStmtList, uuids);
		}

		Set<String> oldpropertyids = criteria.getOldpropertyids();
		if (!CollectionUtils.isEmpty(oldpropertyids)) {

			addClauseIfRequired(preparedStmtList, builder);
			builder.append("property.oldpropertyid IN (").append(createQuery(oldpropertyids)).append(")");
			addToPreparedStatement(preparedStmtList, oldpropertyids);
		}

		if (!CollectionUtils.isEmpty(criteria.getCreatedBy())) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append("property.createdBy IN (").append(createQuery(criteria.getCreatedBy())).append(")");
			addToPreparedStatement(preparedStmtList, criteria.getCreatedBy());
		}
		
		if (!CollectionUtils.isEmpty(criteria.getAdditionalDetailsPropertyIds())) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append("property.additionaldetails->>'propertyId' IN (")
					.append(createQuery(criteria.getAdditionalDetailsPropertyIds())).append(")");
			addToPreparedStatement(preparedStmtList, criteria.getAdditionalDetailsPropertyIds());
		}
		
		if (!CollectionUtils.isEmpty(criteria.getAddressAdditionalDetailsWardNumbers())) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append("address.additionaldetails->>'wardNumber' IN (")
					.append(createQuery(criteria.getAddressAdditionalDetailsWardNumbers())).append(")");
			addToPreparedStatement(preparedStmtList, criteria.getAddressAdditionalDetailsWardNumbers());
		}
		
		if (!CollectionUtils.isEmpty(criteria.getOwnerOldCustomerIds())) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append("owner.additionaldetails->>'ownerOldCustomerId' IN (")
					.append(createQuery(criteria.getOwnerOldCustomerIds())).append(")");
			addToPreparedStatement(preparedStmtList, criteria.getOwnerOldCustomerIds());
		}
		
		if (null != criteria.getName()) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append("owner.name = ?");
			preparedStmtList.add(criteria.getName());
		}
		
		if (null != criteria.getMobileNumber()) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append("owner.mobile_number = ?");
			preparedStmtList.add(criteria.getMobileNumber());
		}
		
		if (null !=criteria.getIsActiveUnit() && criteria.getIsActiveUnit()) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append("unit.active = ?");
			preparedStmtList.add(criteria.getIsActiveUnit());
		}
		
		
		
		return builder.toString();
	}

	public String getPropertyQueryForBulkSearch(PropertyCriteria criteria, List<Object> preparedStmtList,
			Boolean isPlainSearch) {

		Boolean isEmpty = CollectionUtils.isEmpty(criteria.getPropertyIds())
				&& CollectionUtils.isEmpty(criteria.getUuids());

		if (isEmpty)
			throw new CustomException("EG_PT_SEARCH_ERROR",
					" No propertyid or uuid given for the property Bulk search");

		StringBuilder builder = new StringBuilder(QUERY);

		if (isPlainSearch) {
			Set<String> tenantIds = criteria.getTenantIds();
			if (!CollectionUtils.isEmpty(tenantIds)) {
				addClauseIfRequired(preparedStmtList, builder);
				builder.append("property.tenantid IN (").append(createQuery(tenantIds)).append(")");
				addToPreparedStatement(preparedStmtList, tenantIds);
			}
		} else {
			String tenantId = criteria.getTenantId();
			if (tenantId != null) {
				if (tenantId.equalsIgnoreCase(config.getStateLevelTenantId())) {
					addClauseIfRequired(preparedStmtList, builder);
					builder.append(" property.tenantId LIKE ? ");
					preparedStmtList.add(tenantId + '%');
				} else {
					addClauseIfRequired(preparedStmtList, builder);
					builder.append(" property.tenantId= ? ");
					preparedStmtList.add(tenantId);
				}
			}
		}
		if (criteria.getFromDate() != null) {
			addClauseIfRequired(preparedStmtList, builder);
			// If user does NOT specify toDate, take today's date as the toDate by default
			if (criteria.getToDate() == null) {
				criteria.setToDate(Instant.now().toEpochMilli());
			}
			builder.append("property.createdTime BETWEEN ? AND ?");
			preparedStmtList.add(criteria.getFromDate());
			preparedStmtList.add(criteria.getToDate());
		} else {
			if (criteria.getToDate() != null) {
				throw new CustomException("INVALID SEARCH", "From Date should be mentioned first");
			}
		}

		Set<String> propertyIds = criteria.getPropertyIds();
		if (!CollectionUtils.isEmpty(propertyIds)) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append("property.propertyid IN (").append(createQuery(propertyIds)).append(")");
			addToPreparedStatementWithUpperCase(preparedStmtList, propertyIds);
		}

		Set<String> uuids = criteria.getUuids();
		if (!CollectionUtils.isEmpty(uuids)) {

			addClauseIfRequired(preparedStmtList, builder);
			builder.append("property.id IN (").append(createQuery(uuids)).append(")");
			addToPreparedStatement(preparedStmtList, uuids);
		}
		return addPaginationWrapper(builder.toString(), preparedStmtList, criteria);
	}

	public String getPropertyIdsQuery(Set<String> ownerIds, String tenantId, List<Object> preparedStmtList) {

		StringBuilder query = new StringBuilder("(");
		query.append(createQuery(ownerIds));
		addToPreparedStatement(preparedStmtList, ownerIds);
		query.append(")");

		StringBuilder propertyIdQuery = new StringBuilder(PROEPRTY_ID_QUERY.replace(REPLACE_STRING, query));

		if (tenantId.equalsIgnoreCase(config.getStateLevelTenantId())) {
			propertyIdQuery.append(AND_QUERY);
			propertyIdQuery.append(" tenantId LIKE ? ");
			preparedStmtList.add(tenantId + '%');
		} else {
			propertyIdQuery.append(AND_QUERY);
			propertyIdQuery.append(" tenantId= ? ");
			preparedStmtList.add(tenantId);
		}

		return propertyIdQuery.toString();
	}

	private String createQuery(Set<String> ids) {
		StringBuilder builder = new StringBuilder();
		int length = ids.size();
		for (int i = 0; i < length; i++) {
			builder.append(" ?");
			if (i != length - 1)
				builder.append(",");
		}
		return builder.toString();
	}

	private void addToPreparedStatement(List<Object> preparedStmtList, Set<String> ids) {
		ids.forEach(id -> {
			preparedStmtList.add(id);
		});
	}

	private void addToPreparedStatementWithUpperCase(List<Object> preparedStmtList, Set<String> ids) {
		ids.forEach(id -> {
			preparedStmtList.add(id.toUpperCase());
		});
	}

	private static void addClauseIfRequired(List<Object> values, StringBuilder queryString) {
		if (values.isEmpty())
			queryString.append(" WHERE ");
		else {
			queryString.append(" AND ");
		}
	}

	public String getpropertyAuditQuery() {
		return PROEPRTY_AUDIT_QUERY;
	}

	public String getTotalApplicationsCountQueryString(PropertyCriteria criteria, List<Object> preparedStatement) {
		preparedStatement.add(criteria.getTenantId());
		return TOTAL_APPLICATIONS_COUNT_QUERY;
	}

	public String getLastExecutionDetail(PropertyCriteria criteria, List<Object> preparedStatement) {
		preparedStatement.add(criteria.getTenantId());
		return LATEST_EXECUTED_MIGRATION_QUERY;
	}

	public String getpropertyAuditEncQuery() {
		return PROPERTY_AUDIT_ENC_QUERY;
	}

	public String getTaxCalculatedPropertiesSearchQuery(
			PtTaxCalculatorTrackerSearchCriteria criteria, List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder(PT_TAX_CALCULATOR_TRACKER_SEARCH_QUERY);

		builder.append(" WHERE 1 = 1 ");

		if (!StringUtils.isEmpty(criteria.getTenantId())) {
			String tenantId = criteria.getTenantId();

			String[] tenantIdChunks = tenantId.split("\\.");

			if (tenantIdChunks.length == 1) {
				andClauseIfRequired(preparedStmtList, builder);
				builder.append(" eptct.tenantid LIKE ? ");
				preparedStmtList.add(criteria.getTenantId() + '%');
			} else {
				andClauseIfRequired(preparedStmtList, builder);
				builder.append(" eptct.tenantid=? ");
				preparedStmtList.add(criteria.getTenantId());
			}
		}

		if (!CollectionUtils.isEmpty(criteria.getTenantIds())) {
			andClauseIfRequired(preparedStmtList, builder);
			builder.append(" eptct.tenantid IN (").append(createQuery(criteria.getTenantIds())).append(")");
			addToPreparedStatement(preparedStmtList, criteria.getTenantIds());
		}
		if (!CollectionUtils.isEmpty(criteria.getUuids())) {
			andClauseIfRequired(preparedStmtList, builder);
			builder.append(" eptct.uuid IN (").append(createQuery(criteria.getUuids())).append(")");
			addToPreparedStatement(preparedStmtList, criteria.getUuids());
		}
		if (!CollectionUtils.isEmpty(criteria.getPropertyIds())) {
			andClauseIfRequired(preparedStmtList, builder);
			builder.append(" eptct.propertyid IN (").append(createQuery(criteria.getPropertyIds())).append(")");
			addToPreparedStatement(preparedStmtList, criteria.getPropertyIds());
		}
		if (!CollectionUtils.isEmpty(criteria.getFinancialYears())) {
			andClauseIfRequired(preparedStmtList, builder);
			builder.append(" eptct.financialyear IN (").append(createQuery(criteria.getFinancialYears())).append(")");
			addToPreparedStatement(preparedStmtList, criteria.getFinancialYears());
		}
		if (!CollectionUtils.isEmpty(criteria.getBillStatus())) {
			andClauseIfRequired(preparedStmtList, builder);
			Set<String> billStatus = criteria.getBillStatus().stream().map(BillStatus::name)
					.collect(Collectors.toSet());
			builder.append(" eptct.bill_status IN (").append(createQuery(billStatus)).append(")");
			addToPreparedStatement(preparedStmtList, billStatus);
		}
		if (!CollectionUtils.isEmpty(criteria.getNotInBillStatus())) {
			andClauseIfRequired(preparedStmtList, builder);
			Set<String> notInBillStatus = criteria.getNotInBillStatus().stream().map(BillStatus::name)
					.collect(Collectors.toSet());
			builder.append(" eptct.bill_status NOT IN (").append(createQuery(notInBillStatus)).append(")");
			addToPreparedStatement(preparedStmtList, notInBillStatus);
		}

		return builder.toString();
	}
	
	public String getTaxCalculatedTenantIdsSearchQuery(PtTaxCalculatorTrackerSearchCriteria criteria,
			List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder(PT_TAX_CALCULATOR_TRACKER_TENANT_ID_SEARCH_QUERY);

		builder.append(" WHERE 1 = 1 ");

		if (!CollectionUtils.isEmpty(criteria.getBillStatus())) {
			andClauseIfRequired(preparedStmtList, builder);
			Set<String> billStatus = criteria.getBillStatus().stream().map(BillStatus::name)
					.collect(Collectors.toSet());
			builder.append(" eptct.bill_status IN (").append(createQuery(billStatus)).append(")");
			addToPreparedStatement(preparedStmtList, billStatus);
		}
		
		if (!CollectionUtils.isEmpty(criteria.getNotInBillStatus())) {
			andClauseIfRequired(preparedStmtList, builder);
			Set<String> notInBillStatus = criteria.getNotInBillStatus().stream().map(BillStatus::name)
					.collect(Collectors.toSet());
			builder.append(" eptct.bill_status NOT IN (").append(createQuery(notInBillStatus)).append(")");
			addToPreparedStatement(preparedStmtList, notInBillStatus);
		}

		return builder.toString();
	}
	
	private static void andClauseIfRequired(List<Object> values, StringBuilder queryString) {
		queryString.append(" AND");
	}
	
	public String getStatusBasedCountQuery(TotalCountRequest totalCountRequest,List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder();
		builder.append(COUNT_STATUS_BASED_QUERY);
		builder.append(" WHERE 1 = 1 ");
		if (!StringUtils.isEmpty(totalCountRequest.getTenantId())) {
			andClauseIfRequired(preparedStmtList, builder);
			builder.append(" property.tenantId = ? ");
			preparedStmtList.add(totalCountRequest.getTenantId());
		}
		return builder.toString();
	}

	public String getOwnerSearchQuery(List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder();
		builder.append(PROPERTY_OWNERS_SEARCH_QUERY);

		return builder.toString();
	}
	
	public String getLimitAndOrderByUpdatedTimeDesc(PtTaxCalculatorTrackerSearchCriteria criteria, String query,
			List<Object> preparedStmtList) {
		StringBuilder queryBuilder = new StringBuilder(query);
		if (null != criteria.getLimit()) {
			queryBuilder.append(" order by eptct.createdtime desc ");
			queryBuilder.append(" limit ? ");
			preparedStmtList.add(criteria.getLimit());
		}

		return queryBuilder.toString();
	}

	public String checkLastCreatedTime(PtTaxCalculatorTrackerSearchCriteria ptTaxCalculatorTrackerSearchCriteria,
			String query, List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder(query);

		if (!query.contains("WHERE"))
			builder.append(" WHERE ");
		else
			builder.append(" AND ");

		builder.append(" eptct.createdtime >= ? ");
		preparedStmtList.add(ptTaxCalculatorTrackerSearchCriteria.getStartDateTime());
		if (null != ptTaxCalculatorTrackerSearchCriteria.getEndDateTime()) {
			builder.append(" AND ");
			builder.append(" eptct.createdtime <= ? ");
			preparedStmtList.add(ptTaxCalculatorTrackerSearchCriteria.getEndDateTime());
		}

		return builder.toString();
	}
	
	public String getPropertyMastersStatusQuery(String ulbName, List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder();
		builder.append(CHECK_PROPERTY_MASTER_STATUS_QUERY);
//		builder.append(" WHERE 1 = 1 ");
		if (!StringUtils.isEmpty(ulbName)) {
			andClauseIfRequired(preparedStmtList, builder);
			builder.append(" data->>'ulbName' = ? ");
			preparedStmtList.add(ulbName);
		}
		// add group by and 
		builder.append(" GROUP BY data->>'ulbName' ORDER BY ulb_name;");

		return builder.toString();
	}

}
