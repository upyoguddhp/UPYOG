package org.upyog.chb.util;

import java.util.ArrayList;
<<<<<<< HEAD
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
=======
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
>>>>>>> niua-upstream/niua-dev-2.0

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.json.JSONObject;
<<<<<<< HEAD
import org.springframework.beans.factory.annotation.Autowired;
=======
>>>>>>> niua-upstream/niua-dev-2.0
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.upyog.chb.config.CommunityHallBookingConfiguration;
import org.upyog.chb.constants.CommunityHallBookingConstants;
import org.upyog.chb.enums.BookingStatusEnum;
import org.upyog.chb.kafka.producer.Producer;
import org.upyog.chb.repository.ServiceRequestRepository;
<<<<<<< HEAD
import org.upyog.chb.web.models.CommunityHallBookingDetail;
import org.upyog.chb.web.models.CommunityHallBookingRequest;
import org.upyog.chb.web.models.events.EventRequest;
=======
import org.upyog.chb.web.models.VenueBookingDetail;
import org.upyog.chb.web.models.events.Action;
import org.upyog.chb.web.models.events.ActionItem;
import org.upyog.chb.web.models.events.EventRequest;
import org.upyog.chb.web.models.notification.Email;
import org.upyog.chb.web.models.notification.EmailRequest;
>>>>>>> niua-upstream/niua-dev-2.0
import org.upyog.chb.web.models.notification.SMSRequest;

import com.jayway.jsonpath.JsonPath;

import lombok.extern.slf4j.Slf4j;

<<<<<<< HEAD
=======
/**
 * This utility class provides methods for sending notifications in the
 * Community Hall Booking module.
 * 
 * Purpose:
 * - To send notifications to users based on booking events and status updates.
 * - To simplify the process of creating and sending notifications through various channels.
 * 
 * Dependencies:
 * - ServiceRequestRepository: Sends HTTP requests to external services for notification delivery.
 * - Producer: Publishes notification events to Kafka topics.
 * - CommunityHallBookingConfiguration: Provides configuration properties for notification operations.
 * 
 * Features:
 * - Sends SMS notifications to users based on booking events.
 * - Publishes event notifications to Kafka topics for further processing.
 * - Fetches and processes notification templates for dynamic message generation.
 * - Logs notification operations and errors for debugging and monitoring purposes.
 * 
 * Methods:
 * 1. sendSMS:
 *    - Sends SMS notifications to users based on the provided SMSRequest objects.
 * 
 * 2. sendEventNotification:
 *    - Publishes event notifications to Kafka topics for further processing.
 * 
 * 3. fetchNotificationTemplate:
 *    - Retrieves and processes notification templates for generating dynamic messages.
 * 
 * Usage:
 * - This class is used throughout the module to send notifications to users.
 * - It ensures consistent and reusable logic for notification delivery across the application.
 */
>>>>>>> niua-upstream/niua-dev-2.0
@Slf4j
@Component
public class NotificationUtil {

<<<<<<< HEAD
	private ServiceRequestRepository serviceRequestRepository;

	private CommunityHallBookingConfiguration config;

	private Producer producer;

	private final String URL = "url";

	@Autowired
=======
	private final ServiceRequestRepository serviceRequestRepository;
	private final CommunityHallBookingConfiguration config;
	private final Producer producer;

	private static final String URL_KEY = "url";
	private static final String PAYMENT_LINK = "PAYMENT_LINK";
	private static final String PERMISSION_LETTER_LINK = "PERMISSION_LETTER_LINK";
	private static final String REQUEST_INFO_KEY = "RequestInfo";
	private static final String TENANT_ID_KEY = "tenantId";
	private static final String USER_TYPE_KEY = "userType";
	private static final String USER_NAME_KEY = "userName";
	private static final String CITIZEN_USER_TYPE = "CITIZEN";
	private static final String JSON_PATH_USER_UUID = "$.user[0].uuid";
	private static final String JSON_PATH_USER_EMAIL = "$.user[0].emailId";

