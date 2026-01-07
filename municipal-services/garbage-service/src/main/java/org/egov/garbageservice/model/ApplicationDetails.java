package org.egov.garbageservice.model;

import java.util.Map;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDetails {
    private String applicationNumber;
    private Double totalPayableAmount;
    private Map<String, Object> billDetails;
    private Map<String, Object> userDetails;
}
