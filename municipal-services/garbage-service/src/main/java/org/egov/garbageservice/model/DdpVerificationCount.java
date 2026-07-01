package org.egov.garbageservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DdpVerificationCount {

    private Integer totalDdpVerified;

    private Integer remainingForDdpVerification;
    
    private Integer totalApprovedAccounts;
}