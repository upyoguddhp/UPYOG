package org.upyog.chb.util;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
<<<<<<< HEAD
=======
import java.time.LocalDateTime;
>>>>>>> niua-upstream/niua-dev-2.0
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.egov.common.contract.request.RequestInfo;
import org.upyog.chb.web.models.AuditDetails;
import org.upyog.chb.web.models.ResponseInfo;
import org.upyog.chb.web.models.ResponseInfo.StatusEnum;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

<<<<<<< HEAD
import net.logstash.logback.encoder.org.apache.commons.lang.StringUtils;

public class CommunityHallBookingUtil {

	public static ResponseInfo createReponseInfo(final RequestInfo requestInfo, String resMsg, StatusEnum status) {

		final String apiId = requestInfo != null ? requestInfo.getApiId() : StringUtils.EMPTY;
		final String ver = requestInfo != null ? requestInfo.getVer() : StringUtils.EMPTY;
		Long ts = null;
		if (requestInfo != null)
			ts = requestInfo.getTs();
		final String msgId = requestInfo != null ? requestInfo.getMsgId() : StringUtils.EMPTY;

		ResponseInfo responseInfo = ResponseInfo.builder().apiId(apiId).ver(ver).ts(ts).msgId(msgId).resMsgId(resMsg)
				.status(status).build();

		return responseInfo;
=======
import lombok.extern.slf4j.Slf4j;
import net.logstash.logback.encoder.org.apache.commons.lang.StringUtils;

/**
 * Common utility methods for the Community Hall Booking module.
 */
@Slf4j
public class CommunityHallBookingUtil {

	private static final ZoneId SYSTEM_ZONE = ZoneId.systemDefault();

	public static final String DATE_FORMAT = "yyyy-MM-dd";

	private CommunityHallBookingUtil() {
	}

	public static ResponseInfo createReponseInfo(final RequestInfo requestInfo, String resMsg, StatusEnum status) {
		final String apiId = requestInfo != null ? requestInfo.getApiId() : StringUtils.EMPTY;
		final String ver = requestInfo != null ? requestInfo.getVer() : StringUtils.EMPTY;
		Long ts = null;
		if (requestInfo != null) {
			ts = requestInfo.getTs();
		}
		final String msgId = requestInfo != null ? requestInfo.getMsgId() : StringUtils.EMPTY;

		return ResponseInfo.builder().apiId(apiId).ver(ver).ts(ts).msgId(msgId).resMsgId(resMsg).status(status).build();
>>>>>>> niua-upstream/niua-dev-2.0
	}

	public static Long getCurrentTimestamp() {
		return Instant.now().toEpochMilli();
	}
<<<<<<< HEAD
	
	public static LocalDate getCurrentDate() {
		return LocalDate.now();
	}

	public static AuditDetails getAuditDetails(String by, Boolean isCreate) {
		Long time = getCurrentTimestamp();
		if (isCreate)
			// TODO: check if we can set lastupdated details to empty
			return AuditDetails.builder().createdBy(by).lastModifiedBy(by).createdTime(time).lastModifiedTime(time)
					.build();
		else
			return AuditDetails.builder().lastModifiedBy(by).lastModifiedTime(time).build();
	}
	
	/*Commented and used Instant
	 * public static Long getCurrentTimestamp() { return System.currentTimeMillis();
	 * }
	 */
=======

	public static LocalDate getCurrentDate() {
		return LocalDate.now(SYSTEM_ZONE);
	}

	public static AuditDetails getAuditDetails(String by, boolean isCreate) {
		Long time = getCurrentTimestamp();
		if (isCreate) {
			return AuditDetails.builder().createdBy(by).lastModifiedBy(by).createdTime(time).lastModifiedTime(time)
					.build();
		}
		return AuditDetails.builder().lastModifiedBy(by).lastModifiedTime(time).build();
	}
>>>>>>> niua-upstream/niua-dev-2.0

	public static String getRandonUUID() {
		return UUID.randomUUID().toString();
	}

	public static LocalDate parseStringToLocalDate(String date) {
<<<<<<< HEAD
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
		LocalDate localDate = LocalDate.parse(date, formatter);
		return localDate;
	}

	public static Long minusOneDay(LocalDate date) {
		return date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
	}

	public static String parseLocalDateToString(LocalDate date) {
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
		// Format the LocalDate
		String formattedDate = date.format(formatter);
		return formattedDate;
	}

	public static AuditDetails getAuditDetails(ResultSet rs) throws SQLException {
		AuditDetails auditdetails = AuditDetails.builder().createdBy(rs.getString("createdBy"))
				.createdTime(rs.getLong("createdTime")).lastModifiedBy(rs.getString("lastModifiedBy"))
				.lastModifiedTime(rs.getLong("lastModifiedTime")).build();
		return auditdetails;
=======
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_FORMAT);
		return LocalDate.parse(date, formatter);
	}

	public static Long minusOneDay(LocalDate date) {
		return date.atStartOfDay(SYSTEM_ZONE).toInstant().toEpochMilli();
	}

	public static String parseLocalDateToString(LocalDate date, String dateFormat) {
		String effectiveFormat = dateFormat != null ? dateFormat : DATE_FORMAT;
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern(effectiveFormat);
		return date.format(formatter);
	}

	public static String convertDateFormat(String date, String dateFormat) {
		String effectiveFormat = dateFormat != null ? dateFormat : DATE_FORMAT;
		LocalDate localDate = parseStringToLocalDate(date);
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern(effectiveFormat);
		return localDate.format(formatter);
	}

	public static AuditDetails getAuditDetails(ResultSet rs) throws SQLException {
		return AuditDetails.builder().createdBy(rs.getString("createdBy"))
				.createdTime(rs.getLong("createdTime")).lastModifiedBy(rs.getString("lastModifiedBy"))
				.lastModifiedTime(rs.getLong("lastModifiedTime")).build();
>>>>>>> niua-upstream/niua-dev-2.0
	}

	public static String beuatifyJson(Object result) {
		ObjectMapper mapper = new ObjectMapper();
<<<<<<< HEAD
		String data = null;
		try {
			data = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);
		} catch (JsonProcessingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return data;
=======
		try {
			return mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);
		} catch (JsonProcessingException e) {
			log.error("Failed to serialize object to JSON", e);
			return null;
		}
>>>>>>> niua-upstream/niua-dev-2.0
	}

	public static String getTenantId(String tenantId) {
		return tenantId.split("\\.")[0];
	}

<<<<<<< HEAD
=======
	public static LocalDate getMonthsAgo(int month) {
		return LocalDate.now(SYSTEM_ZONE).minusMonths(month);
	}

	/**
	 * Converts the given minutes to seconds.
	 */
	public static int getSeconds(int minutes) {
		if (minutes < 0) {
			throw new IllegalArgumentException("Minutes cannot be negative");
		}
		return minutes * 60;
	}

	public static long calculateDifferenceInSeconds(long time1, long time2) {
		long differenceInMillis = time1 - time2;
		return differenceInMillis / 1000;
	}

	/**
	 * Converts date string to long using LocalDateTime.
	 */
	public static Long dateTolong(String date, String format) {
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);

		if (format.contains("H") || format.contains("m") || format.contains("s")) {
			LocalDateTime dateTime = LocalDateTime.parse(date, formatter);
			return dateTime.atZone(SYSTEM_ZONE).toInstant().toEpochMilli();
		}
		LocalDate localDate = LocalDate.parse(date, formatter);
		return localDate.atStartOfDay(SYSTEM_ZONE).toInstant().toEpochMilli();
	}

>>>>>>> niua-upstream/niua-dev-2.0
}
