package org.egov.pt.exception;

import java.util.Arrays;
import java.util.Date;
import java.util.List;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
public class ErrorInfo {
	private String errorCode;
	private String errorMessage;
	private List<String> errorDetails;
	private Date timestamp;

	public ErrorInfo(String errorCode, String errorMessage, Date timestamp) {
		this.errorCode = errorCode;
		this.errorMessage = errorMessage;
		this.timestamp = timestamp;
		this.errorDetails = Arrays.asList(errorMessage);
	}

	public ErrorInfo(String errorCode, String errorMessage, List<String> errors, Date timestamp) {
		this.errorCode = errorCode;
		this.errorMessage = errorMessage;
		this.timestamp = timestamp;
		this.errorDetails = errors;
	}
}