package org.egov.asset.web.models;

<<<<<<< HEAD
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
=======
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.springframework.validation.annotation.Validated;
>>>>>>> niua-upstream/niua-dev-2.0

/**
 * Collection of audit related fields used by most models
 */
<<<<<<< HEAD
@ApiModel(description = "Collection of audit related fields used by most models")
@Validated
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")

=======
@Schema(description = "Collection of audit related fields used by most models")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")
>>>>>>> niua-upstream/niua-dev-2.0
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
<<<<<<< HEAD
public class AuditDetails   {
        @JsonProperty("createdBy")
        private String createdBy = null;

        @JsonProperty("lastModifiedBy")
        private String lastModifiedBy = null;

        @JsonProperty("createdTime")
        private Long createdTime = null;

        @JsonProperty("lastModifiedTime")
        private Long lastModifiedTime = null;
=======
public class AuditDetails {
    @JsonProperty("createdBy")
    private String createdBy = null;

    @JsonProperty("lastModifiedBy")
    private String lastModifiedBy = null;

    @JsonProperty("createdTime")
    private Long createdTime = null;

    @JsonProperty("lastModifiedTime")
    private Long lastModifiedTime = null;
>>>>>>> niua-upstream/niua-dev-2.0

}

