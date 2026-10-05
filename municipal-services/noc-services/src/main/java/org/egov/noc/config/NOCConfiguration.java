package org.egov.noc.config;

import java.util.TimeZone;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Component
public class NOCConfiguration {

	@Value("${app.timezone}")
	private String timeZone;

	@PostConstruct
	public void initialize() {
		TimeZone.setDefault(TimeZone.getTimeZone(timeZone));
	}
	
	// Alfresco keys
	public static final Long ALFRESCO_COMMON_DOCUMENT_ID = 0L;
	public static final String ALFRESCO_COMMON_CERTIFICATE_DESCRIPTION = "chb service certificate";
	public static final String ALFRESCO_COMMON_CERTIFICATE_ID = "";
	public static final String ALFRESCO_COMMON_CERTIFICATE_TYPE = "PDF";
	public static final String ALFRESCO_DOCUMENT_TYPE = "CERT";
	public static final String ALFRESCO_NOC_CERTIFICATE_COMMENT = "Signed Certificate";
	public static final String ALFRESCO_BUSINESS_SERVICE = "chb-services";
	public static final String STATUS_APPROVED = "APPROVED";

	// User Config
	@Value("${egov.user.host}")
	private String userHost;

	@Value("${egov.user.context.path}")
	private String userContextPath;

	@Value("${egov.user.search.path}")
	private String userSearchEndpoint;

	// SMS
	@Value("${kafka.topics.notification.sms}")
	private String smsNotifTopic;

	@Value("${notification.sms.enabled}")
	private Boolean isSMSEnabled;

	// Localization
	@Value("${egov.localization.host}")
	private String localizationHost;

	@Value("${egov.localization.context.path}")
	private String localizationContextPath;

	@Value("${egov.localization.search.endpoint}")
	private String localizationSearchEndpoint;

	@Value("${egov.localization.statelevel}")
	private Boolean isLocalizationStateLevel;
	
	@Value("${egov.idgen.host}")
	private String idGenHost;

	@Value("${egov.idgen.path}")
	private String idGenPath;

	@Value("${egov.idgen.noc.application.id}")
	private String applicationNoIdgenName;
	
	@Value("${workflow.context.path}")
	private String wfHost;

	@Value("${workflow.transition.path}")
	private String wfTransitionPath;

	@Value("${workflow.businessservice.search.path}")
	private String wfBusinessServiceSearchPath;

	@Value("${workflow.process.path}")
	private String wfProcessPath;
		
	@Value("${egov.mdms.host}")
	private String mdmsHost;

	@Value("${egov.mdms.search.endpoint}")
	private String mdmsEndPoint;
	
	@Value("${persister.save.noc.topic}")
	private String saveTopic;
	
	@Value("${persister.update.noc.topic}")
	private String updateTopic;
	
	@Value("${persister.update.noc.workflow.topic}")
	private String updateWorkflowTopic;
	
	@Value("${egov.noc.pagination.default.limit}")
	private Integer defaultLimit;

	@Value("${egov.noc.pagination.default.offset}")
	private Integer defaultOffset;

	@Value("${egov.noc.pagination.max.limit}")
	private Integer maxSearchLimit;
	
	@Value("${noc.offline.doc.required}")
	private Boolean nocOfflineDocRequired;

	//bpa configuration
    @Value("${egov.bpa.host}")
    private String bpaHost;

    @Value("${egov.bpa.context.path}")
    private String bpaContextPath;

    @Value("${egov.bpa.search.endpoint}")
    private String bpaSearchEndpoint;
    
    //billing
    @Value("${egov.bill.context.host}")
    private String billingHost;

    @Value("${egov.demand.create.endpoint}")
    private String demandCreateEndpoint;

    @Value("${egov.bill.endpoint.fetch}")
    private String billFetchEndpoint;

    @Value("${egov.bill.endpoint.search}")
    private String billSearchEndpoint;
    
    @Value("${egov.mdmsV2.host}")
    private String mdmsV2Host;

    @Value("${egov.mdms.v2.search}")
    private String mdmsV2SearchEndpoint;
    
	@Value("${egov.report.host}")
	public String reportHost;

	@Value("${egov.report.endpoint.create}")
	public String reportCreateEndPoint;
	
	@Value("${egov.alfresco.host}")
	public String alfrescoHost;

	@Value("${egov.alfresco.endpoint.upload}")
	public String alfrescoUploadEndPoint;
}
