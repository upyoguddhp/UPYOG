//package org.egov.schedulerservice.util;
//
//import java.text.SimpleDateFormat;
//import java.util.Date;
//
//import org.apache.commons.lang3.ObjectUtils;
//import org.apache.commons.lang3.StringUtils;
//import org.egov.tracer.model.CustomException;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Component;
//
//import lombok.Data;
//
//@Data
//@Component
//public class SchedulerConstants {
//
//
//	public static final String STATE_LEVEL_TENANT_ID = "hp";
//
//	public static final String APPLICATION_PREFIX = "GB/HP/DISTRICT/ULBNAME/MMYYYY/XXXXXX";
//
//	public static final String DOCUMENT_ACCOUNT = "ACCOUNT";
//	
//	public static final String STATUS_INITIATED = "INITIATED";
//    
//    public static final String STATUS_PENDINGFORMODIFICATION = "PENDINGFORMODIFICATION";
//    
//    public static final String STATUS_PENDINGFORVERIFICATION = "PENDINGFORVERIFICATION";
//    
//    public static final String STATUS_PENDINGFORPAYMENT = "PENDINGFORPAYMENT";
//    
//    public static final String STATUS_PENDINGFORAPPROVAL = "PENDINGFORAPPROVAL";
//
//    public static final String STATUS_APPROVED  = "APPROVED";
//
//    public static final String STATUS_REJECTED  = "REJECTED";
//
//    public static final String STATUS_CANCELLED  = "CANCELLED";
//
//    public static final String WORKFLOW_ACTION_INITIATE  = "INITIATE";
//
//    public static final String WORKFLOW_ACTION_VERIFY  = "VERIFY";
//
//    public static final String WORKFLOW_ACTION_FORWARD_TO_VERIFIER  = "FORWARD_TO_VERIFIER";
//
//    public static final String WORKFLOW_ACTION_APPROVE  = "APPROVE";
//
//    public static final String WORKFLOW_ACTION_FORWARD_TO_APPROVER  = "FORWARD_TO_APPROVER";
//
//    public static final String WORKFLOW_ACTION_RETURN_TO_INITIATOR  = "RETURN_TO_INITIATOR";
//
//    public static final String WORKFLOW_ACTION_RETURN_TO_VERIFIER  = "RETURN_TO_VERIFIER";
//
//    public static final String WORKFLOW_ACTION_RETURN_TO_INITIATOR_FOR_PAYMENT = "RETURN_TO_INITIATOR_FOR_PAYMENT";
//
//    public static final String WORKFLOW_BUSINESS_SERVICE = "GB";
//
//    public static final String BUSINESS_SERVICE = "GB";
//
//    public static final String WORKFLOW_MODULE_NAME  = "GB";
//
//    public static final String MDMS_MODULE_NAME_FEE_STRUCTURE  = "Garbage";
//
//    public static final String MDMS_MASTER_NAME_FEE_STRUCTURE  = "FeeStructure";
//
//    public static final String USER_TYPE_CITIZEN  = "CITIZEN";
//
//    public static final String USER_TYPE_EMPLOYEE = "EMPLOYEE";
//
//    public static final String USER_ROLE_GB_VERIFIER = "GB_VERIFIER";
//
//    public static final String USER_ROLE_GB_APPROVER = "GB_APPROVER";
//
//    public static final String USER_ROLE_SUPERVISOR = "SUPERVISOR";
//
//    public static final String USER_ROLE_SECRETARY = "SECRETARY";
//
//    public static final String BILLING_TAX_HEAD_MASTER_CODE = "LCF.Garbage_Collection_Fee";
//    
////
////    @Value("${workflow.context.path}")
////    public String workflowHost;
////    
////    @Value("${workflow.transition.path}")
////    public String workflowEndpointTransition;
////    
////    @Value("${workflow.business.search}")
////    public String workflowBusinessServiceSearchPath;
//    
//
//
//	// PERSISTER
//	@Value("${ptr.kafka.create.topic}")
//	private String createPtrTopic;
//
//	@Value("${ptr.kafka.update.topic}")
//	private String updatePtrTopic;
//
//
//	// ##### mdms
//
//	@Value("${egov.mdms.host}")
//	private String mdmsHost;
//
//	@Value("${egov.mdms.search.endpoint}")
//	private String mdmsEndpoint;
//
//    @Value("${egov.bill.context.host}")
//    public String billHost;
//    
//    @Value("${egov.bill.endpoint.fetch}")
//    public String fetchBillEndpoint;
//    
//    @Value("${egov.bill.endpoint.search}")
//    public String searchBillEndpoint;
//    
//    @Value("${egov.demand.create.endpoint}")
//    public String demandCreateEndpoint;
//    
//    @Value("${egov.demand.search.endpoint}")
//    public String demandSearchEndpoint;
//    
//    @Value("${egov.demand.update.endpoint}")
//    public String demandUpdateEndpoint;
//
//}
