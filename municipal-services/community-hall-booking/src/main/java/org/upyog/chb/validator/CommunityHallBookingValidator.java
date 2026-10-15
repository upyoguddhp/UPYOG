package org.upyog.chb.validator;

<<<<<<< HEAD
import java.util.Arrays;
import java.util.Date;
import java.util.LinkedList;
import java.util.List;
=======
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
>>>>>>> niua-upstream/niua-dev-2.0

import org.apache.commons.lang.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
<<<<<<< HEAD
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.upyog.chb.config.CommunityHallBookingConfiguration;
import org.upyog.chb.constants.CommunityHallBookingConstants;
import org.upyog.chb.web.models.BookingSlotDetail;
import org.upyog.chb.web.models.CommunityHallBookingRequest;
import org.upyog.chb.web.models.CommunityHallBookingSearchCriteria;
=======
import org.springframework.stereotype.Component;
import org.upyog.chb.config.CommunityHallBookingConfiguration;
import org.upyog.chb.constants.CommunityHallBookingConstants;
import org.upyog.chb.util.CommunityHallBookingUtil;
import org.upyog.chb.web.models.BookingSlotDetail;
import org.upyog.chb.web.models.VenueBookingDetail;
import org.upyog.chb.web.models.VenueBookingRequest;
import org.upyog.chb.web.models.VenueBookingSearchCriteria;
>>>>>>> niua-upstream/niua-dev-2.0

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CommunityHallBookingValidator {

<<<<<<< HEAD
	@Autowired
	private MDMSValidator mdmsValidator;

	@Autowired
	private CommunityHallBookingConfiguration config;

	/**
	 * TODO: uncomment validation after adding data to MDMS
	 * 
	 * @param bookingRequest
	 * @param mdmsData
	 */
	public void validateCreate(CommunityHallBookingRequest bookingRequest, Object mdmsData) {
		log.info("validating master data for create booking request for applicant mobile no : " + bookingRequest.getHallsBookingApplication()
		.getApplicantDetail().getApplicantMobileNo());
		if(!isSameHallCode(bookingRequest.getHallsBookingApplication().getBookingSlotDetails())) {
			throw new CustomException(CommunityHallBookingConstants.MULTIPLE_HALL_CODES_ERROR, "Booking of multiple halls are not allowed");
		}
		 mdmsValidator.validateMdmsData(bookingRequest, mdmsData);
		 validateDuplicateDocuments(bookingRequest);
	}

	public void validateUpdate(CommunityHallBookingRequest bookingRequest, Object mdmsData) {
		log.info("validating master data for update  booking request for  applicant mobile no : " + bookingRequest.getHallsBookingApplication()
		.getApplicantDetail().getApplicantMobileNo());
		mdmsValidator.validateMdmsData(bookingRequest, mdmsData);
	}

	/**
	 * TODO: add slot and document validation here
	 * 
	 * @param bookingRequest
	 */
	private void validateDuplicateDocuments(CommunityHallBookingRequest bookingRequest) {
		if (bookingRequest.getHallsBookingApplication().getUploadedDocumentDetails() != null) {
			List<String> documentFileStoreIds = new LinkedList<String>();
			bookingRequest.getHallsBookingApplication().getUploadedDocumentDetails().forEach(document -> {
=======
	private final MDMSValidator mdmsValidator;
	private final CommunityHallBookingConfiguration config;

	public CommunityHallBookingValidator(MDMSValidator mdmsValidator,
			CommunityHallBookingConfiguration config) {
		this.mdmsValidator = mdmsValidator;
		this.config = config;
	}

	public void validateCreate(VenueBookingRequest bookingRequest, Object mdmsData,Object venueOTypeMasterData) {
		String mobileNo = null;
		try {
			if (bookingRequest != null && bookingRequest.getVenueBookingApplication() != null
					&& bookingRequest.getVenueBookingApplication().getApplicantDetail() != null) {
				mobileNo = bookingRequest.getVenueBookingApplication().getApplicantDetail().getApplicantMobileNo();
			}
		} catch (Exception ex) {
			// ignore
		}
		log.info("validating master data for create booking request for applicant mobile no : " + mobileNo);

		if (!isSameHallCode(bookingRequest.getVenueBookingApplication().getBookingSlotDetails())) {
			throw new CustomException(CommunityHallBookingConstants.MULTIPLE_HALL_CODES_ERROR,
					"Booking of multiple halls are not allowed.");
		}
		
		if(!validateBookingDate(bookingRequest.getVenueBookingApplication().getBookingSlotDetails())) {
			throw new CustomException(CommunityHallBookingConstants.INVALID_BOOKING_DATE,
					"Booking date is not valid.");
		}
	
		mdmsValidator.validateMdmsData(bookingRequest, mdmsData,venueOTypeMasterData);
		validateDuplicateDocuments(bookingRequest);
	}

	
	public void validateUpdate(VenueBookingDetail bookingDetailFromRequest, VenueBookingDetail bookingDetailFromDB) {
		log.info("validating master data for update booking request for booking no : {} with current status : {}",
				bookingDetailFromRequest.getBookingNo(), bookingDetailFromDB.getBookingStatus());
	}
	
	private boolean validateBookingDate(List<BookingSlotDetail> bookingSlotDetails) {
		LocalDate currentDate = CommunityHallBookingUtil.getCurrentDate();
		return bookingSlotDetails.stream().anyMatch(slotDetail ->
		currentDate.isBefore(slotDetail.getBookingDate()));
	}

	private void validateDuplicateDocuments(VenueBookingRequest bookingRequest) {
		if (bookingRequest.getVenueBookingApplication().getUploadedDocumentDetails() != null) {
			List<String> documentFileStoreIds = new LinkedList<>();
			bookingRequest.getVenueBookingApplication().getUploadedDocumentDetails().forEach(document -> {
>>>>>>> niua-upstream/niua-dev-2.0
				if (documentFileStoreIds.contains(document.getFileStoreId()))
					throw new CustomException(CommunityHallBookingConstants.DUPLICATE_DOCUMENT_UPLOADED, "Same document cannot be used multiple times");
				else
					documentFileStoreIds.add(document.getFileStoreId());
			});
<<<<<<< HEAD
=======
		} else {
			throw new CustomException(CommunityHallBookingConstants.EMPTY_DOCUMENT_ERROR, "Documents are mandatory for booking.");
>>>>>>> niua-upstream/niua-dev-2.0
		}
	}

	/**
<<<<<<< HEAD
	 * Validates if the search parameters are valid
	 * 
	 * @param requestInfo The requestInfo of the incoming request
	 * @param criteria    The CommunityHallBookingSearchCriteria Criteria
	 */
	// TODO need to make the changes in the data
	public void validateSearch(RequestInfo requestInfo, CommunityHallBookingSearchCriteria criteria) {
		log.info("Validating search request for criteria " + criteria);
		String userType = requestInfo.getUserInfo().getType();
		
		
=======
	 * Validates booking search requests for role-based access, allowed parameters, and date range.
	 *
	 * @param requestInfo caller context (citizen vs employee)
	 * @param criteria search filters supplied by the API consumer
	 * @throws CustomException when search parameters are invalid or not permitted
	 */
	public void validateSearch(RequestInfo requestInfo, VenueBookingSearchCriteria criteria) {
		log.info("Validating search request for criteria " + criteria);

		validateSearchAccess(requestInfo, criteria);
		validateAllowedSearchConfiguration(criteria);
		validateSearchDateRange(criteria);
	}
	
	/**
	 * Enforces tenant and empty-search rules based on the caller type.
	 *
	 * @param requestInfo caller context (citizen vs employee)
	 * @param criteria search filters supplied by the API consumer
	 * @throws CustomException when mandatory tenant information is missing or search is too broad
	 */
	private void validateSearchAccess(RequestInfo requestInfo, VenueBookingSearchCriteria criteria) {
>>>>>>> niua-upstream/niua-dev-2.0
		if (!requestInfo.getUserInfo().getType().equalsIgnoreCase(CommunityHallBookingConstants.CITIZEN) && criteria.isEmpty())
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH, "Search without any paramters is not allowed");

		if (!requestInfo.getUserInfo().getType().equalsIgnoreCase(CommunityHallBookingConstants.CITIZEN) && !criteria.tenantIdOnly()
				&& criteria.getTenantId() == null)
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH, "TenantId is mandatory in search");

		if (requestInfo.getUserInfo().getType().equalsIgnoreCase(CommunityHallBookingConstants.CITIZEN) && !criteria.isEmpty()
				&& !criteria.tenantIdOnly() && criteria.getTenantId() == null)
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH, "TenantId is mandatory in search");
<<<<<<< HEAD
			

		String allowedParamStr = null;

		if (!userType.equalsIgnoreCase(CommunityHallBookingConstants.EMPLOYEE))
			allowedParamStr = config.getAllowedEmployeeSearchParameters();
		else if (userType.equalsIgnoreCase(CommunityHallBookingConstants.EMPLOYEE))
			allowedParamStr = config.getAllowedEmployeeSearchParameters();
		else
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH,
					"The userType: " + requestInfo.getUserInfo().getType() + " does not have any search config");

		if (StringUtils.isEmpty(allowedParamStr) && !criteria.isEmpty())
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH,
					"No search parameters are expected");
		else {
			List<String> allowedParams = Arrays.asList(allowedParamStr.split(","));
			validateSearchParams(criteria, allowedParams);
		}
	}

	/**
	 * Validates if the paramters coming in search are allowed
	 * 
	 * @param criteria      CHB search criteria
	 * @param allowedParams Allowed Params for search
	 */
	private void validateSearchParams(CommunityHallBookingSearchCriteria criteria, List<String> allowedParams) {
=======
	}

	/**
	 * Validates employee search criteria against configured allowed parameter names.
	 *
	 * @param criteria search filters supplied by the API consumer
	 * @throws CustomException when unsupported search parameters are provided
	 */
	private void validateAllowedSearchConfiguration(VenueBookingSearchCriteria criteria) {
		String allowedParamStr = config.getAllowedEmployeeSearchParameters();
		if (StringUtils.isEmpty(allowedParamStr) && !criteria.isEmpty()) {
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH,
					"No search parameters are expected");
		}
		log.info("allowedParamStr {} in validateAllowedSearchConfiguration", allowedParamStr);
		List<String> allowedParams = Arrays.asList(allowedParamStr.split(","));
		validateSearchParams(criteria, allowedParams);
	}

	private void validateSearchDateRange(VenueBookingSearchCriteria criteria) {
		if (criteria.getFromDate() != null) {
			LocalDate fromDate = CommunityHallBookingUtil.parseStringToLocalDate(criteria.getFromDate());
			if (fromDate.isAfter(LocalDate.now(ZoneId.systemDefault()))) {
				throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH,
						"From date cannot be a future date");
			}
			if (fromDate.isBefore(CommunityHallBookingUtil.getMonthsAgo(6))) {
				throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH,
						"From date cannot be prior 6 months");
			}
		}

		if (criteria.getToDate() != null && criteria.getFromDate() != null) {
			LocalDate fromDate = CommunityHallBookingUtil.parseStringToLocalDate(criteria.getFromDate());
			LocalDate toDate = CommunityHallBookingUtil.parseStringToLocalDate(criteria.getToDate());
			if (toDate.isBefore(fromDate)) {
				throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH,
						"To date cannot be prior to from date");
			}
		}
	}

	private void validateSearchParams(VenueBookingSearchCriteria criteria, List<String> allowedParams) {
>>>>>>> niua-upstream/niua-dev-2.0
		log.info("Validating search params for allowedParams " + allowedParams);

		if (criteria.getBookingNo() != null && !allowedParams.contains("bookingNo"))
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH,
					"Search on booking no is not allowed");

		if (criteria.getStatus() != null && !allowedParams.contains("status"))
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH, "Search on Status is not allowed");

		if (criteria.getBookingIds() != null && !allowedParams.contains("ids"))
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH, "Search on ids is not allowed");

		if (criteria.getOffset() != null && !allowedParams.contains("offset"))
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH, "Search on offset is not allowed");

		if (criteria.getLimit() != null && !allowedParams.contains("limit"))
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH, "Search on limit is not allowed");
		
		if (criteria.getMobileNumber() != null && !allowedParams.contains("mobileNumber"))
