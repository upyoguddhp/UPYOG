package org.egov.digitaldoorplate.consumer;

import java.util.Map;

import org.egov.digitaldoorplate.model.GarbageCollectionRequest;
import org.egov.digitaldoorplate.repository.GarbageCollectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * Persists garbage collection records published by the _create and _sync
 * APIs. The write load of the morning collection peak is absorbed by kafka
 * and drained here at the DB's pace instead of hitting it directly from the
 * API threads.
 */
@Slf4j
@Service
public class GarbageCollectionPersistConsumer {

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private GarbageCollectionRepository garbageCollectionRepository;

	@KafkaListener(topics = { "${kafka.topics.save.garbage.collection}" })
	public void persistGarbageCollections(Map<String, Object> consumerRecord,
			@Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {

		GarbageCollectionRequest request;
		try {
			request = objectMapper.convertValue(consumerRecord, GarbageCollectionRequest.class);
		} catch (Exception e) {
			log.error("Unable to parse garbage collection message from topic {}.", topic, e);
			return;
		}

		if (null == request || CollectionUtils.isEmpty(request.getGarbageCollections())) {
			return;
		}

		request.getGarbageCollections().forEach(garbageCollection -> {
			try {
				garbageCollectionRepository.create(garbageCollection);
			} catch (DuplicateKeyException e) {
				// clientRefId unique index hit — record was already persisted
				// by an earlier sync of the same device queue
				log.warn("Skipping duplicate garbage collection record with clientRefId {}.",
						garbageCollection.getClientRefId());
			} catch (Exception e) {
				log.error("Failed to persist garbage collection record uuid {} clientRefId {}.",
						garbageCollection.getUuid(), garbageCollection.getClientRefId(), e);
			}
		});
	}
}
