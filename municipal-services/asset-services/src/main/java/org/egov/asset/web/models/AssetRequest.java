package org.egov.asset.web.models;

<<<<<<< HEAD
import org.egov.common.contract.request.RequestInfo;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.util.ArrayList;
import java.util.List;
import org.egov.asset.web.models.Asset;
import org.springframework.validation.annotation.Validated;
import javax.validation.Valid;
import javax.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;
=======
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
>>>>>>> niua-upstream/niua-dev-2.0

/**
 * Contract class to receive request. Array of items are used in case of create,
 * whereas single item is used for update
 */
<<<<<<< HEAD
@ApiModel(description = "Contract class to receive request. Array of items are used in case of create, whereas single item is used for update")
@Validated
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")
=======
@Schema(description = "Contract class to receive request. Array of items are used in case of create, whereas single item is used for update")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")
>>>>>>> niua-upstream/niua-dev-2.0

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AssetRequest {

<<<<<<< HEAD
	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo = null;

	@JsonProperty("Asset")
	@Valid
	private Asset asset = null;
=======
    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo = null;

    @JsonProperty("Asset")
    @Valid
    private Asset asset = null;
>>>>>>> niua-upstream/niua-dev-2.0

}
