package org.egov.asset.kafka;

<<<<<<< HEAD
import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
=======
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.springframework.stereotype.Service;
>>>>>>> niua-upstream/niua-dev-2.0

// NOTE: If tracer is disabled change CustomKafkaTemplate to KafkaTemplate in autowiring

@Service
@Slf4j
public class Producer {

<<<<<<< HEAD
    @Autowired
    private CustomKafkaTemplate<String, Object> kafkaTemplate;
=======
    private final CustomKafkaTemplate<String, Object> kafkaTemplate;

    public Producer(CustomKafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }
>>>>>>> niua-upstream/niua-dev-2.0

    public void push(String topic, Object value) {
        kafkaTemplate.send(topic, value);
    }
}
