package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.DecryptQrRequest;
import org.egov.digitaldoorplate.model.DecryptQrResponse;
import org.egov.digitaldoorplate.model.GenerateQrRequest;
import org.egov.digitaldoorplate.model.GenerateQrResponse;
import org.egov.digitaldoorplate.service.SecureQrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/qr")
public class SecureQrController {

	@Autowired
	private SecureQrService secureQrService;

	/**
	 * Encrypts the given JSON string (RSA+AES hybrid encryption using the
	 * citizenseva certificate) and returns it as a QR code image, the same way
	 * an Aadhaar secure QR code carries its data.
	 */
	@PostMapping("/_generate")
	public ResponseEntity<GenerateQrResponse> generate(@RequestBody GenerateQrRequest generateQrRequest) {
		return ResponseEntity.ok(secureQrService.generate(generateQrRequest));
	}

	/**
	 * Decrypts a payload produced by {@code /_generate} (e.g. after scanning
	 * the QR code) and returns the original JSON string.
	 */
	@PostMapping("/_decrypt")
	public ResponseEntity<DecryptQrResponse> decrypt(@RequestBody DecryptQrRequest decryptQrRequest) {
		return ResponseEntity.ok(secureQrService.decrypt(decryptQrRequest));
	}
}
