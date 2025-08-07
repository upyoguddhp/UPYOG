package org.egov.user.domain.service.utils;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import javax.xml.bind.ValidationException;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.opensaml.saml2.core.Issuer;
import org.opensaml.saml2.core.LogoutRequest;
import org.opensaml.saml2.core.LogoutResponse;
import org.opensaml.saml2.core.NameID;
import org.opensaml.saml2.core.Response;
import org.opensaml.saml2.core.Status;
import org.opensaml.saml2.core.StatusCode;
import org.opensaml.saml2.core.impl.LogoutRequestImpl;
import org.egov.user.web.contract.BisagNSAMLResponse;
import org.joda.time.DateTime;
import org.opensaml.Configuration;
import org.opensaml.DefaultBootstrap;
import org.opensaml.common.SAMLObjectBuilder;
import org.opensaml.common.SAMLVersion;
import org.opensaml.xml.ConfigurationException;
import org.opensaml.xml.io.Unmarshaller;
import org.opensaml.xml.io.UnmarshallerFactory;
import org.opensaml.xml.io.UnmarshallingException;
import org.opensaml.xml.security.credential.Credential;
import org.opensaml.xml.security.x509.BasicX509Credential;
import org.opensaml.xml.signature.SignatureValidator;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.SAXException;

public class BisagNSAMLUtil {

//  private static final String pvtKeyPath = "/etc/ssl/private/rrm.army.mil.key";
//	private static final String iampubKeyPath = "/etc/ssl/certs/iam.cer";

	private static final String pvtKeyPath = "D:\\JLA 24_02_23\\cert\\iametm.army.mil.key";
	private static final String iampubKeyPath = "D:\\JLA 24_02_23\\cert\\class3.cer";

	public static BisagNSAMLResponse validateSAML(String response)
			throws InvalidKeySpecException, NoSuchAlgorithmException, IOException, ValidationException,
			CertificateException, ParserConfigurationException, SAXException, UnmarshallingException,
			org.opensaml.xml.validation.ValidationException {
		// SAML Response in encrypted with application server's public key
		// Response is decrypted using application server's private key
		String decryptFile = decryptFile(response, getPrivateKey());
		BisagNSAMLResponse res = receiveSAMLResponse(decryptFile);
		return res;
	}

	public static BisagNSAMLResponse receiveSAMLResponse(String responseString)
			throws ParserConfigurationException, SAXException, IOException, UnmarshallingException, ValidationException,
			CertificateException, org.opensaml.xml.validation.ValidationException {

		Response response = null;
		BisagNSAMLResponse res = new BisagNSAMLResponse();
		System.out.println("responseString :-" + responseString);
		String responseXml = new String(Base64.getDecoder().decode(responseString.getBytes()));

		System.out.println("responseXml :-" + responseXml);
		/* Generating SAML Response object from XML string */
		try {
			DocumentBuilderFactory documentBuilderFactory = DocumentBuilderFactory.newInstance();
			documentBuilderFactory.setNamespaceAware(true);
			DocumentBuilder docBuilder = documentBuilderFactory.newDocumentBuilder();
			DefaultBootstrap.bootstrap();
			System.out.println("--" + responseXml.getBytes());
			Document document = docBuilder.parse(new ByteArrayInputStream(responseXml.getBytes()));

			Element element = document.getDocumentElement();
			UnmarshallerFactory unmarshallerFactory = Configuration.getUnmarshallerFactory();
			Unmarshaller unmarshaller = unmarshallerFactory.getUnmarshaller(element);

			response = (Response) unmarshaller.unmarshall(element);
			validateSignature(response);

			String userid = response.getAssertions().get(0).getSubject().getNameID().getValue();
			String roleid = response.getAssertions().get(0).getAttributeStatements().get(0).getAttributes().get(3)
					.getAttributeValues().get(0).getDOM().getFirstChild().getNodeValue();
			res.setRole(roleid);
			res.setAppt(userid);
			res.setHasSignValidated(true);
			// System.out.println("response1
			// "+response1.getAssertions().get(0).getAttributeStatements().get(0).getAttributes().get(4).getAttributeValues().get(0).getDOM().getFirstChild().getNodeValue());
		} catch (ConfigurationException e) {
			res.setHasSignValidated(false);
			e.printStackTrace();
		} catch (ArrayIndexOutOfBoundsException e) {
			e.printStackTrace();
			res.setHasSignValidated(false);
		} catch (Exception e) {
			e.printStackTrace();
			res.setHasSignValidated(false);
		}
		return res;
	}

