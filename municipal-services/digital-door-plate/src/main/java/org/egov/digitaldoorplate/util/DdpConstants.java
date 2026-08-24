package org.egov.digitaldoorplate.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
public class DdpConstants {

	public static final String DUTY_STATUS_STARTED = "STARTED";

	public static final String DUTY_STATUS_ENDED = "ENDED";

	public static final String WASTE_TYPE_WET = "WET";

	public static final String WASTE_TYPE_DRY = "DRY";

	public static final String WASTE_TYPE_MIXED = "MIXED";

	public static final String TIMEZONE = "Asia/Kolkata";

	public static final String PLATE_STATUS_QR_GENERATED = "QR_GENERATED";

	public static final String PLATE_STATUS_PRINT_VERIFIED = "PRINT_VERIFIED";

	public static final String PLATE_STATUS_INSTALLED = "INSTALLED";

	public static final String SYNC_STATUS_CREATED = "CREATED";

	public static final String SYNC_STATUS_QUEUED = "QUEUED";

	public static final String SYNC_STATUS_DUPLICATE = "DUPLICATE";

	public static final String SYNC_STATUS_FAILED = "FAILED";

	public static final String CONTRACTOR_STATUS_ONBOARDED = "ONBOARDED";

	public static final String CONTRACTOR_STATUS_ACTIVE = "ACTIVE";

	public static final String CONTRACTOR_STATUS_INACTIVE = "INACTIVE";

	public static final String COLLECTOR_ASSIGNMENT_STATUS_ASSIGNED = "ASSIGNED";

	public static final String COLLECTOR_ASSIGNMENT_STATUS_UNASSIGNED = "UNASSIGNED";

	public static final String USER_TYPE_EMPLOYEE = "EMPLOYEE";

	public static final String USER_ROLE_GARBAGE_COLLECTOR = "GARBAGE_COLLECTOR";

	public static final String USER_ROLE_GARBAGE_SUPERVISOR = "GARBAGE_SUPERVISOR";

	@Value("${state.level.tenant.id}")
	private String stateLevelTenantId;

	@Value("${kafka.topics.save.garbage.collection}")
	private String saveGarbageCollectionTopic;

	@Value("${egov.garbage.service.host}")
	private String garbageServiceHostUrl;

	@Value("${egov.garbage.account.search.endpoint}")
	private String garbageAccountSearchEndpoint;
}
