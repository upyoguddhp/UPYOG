package org.egov.garbageservice.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.egov.garbageservice.util.RequestInfoWrapper;
import org.egov.garbageservice.model.GarbageAccount;
import org.egov.garbageservice.model.GrbgBillTracker;
import org.egov.garbageservice.model.contract.PDFRequest;
import org.egov.garbageservice.contract.bill.Bill;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PDFRequestGenerator {

	@Autowired
	private ObjectMapper objectMapper;

	public PDFRequest generatePdfRequestForBill(RequestInfoWrapper requestInfoWrapper,GarbageAccount grbgAccount,GrbgBillTracker grbgBillTracker,Bill bill) {

		Map<String, Object> dataObject = new HashMap<>();
		Map<String, String> grbg = new HashMap<>();

		JsonNode AdditionalDetail = objectMapper.valueToTree(grbgAccount.getAdditionalDetail());

//		grbg.put("ulbType", addressAdditionalDetails.get("ulbType").asText());
//		grbg.put("ulbName", addressAdditionalDetails.get("ulbName").asText());
		grbg.put("ulbName", grbgAccount.getAddresses().get(0).getUlbName());
		grbg.put("ulbType", grbgAccount.getAddresses().get(0).getUlbType());
		grbg.put("billNo", bill.getBillNumber());

		grbg.put("date",
				Instant.ofEpochMilli(grbgBillTracker.getAuditDetails().getCreatedDate())
						.atZone(ZoneId.systemDefault()).toLocalDateTime()
						.format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));
//
		grbg.put("billPeriod", grbgBillTracker.getYear());
//		
		grbg.put("from", grbgBillTracker.getFromDate());
		
		grbg.put("to", grbgBillTracker.getToDate());
	
		grbg.put("billDueDate", Instant.ofEpochMilli(bill.getBillDetails().get(0).getExpiryDate())
				.atZone(ZoneId.systemDefault()).toLocalDateTime()
				.format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));

		int year = Integer.parseInt(grbgBillTracker.getYear());
		grbg.put("finYear", year + "-" + (year + 1));
//		grbg.put("finYear", grbgBillTracker.getYear()+"-"+(year+1));

		
//
//		grbg.put("to", grbgBillTracker.getToDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate()
//				.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
//
		grbg.put("district", "district");
		grbg.put("wardNumber", "wardname");
//		grbg.put("district", property.getAddress().getDistrict());
//		grbg.put("wardNumber", addressAdditionalDetails.get("wardNumber").asText());
//
		grbg.put("unitCategory",grbgAccount.getGrbgCollectionUnits().get(0).getCategory());
		
		grbg.put("address",grbgAccount.getAddresses().get(0).getAddress1().concat(", ")
				.concat(grbgAccount.getAddresses().get(0).getWardName()).concat(", ")
				.concat(grbgAccount.getAddresses().get(0).getUlbName()).concat(" (")
				.concat(grbgAccount.getAddresses().get(0).getUlbType()).concat(") ")
				.concat(grbgAccount.getAddresses().get(0).getAdditionalDetail().get("district").asText())
				.concat(", ").concat(grbgAccount.getAddresses().get(0).getPincode()));
//
		grbg.put("customerId", "alsaksjld");
//
		grbg.put("propertyId", grbgAccount.getPropertyId());
		
		grbg.put("grbgId", grbgAccount.getGrbgApplicationNumber());
//
		grbg.put("ownerOrOccupier",AdditionalDetail.get("propertyOwnerName").asText());

		BigDecimal grbgTax = grbgBillTracker.getGrbgBillAmount(); // TODO get from bill
		grbg.put("grbgTax", String.valueOf(grbgTax));

		// TODO START
		BigDecimal arrear = bill.getTotalAmount().subtract(grbgTax);
		grbg.put("arrear", String.valueOf(arrear));

		grbg.put("grbgTaxPlusArrear", String.valueOf(grbgTax.add(arrear)));

		BigDecimal credit = new BigDecimal("0.00");
		grbg.put("credit", String.valueOf(credit));
		
		BigDecimal rebate = new BigDecimal("0.00");
		grbg.put("rebate", String.valueOf(credit));

		BigDecimal interest = new BigDecimal("0.00");
		grbg.put("interest", String.valueOf(interest));

		BigDecimal penalty = new BigDecimal("0.00");
		grbg.put("penalty", String.valueOf(penalty));

		grbg.put("totalTax", String.valueOf(grbgTax.add(arrear)
				.subtract(rebate)
				.add(interest).add(penalty)
				));
		// TODO END

		BigDecimal amountPaid = new BigDecimal("0.00");
		String paymentStatus = "";
		String paymentDate = "";
//		if (bill.getStatus().equals(StatusEnum.PAID)) {
//			amountPaid = bill.getTotalAmount();
//			paymentStatus = "Success";
//			paymentDate = ""; // TODO blank
//		}
		grbg.put("amountPaid", String.valueOf(amountPaid));
		grbg.put("paymentStatus", paymentStatus);
		grbg.put("billGeneratedDate", Instant.ofEpochMilli(bill.getBillDate()).atZone(ZoneId.systemDefault())
				.toLocalDateTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
		grbg.put("paymentDate", paymentDate);

//		dataObject.putAll(tableRowMap);
		dataObject.put("grbg", grbg);

		return PDFRequest.builder().RequestInfo(requestInfoWrapper.getRequestInfo()).key("grbgBillReceipt")
				.tenantId("hp").data(dataObject).build();
	}

}
