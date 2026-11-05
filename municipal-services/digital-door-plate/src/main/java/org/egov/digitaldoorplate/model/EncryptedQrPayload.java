package org.egov.digitaldoorplate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result of encrypting a JSON payload for a secure QR code: the base64
 * encrypted envelope, and the base64 PNG QR code image rendered from it.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class EncryptedQrPayload {

	private String encryptedData;

	private String qrCodeImage;
}
