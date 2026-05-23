package org.egov.garbageservice.model;
import lombok.Data;
import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;

@Data
public class ApplicationBillDTO {

    private String applicationNo;
    private String billId;
    private String status;
    private String consumerCode;
    private List<GrbgCollectionUnit> grbgCollectionUnits;

    private String name;
    private String mobileNumber;
    private String email;
    private String address;
    private String additionalDetails;
    private String formula;

    private Double totalAmount;
}