	public static final String MESSAGE_TEXT = "MESSAGE_TEXT";
	public static final String ACTION_LINK = "ACTION_LINK";

>>>>>>> niua-upstream/niua-dev-2.0
	public NotificationUtil(ServiceRequestRepository serviceRequestRepository, CommunityHallBookingConfiguration config,
			Producer producer) {
		this.serviceRequestRepository = serviceRequestRepository;
		this.config = config;
		this.producer = producer;
	}

	/**
	 * Extracts message for the specific code
	 *
	 * @param notificationCode    The code for which message is required
	 * @param localizationMessage The localization messages
	 * @return message for the specific code
	 */
	@SuppressWarnings({ "unchecked" })
	private String getMessageTemplate(String notificationCode, String localizationMessage) {

		String path = "$..messages[?(@.code==\"{}\")].message";
		path = path.replace("{}", notificationCode);
		String message = "";
		try {
			Object messageObj = JsonPath.parse(localizationMessage).read(path);
			message = ((ArrayList<String>) messageObj).get(0);
		} catch (Exception e) {
			log.warn("Fetching from localization failed", e);
		}
		return message;
	}

	/**
	 * Fetches messages from localization service
	 * 
	 * @param tenantId    tenantId of the BPA
	 * @param requestInfo The requestInfo of the request
	 * @return Localization messages for the module
	 */
	@SuppressWarnings("rawtypes")
	public String getLocalizationMessages(String tenantId, RequestInfo requestInfo) {
<<<<<<< HEAD

		LinkedHashMap responseMap = (LinkedHashMap) serviceRequestRepository.fetchResult(getUri(tenantId, requestInfo),
				requestInfo);
		String jsonString = new JSONObject(responseMap).toString();
		return jsonString;
=======
		Map responseMap = (Map) serviceRequestRepository.fetchResult(getUri(tenantId, requestInfo), requestInfo);
		return new JSONObject(responseMap).toString();
>>>>>>> niua-upstream/niua-dev-2.0
	}

	/**
	 * Returns the uri for the localization call
	 * 
	 * @param tenantId TenantId of the propertyRequest
	 * @return The uri for localization search call
	 */
	private StringBuilder getUri(String tenantId, RequestInfo requestInfo) {

<<<<<<< HEAD
		if (config.getIsLocalizationStateLevel())
=======
		if (Boolean.TRUE.equals(config.getIsLocalizationStateLevel()))
>>>>>>> niua-upstream/niua-dev-2.0
			tenantId = tenantId.split("\\.")[0];

		String locale = "en_IN";
		if (!StringUtils.isEmpty(requestInfo.getMsgId()) && requestInfo.getMsgId().split("|").length >= 2)
			locale = requestInfo.getMsgId().split("\\|")[1];

		StringBuilder uri = new StringBuilder();
		uri.append(config.getLocalizationHost()).append(config.getLocalizationContextPath())
				.append(config.getLocalizationSearchEndpoint()).append("?").append("locale=").append(locale)
				.append("&tenantId=").append(tenantId).append("&module=")
				.append(CommunityHallBookingConstants.NOTIFICATION_MODULE_NAME);
		return uri;
	}

