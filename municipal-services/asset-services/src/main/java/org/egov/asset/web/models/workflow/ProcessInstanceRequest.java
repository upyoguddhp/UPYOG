package org.egov.asset.web.models.workflow;

import com.fasterxml.jackson.annotation.JsonProperty;
<<<<<<< HEAD
import io.swagger.annotations.ApiModel;

import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;
import javax.validation.Valid;
import javax.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.Builder;
=======
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
>>>>>>> niua-upstream/niua-dev-2.0

/**
 * Contract class to receive process instance request.
 */
<<<<<<< HEAD
@ApiModel(description = "Contract class to process instance receive request. Array of TradeLicense items are used in case of create, whereas single TradeLicense item is used for update")
@Validated
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2018-12-04T11:26:25.532+05:30")

=======
@Schema(description = "Contract class to process instance receive request. Array of TradeLicense items are used in case of create, whereas single TradeLicense item is used for update")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2018-12-04T11:26:25.532+05:30")
>>>>>>> niua-upstream/niua-dev-2.0
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class ProcessInstanceRequest {
<<<<<<< HEAD
        @JsonProperty("RequestInfo")
        private RequestInfo requestInfo;

        @JsonProperty("ProcessInstances")
        @Valid
        @NotNull
        private List<ProcessInstance> processInstances;


        public ProcessInstanceRequest addProcessInstanceItem(ProcessInstance processInstanceItem) {
            if (this.processInstances == null) {
            this.processInstances = new ArrayList<>();
            }
        this.processInstances.add(processInstanceItem);
        return this;
        }
=======
    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("ProcessInstances")
    @Valid
    @NotNull
    private List<ProcessInstance> processInstances;


    public ProcessInstanceRequest addProcessInstanceItem(ProcessInstance processInstanceItem) {
        if (this.processInstances == null) {
            this.processInstances = new ArrayList<>();
        }
        this.processInstances.add(processInstanceItem);
        return this;
    }
>>>>>>> niua-upstream/niua-dev-2.0

}