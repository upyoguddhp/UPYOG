package org.upyog.chb.kafka.producer;

import org.egov.tracer.kafka.CustomKafkaTemplate;
<<<<<<< HEAD
import org.springframework.beans.factory.annotation.Autowired;
=======
>>>>>>> niua-upstream/niua-dev-2.0
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

// NOTE: If tracer is disabled change CustomKafkaTemplate to KafkaTemplate in autowiring

@Service("chbProducer")
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
    	try {
    		kafkaTemplate.send(topic, value);
		} catch (Exception e) {
			log.error("Exception occured while sending message to topic : " + topic);
			log.error("Exception details : " + e);
		}
    }
}
