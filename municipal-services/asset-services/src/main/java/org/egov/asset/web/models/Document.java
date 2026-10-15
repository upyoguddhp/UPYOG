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
 * This object holds list of documents attached during the transaciton for a property
 */
<<<<<<< HEAD
@ApiModel(description = "This object holds list of documents attached during the transaciton for a property")
@Validated
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")

=======
@Schema(description = "This object holds list of documents attached during the transaciton for a property")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")
>>>>>>> niua-upstream/niua-dev-2.0
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
<<<<<<< HEAD
public class Document   {
        @JsonProperty("documentId")
        private String documentId = null;

        @JsonProperty("documentType")
        private String documentType = null;

        @JsonProperty("fileStoreId")
        private String fileStoreId = null;

        @JsonProperty("documentUid")
        private String documentUid = null;

        @JsonProperty("docDetails")
        private Object docDetails = null;
=======
public class Document {
    @JsonProperty("documentId")
    private String documentId = null;

    @JsonProperty("documentType")
    private String documentType = null;

    @JsonProperty("fileStoreId")
    private String fileStoreId = null;

    @JsonProperty("documentUid")
    private String documentUid = null;

    @JsonProperty("docDetails")
    private Object docDetails = null;
>>>>>>> niua-upstream/niua-dev-2.0


}

