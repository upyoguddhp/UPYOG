package org.egov.digitaldoorplate.util;

import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * Converts the free-form additionalDetails object to/from a postgres jsonb
 * column value.
 */
@Component
@Slf4j
public class JsonbUtil {

	@Autowired
	private ObjectMapper objectMapper;

	public PGobject toPGobject(Object value) {
		if (null == value) {
			return null;
		}
		try {
			PGobject pgObject = new PGobject();
			pgObject.setType("jsonb");
			pgObject.setValue(objectMapper.writeValueAsString(value));
			return pgObject;
		} catch (Exception e) {
			throw new CustomException("INVALID_ADDITIONAL_DETAILS",
					"Unable to serialize additionalDetails to json. Message: " + e.getMessage());
		}
	}

	public Object parse(String value) {
		if (null == value) {
			return null;
		}
		try {
			return objectMapper.readValue(value, Object.class);
		} catch (Exception e) {
			log.error("Unable to parse additional_details json from db.", e);
			return null;
		}
	}
}