	private static void validateSignature(org.opensaml.saml2.core.Response response) throws ValidationException,
			FileNotFoundException, CertificateException, org.opensaml.xml.validation.ValidationException {
		// SAMLSignatureProfileValidator profileValidator = new
		// SAMLSignatureProfileValidator();
		// profileValidator.validate(response.getSignature());
		System.out.println("response.getSignature() " + response.getSignature());
		Credential verificationCredential = getVerificationCredential();
		SignatureValidator sigValidator = new SignatureValidator(verificationCredential);
		sigValidator.validate(response.getSignature());
	}

	// Retrieving IAM public key for signature verification
	private static Credential getVerificationCredential() throws FileNotFoundException, CertificateException {
		BufferedInputStream bis = new BufferedInputStream(new FileInputStream(iampubKeyPath));
		CertificateFactory cf = CertificateFactory.getInstance("X509");
		X509Certificate cert = (X509Certificate) cf.generateCertificate(bis);
		BasicX509Credential x509Credential = new BasicX509Credential();
		x509Credential.setPublicKey(cert.getPublicKey());
		x509Credential.setEntityCertificate(cert);
		Credential credential = x509Credential;
		return credential;
	}

	public static String decryptFile(String inputData, PrivateKey xprivatekey) {
		String decryptionStatus = "";
		String decryptionData = "";
		try {
			String eFile = "";
			String encKey = "";
			byte[] ef = null;
			File file = null;
			try {
				ef = inputData.getBytes();
			} catch (Exception e) {
				decryptionStatus = "failure - " + e.getLocalizedMessage();
			}
			try {
				String sd = new String(ef);
				String ss = new String(Base64.getEncoder().encode("alpha".getBytes()));
				String[] s1 = sd.split(ss);
				eFile = new String(s1[0]);
				encKey = new String(s1[1]);
			} catch (Exception e) {
				decryptionStatus = "failure - " + e.getLocalizedMessage();
			}
			Cipher decryptCipherRSA = null;
			try {
				decryptCipherRSA = Cipher.getInstance("RSA/ECB/PKCS1Padding");
			} catch (Exception e) {
				decryptionStatus = "failure - Error while initiating the RSA Keys-" + e.getLocalizedMessage();
				// System.out.println(e + "e^2003:Error while initiating the RSA Keys.");
			}
			PrivateKey privateKey = xprivatekey;
			decryptCipherRSA.init(2, privateKey);
			byte[] ds = null;
			try {
				ds = decryptCipherRSA.doFinal(Base64.getDecoder().decode(encKey));
			} catch (Exception e) {
				decryptionStatus = "failure - Error while decrypting the file-" + e.getLocalizedMessage();
				// System.out.println("e^2004:Error while decrypting the file.");
			}
			Cipher decryptCipherAES = null;
			try {
				SecretKey secKeyDec = new SecretKeySpec(ds, "AES");
				decryptCipherAES = Cipher.getInstance("AES");
				decryptCipherAES.init(2, secKeyDec);
			} catch (Exception e) {
				decryptionStatus = "failure - Error while generating the SYM key-" + e.getLocalizedMessage();
				// System.out.println("e^2005:Error while generating the SYM key.");
			}
			byte[] decryptedBytes = null;
			try {
				decryptedBytes = decryptCipherAES.doFinal(Base64.getDecoder().decode(eFile));
			} catch (Exception e) {
				decryptionStatus = "failure - Error while decrypting the file-" + e.getLocalizedMessage();
				// System.out.println("e^2006:Error while decrypting the file.");
			}
			String decryptedData = new String(decryptedBytes);
			decryptionData = decryptedData;
			decryptionStatus = "success";
		} catch (Exception e) {
			decryptionStatus = "failure - Error while decrypting-" + e.getLocalizedMessage();
			// System.out.println(e + "e^2009:Error while decrypting.");
		}
		return decryptionData;
	}

	// Retrieving application server's private key from file path
	public static PrivateKey getPrivateKey() throws IOException, InvalidKeySpecException, NoSuchAlgorithmException {
		String privateKeyContent = new String(Files.readAllBytes(Paths.get(pvtKeyPath)));
		privateKeyContent = privateKeyContent.replaceAll("\\n", "").replace("-----BEGIN PRIVATE KEY-----", "")
				.replace("-----END PRIVATE KEY-----", "");
		KeyFactory kf = KeyFactory.getInstance("RSA");
		PKCS8EncodedKeySpec keySpecPKCS8 = new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privateKeyContent));
		return kf.generatePrivate(keySpecPKCS8);
	}

}
