package org.egov.web.notification.sms.service;

import org.egov.web.notification.sms.consumer.contract.SMSRequest;
import org.egov.web.notification.sms.models.OTPSentRequest;
import org.egov.web.notification.sms.models.SMSSentRequest;
import org.egov.web.notification.sms.models.UserSearchResponse;

public interface SMSService {

	void sendOtp(OTPSentRequest smsSentRequest);

	void sendSMS(SMSSentRequest smsSentRequest);
	
	UserSearchResponse validateCitizen(OTPSentRequest smsSentRequest);

	SMSRequest populateSMSRequest(SMSSentRequest smsSentRequest);

}
