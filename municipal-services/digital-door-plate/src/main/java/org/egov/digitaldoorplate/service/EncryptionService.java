package org.egov.digitaldoorplate.service;

import java.net.URLDecoder;
import java.util.ArrayList;

import org.egov.digitaldoorplate.util.DdpConstants;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EncryptionService {

	@Autowired
	private RestTemplate restTemplate;

	@Autowired
	private DdpConstants ddpConfig;

	@SuppressWarnings({ "unchecked", "deprecation" })
	public String decryptString(String valueToDecrypt) {
		StringBuilder url = new StringBuilder(ddpConfig.getEncServiceHostUrl());
		url.append(ddpConfig.getEncDecryptEndpoint());

		ArrayList<String> decryptedValueResponse = null;
		String response = null;

		try {
			valueToDecrypt = URLDecoder.decode(valueToDecrypt);
			String[] decryptionRequest = { valueToDecrypt };

			decryptedValueResponse = restTemplate.postForObject(url.toString(), decryptionRequest, ArrayList.class);
		} catch (Exception e) {
			log.error("Error occured while decrypt value.", e);
			throw new CustomException("DECRYPTION ERROR",
					"Error occured while decrypt value. Message: " + e.getMessage());
		}
		if (!CollectionUtils.isEmpty(decryptedValueResponse)) {
			response = decryptedValueResponse.get(0);
		}

		return response;
	}
}
