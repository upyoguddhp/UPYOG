package org.egov.garbageservice.exception;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class GarbageServiceException extends RuntimeException {

	private static final long serialVersionUID = 6434654148768665881L;

	private final String message;
	private final String errorCode;

	public GarbageServiceException(String errorCode, String message) {
		super();
		this.message = message;
		this.errorCode = errorCode;
	}
}