	/**
	 * Creates sms request for the each owners
	 * 
	 * @param mobileNumberToOwnerName Map of mobileNumber to OwnerName
	 * @return List of SMSRequest
	 */
<<<<<<< HEAD
	public List<SMSRequest> createSMSRequest(CommunityHallBookingRequest bookingRequest, String message,
			Map<String, String> mobileNumberToOwnerName) {

		List<SMSRequest> smsRequest = new LinkedList<>();
	//	message  = "Dear Citizen, Your OTP to complete your UPYOG Registration is 12345.\\n\\nUPYOG" + "#1207167462318135756#1207167462307097438" ;
=======
	public List<SMSRequest> createSMSRequest(String message,
			Map<String, String> mobileNumberToOwnerName) {

		List<SMSRequest> smsRequest = new LinkedList<>();
>>>>>>> niua-upstream/niua-dev-2.0
		for (Map.Entry<String, String> entryset : mobileNumberToOwnerName.entrySet()) {
			smsRequest.add(new SMSRequest(entryset.getKey(), message));
		}
		return smsRequest;
	}

	/**
	 * Send the SMSRequest on the SMSNotification kafka topic
	 *
	 * @param smsRequestList The list of SMSRequest to be sent
	 */
	public void sendSMS(List<SMSRequest> smsRequestList) {
		if (CollectionUtils.isEmpty(smsRequestList))
			log.info("Messages fobject is empty in send sms!");
		for (SMSRequest smsRequest : smsRequestList) {
			producer.push(config.getSmsNotifTopic(), smsRequest);
			log.debug("SMS request object : " + smsRequest);
			log.info("Sending SMS notification to MobileNumber: " + smsRequest.getMobileNumber() + " Messages: " + smsRequest.getMessage());
		}
	}

	/**
	 * Pushes the event request to Kafka Queue.
	 *
	 * @param request
	 */
	public void sendEventNotification(EventRequest request) {
		log.info("EVENT notification sent!");
		producer.push(config.getSaveUserEventsTopic(), request);
	}

	/**
	 * 
	 * Get message from {@code localizationMessage} for particular event
	 * Replace dynamic values of messages
	 * 
	 * @param bookingDetail
	 * @param localizationMessage
	 * @param actionStatus
	 * @return
	 */
<<<<<<< HEAD
	public String getCustomizedMsg(CommunityHallBookingDetail bookingDetail, String localizationMessage, String actionStatus) {
		String message = null, messageTemplate = null;
		log.info(" booking status : " + bookingDetail.getBookingStatus());
		log.info(" booking status ACTION_STATUS : " + actionStatus); 
		
		BookingStatusEnum notificationType = BookingStatusEnum.valueOf(actionStatus);

		switch (notificationType) {

		case BOOKING_CREATED:
			//Fetch message template from localization message for localization code
			messageTemplate = getMessageTemplate(config.getBookingCreatedTemplate(), localizationMessage);
			//Update placeholder in messages
			message = populateDynamicValues(bookingDetail, messageTemplate);
			//Shorten URL part of notification message
			String shortUrl = getActionLink(bookingDetail, actionStatus);
			//Update payment link placeholder in message
			message = message.replace(CommunityHallBookingConstants.CHB_PAYMENT_LINK, shortUrl);
			break;

		case BOOKED:
			messageTemplate = getMessageTemplate(config.getBookedTemplate(), localizationMessage);
			message = populateDynamicValues(bookingDetail, messageTemplate);
			String permissionLetterShortUrl = getActionLink(bookingDetail, actionStatus);
			message = message.replace(CommunityHallBookingConstants.CHB_PERMISSION_LETTER_LINK, permissionLetterShortUrl);
			break;

		case CANCELLATION_REQUESTED:
			// TODO: Implement
			messageTemplate = getMessageTemplate("", localizationMessage);
			message = populateDynamicValues(bookingDetail, messageTemplate);
			break;

		case CANCELLED:
			// TODO: Implement
			messageTemplate = getMessageTemplate("", localizationMessage);
			message = populateDynamicValues(bookingDetail, messageTemplate);
			break;
			
		case PAYMENT_FAILED:
			messageTemplate = getMessageTemplate(config.getBookingCreatedTemplate(), localizationMessage);
			break;
			
		case PENDING_FOR_PAYMENT:
			//Notification not required in this case
			break;
			
		default:
			message = "Localization message not available for  status : " + actionStatus;
			break;
			
		}
		log.info("getCustomizedMsg messageTemplate : " + messageTemplate);
		log.info("getCustomizedMsg  message : " + message);
		return message;
	}

	// Hi {APPLICANT_NAME} your booking no {BOOKING_NO} for community hall
	// {COMMUNITY_HALL_NAME} is created. Please pay using link {CHB_PAYMENT_LINK}
	// Hi {APPLICANT_NAME} your booking no {BOOKING_NO} for community hall
	// {COMMUNITY_HALL_NAME} is confirmed. Please download permission letter using
	// link {CHB_PERMISSION_LETTER_LINK}
	private String populateDynamicValues(CommunityHallBookingDetail bookingDetail, String message) {
		message = message.replace(CommunityHallBookingConstants.APPLICANT_NAME,
				bookingDetail.getApplicantDetail().getApplicantName());
		message = message.replace(CommunityHallBookingConstants.BOOKING_NO, bookingDetail.getBookingNo());
		message = message.replace(CommunityHallBookingConstants.COMMUNITY_HALL_NAME,
				bookingDetail.getCommunityHallName());
		
		return message;
	}
	
	private String getActionLink(CommunityHallBookingDetail bookingDetail, String status) {
		String link = null;
		if(BookingStatusEnum.BOOKING_CREATED.toString().equals(status)) {
			//Payment Link
			link = config.getUiAppHost() + config.getPayLinkSMS().replace("$consumerCode", bookingDetail.getBookingNo())
					.replace("$mobile", bookingDetail.getApplicantDetail().getApplicantMobileNo()).replace("$tenantId", bookingDetail.getTenantId())
					.replace("$businessService", config.getBusinessServiceName());
		} else if(BookingStatusEnum.BOOKING_CREATED.toString().equals(status)) {
			//Permission letter link
			link = config.getUiAppHost() + config.getPermissionLetterLink().replace("$consumerCode", bookingDetail.getBookingNo())
					.replace("$mobile", bookingDetail.getApplicantDetail().getApplicantMobileNo()).replace("$tenantId", bookingDetail.getTenantId())
					.replace("$businessService", config.getBusinessServiceName());
		}
		String shortUrl =  "";
		if (null != link) {
			shortUrl = getShortnerURL(link);
		}
		return shortUrl;
=======
	public Map<String, String> getCustomizedMsg(VenueBookingDetail bookingDetail, String localizationMessage,
			String actionStatus, String eventType) {
		String notificationEventType = actionStatus + "_" + eventType;
		log.info(" booking status : {}", bookingDetail.getBookingStatus());
		log.info(" booking status ACTION_STATUS : {}", actionStatus);
		log.info("notificationEventType  : {}", notificationEventType);

		BookingStatusEnum notificationType = BookingStatusEnum.valueOf(actionStatus);
		String messageTemplate = switch (notificationType) {
		case BOOKING_CREATED, BOOKED, CANCELLED, PAYMENT_FAILED ->
			getMessageTemplate(notificationEventType, localizationMessage);
		default -> "Localization message not available for  status : " + actionStatus;
		};

		String link = null;
		if (messageTemplate.contains(CommunityHallBookingConstants.NOTIFICATION_PAY_NOW)) {
			link = getPayUrl();
		}
		if (messageTemplate.contains(CommunityHallBookingConstants.NOTIFICATION_DOWNLOAD_RECEIPT)) {
			link = getReceiptDownloadLink(bookingDetail);
		}

		Map<String, String> messageMap = new HashMap<>();
		messageMap.put(ACTION_LINK, link);
		messageMap.put(MESSAGE_TEXT, messageTemplate);

		log.info("getCustomizedMsg messageTemplate : {}", messageTemplate);
		return messageMap;
	}
	
	public String getActionLink(VenueBookingDetail bookingDetail, String action) {
		String link = null;
		if (PAYMENT_LINK.equals(action)) {
			link = config.getUiAppHost() + config.getPayLinkSMS().replace("$consumerCode", bookingDetail.getBookingNo())
					.replace("$mobile", bookingDetail.getApplicantDetail().getApplicantMobileNo())
					.replace("$tenantId", bookingDetail.getTenantId())
					.replace("$businessService", config.getBusinessServiceName());
		} else if (PERMISSION_LETTER_LINK.equals(action)) {
			link = config.getUiAppHost() + config.getPermissionLetterLink()
					.replace("$consumerCode", bookingDetail.getBookingNo())
					.replace("$mobile", bookingDetail.getApplicantDetail().getApplicantMobileNo())
					.replace("$tenantId", bookingDetail.getTenantId())
					.replace("$businessService", config.getBusinessServiceName());
		}
		if (link != null) {
			link = getShortnerURL(link);
		}
		return link;
>>>>>>> niua-upstream/niua-dev-2.0
	}

	private String getShortnerURL(String actualURL) {
		net.minidev.json.JSONObject obj = new net.minidev.json.JSONObject();
<<<<<<< HEAD
		obj.put(URL, actualURL);
=======
		obj.put(URL_KEY, actualURL);
>>>>>>> niua-upstream/niua-dev-2.0
		String url = config.getUrlShortnerHost() + config.getShortenerEndpoint();

		Object response = serviceRequestRepository.getShorteningURL(new StringBuilder(url), obj);
		return response.toString();
	}
<<<<<<< HEAD
=======
	
	
	/**
	 * Builds the shortened "Pay Now" URL for SMS/event notifications.
	 * <p>
	 * The link is composed from the configured UI host and pay-now template, then passed through the URL shortener.
	 * CHB redirects citizens to the My Bookings page so the client can resolve the active payment timer before payment.
	 *
	 * @return shortened payment URL, or the original URL when shortening is unavailable
	 */
	public String getPayUrl() {
	    String payLinkTemplate = config.getPayNowLink();
	    String finalUrl = config.getUiAppHost() + payLinkTemplate;

	    return getShortnerURL(finalUrl);
	}
	
	
	/**
	 * Generates a downloadable receipt link for the given {@link BookingDetail}.
	 * <p>
	 * This method constructs the download URL using the configured request link template
	 * and the application number and tenant ID from the provided {@code CNDApplicationDetail} object.
	 * The full URL is then shortened before returning.
	 *
	 * @param cndApplicationDetail the application detail containing the application number and tenant ID
	 * @return a shortened URL string for downloading the receipt
	 */
	
     public String getReceiptDownloadLink(VenueBookingDetail bookingDetail) {
		
		String downloadReceiptLinkTemplate = config.getDownloadReceipt();
	    String actionLink = String.format(downloadReceiptLinkTemplate,
	    		bookingDetail.getBookingNo(),
	    		bookingDetail.getTenantId()
	            );
	    
	    String finalUrl = config.getUiAppHost() + actionLink;
	    
	    log.info("Final url to download receipt : " + finalUrl);

	    return getShortnerURL(finalUrl);

	}
     
     
     /**
 	 * Generates an {@link Action} object based on specific placeholders found in the input message.
 	 * <p>
 	 * This method checks if the provided message contains the {@code NOTIFICATION_ACTION} and 
 	 * {@code NOTIFICATION_ACTION_BUTTON} placeholders. If present, it extracts the action code 
 	 * between these placeholders and validates it against known constants like 
 	 * {@code NOTIFICATION_PAY_NOW} or {@code NOTIFICATION_DOWNLOAD_RECEIPT}.
 	 * If the code is valid, it constructs an {@link ActionItem} with the provided action URL and tenant ID,
 	 * wraps it in an {@link Action} object, and returns it.
 	 *
 	 * @param message    The notification message which may contain action placeholders.
 	 * @param actionLink The URL to be used for the action (e.g., pay now or download receipt).
 	 * @param tenantId   The tenant ID to associate with the generated action.
 	 * @return An {@link Action} object if the message contains a recognized action code, otherwise {@code null}.
 	 * EX- Hi Nehatest your advertisement booking under booking number: ADV-1508-000470 has been completed successfully. Please download receipt using link {Action Button}Download Receipt{/Action Button}
 	 */
 	
 	public Action getActionLinkAndCode(String message, String actionLink, String tenantId) {
 	   
 	        String code = StringUtils.substringBetween(
 	                message, 
 	                CommunityHallBookingConstants.NOTIFICATION_ACTION, 
 	               CommunityHallBookingConstants.NOTIFICATION_ACTION_BUTTON
 	        );

 	        if (CommunityHallBookingConstants.NOTIFICATION_PAY_NOW.equalsIgnoreCase(code) || 
 	        		CommunityHallBookingConstants.NOTIFICATION_DOWNLOAD_RECEIPT.equalsIgnoreCase(code)) {

 	            ActionItem actionItem = ActionItem.builder()
 	                    .actionUrl(actionLink)
 	                    .code(code)
 	                    .build();

 	            return Action.builder()
 	                    .tenantId(tenantId)
 	                    .actionUrls(Collections.singletonList(actionItem))
 	                    .build();
 	        }
 	    
 	    return null;
 	}
 	
 	  /**
     * Fetches UUIDs (unique user identifiers) for a set of mobile numbers.
     * <p>
     * This method sends a search request for each mobile number to the user service endpoint
     * and retrieves the corresponding UUIDs from the JSON response using JsonPath. The results are
     * stored in a map where the key is the mobile number and the value is the UUID.
     * </p>
     *
     * <p>
     * If a user is not found or an error occurs during the fetch, appropriate error logs are generated.
     * </p>
     *
     * @param mobileNumbers the set of mobile numbers to search for
     * @param requestInfo   the {@link RequestInfo} object containing metadata for the request
     * @param tenantId      the tenant ID under which the search is performed
     * @return a map of mobile numbers to corresponding user UUIDs
     */
    
	public Map<String, String> fetchUserUUIDs(Set<String> mobileNumbers, RequestInfo requestInfo, String tenantId) {
		Map<String, String> mapOfPhnoAndUUIDs = new HashMap<>();
		StringBuilder uri = new StringBuilder();
		uri.append(config.getUserHost()).append(config.getUserSearchEndpoint());
		for (String mobileNo : mobileNumbers) {
			Map<String, Object> userSearchRequest = buildUserSearchRequest(requestInfo, tenantId, mobileNo);
			try {
				Object user = serviceRequestRepository.fetchResult(uri, userSearchRequest);
				if (user != null) {
					String uuid = JsonPath.read(user, JSON_PATH_USER_UUID);
					mapOfPhnoAndUUIDs.put(mobileNo, uuid);
				} else {
					log.error("Service returned null while fetching user for username - {}", mobileNo);
				}
			} catch (Exception e) {
				log.error("Exception while fetching user for username - {}", mobileNo);
				log.error("Exception trace: ", e);
			}
		}
		return mapOfPhnoAndUUIDs;
	}

	public Map<String, String> fetchUserEmailIds(Set<String> mobileNumbers, RequestInfo requestInfo, String tenantId) {
		Map<String, String> mapOfPhnoAndEmailIds = new HashMap<>();
		StringBuilder uri = new StringBuilder();
		uri.append(config.getUserHost()).append(config.getUserSearchEndpoint());
		for (String mobileNo : mobileNumbers) {
			Map<String, Object> userSearchRequest = buildUserSearchRequest(requestInfo, tenantId, mobileNo);
			try {
				Object user = serviceRequestRepository.fetchResult(uri, userSearchRequest);
				if (user != null && JsonPath.read(user, JSON_PATH_USER_EMAIL) != null) {
					String email = JsonPath.read(user, JSON_PATH_USER_EMAIL);
					mapOfPhnoAndEmailIds.put(mobileNo, email);
				} else if (user == null) {
					log.error("Service returned null while fetching user for username - {}", mobileNo);
				}
			} catch (Exception e) {
				log.error("Exception while fetching user for username - {}", mobileNo);
				log.error("Exception trace: ", e);
			}
		}
		return mapOfPhnoAndEmailIds;
	}

	private Map<String, Object> buildUserSearchRequest(RequestInfo requestInfo, String tenantId, String mobileNo) {
		Map<String, Object> userSearchRequest = new HashMap<>();
		userSearchRequest.put(REQUEST_INFO_KEY, requestInfo);
		userSearchRequest.put(TENANT_ID_KEY, tenantId);
		userSearchRequest.put(USER_TYPE_KEY, CITIZEN_USER_TYPE);
		userSearchRequest.put(USER_NAME_KEY, mobileNo);
		return userSearchRequest;
	}
	
	/**
	 * Creates a list of {@link EmailRequest} objects using the provided message template and a map
	 * of mobile numbers to email IDs.
	 * <p>
	 * For each entry in the map, the placeholder {@code BookingConstants.NOTIFICATION_EMAIL} in the message
	 * is replaced with the corresponding email ID. Each customized message is then used to create an
	 * {@link Email} object, which is wrapped in an {@link EmailRequest} along with the given {@link RequestInfo}.
	 * </p>
	 *
	 * @param requestInfo          the request information containing metadata about the request
	 * @param message              the email message template that may contain placeholders
	 * @param mobileNumberToEmailId a map where keys are mobile numbers and values are corresponding email IDs
	 * @return a list of {@link EmailRequest} objects ready to be sent
	 */
	public List<EmailRequest> createEmailRequest(RequestInfo requestInfo, String message,
			Map<String, String> mobileNumberToEmailId) {

		List<EmailRequest> emailRequest = new LinkedList<>();
		for (Map.Entry<String, String> entryset : mobileNumberToEmailId.entrySet()) {
			String customizedMsg = "";
			if (message.contains(CommunityHallBookingConstants.NOTIFICATION_EMAIL))
				customizedMsg = message.replace(CommunityHallBookingConstants.NOTIFICATION_EMAIL, entryset.getValue());

			String subject = "";
			String body = customizedMsg;
			Email emailobj = Email.builder().emailTo(Collections.singleton(entryset.getValue())).isHTML(false)
					.body(body).subject(subject).build();
			EmailRequest email = new EmailRequest(requestInfo, emailobj);
			emailRequest.add(email);
		}
		return emailRequest;
	}

	
	/**
	 * Sends email notifications based on the provided list of {@link EmailRequest}.
	 * <p>
	 * This method checks whether email notifications are enabled through the configuration.
	 * If enabled and the list of email requests is not empty, it iterates through each request,
	 * and pushes it to the configured Kafka topic for further processing, provided the email body is not empty.
	 * </p>
	 *
	 * <p>
	 * If the list is empty or the email body is empty, appropriate logs are generated and the email is not sent.
	 * </p>
	 *
	 * @param emailRequestList the list of {@link EmailRequest} objects to be processed for email notifications
	 */
	public void sendEmail(List<EmailRequest> emailRequestList) {

		if (Boolean.TRUE.equals(config.getIsEmailNotificationEnabled())) {
			if (CollectionUtils.isEmpty(emailRequestList))
				log.info("Messages from localization couldn't be fetched!");
			for (EmailRequest emailRequest : emailRequestList) {
				if (!StringUtils.isEmpty(emailRequest.getEmail().getBody())) {
					producer.push(config.getEmailNotifTopic(), emailRequest);
					log.info("Sending EMAIL notification! ");
					log.info("Email Id: " + emailRequest.getEmail().toString());
				} else {
					log.info("Email body is empty, hence no email notification will be sent.");
				}
			}

		}
	}
	


	
>>>>>>> niua-upstream/niua-dev-2.0

}
