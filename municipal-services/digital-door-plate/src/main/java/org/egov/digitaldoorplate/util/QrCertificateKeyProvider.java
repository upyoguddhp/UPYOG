package org.egov.digitaldoorplate.util;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Security;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

import javax.annotation.PostConstruct;

import org.bouncycastle.asn1.pkcs.PrivateKeyInfo;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openssl.PEMKeyPair;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

/**
 * Loads the RSA key pair used for the secure QR generate/decrypt APIs from
 * the citizenseva wildcard certificate (public key from the X.509 cert,
 * private key from the accompanying PEM key) once at application startup.
 */
@Slf4j
@Component
public class QrCertificateKeyProvider {

	static {
		Security.addProvider(new BouncyCastleProvider());
	}

	@Value("${qr.crypto.public.cert.path}")
	private String publicCertPath;

	@Value("${qr.crypto.private.key.path}")
	private String privateKeyPath;

	@Autowired
	private ResourceLoader resourceLoader;

	@Getter
	private PublicKey publicKey;

	@Getter
	private PrivateKey privateKey;

	@PostConstruct
	public void init() {
		try {
			this.publicKey = loadPublicKey();
			this.privateKey = loadPrivateKey();
			log.info("Loaded RSA key pair for secure QR crypto from {} / {}", publicCertPath, privateKeyPath);
		} catch (Exception e) {
			log.error("Unable to load the citizenseva certificate/key for secure QR crypto.", e);
			throw new CustomException("QR_CRYPTO_KEY_LOAD_ERROR",
					"Unable to load the certificate/private key configured for secure QR generation. Message: "
							+ e.getMessage());
		}
	}

	private PublicKey loadPublicKey() throws Exception {
		Resource resource = resourceLoader.getResource(publicCertPath);
		try (InputStream is = resource.getInputStream()) {
			CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");
			X509Certificate certificate = (X509Certificate) certificateFactory.generateCertificate(is);
			return certificate.getPublicKey();
		}
	}

	private PrivateKey loadPrivateKey() throws Exception {
		Resource resource = resourceLoader.getResource(privateKeyPath);
		try (InputStream is = resource.getInputStream();
				PEMParser pemParser = new PEMParser(new InputStreamReader(is))) {

			Object pemObject = pemParser.readObject();
			JcaPEMKeyConverter converter = new JcaPEMKeyConverter().setProvider("BC");

			if (pemObject instanceof PEMKeyPair) {
				// Traditional PKCS#1 "BEGIN RSA PRIVATE KEY" format.
				return converter.getKeyPair((PEMKeyPair) pemObject).getPrivate();
			} else if (pemObject instanceof PrivateKeyInfo) {
				// PKCS#8 "BEGIN PRIVATE KEY" format.
				return converter.getPrivateKey((PrivateKeyInfo) pemObject);
			}
			throw new IllegalArgumentException("Unsupported private key format in " + privateKeyPath);
		}
	}
}
