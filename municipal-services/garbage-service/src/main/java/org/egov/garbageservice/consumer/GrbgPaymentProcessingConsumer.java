package org.egov.garbageservice.consumer;

import java.util.HashMap;
import java.util.Map;

import org.egov.garbageservice.model.PaymentProcessingUpdateRequest;
import org.egov.garbageservice.model.PaymentDetailUpdateRequest;
import org.egov.garbageservice.repository.GarbageBillTrackerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GrbgPaymentProcessingConsumer {

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private GarbageBillTrackerRepository trackerRepository;

	@KafkaListener(topics = { "grbg-payment-processing" })
	public void paymentProcessingUpdate(HashMap<String, Object> record) {
		PaymentProcessingUpdateRequest request = objectMapper.convertValue(record,PaymentProcessingUpdateRequest.class);
		Map<String, Object> additionalDetails = (Map<String, Object>) record.get("AddiitonalDetails");
		String transactionDate = null;

	    if (additionalDetails != null) {
	        transactionDate = (String) additionalDetails.get("transactionDate");
	    }
		trackerRepository.updatePaymentProcessing(request.getBillId(), request.isPaymentProcessing(), request.getTxnAmount(), transactionDate);
	}
	
	@KafkaListener(topics = { "grbg-payment-details-update" })
	public void paymentDetailsUpdate(HashMap<String, Object> record) {
		PaymentDetailUpdateRequest request = objectMapper.convertValue(record,PaymentDetailUpdateRequest.class);
		Map<String, Object> additionalDetails = (Map<String, Object>) record.get("AdditionalDetails");
		String transactionDate = null;

	    if (additionalDetails != null) {
	        transactionDate = (String) additionalDetails.get("transactionDate");
	    }
	    if (request.getBillIds() != null && !request.getBillIds().isEmpty()) {
		trackerRepository.updatePaymentDetailsInTracker(request.getPaymentMode(), transactionDate, request.getBillIds());
	    }
	}
}
