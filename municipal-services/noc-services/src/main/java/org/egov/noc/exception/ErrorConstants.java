package org.egov.noc.exception;

import org.springframework.stereotype.Component;

@Component
public class ErrorConstants {
	public static final String ERR_INPUT_VALIDATION = "ERR_INPUT_VALIDATION";
	public static final String ERR_INPUT_VALIDATION_MSG = "Input Invalid.";

	public static final String ERR_TECHNICAL = "ERR_TECHNICAL";
	public static final String ERR_TECHNICAL_MSG = "Internal server error occurred.";

	public static final String ERR_ROWMAPPER = "ERR_ROWMAPPER";
	public static final String ERR_ROWMAPPER_MSG = "Error occured in row mapper.";

	public static final String ERR_HTTP_CLIENT = "ERR_HTTP_CLIENT";
	public static final String ERR_HTTP_CLIENT_MSG = "HTTP Client error occured.";

	public static final String ERR_USER_SERVICE_ERROR = "ERR_USER_SERVICE_ERROR";
	public static final String ERR_USER_SERVICE_ERROR_MSG = "Error occured in user service.";

	public static final String ERR_COMMON_SERVICE_ERROR = "ERR_COMMON_SERVICE_ERROR";
	public static final String ERR_COMMON_SERVICE_ERROR_MSG = "Error occured in Common service.";

	public static final String ERR_GENERATE_ID = "ERR_GENERATE_ID";
	public static final String ERR_GENERATE_ID_MSG = "Error occured while generating employee id.";

	public static final String ERR_NOT_FOUND = "ERR_NOT_FOUND";
	public static final String ERR_NOT_FOUND_MSG = "Not found.";

	public static final String PARSING_ERROR = "PARSING ERROR";

	public static final String ERR_DUPLICATE_ENTITY = "ERR_DUPLICATE_ENTITY";
	public static final String ERR_DUPLICATE_ENTITY_MSG = "Entity already exists.";
}