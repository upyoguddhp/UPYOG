package org.egov.digitaldoorplate.model;

import org.egov.common.contract.response.ResponseInfo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GenerateQrResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo;

	/**
	 * Base64 envelope: RSA-OAEP encrypted AES-256 key + GCM IV + AES-256-GCM
	 * ciphertext. This is the exact string encoded into the QR code image, and
	 * is also what {@code /qr/_decrypt} expects back.
	 */
	private String encryptedData;

	/**
	 * QR code image as a base64 PNG data URI, ready to drop into an
	 * {@code <img src="...">} tag.
	 */
	private String qrCodeImage;
}
