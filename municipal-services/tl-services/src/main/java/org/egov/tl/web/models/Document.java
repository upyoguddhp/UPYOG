package org.egov.tl.web.models;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.*;
import org.egov.tl.web.models.AuditDetails;
import org.hibernate.validator.constraints.CustomSafeHtml;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

/**
 * A Object holds the basic data for a Trade License
 */
@ApiModel(description = "A Object holds the basic data for a Trade License")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2018-09-18T17:06:11.263+05:30")

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode
public class Document   {

        @Size(max=64)
        @CustomSafeHtml
        @JsonProperty("id")
        private String id;

        @JsonProperty("active")
        private Boolean active;

        @Size(max=64)
        @CustomSafeHtml
        @JsonProperty("tenantId")
        private String tenantId = null;

        @Size(max=64)
        @CustomSafeHtml
        @JsonProperty("documentType")
        private String documentType = null;

        @Size(max=64)
        @CustomSafeHtml
        @JsonProperty("fileStoreId")
        private String fileStoreId = null;

        @Size(max=64)
        @CustomSafeHtml
        @JsonProperty("documentUid")
        private String documentUid;

        @JsonProperty("auditDetails")
        private AuditDetails auditDetails = null;


}

