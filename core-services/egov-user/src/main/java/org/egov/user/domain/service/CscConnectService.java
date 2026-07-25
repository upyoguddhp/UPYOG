package org.egov.user.domain.service;


import org.egov.user.domain.service.utils.Constants;
import org.egov.user.web.contract.CscValidateToken;
import org.egov.user.web.contract.CscValidateTokenResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;



@Service
@Slf4j
public class CscConnectService {
	@Autowired
	private Constants constants;

	@Autowired
	private RestTemplate restTemplate;
	
	    public ResponseEntity<?> getCscValidateTokenResponse(CscValidateToken accessToken) {

	        Object loginResponse = "";
	       
	        CscValidateTokenResponse cscValidateTokenResponse = getCscValidateToken(accessToken);
	        
	        return ResponseEntity.ok(cscValidateTokenResponse);
	    }
	    
		public CscValidateTokenResponse getCscValidateToken(CscValidateToken cscValidateToken) {

			StringBuilder uri = new StringBuilder(constants.getCscHost());
			
			uri.append(constants.getCscEndpoint());

			CscValidateTokenResponse cscValidateTokenResponse = null;
			try {
				
				HttpHeaders headers = new HttpHeaders();
				headers.set("Authorization", "Bearer " + cscValidateToken);
				
				HttpEntity<Void> entity = new HttpEntity<>(headers);
				
				ResponseEntity<CscValidateTokenResponse> response= restTemplate.exchange(
							uri.toString(),
					        HttpMethod.GET,
					        entity,
					        CscValidateTokenResponse.class
						);
				CscValidateTokenResponse userInfo = response.getBody();
				
			} catch (RestClientException e) {
				System.out.print("Error Occured while rest call to SSO HP service." + e.getLocalizedMessage());
				return null;
			}
			return cscValidateTokenResponse;

		}

	   

	
}
