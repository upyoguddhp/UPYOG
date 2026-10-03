package org.egov.egf.web.controller.microservice;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.http.HttpStatus;
import org.apache.log4j.Logger;
import org.egov.billsaccounting.services.CreateVoucher;
import org.egov.billsaccounting.services.VoucherConstant;
import org.egov.commons.CVoucherHeader;
import org.egov.commons.EgModules;
import org.egov.commons.service.ChartOfAccountDetailService;
import org.egov.egf.contract.model.AccountDetailContract;
import org.egov.egf.contract.model.SubledgerDetailContract;
import org.egov.egf.contract.model.Voucher;
import org.egov.egf.contract.model.VoucherRequest;
import org.egov.egf.contract.model.VoucherResponse;
import org.egov.egf.contract.model.VoucherSearchRequest;
import org.egov.infra.admin.master.entity.AppConfigValues;
import org.egov.infra.exception.ApplicationRuntimeException;
import org.egov.infra.microservice.models.VoucherSearchCriteria;
import org.egov.infra.microservice.utils.MicroserviceUtils;
import org.egov.infra.validation.exception.ValidationException;
import org.egov.services.voucher.VoucherService;
import org.owasp.esapi.ESAPI;
import org.owasp.esapi.errors.EncodingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;

@RestController
public class VoucherController {
	private static final Logger LOGGER = Logger.getLogger(VoucherController.class);
	@Autowired
	private CreateVoucher createVoucher;
	@Autowired
	private VoucherService voucherService;
	@Autowired
	private ChartOfAccountDetailService chartOfAccountDetailService;

	@PostMapping(value = "/rest/voucher/_search")
	@ResponseBody
	public VoucherResponse search(@RequestBody VoucherSearchRequest voucherSearchRequest) {
		try {
			VoucherResponse response = voucherService.findVouchers(voucherSearchRequest);
			response.setResponseInfo(
					MicroserviceUtils.getResponseInfo(voucherSearchRequest.getRequestInfo(), HttpStatus.SC_OK, null));

			return response;
		} catch (HttpClientErrorException e) {
			LOGGER.error(e.getMessage(), e);
			throw new ApplicationRuntimeException(e.getMessage());
		}

	}

	@PostMapping(value = "/rest/voucher/_ismanualreceiptdateenabled")
	@ResponseBody
	public AppConfigValues getManualReceiptDateConsiderationForVoucher() {
		try {
			return voucherService.isManualReceiptDateEnabledForVoucher();
		} catch (HttpClientErrorException e) {
			LOGGER.error(e.getMessage(), e);
			throw new ApplicationRuntimeException(e.getMessage());
		}
	}

	@PostMapping(value = "/rest/voucher/_getmoduleidbyname")
	@ResponseBody
	public EgModules getEgModuleIdByName(@Param("moduleName") String moduleName) {
		try {
			return voucherService.getModulesIdByName(moduleName);
		} catch (HttpClientErrorException e) {
			LOGGER.error(e.getMessage(), e);
			throw new ApplicationRuntimeException(e.getMessage());
		}
	}

