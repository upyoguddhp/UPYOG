package org.egov.digitaldoorplate.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.spec.MGF1ParameterSpec;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import javax.crypto.spec.SecretKeySpec;

import org.egov.digitaldoorplate.model.EncryptedQrPayload;
import org.egov.digitaldoorplate.util.QrCertificateKeyProvider;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import lombok.extern.slf4j.Slf4j;

/**
 * RSA+AES hybrid envelope encryption for the secure QR generate/decrypt
 * APIs, modelled on the same idea Aadhaar-style secure QR codes use: the
 * actual payload is protected with a fresh symmetric key per call, and that
 * symmetric key is itself protected with the citizenseva RSA key pair so
 * only the holder of the matching private key can recover it.
 *
 * Envelope layout (before base64): [2 bytes encryptedAesKey length][RSA-OAEP
 * encrypted AES-256 key][12 byte GCM IV][AES-256-GCM ciphertext + tag].
 */
@Slf4j
@Service
public class QrCryptoService {

	private static final String AES_ALGO = "AES";
	private static final String AES_CIPHER = "AES/GCM/NoPadding";
	private static final String RSA_CIPHER = "RSA/ECB/OAEPPadding";
	private static final int AES_KEY_SIZE = 256;
	private static final int GCM_IV_LENGTH = 12;
	private static final int GCM_TAG_LENGTH_BITS = 128;
	private static final int QR_IMAGE_SIZE = 350;

	@Autowired
	private QrCertificateKeyProvider keyProvider;

	private final SecureRandom secureRandom = new SecureRandom();

	public EncryptedQrPayload encrypt(String jsonData) {
		try {
			SecretKey aesKey = generateAesKey();
			byte[] iv = new byte[GCM_IV_LENGTH];
			secureRandom.nextBytes(iv);

			Cipher aesCipher = Cipher.getInstance(AES_CIPHER);
			aesCipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
			byte[] cipherText = aesCipher.doFinal(jsonData.getBytes(StandardCharsets.UTF_8));

			Cipher rsaCipher = Cipher.getInstance(RSA_CIPHER);
			rsaCipher.init(Cipher.ENCRYPT_MODE, keyProvider.getPublicKey(), oaepParams());
			byte[] encryptedAesKey = rsaCipher.doFinal(aesKey.getEncoded());

			ByteBuffer buffer = ByteBuffer.allocate(2 + encryptedAesKey.length + iv.length + cipherText.length);
			buffer.putShort((short) encryptedAesKey.length);
			buffer.put(encryptedAesKey);
			buffer.put(iv);
			buffer.put(cipherText);

			String encryptedData = Base64.getEncoder().encodeToString(buffer.array());

			return EncryptedQrPayload.builder().encryptedData(encryptedData).qrCodeImage(toQrCodeImage(encryptedData))
					.build();
		} catch (CustomException ce) {
			throw ce;
		} catch (Exception e) {
			log.error("Error occurred while generating the secure QR code.", e);
			throw new CustomException("QR_GENERATION_ERROR",
					"Error occurred while generating the secure QR code. Message: " + e.getMessage());
		}
	}

	public String decrypt(String encryptedData) {
		try {
			byte[] payload = Base64.getDecoder().decode(encryptedData.trim());
			ByteBuffer buffer = ByteBuffer.wrap(payload);

			int encryptedKeyLength = Short.toUnsignedInt(buffer.getShort());
			if (encryptedKeyLength <= 0 || encryptedKeyLength > buffer.remaining()) {
				throw new IllegalArgumentException("Malformed encrypted payload.");
			}
			byte[] encryptedAesKey = new byte[encryptedKeyLength];
			buffer.get(encryptedAesKey);

			if (buffer.remaining() < GCM_IV_LENGTH) {
				throw new IllegalArgumentException("Malformed encrypted payload.");
			}
			byte[] iv = new byte[GCM_IV_LENGTH];
			buffer.get(iv);

			byte[] cipherText = new byte[buffer.remaining()];
			buffer.get(cipherText);

			Cipher rsaCipher = Cipher.getInstance(RSA_CIPHER);
			rsaCipher.init(Cipher.DECRYPT_MODE, keyProvider.getPrivateKey(), oaepParams());
			byte[] aesKeyBytes = rsaCipher.doFinal(encryptedAesKey);
			SecretKey aesKey = new SecretKeySpec(aesKeyBytes, AES_ALGO);

			Cipher aesCipher = Cipher.getInstance(AES_CIPHER);
			aesCipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
			byte[] plainText = aesCipher.doFinal(cipherText);

			return new String(plainText, StandardCharsets.UTF_8);
		} catch (CustomException ce) {
			throw ce;
		} catch (Exception e) {
			log.error("Error occurred while decrypting the secure QR payload.", e);
			throw new CustomException("QR_DECRYPTION_ERROR",
					"Error occurred while decrypting the secure QR payload. Message: " + e.getMessage());
		}
	}

	private OAEPParameterSpec oaepParams() {
		return new OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
	}

	private SecretKey generateAesKey() throws Exception {
		KeyGenerator keyGenerator = KeyGenerator.getInstance(AES_ALGO);
		keyGenerator.init(AES_KEY_SIZE, secureRandom);
		return keyGenerator.generateKey();
	}

	private String toQrCodeImage(String data) {
		try {
			Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
			hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
			hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
			hints.put(EncodeHintType.MARGIN, 1);

			QRCodeWriter qrCodeWriter = new QRCodeWriter();
			BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, QR_IMAGE_SIZE, QR_IMAGE_SIZE,
					hints);

			ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
			MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

			return "data:image/png;base64," + Base64.getEncoder().encodeToString(outputStream.toByteArray());
		} catch (WriterException | IOException e) {
			log.error("Error occurred while rendering the QR code image.", e);
			throw new CustomException("QR_IMAGE_GENERATION_ERROR",
					"The encrypted payload is too large to fit in a single QR code, or the image could not be rendered. Message: "
							+ e.getMessage());
		}
	}
}
