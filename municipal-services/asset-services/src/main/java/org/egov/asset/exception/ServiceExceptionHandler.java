package org.egov.asset.exception;

import static org.egov.asset.exception.ErrorConstants.ERR_GENERATE_ID;
import static org.egov.asset.exception.ErrorConstants.ERR_HTTP_CLIENT;
import static org.egov.asset.exception.ErrorConstants.ERR_INPUT_VALIDATION;
import static org.egov.asset.exception.ErrorConstants.ERR_NOT_FOUND;
import static org.egov.asset.exception.ErrorConstants.ERR_ROWMAPPER;
import static org.egov.asset.exception.ErrorConstants.ERR_TECHNICAL;
import static org.egov.asset.exception.ErrorConstants.ERR_TECHNICAL_MSG;

import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import org.postgresql.util.PSQLException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.fasterxml.jackson.databind.JsonMappingException;

@ControllerAdvice
public class ServiceExceptionHandler extends ResponseEntityExceptionHandler {

	@ExceptionHandler(ServiceException.class)
	public ResponseEntity<Object> handleUserServiceException(ServiceException ex) {

		ex.printStackTrace();
		HttpStatus httpStatus;
		String errorCode = ex.getErrorCode();
		if (isNotFoundException(errorCode)) {
			httpStatus = HttpStatus.NOT_FOUND;
		} else if (isBadRequestException(errorCode)) {
			httpStatus = HttpStatus.BAD_REQUEST;
		} else if (isTechnicalErrorException(errorCode)) {
			httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
		} else {
			httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
			errorCode = ERR_TECHNICAL;
		}

		return new ResponseEntity<>(new ErrorInfo(errorCode, ex.getMessage(), new Date()), httpStatus);
	}

	private static boolean isNotFoundException(String errorCode) {
		List<String> notFoundErrorCodes = Arrays.asList(ERR_NOT_FOUND);
		return notFoundErrorCodes.contains(errorCode);
	}

	private static boolean isBadRequestException(String errorCode) {
		List<String> badRequestErrorCodes = Arrays.asList(ERR_ROWMAPPER, ERR_INPUT_VALIDATION);
		return badRequestErrorCodes.contains(errorCode);
	}

	private static boolean isTechnicalErrorException(String errorCode) {
		List<String> technicalErrorCodes = Arrays.asList(ERR_GENERATE_ID, ERR_HTTP_CLIENT, ERR_TECHNICAL);
		return technicalErrorCodes.contains(errorCode);
	}

	@Override
	protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
			HttpHeaders headers, HttpStatus status, WebRequest request) {
		ex.printStackTrace();
		String errorMessage = "Http message not readable exception occured.";
		JsonMappingException jsonMappingException = (JsonMappingException) ex.getCause();
		List<String> errors = jsonMappingException.getPath().stream()
				.map(jme -> String.format("%s : input format is invalid.", jme.getFieldName()))
				.collect(Collectors.toList());
		return buildResponseEntity(new ErrorInfo(ERR_INPUT_VALIDATION, errorMessage, errors, new Date()));
	}

	private ResponseEntity<Object> buildResponseEntity(ErrorInfo errorInfo) {
		return new ResponseEntity<>(errorInfo, HttpStatus.BAD_REQUEST);
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatus status, WebRequest request) {
		ex.printStackTrace();
		String errorMessage = "Method argument not valid exception occured.";
		List<String> errors = ex.getBindingResult().getFieldErrors().stream()
				.map(x -> String.format("%s : %s.", x.getField(), x.getDefaultMessage())).collect(Collectors.toList());
		return new ResponseEntity<>(new ErrorInfo(ERR_INPUT_VALIDATION, errorMessage, errors, new Date()),
				HttpStatus.BAD_REQUEST);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<?> handleUnknownException(final Exception exception, final HttpServletRequest request) {
		exception.printStackTrace();
		List<String> errors = Arrays.asList(exception.getMessage());
		return new ResponseEntity<>(new ErrorInfo(ERR_TECHNICAL, ERR_TECHNICAL_MSG, errors, new Date()),
				HttpStatus.INTERNAL_SERVER_ERROR);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	protected ResponseEntity<Object> handleDataIntegrityViolationException(DataIntegrityViolationException ex,
			WebRequest request) {
		ex.printStackTrace();
		String errorMessage = "Data integrity violation occurred.";
		List<String> errors;

		Throwable rootCause = ex.getRootCause();
		if (rootCause instanceof PSQLException) {
			PSQLException psqlException = (PSQLException) rootCause;
			String detail = psqlException.getServerErrorMessage().getDetail();
			errors = Collections.singletonList(detail != null ? detail : psqlException.getMessage());
		} else {
			errors = Collections.singletonList(ex.getMessage());
		}

		ErrorInfo errorInfo = new ErrorInfo(ERR_TECHNICAL, errorMessage, errors, new Date());
		return new ResponseEntity<>(errorInfo, new HttpHeaders(), HttpStatus.INTERNAL_SERVER_ERROR);
	}

	@ExceptionHandler(BadSqlGrammarException.class)
	protected ResponseEntity<Object> handleBadSqlGrammarException(BadSqlGrammarException ex, WebRequest request) {
		ex.printStackTrace();
		String errorMessage = "There was an error with the SQL syntax.";
		List<String> errors;

		Throwable rootCause = ex.getRootCause();
		if (rootCause instanceof PSQLException) {
			PSQLException psqlException = (PSQLException) rootCause;
			String detail = psqlException.getServerErrorMessage().getDetail();
			errors = Collections.singletonList(detail != null ? detail : psqlException.getMessage());
		} else {
			errors = Collections.singletonList(ex.getMessage());
		}

		ErrorInfo errorInfo = new ErrorInfo(ERR_TECHNICAL, errorMessage, errors, new Date());
		return new ResponseEntity<>(errorInfo, new HttpHeaders(), HttpStatus.INTERNAL_SERVER_ERROR);
	}

}
