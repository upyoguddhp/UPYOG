package org.upyog.chb.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
<<<<<<< HEAD
import org.springframework.beans.factory.annotation.Autowired;
=======
>>>>>>> niua-upstream/niua-dev-2.0
import org.springframework.stereotype.Service;
import org.upyog.chb.constants.CommunityHallBookingConstants;
import org.upyog.chb.util.EncryptionDecryptionUtil;
import org.upyog.chb.web.models.ApplicantDetail;
<<<<<<< HEAD
import org.upyog.chb.web.models.CommunityHallBookingDetail;
import org.upyog.chb.web.models.CommunityHallBookingRequest;
=======
import org.upyog.chb.web.models.VenueBookingDetail;
import org.upyog.chb.web.models.VenueBookingRequest;
>>>>>>> niua-upstream/niua-dev-2.0

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class CHBEncryptionService {

<<<<<<< HEAD
	@Autowired
	private EncryptionDecryptionUtil encryptionDecryptionUtil;

	public CommunityHallBookingDetail encryptObject(CommunityHallBookingRequest bookingRequest) {
		ApplicantDetail applicantDetail = bookingRequest.getHallsBookingApplication().getApplicantDetail();
		log.info("Applicant detail before encyption : " + applicantDetail);
		applicantDetail = encryptionDecryptionUtil.encryptObject(applicantDetail,
				CommunityHallBookingConstants.CHB_APPLICANT_DETAIL_ENCRYPTION_KEY, ApplicantDetail.class);
		log.info("Applicant detail after encyption : " + applicantDetail);
		bookingRequest.getHallsBookingApplication().setApplicantDetail(applicantDetail);
		return bookingRequest.getHallsBookingApplication();
	}
	
	
	public CommunityHallBookingDetail decryptObject(CommunityHallBookingDetail bookingDetail, RequestInfo requestInfo) {
		ApplicantDetail applicantDetail = bookingDetail.getApplicantDetail();
		log.info("Applicant detail before decryption : " + applicantDetail);
		applicantDetail = encryptionDecryptionUtil.decryptObject(applicantDetail, 
				CommunityHallBookingConstants.CHB_APPLICANT_DETAIL_PLAIN_DECRYPTION_KEY, ApplicantDetail.class, requestInfo);
				
		log.info("Applicant detail after decryption : " + applicantDetail);
=======
	private final EncryptionDecryptionUtil encryptionDecryptionUtil;

	public CHBEncryptionService(EncryptionDecryptionUtil encryptionDecryptionUtil) {
		this.encryptionDecryptionUtil = encryptionDecryptionUtil;
	}

	public VenueBookingDetail encryptObject(VenueBookingRequest bookingRequest) {
		ApplicantDetail applicantDetail = bookingRequest.getVenueBookingApplication().getApplicantDetail();
		log.info("Applicant detail before encyption : " + applicantDetail.getApplicantMobileNo());
		applicantDetail = encryptionDecryptionUtil.encryptObject(applicantDetail,
				CommunityHallBookingConstants.CHB_APPLICANT_DETAIL_ENCRYPTION_KEY, ApplicantDetail.class);
		log.info("Applicant detail after encyption : " + applicantDetail.getApplicantMobileNo());
		bookingRequest.getVenueBookingApplication().setApplicantDetail(applicantDetail);
		return bookingRequest.getVenueBookingApplication();
	}
	
	
	public VenueBookingDetail decryptObject(VenueBookingDetail bookingDetail, RequestInfo requestInfo) {
		ApplicantDetail applicantDetail = bookingDetail.getApplicantDetail();
		log.info("Applicant detail before decryption : " + applicantDetail.getApplicantMobileNo());
		applicantDetail = encryptionDecryptionUtil.decryptObject(applicantDetail, 
				CommunityHallBookingConstants.CHB_APPLICANT_DETAIL_PLAIN_DECRYPTION_KEY, ApplicantDetail.class, requestInfo);
				
		log.info("Applicant detail after decryption : " + applicantDetail.getApplicantMobileNo());
>>>>>>> niua-upstream/niua-dev-2.0
		bookingDetail.setApplicantDetail(applicantDetail);

		return bookingDetail;
	}
	
<<<<<<< HEAD
	public List<CommunityHallBookingDetail> decryptObject(List<CommunityHallBookingDetail> bookingDetails, RequestInfo requestInfo) {
		Map<String, CommunityHallBookingDetail> applicantDetailMap = bookingDetails.stream().collect(
				Collectors.toMap(CommunityHallBookingDetail::getBookingId, Function.identity()));
		
		List<ApplicantDetail> applicantDetails = bookingDetails.stream().map(detail -> detail.getApplicantDetail()).collect(Collectors.toList());
		
		log.info("Applicant detail before decryption : " + applicantDetails);
		applicantDetails = encryptionDecryptionUtil.decryptObject(applicantDetails, 
				CommunityHallBookingConstants.CHB_APPLICANT_DETAIL_PLAIN_DECRYPTION_KEY, ApplicantDetail.class, requestInfo);
		
		applicantDetails.stream().forEach( detail ->{
=======
	public List<VenueBookingDetail> decryptObject(List<VenueBookingDetail> bookingDetails, RequestInfo requestInfo) {
		Map<String, VenueBookingDetail> applicantDetailMap = bookingDetails.stream().collect(
				Collectors.toMap(VenueBookingDetail::getBookingId, Function.identity()));
		
		List<ApplicantDetail> applicantDetails = bookingDetails.stream().map(VenueBookingDetail::getApplicantDetail).toList();
		
		log.info("Applicant detail before decryption : " + applicantDetails.get(0).getApplicantMobileNo());
		applicantDetails = encryptionDecryptionUtil.decryptObject(applicantDetails, 
				CommunityHallBookingConstants.CHB_APPLICANT_DETAIL_PLAIN_DECRYPTION_KEY, ApplicantDetail.class, requestInfo);
		
		applicantDetails.forEach(detail -> {
>>>>>>> niua-upstream/niua-dev-2.0
			if(applicantDetailMap.containsKey(detail.getBookingId())) {
				applicantDetailMap.get(detail.getBookingId()).setApplicantDetail(detail);
			}
		});
				
<<<<<<< HEAD
		log.info("Applicant detail after decryption : " + applicantDetails);
		//bookingDetail.setApplicantDetail(applicantDetail);
=======
		log.info("Applicant detail after decryption : " + applicantDetails.get(0).getApplicantMobileNo());
>>>>>>> niua-upstream/niua-dev-2.0

		return bookingDetails;
	}

}