	@PostMapping(value = "/rest/voucher/_create")
	@ResponseBody
	public VoucherResponse create(@RequestBody VoucherRequest voucherRequest) {

	    LOGGER.info("1. REST Voucher create request received");

	    VoucherResponse response = new VoucherResponse();
	    final HashMap<String, Object> headerDetails = new HashMap<>();
	    HashMap<String, Object> detailMap = null;
	    HashMap<String, Object> subledgertDetailMap = null;
	    final List<HashMap<String, Object>> accountdetails = new ArrayList<>();
	    final List<HashMap<String, Object>> subledgerDetails = new ArrayList<>();

	    LOGGER.info("2. Number of vouchers received: "
	            + voucherRequest.getVouchers().size());

	    for (Voucher voucher : voucherRequest.getVouchers()) {

	        LOGGER.info("3. Processing voucher. Voucher Number: "
	                + voucher.getVoucherNumber()
	                + ", Voucher Date: " + voucher.getVoucherDate()
	                + ", Voucher Name: " + voucher.getName()
	                + ", Voucher Type: " + voucher.getType());

	        try {

	            LOGGER.info("4. Parsing voucher date");

	            SimpleDateFormat fm = new SimpleDateFormat("dd/MM/yyyy");
	            Date vDate = fm.parse(voucher.getVoucherDate());

	            LOGGER.info("5. Voucher date parsed successfully: " + vDate);

	            headerDetails.put(VoucherConstant.DEPARTMENTCODE, voucher.getDepartment());
	            headerDetails.put(VoucherConstant.VOUCHERNAME, voucher.getName());
	            headerDetails.put(VoucherConstant.VOUCHERTYPE, voucher.getType());
	            headerDetails.put(VoucherConstant.VOUCHERNUMBER, voucher.getVoucherNumber());
	            headerDetails.put(VoucherConstant.VOUCHERDATE, vDate);
	            headerDetails.put(VoucherConstant.DESCRIPTION, voucher.getDescription());
	            headerDetails.put(VoucherConstant.MODULEID, voucher.getModuleId());

	            String source = voucher.getSource();
	            headerDetails.put(VoucherConstant.SOURCEPATH, source);

	            if (voucher.getReferenceDocument() != null
	                    && !voucher.getReferenceDocument().isEmpty()) {

	                headerDetails.put(VoucherConstant.REFERENCEDOC,
	                        voucher.getReferenceDocument());
	            }

	            if (voucher.getServiceName() != null
	                    && !voucher.getServiceName().isEmpty()) {

	                headerDetails.put(VoucherConstant.SERVICE_NAME,
	                        voucher.getServiceName());
	            }

	            if (voucher.getFund() != null)
	                headerDetails.put(VoucherConstant.FUNDCODE,
	                        voucher.getFund().getCode());

	            if (voucher.getFunction() != null)
	                headerDetails.put(VoucherConstant.FUNCTIONCODE,
	                        voucher.getFunction().getCode());

	            if (voucher.getFunctionary() != null)
	                headerDetails.put(VoucherConstant.FUNCTIONARYCODE,
	                        voucher.getFunctionary().getCode());

	            if (voucher.getScheme() != null)
	                headerDetails.put(VoucherConstant.SCHEMECODE,
	                        voucher.getScheme().getCode());

	            if (voucher.getSubScheme() != null)
	                headerDetails.put(VoucherConstant.SUBSCHEMECODE,
	                        voucher.getSubScheme().getCode());

	            LOGGER.info("6. Voucher header details prepared successfully");

	            LOGGER.info("7. Number of ledger details received: "
	                    + voucher.getLedgers().size());

	            for (AccountDetailContract ac : voucher.getLedgers()) {

	                LOGGER.info("8. Processing ledger. GL Code: "
	                        + ac.getGlcode()
	                        + ", Debit Amount: " + ac.getDebitAmount()
	                        + ", Credit Amount: " + ac.getCreditAmount());

	                detailMap = new HashMap<>();
	                detailMap.put(VoucherConstant.GLCODE, ac.getGlcode());
	                detailMap.put(VoucherConstant.DEBITAMOUNT, ac.getDebitAmount());
	                detailMap.put(VoucherConstant.CREDITAMOUNT, ac.getCreditAmount());

	                if (ac.getFunction() != null)
	                    detailMap.put(VoucherConstant.FUNCTIONCODE,
	                            ac.getFunction().getCode());

	                accountdetails.add(detailMap);

	                LOGGER.info("9. Ledger detail added. Processing subledger details");

	                for (SubledgerDetailContract sl : ac.getSubledgerDetails()) {

	                    LOGGER.info("10. Processing subledger. GL Code: "
	                            + ac.getGlcode()
	                            + ", Amount: " + sl.getAmount()
	                            + ", Detail Type ID: "
	                            + sl.getAccountDetailType().getId()
	                            + ", Detail Key ID: "
	                            + sl.getAccountDetailKey().getId());

	                    subledgertDetailMap = new HashMap<>();
	                    subledgertDetailMap.put(VoucherConstant.GLCODE,
	                            ac.getGlcode());
	                    subledgertDetailMap.put(VoucherConstant.DETAILAMOUNT,
	                            sl.getAmount());
	                    subledgertDetailMap.put(VoucherConstant.DETAIL_TYPE_ID,
	                            sl.getAccountDetailType().getId());
	                    subledgertDetailMap.put(VoucherConstant.DETAIL_KEY_ID,
	                            sl.getAccountDetailKey().getId());

	                    if (chartOfAccountDetailService.getByGlcodeAndDetailTypeId(
	                            ac.getGlcode(),
	                            Integer.valueOf(
	                                    sl.getAccountDetailType().getId().intValue())) != null) {

	                        LOGGER.info("11. Chart of Account Detail found. Adding subledger detail");

	                        subledgerDetails.add(subledgertDetailMap);

	                    } else {

	                        LOGGER.info("11. Chart of Account Detail not found. "
	                                + "Subledger detail not added");
	                    }
	                }
	            }

	            LOGGER.info("12. Account details prepared: "
	                    + accountdetails.size()
	                    + ", Subledger details prepared: "
	                    + subledgerDetails.size());

	            LOGGER.info("13. Calling createVoucher service. Voucher Number: "
	                    + voucher.getVoucherNumber());

	            CVoucherHeader voucherHeader = createVoucher.createVoucher(
	                    headerDetails,
	                    accountdetails,
	                    subledgerDetails);

	            LOGGER.info("14. createVoucher service completed successfully. "
	                    + "Voucher Header ID: " + voucherHeader.getId()
	                    + ", Voucher Number: " + voucherHeader.getVoucherNumber());

	            voucher.setId(voucherHeader.getId());
	            voucher.setVoucherNumber(voucherHeader.getVoucherNumber());

	            response.getVouchers().add(voucher);

	            LOGGER.info("15. Voucher added to response successfully");

	            response.setResponseInfo(
	                    MicroserviceUtils.getResponseInfo(
	                            voucherRequest.getRequestInfo(),
	                            HttpStatus.SC_CREATED,
	                            null));

	            LOGGER.info("16. Response information prepared successfully");

	        } catch (ValidationException | ApplicationRuntimeException e) {

	            LOGGER.error("ERROR at voucher creation. Voucher Number: "
	                    + voucher.getVoucherNumber(), e);

	            throw e;

	        } catch (ParseException e) {

	            LOGGER.error("ERROR at step 4/5. Unable to parse voucher date. "
	                    + "Voucher Number: "
	                    + voucher.getVoucherNumber()
	                    + ", Voucher Date: "
	                    + voucher.getVoucherDate(), e);

	            throw new ApplicationRuntimeException(e.getMessage());
	        }
	    }

	    LOGGER.info("17. REST Voucher create request completed successfully. "
	            + "Total vouchers processed: "
	            + response.getVouchers().size());

	    return response;
	}

