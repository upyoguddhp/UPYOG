package org.egov.garbageservice.model;
import lombok.Data;
@Data
public class ApplicationBillDTO {

    private String applicationNo;
    private String billId;
    private String status;
    private String consumerCode;

    private String name;
    private String mobileNumber;
    private String email;

    private Double totalAmount;
}
