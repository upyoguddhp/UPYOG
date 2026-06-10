package org.egov.pt.service;

import java.util.Arrays;

import org.egov.pt.producer.PropertyProducer;
import org.egov.pt.config.PropertyConfiguration;
import org.egov.pt.models.Property;
import org.egov.pt.models.Unit;
import org.egov.pt.util.UsageCategoryMapper;
import org.egov.pt.web.contracts.PropertyRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UsageCategoryUpdateService {

    @Autowired
    private PropertyProducer producer;

    @Autowired
    private PropertyConfiguration config;

    @Transactional
    public void updateUsageCategory(String unitId, String buildingType) {

        if (unitId == null || unitId.trim().isEmpty()) {
            log.warn("Unit ID is null or empty");
            return;
        }

        String category = UsageCategoryMapper.map(buildingType);

        // Prepare minimal property with single unit carrying updated usageCategory
        Unit unit = Unit.builder().id(unitId).usageCategory(category).build();
        Property property = Property.builder().units(Arrays.asList(unit)).build();

        PropertyRequest request = PropertyRequest.builder().requestInfo(null).property(property).build();

        // Push to persister update topic so async persister updates eg_pt_unit usageCategory
       // producer.pushAfterEncrytpion(config.getUpdatePropertyTopic(), request);
		producer.pushAfterEncrytpion(config.getUpdateUnitUsageCategoryTopic(), request);

        log.info("Pushed usageCategory update for Unit ID {} with category {} to topic {}", unitId, category,
                config.getUpdatePropertyTopic());
    }
}