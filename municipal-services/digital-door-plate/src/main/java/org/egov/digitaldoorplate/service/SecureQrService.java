package org.egov.digitaldoorplate.service;

import org.apache.commons.lang3.StringUtils;
import org.egov.digitaldoorplate.model.DecryptQrRequest;
import org.egov.digitaldoorplate.model.DecryptQrResponse;
import org.egov.digitaldoorplate.model.EncryptedQrPayload;
import org.egov.digitaldoorplate.model.GenerateQrRequest;
import org.egov.digitaldoorplate.model.GenerateQrResponse;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * Aadhaar-style secure QR: {@code /qr/_generate} encrypts an arbitrary JSON
 * string with the citizenseva RSA key pair and renders it as a QR code
 * image; {@code /qr/_decrypt} reverses it back to the original JSON string.
 */
@Slf4j
@Service
public class SecureQrService {

	@Autowired
	private QrCryptoService qrCryptoService;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	public GenerateQrResponse generate(GenerateQrRequest generateQrRequest) {
		if (StringUtils.isEmpty(generateQrRequest.getData())) {
			throw new CustomException("INVALID_REQUEST", "Provide the JSON string to encrypt in 'data'.");
		}

		EncryptedQrPayload payload = qrCryptoService.encrypt(generateQrRequest.getData());

		return GenerateQrResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(generateQrRequest.getRequestInfo(), true))
				.encryptedData(payload.getEncryptedData()).qrCodeImage(payload.getQrCodeImage()).build();
	}

	public DecryptQrResponse decrypt(DecryptQrRequest decryptQrRequest) {
		if (StringUtils.isEmpty(decryptQrRequest.getEncryptedData())) {
			throw new CustomException("INVALID_REQUEST", "Provide the encrypted payload in 'encryptedData'.");
		}

		String data = qrCryptoService.decrypt(decryptQrRequest.getEncryptedData());

		return DecryptQrResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(decryptQrRequest.getRequestInfo(), true))
				.data(data).build();
	}
}
