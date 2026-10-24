package org.egov.noc.service;

import java.util.HashMap;
import java.util.Map;

import org.egov.noc.config.NOCConfiguration;
import org.egov.noc.web.model.PDFRequest;
import org.egov.noc.web.model.RequestInfoWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ReportService {

	@Autowired
	private NOCConfiguration config;

	@Autowired
	private RestTemplate restTemplate;
	
	public ResponseEntity<Resource> createNoSavePDF(PDFRequest pdfRequest) {
		HttpHeaders headers = new HttpHeaders();
		headers.set("Content-Type", "application/json");
		HttpEntity<PDFRequest> requestEntity = new HttpEntity<>(pdfRequest, headers);
		return restTemplate.exchange(config.getReportHost().concat(config.getReportCreateEndPoint()), HttpMethod.POST,
				requestEntity, Resource.class);
	}
	
	public PDFRequest generatePdfRequestForNoc(String template, RequestInfoWrapper requestInfoWrapper) {
		Map<String, Object> dataObject = new HashMap<>();
		Map<String, Object> noc = new HashMap<>();

		noc.put("template", template);
		dataObject.put("noc", noc);

		return PDFRequest.builder().RequestInfo(requestInfoWrapper.getRequestInfo()).key("nocCertificate")
				.tenantId("hp").data(dataObject).build();
	}
	
}
