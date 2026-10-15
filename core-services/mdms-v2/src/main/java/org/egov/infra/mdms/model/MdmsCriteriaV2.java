package org.egov.infra.mdms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * MdmsCriteria
 */
@Validated
@jakarta.annotation.Generated(
        value = "org.egov.codegen.SpringBootCodegen",
        date = "2023-05-30T09:26:57.838+05:30[Asia/Kolkata]"
)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MdmsCriteriaV2 {

    @JsonProperty("tenantId")
    @Size(min = 1, max = 100)
    @NotNull
    private String tenantId;

    @JsonProperty("ids")
    private Set<String> ids;

    @JsonProperty("uniqueIdentifiers")
    @Size(min = 1, max = 64)
    private Set<String> uniqueIdentifiers;

    @JsonProperty("schemaCode")
    private String schemaCode;

    @JsonProperty("filters")
    private Map<String, String> filterMap;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonIgnore
    private Map<String, String> schemaCodeFilterMap;

    @JsonIgnore
    private Set<String> uniqueIdentifiersForRefVerification;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("limit")
    private Integer limit;
}