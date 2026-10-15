package org.egov.ptr.repository.rowmapper;

import org.egov.ptr.models.*;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * RowMapper class responsible for mapping result set data to PetRegistrationApplication objects.
 */
@Component
public class PetApplicationRowMapper implements ResultSetExtractor<List<PetRegistrationApplication>> {

<<<<<<< HEAD
    @Autowired
    private ObjectMapper mapper;
    
=======
	/**
	 * Extracts data from the ResultSet and maps it to a list of PetRegistrationApplication objects.
	 *
	 * @param rs The ResultSet containing database query results.
	 * @return A list of mapped PetRegistrationApplication objects.
	 * @throws SQLException If an SQL error occurs.
	 * @throws DataAccessException If a data access error occurs.
	 */
>>>>>>> niua-upstream/niua-dev-2.0
	public List<PetRegistrationApplication> extractData(ResultSet rs) throws SQLException, DataAccessException {

		Map<String, PetRegistrationApplication> petRegistrationApplicationMap = new LinkedHashMap<>();
		while (rs.next()) {
			String uuid = rs.getString("papplicationnumber");
			PetRegistrationApplication petRegistrationApplication = petRegistrationApplicationMap.get(uuid);

			if (petRegistrationApplication == null) {

				Long lastModifiedTime = rs.getLong("plastModifiedTime");
				if (rs.wasNull()) {
					lastModifiedTime = null;
				}
// Creating audit details for the application
				AuditDetails auditdetails = AuditDetails.builder().createdBy(rs.getString("pcreatedBy"))
						.createdTime(rs.getLong("pcreatedTime")).lastModifiedBy(rs.getString("plastModifiedBy"))
						.lastModifiedTime(lastModifiedTime).build();
<<<<<<< HEAD
				PetDetails petdetails = PetDetails.builder().id(rs.getString("ptid")).petName(rs.getString("ptpetName"))
						.petType(rs.getString("ptpetType")).breedType(rs.getString("ptbreedType"))
						.clinicName(rs.getString("ptclinicName")).doctorName(rs.getString("ptdoctorName"))
						.lastVaccineDate(rs.getString("ptlastVaccineDate"))
						.vaccinationNumber(rs.getString("ptvaccinationNumber")).petAge(rs.getString("ptpetAge"))
						.petGender(rs.getString("ptpetGender")).petDetailsId(rs.getString("ptpetdetails")).build();


				petRegistrationApplication = PetRegistrationApplication.builder()
						.applicationNumber(rs.getString("papplicationnumber")).tenantId(rs.getString("ptenantid"))
						.id(rs.getString("pid")).applicantName(rs.getString("papplicantname"))
						.fatherName(rs.getString("pfathername")).emailId(rs.getString("pemailId"))
						.mobileNumber(rs.getString("pmobileNumber")).petDetails(petdetails).auditDetails(auditdetails)
						.aadharNumber(rs.getString("paadharnumber")).status(rs.getString("pstatus")).isBannedPet(rs.getBoolean("pis_banned_pet")).build();
=======
				// Mapping pet details from the result set
				PetDetails petdetails = PetDetails.builder()
					    .id(rs.getString("ptid"))
					    .petName(rs.getString("ptpetname"))
					    .petType(rs.getString("ptpettype"))
					    .breedType(rs.getString("ptbreedtype"))
					    .clinicName(rs.getString("ptclinicname"))
					    .doctorName(rs.getString("ptdoctorname"))
					    .lastVaccineDate(rs.getString("ptlastvaccinedate"))
					    .vaccinationNumber(rs.getString("ptvaccinationnumber"))
					    .petAge(rs.getString("ptpetage"))
					    .petGender(rs.getString("ptpetgender"))
					    .petColor(rs.getString("ptpetcolor"))
					    .adoptionDate(rs.getLong("ptadoptiondate"))  
					    .birthDate(rs.getLong("ptbirthdate"))        
					    .identificationMark(rs.getString("ptidentificationmark"))
					    .build();
				// Creating a new PetRegistrationApplication object
					petRegistrationApplication = PetRegistrationApplication.builder()
					    .applicationNumber(rs.getString("papplicationnumber"))
					    .tenantId(rs.getString("ptenantid"))
					    .id(rs.getString("pid"))
					    .applicantName(rs.getString("papplicantname"))
					    .fatherName(rs.getString("pfathername"))
					    .emailId(rs.getString("pemailid"))
					    .mobileNumber(rs.getString("pmobilenumber"))
					    .applicationType(rs.getString("papplicationtype"))
					    .validityDate(rs.getLong("pvaliditydate"))  
					    .status(rs.getString("pstatus"))
					    .expireFlag(rs.getBoolean("pexpireflag"))
					    .petToken(rs.getString("ppettoken"))
					    .previousApplicationNumber(rs.getString("ppreviousapplicationnumber"))
					    .propertyId(rs.getString("ppropertyid"))
					    .petDetails(petdetails)
					    .auditDetails(auditdetails)
					    .build();

>>>>>>> niua-upstream/niua-dev-2.0
				addDocToPetApplication(rs, petRegistrationApplication);

				PGobject pgObj = (PGobject) rs.getObject("padditionaldetail");
				if (pgObj != null) {
					JsonNode additionalDetail = null;
					try {
						additionalDetail = mapper.readTree(pgObj.getValue());
					} catch (JsonMappingException e) {
						e.printStackTrace();
					} catch (JsonProcessingException e) {
						e.printStackTrace();
					}
					petRegistrationApplication.setAdditionalDetail(additionalDetail);
				}
	            

			} else {
				addDocToPetApplication(rs, petRegistrationApplication);
			}
			addPetRegistrationDetails(rs, petRegistrationApplication);
			petRegistrationApplicationMap.put(uuid, petRegistrationApplication);
		}
		return new ArrayList<>(petRegistrationApplicationMap.values());
	}

