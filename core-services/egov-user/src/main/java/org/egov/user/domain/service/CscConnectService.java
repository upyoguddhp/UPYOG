package org.egov.user.domain.service;


import java.util.HashMap;
import java.util.Map;

import org.egov.user.domain.service.utils.Constants;
import org.egov.user.web.contract.CscValidateTokenApiResponse;
import org.egov.user.web.contract.CscValidateTokenResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;



@Service
@Slf4j
public class CscConnectService {
	@Autowired
	private Constants constants;

	@Autowired
	private RestTemplate restTemplate;
	
	    public ResponseEntity<?> getCscValidateTokenResponse(String accessToken) {
	        if (accessToken == null || accessToken.trim().isEmpty()) {
	            return buildErrorResponse(HttpStatus.BAD_REQUEST,
	                    "CSC_TOKEN_MISSING", "Token is required");
	        }

	        CscValidateTokenResponse cscValidateTokenResponse = getCscValidateToken(accessToken);
	        if (cscValidateTokenResponse == null) {
	            return buildErrorResponse(HttpStatus.UNAUTHORIZED,
	                    "CSC_USER_NOT_FOUND",
	                    "No CSC user details were returned for the supplied token");
	        }

	        return ResponseEntity.ok(cscValidateTokenResponse);
	    }

	    private ResponseEntity<Map<String, String>> buildErrorResponse(
	            HttpStatus status, String code, String message) {
	        Map<String, String> error = new HashMap<>();
	        error.put("code", code);
	        error.put("message", message);
	        return new ResponseEntity<>(error, status);
	    }
	    
		public CscValidateTokenResponse getCscValidateToken(String cscValidateToken) {

			StringBuilder uri = new StringBuilder(constants.getCscHost());
			
			uri.append(constants.getCscEndpoint());

			CscValidateTokenResponse cscValidateTokenResponse = null;
			try {
				
				HttpHeaders headers = new HttpHeaders();
				headers.set("Authorization", "Bearer " + cscValidateToken);
				HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

				ResponseEntity<String> response = restTemplate.exchange(
						uri.toString(),
						HttpMethod.GET,
						requestEntity,
						String.class
				);

				String rawResponse = response.getBody();
				log.info("CSC raw API response: {}", rawResponse);
				if (rawResponse == null || rawResponse.trim().isEmpty()) {
					log.warn("CSC API returned an empty response body");
					return null;
				}

				CscValidateTokenApiResponse apiResponse;
				try {
					apiResponse = new ObjectMapper().readValue(
							rawResponse, CscValidateTokenApiResponse.class);
				} catch (Exception e) {
					log.error("Unable to deserialize CSC response: {}", rawResponse, e);
					return null;
				}

				cscValidateTokenResponse = apiResponse != null ? apiResponse.getUser() : null;
				log.info("userInfo {}", cscValidateTokenResponse);
				
			} catch (HttpStatusCodeException e) {
				log.error("CSC API returned HTTP {} with raw body: {}",
						e.getStatusCode(), e.getResponseBodyAsString());
				return null;
			} catch (RestClientException e) {
				log.error("Error occurred while calling CSC API", e);
				return null;
			}
			return cscValidateTokenResponse;

		}

	   

	
}
