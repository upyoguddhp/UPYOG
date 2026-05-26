package org.egov.garbageservice.model;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import org.egov.common.contract.request.RequestInfo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillRequestV2 {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("Bills")
    @Builder.Default
    private List<BillV2> bills = new ArrayList<>();
}
