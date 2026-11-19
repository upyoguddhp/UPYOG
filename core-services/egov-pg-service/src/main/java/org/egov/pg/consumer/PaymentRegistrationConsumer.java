package org.egov.pg.consumer;

import java.util.HashMap;
import java.util.Map;

import org.egov.pg.config.AppProperties;
import org.egov.pg.producer.Producer;
import org.egov.pg.service.PaymentsService;
import org.egov.pg.web.models.TransactionRequest;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * Registers the payment at collection-service for transactions that the gateway
 * has confirmed as SUCCESS. This used to run inside the /transaction/v2/_update
 * request thread; running it here keeps that API fast during peak load.
 * Retries transient failures; anything that still fails is pushed to the
 * failed topic so the payment can be re-driven (money is already collected).
 */
@Service
@Slf4j
public class PaymentRegistrationConsumer {

	@Autowired
	private PaymentsService paymentsService;

	@Autowired
	private Producer producer;

	@Autowired
	private AppProperties appProperties;

	@Autowired
	private ObjectMapper mapper;

	@KafkaListener(topics = "${egov.pg.payment.register.topic}", concurrency = "${egov.pg.payment.register.concurrency:3}")
	public void listen(final HashMap<String, Object> record) {
		TransactionRequest request;
		try {
			request = mapper.convertValue(record, TransactionRequest.class);
		} catch (Exception e) {
			log.error("PAYMENT_REGISTER_UNREADABLE record={}", record, e);
			producer.push(appProperties.getPaymentRegisterFailedTopic(), record);
			return;
		}

		String txnId = request.getTransaction().getTxnId();
		int maxAttempts = Math.max(1, appProperties.getPaymentRegisterMaxAttempts());

		for (int attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				paymentsService.registerPayment(request);
				log.info("Payment registered for txnId {} (attempt {})", txnId, attempt);
				return;
			} catch (ServiceCallException e) {
				// 4xx from collection-service: retrying the same payload will not help
				log.error("PAYMENT_REGISTER_REJECTED txnId={} : {}", txnId, e.getMessage(), e);
				break;
			} catch (Exception e) {
				log.error("Payment registration failed for txnId {} (attempt {}/{})", txnId, attempt, maxAttempts, e);
				if (attempt < maxAttempts) {
					try {
						Thread.sleep(appProperties.getPaymentRegisterRetryBackoffMs() * attempt);
					} catch (InterruptedException ie) {
						Thread.currentThread().interrupt();
						break;
					}
				}
			}
		}

		log.error("PAYMENT_REGISTER_FAILED txnId={} pushed to {} for manual/automated re-drive", txnId,
				appProperties.getPaymentRegisterFailedTopic());
		Map<String, Object> failed = new HashMap<>(record);
		producer.push(appProperties.getPaymentRegisterFailedTopic(), failed);
	}
}
