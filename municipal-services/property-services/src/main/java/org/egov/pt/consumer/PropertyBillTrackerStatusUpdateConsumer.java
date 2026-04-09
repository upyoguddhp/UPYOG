package org.egov.pt.consumer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.pt.repository.PropertyRepository;
import org.egov.pt.util.PropertyUtil;
import org.egov.common.contract.request.RequestInfo;
import org.egov.pt.models.AuditDetails;
import org.egov.pt.models.collection.Bill;
import org.egov.pt.models.enums.BillStatus;
import org.egov.pt.models.PtTaxCalculatorTracker;

@Service
@Slf4j
public class PropertyBillTrackerStatusUpdateConsumer {

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private PropertyRepository propertyRepository;

	@Autowired
	private PropertyUtil ptUtils;

	@KafkaListener(topics = { "property-bill-tracker-status-update" })
	public void listen(HashMap<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
		try {
			
			RequestInfo reqInfo = objectMapper.convertValue(record.get("requestInfo"), RequestInfo.class);

			AuditDetails audit = ptUtils.buildAuditDetails(reqInfo);
			
			String demandId = (String) record.get("demandId");
			String status = (String) record.get("status");
			String consumerCode = (String) record.get("consumerCode");

			PtTaxCalculatorTracker tracker = PtTaxCalculatorTracker.builder()
			        .propertyId(consumerCode)
			        .demandId(demandId)
			        .billStatus(BillStatus.valueOf(status))
			        .auditDetails(audit)
			        .build();

			propertyRepository.updateStatus(tracker);

		} catch (Exception e) {
			log.error("Error processing property tracker update", e);
		}
	}
}
