package org.egov.web.notification.sms.consumer;

import java.util.HashMap;
import java.util.UUID;

import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.egov.web.notification.sms.consumer.contract.SMSRequest;
import org.egov.web.notification.sms.models.Category;
import org.egov.web.notification.sms.models.RequestContext;
import org.egov.web.notification.sms.models.SMSSentRequest;
import org.egov.web.notification.sms.service.BaseSMSService;
import org.egov.web.notification.sms.service.SMSService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SmsNotificationListener {

    private final ApplicationContext context;
    private SMSService smsService;
    private CustomKafkaTemplate<String, SMSRequest> kafkaTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${kafka.topics.expiry.sms}")
    String expiredSmsTopic;

    @Value("${kafka.topics.backup.sms}")
    String backupSmsTopic;

    @Value("${kafka.topics.error.sms}")
    String errorSmsTopic;


    @Autowired
    public SmsNotificationListener(
            ApplicationContext context,
            SMSService smsService,
            CustomKafkaTemplate<String, SMSRequest> kafkaTemplate) {
        this.smsService = smsService;
        this.context = context;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(
            topics = "${kafka.topics.notification.sms.name}"
    )
    public void process(HashMap<String, Object> consumerRecord) {
        RequestContext.setId(UUID.randomUUID().toString());
        SMSRequest request = null;
        SMSSentRequest smsSentRequest = null;
        try {
        	smsSentRequest = objectMapper.convertValue(consumerRecord, SMSSentRequest.class);
            request = smsService.populateSMSRequest(smsSentRequest);
            if (request.getExpiryTime() != null && request.getCategory() == Category.OTP) {
                Long expiryTime = request.getExpiryTime();
                Long currentTime = System.currentTimeMillis();
                if (expiryTime < currentTime) {
                    log.info("OTP Expired");
                    if (!StringUtils.isEmpty(expiredSmsTopic))
                        kafkaTemplate.send(expiredSmsTopic, request);
                } else {
                    smsService.sendSMS(smsSentRequest);
                }
            } else {
                smsService.sendSMS(smsSentRequest);
            }
        } catch (RestClientException rx) {
            log.info("Going to backup SMS Service", rx);
            if (!StringUtils.isEmpty(backupSmsTopic))
                kafkaTemplate.send(backupSmsTopic, request);
            else if (!StringUtils.isEmpty(errorSmsTopic)) {
                kafkaTemplate.send(errorSmsTopic, request);
            } else {
                throw rx;
            }
        } catch (Exception ex) {
            log.error("Sms service failed", ex);
            if (!StringUtils.isEmpty(errorSmsTopic)) {
                kafkaTemplate.send(errorSmsTopic, request);
            } else {
                throw ex;
            }
        }
    }
}