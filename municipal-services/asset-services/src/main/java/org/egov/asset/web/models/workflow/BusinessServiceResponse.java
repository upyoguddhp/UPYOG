package org.egov.asset.web.models.workflow;

<<<<<<< HEAD
import java.util.ArrayList;
import java.util.List;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import org.egov.common.contract.response.ResponseInfo;

import com.fasterxml.jackson.annotation.JsonProperty;
=======
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.response.ResponseInfo;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
>>>>>>> niua-upstream/niua-dev-2.0

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class BusinessServiceResponse {

    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;

    @JsonProperty("BusinessServices")
    @Valid
    @NotNull
    private List<BusinessService> businessServices;


    public BusinessServiceResponse addBusinessServiceItem(BusinessService businessServiceItem) {
        if (this.businessServices == null) {
<<<<<<< HEAD
            this.businessServices = new ArrayList<BusinessService>();
=======
            this.businessServices = new ArrayList<>();
>>>>>>> niua-upstream/niua-dev-2.0
        }
        this.businessServices.add(businessServiceItem);
        return this;
    }


<<<<<<< HEAD

=======
>>>>>>> niua-upstream/niua-dev-2.0
}
