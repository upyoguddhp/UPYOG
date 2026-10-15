package org.egov.asset.web.models.workflow;

import com.fasterxml.jackson.annotation.JsonProperty;
<<<<<<< HEAD
import io.swagger.annotations.ApiModel;

import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;
import javax.validation.Valid;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;
=======
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
>>>>>>> niua-upstream/niua-dev-2.0

/**
 * Contract class to send response. Array of TradeLicense items are used in case of search results or response for create, whereas single TradeLicense item is used for update
 */
<<<<<<< HEAD
@ApiModel(description = "Contract class to send response. Array of TradeLicense items are used in case of search results or response for create, whereas single TradeLicense item is used for update")
@Validated
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2018-12-04T11:26:25.532+05:30")

=======
@Schema(description = "Contract class to send response. Array of TradeLicense items are used in case of search results or response for create, whereas single TradeLicense item is used for update")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2018-12-04T11:26:25.532+05:30")
>>>>>>> niua-upstream/niua-dev-2.0
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProcessInstanceResponse {
<<<<<<< HEAD
        @JsonProperty("ResponseInfo")
        private ResponseInfo responseInfo;

        @JsonProperty("ProcessInstances")
        @Valid
        private List<ProcessInstance> processInstances;


        public ProcessInstanceResponse addProceInstanceItem(ProcessInstance proceInstanceItem) {
            if (this.processInstances == null) {
            this.processInstances = new ArrayList<>();
            }
        this.processInstances.add(proceInstanceItem);
        return this;
        }
=======
    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;

    @JsonProperty("ProcessInstances")
    @Valid
    private List<ProcessInstance> processInstances;


    public ProcessInstanceResponse addProceInstanceItem(ProcessInstance proceInstanceItem) {
        if (this.processInstances == null) {
            this.processInstances = new ArrayList<>();
        }
        this.processInstances.add(proceInstanceItem);
        return this;
    }
>>>>>>> niua-upstream/niua-dev-2.0

}

