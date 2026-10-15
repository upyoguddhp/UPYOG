package org.egov.asset.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
<<<<<<< HEAD
=======
import com.fasterxml.jackson.databind.JsonNode;
>>>>>>> niua-upstream/niua-dev-2.0

import lombok.Data;

@Data
<<<<<<< HEAD
public class AssetSearchDTO implements AssetDTO{
	
	@JsonProperty("id")
    private String id ;
=======
public class AssetSearchDTO implements AssetDTO {

    @JsonProperty("id")
    private String id;
>>>>>>> niua-upstream/niua-dev-2.0

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("assetBookRefNo")
<<<<<<< HEAD
    private String assetBookRefNo ;
=======
    private String assetBookRefNo;
>>>>>>> niua-upstream/niua-dev-2.0

    @JsonProperty("assetName")
    private String assetName;

    @JsonProperty("description")
    private String description;

    @JsonProperty("assetClassification")
    private String assetClassification;
<<<<<<< HEAD
    
=======

>>>>>>> niua-upstream/niua-dev-2.0
    @JsonProperty("assetParentCategory")
    private String assetParentCategory;

    @JsonProperty("assetCategory")
    private String assetCategory;
<<<<<<< HEAD
    
    @JsonProperty("assetSubCategory")
    private String assetSubCategory;
    
=======

    @JsonProperty("assetSubCategory")
    private String assetSubCategory;

>>>>>>> niua-upstream/niua-dev-2.0
    @JsonProperty("department")
    private String department;

    @JsonProperty("applicationNo")
    private String applicationNo;

    @JsonProperty("applicationDate")
    private Long applicationDate;

    @JsonProperty("status")
    private String status;
<<<<<<< HEAD
    
    @JsonProperty("assetStatus")
    private String assetStatus;
    
    @JsonProperty("assetAssignment")
    AssetAssignmentDTO assetAssignment;

=======

    @JsonProperty("assetStatus")
    private String assetStatus;

    @JsonProperty("location")
    private String location;

    @JsonProperty("assetAssignment")
    AssetAssignmentDTO assetAssignment;

    @JsonProperty("additionalDetails")
    private JsonNode additionalDetails;




>>>>>>> niua-upstream/niua-dev-2.0
}
