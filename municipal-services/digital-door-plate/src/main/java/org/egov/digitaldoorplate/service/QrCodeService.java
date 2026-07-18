package org.egov.digitaldoorplate.service;

import org.egov.digitaldoorplate.model.QrCodeData;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class QrCodeService {

	@Autowired
	private EncryptionService encryptionService;

	@Autowired
	private ObjectMapper objectMapper;

	/**
	 * Decrypts the scanned QR payload via egov-enc-service and parses the
	 * embedded json ({"id": ..., "useruuid": ...}). Falls back to parsing the
	 * raw payload when it is not encrypted.
	 */
	public QrCodeData parseQrCodeData(String scannedData) {
		String decryptedData;
		try {
			decryptedData = encryptionService.decryptString(scannedData);
		} catch (Exception e) {
			log.warn("Decryption of scanned QR data failed, trying to parse raw data. Message: {}", e.getMessage());
			decryptedData = scannedData;
		}

		try {
			return objectMapper.readValue(decryptedData, QrCodeData.class);
		} catch (Exception e) {
			log.error("Unable to parse the scanned QR data.", e);
			throw new CustomException("INVALID_QR", "Scanned QR data is not in the expected format.");
		}
	}
}