	/**
	 * Adds additional pet registration details to the application.
	 */
	private void addPetRegistrationDetails(ResultSet rs, PetRegistrationApplication petRegistrationApplication)
			throws SQLException {
		addAddressToApplication(rs, petRegistrationApplication);
	}

	/**
	 * Maps address details from the result set to the application object.
	 */
	private void addAddressToApplication(ResultSet rs, PetRegistrationApplication petRegistrationApplication)
			throws SQLException {
		Address address = Address.builder().id(rs.getString("aid")).tenantId(rs.getString("atenantid"))
				.doorNo(rs.getString("adoorno")).latitude(rs.getDouble("alatitude"))
				.longitude(rs.getDouble("alongitude")).buildingName(rs.getString("abuildingname"))
				.addressId(rs.getString("aaddressid")).addressNumber(rs.getString("aaddressnumber"))
				.type(rs.getString("atype")).addressLine1(rs.getString("aaddressline1"))
				.addressLine2(rs.getString("aaddressline2")).landmark(rs.getString("alandmark"))
				.street(rs.getString("astreet")).city(rs.getString("acity")).pincode(rs.getString("apincode"))
				.detail("adetail").registrationId(rs.getString("aregistrationid")).locality(Boundary.builder().code(rs.getString("alocality")).build()).build();

		petRegistrationApplication.setAddress(address);
	}

	/**
	 * Adds document details to the PetRegistrationApplication if they are not already present.
	 */
	private void addDocToPetApplication(ResultSet rs, PetRegistrationApplication petApplication) throws SQLException {
		String docId = rs.getString("did");
		List<Document> docs = petApplication.getDocuments();

		if (docId == null)
			return;

		if (!CollectionUtils.isEmpty(docs))
			for (Document doc : docs) {
				if (doc.getId().equals(docId))
					return;
			}

		AuditDetails auditdetails = AuditDetails.builder().createdBy(rs.getString("dcreatedBy"))
				.createdTime(rs.getLong("dcreatedTime")).lastModifiedBy(rs.getString("dlastModifiedBy"))
				.lastModifiedTime(rs.getLong("dlastModifiedTime")).build();
		Document doc = Document.builder().documentType(rs.getString("documentType")).active(rs.getBoolean("dactive")).tenantId(rs.getString("dtenantid"))
				.filestoreId(rs.getString("dfilestoreId")).documentUid(rs.getString("ddocumentUid")).id(docId).auditDetails(auditdetails).build();

		petApplication.addDocumentsItem(doc);
	}
}