<<<<<<< HEAD
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH, "Search on mobiloe number is not allowed");

		if (criteria.getFromDate() != null  && (criteria.getFromDate() > new Date().getTime()))
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH,
					"From date cannot be a future date");

		if (criteria.getToDate() != null && criteria.getFromDate() != null
				&& (criteria.getFromDate() > criteria.getToDate()))
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH,
					"To date cannot be prior to from date");
	}
	
	public boolean isSameHallCode(List<BookingSlotDetail> bookingSlotDetails) {
		String hallCode = bookingSlotDetails.get(0).getHallCode();
		boolean allSameCode = bookingSlotDetails.stream().allMatch(x -> x.getHallCode().equals(hallCode));
		return allSameCode;

=======
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH, "Search on mobile number is not allowed");
		
		if (criteria.getVenueCode() != null && !allowedParams.contains("venueCode"))
			throw new CustomException(CommunityHallBookingConstants.INVALID_SEARCH, "Search on venue name is not allowed");
	}
	
	public boolean isSameHallCode(List<BookingSlotDetail> bookingSlotDetails) {
		String hallCode = bookingSlotDetails.get(0).getUnitCode();
		return bookingSlotDetails.stream().allMatch(x -> x.getUnitCode().equals(hallCode));
>>>>>>> niua-upstream/niua-dev-2.0
	}

}