	@PostMapping(value = "/rest/voucher/_cancel")
	@ResponseBody
	public VoucherResponse cancel(@RequestBody VoucherSearchRequest voucherSearchRequest) {
		try {
			VoucherResponse response = voucherService.cancel(voucherSearchRequest);
			response.setResponseInfo(
					MicroserviceUtils.getResponseInfo(voucherSearchRequest.getRequestInfo(), HttpStatus.SC_OK, null));

			return response;
		} catch (HttpClientErrorException e) {
			LOGGER.error(e.getMessage(), e);
			throw new ApplicationRuntimeException(e.getMessage());
		}

	}

	@PostMapping(value = "/rest/voucher/_searchbyserviceandreference", produces = "application/json")
	@ResponseBody
	public VoucherResponse searchVoucherByServiceCodeAndReferenceDoc(
			@RequestParam(name = "servicecode", required = false) String serviceCode,
			@RequestParam("referencedocument") String referenceDocument) {
		try {
			referenceDocument = ESAPI.encoder().encodeForURL(referenceDocument);
			List<CVoucherHeader> cVoucherHeaders = voucherService
					.getVoucherByServiceNameAndReferenceDocument(serviceCode, referenceDocument);
			VoucherResponse res = new VoucherResponse();
			if (cVoucherHeaders == null) {
				res.setResponseInfo(MicroserviceUtils.getResponseInfo(null, HttpStatus.SC_NOT_FOUND, null));
			} else {
				res.setVouchers(cVoucherHeaders.stream().map(cv -> new Voucher(cv)).collect(Collectors.toList()));
			}
			return res;
		} catch (EncodingException e) {
			LOGGER.error(e.getMessage(), e);
			throw new ApplicationRuntimeException(e.getMessage());
		}
	}

	@PostMapping(value = "/rest/voucher/v2/_search")
	public @ResponseBody ResponseEntity<VoucherResponse> search(@ModelAttribute VoucherSearchCriteria criteria,
			@RequestBody VoucherSearchRequest voucherSearchRequest) {
		try {
			VoucherResponse response = voucherService.findVouchersByCriteria(criteria, voucherSearchRequest);
			response.setResponseInfo(
					MicroserviceUtils.getResponseInfo(voucherSearchRequest.getRequestInfo(), HttpStatus.SC_OK, null));

			return new ResponseEntity<>(response, org.springframework.http.HttpStatus.OK);
		} catch (HttpClientErrorException e) {
			LOGGER.error(e.getMessage(), e);
			throw new ApplicationRuntimeException(e.getMessage());
		}

	}

}