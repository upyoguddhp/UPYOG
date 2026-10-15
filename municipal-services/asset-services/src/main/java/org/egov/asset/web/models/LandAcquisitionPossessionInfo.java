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
 * Specific details related to the asset get stored as JSON in single column in Database.
 */
<<<<<<< HEAD
@ApiModel(description = "Specific details related to the asset get stored as JSON in single column in Database.")
@Validated
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")

=======
@Schema(description = "Specific details related to the asset get stored as JSON in single column in Database.")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")
>>>>>>> niua-upstream/niua-dev-2.0
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LandAcquisitionPossessionInfo {
<<<<<<< HEAD
	
	 @JsonProperty("landType")
     private String landType = null;

     @JsonProperty("modeOfPossessionOrAcquisition")
     private String modeOfPossessionOrAcquisition = null;
     
     @JsonProperty("areaOfLand")
     private String areaOfLand = null;
     
     @JsonProperty("compensationPaidOrAcquisition")
     private String compensationPaidOrAcquisition = null;
     
     @JsonProperty("costOrBookValue")
     private String costOrBookValue = null;
     
     @JsonProperty("deedExecutionDate ")
     private String deedExecutionDate = null;
     
     @JsonProperty("possessionDate")
     private String possessionDate = null;
     
     @JsonProperty("possessionAcquiredFrom")
     private String possessionAcquiredFrom = null;
     
     @JsonProperty("specialConditionsOnHolding ")
     private String specialConditionsOnHolding = null;
     
     @JsonProperty("govtOrderNumber")
     private String govtOrderNumber = null;
     
     @JsonProperty("govtOrderNumber")
     private String collectorOrderNumber = null;
     
     @JsonProperty("councilResoulutionNumber ")
     private String councilResoulutionNumber = null;
     
     @JsonProperty("assetImprovmentDate")
     private String assetImprovmentDate = null;
     
     @JsonProperty("assetImprovmentCost")
     private String assetImprovmentCost = null;
     
     @JsonProperty("tasksDoneForAssetImprovmentDesc")
     private String tasksDoneForAssetImprovmentDesc = null;
     
     //Auto calculate form possession cost + O&M cost during improvement
     @JsonProperty("totalCost")
     private String totalCost = null;
     
     @JsonProperty("depreciationRate")
     private String depreciationRate = null;
     
     //Auto calculate on totalcost
     @JsonProperty("costAfterDepreciation")
     private String costAfterDepreciation = null;
     
     @JsonProperty("revenueGeneratedByAsset")
     private String revenueGeneratedByAsset = null;
     
     @JsonProperty("lastMaintenanceDate")
     private String lastMaintenanceDate = null;
     
     @JsonProperty("estimatedNextMaintenanceDate")
     private String estimatedNextMaintenanceDate = null;
     
=======

    @JsonProperty("landType")
    private String landType = null;

    @JsonProperty("modeOfPossessionOrAcquisition")
    private String modeOfPossessionOrAcquisition = null;

    @JsonProperty("areaOfLand")
    private String areaOfLand = null;

    @JsonProperty("compensationPaidOrAcquisition")
    private String compensationPaidOrAcquisition = null;

    @JsonProperty("costOrBookValue")
    private String costOrBookValue = null;

    @JsonProperty("deedExecutionDate ")
    private String deedExecutionDate = null;

    @JsonProperty("possessionDate")
    private String possessionDate = null;

    @JsonProperty("possessionAcquiredFrom")
    private String possessionAcquiredFrom = null;

    @JsonProperty("specialConditionsOnHolding ")
    private String specialConditionsOnHolding = null;

    @JsonProperty("govtOrderNumber")
    private String govtOrderNumber = null;

    @JsonProperty("govtOrderNumber")
    private String collectorOrderNumber = null;

    @JsonProperty("councilResoulutionNumber ")
    private String councilResoulutionNumber = null;

    @JsonProperty("assetImprovmentDate")
    private String assetImprovmentDate = null;

    @JsonProperty("assetImprovmentCost")
    private String assetImprovmentCost = null;

    @JsonProperty("tasksDoneForAssetImprovmentDesc")
    private String tasksDoneForAssetImprovmentDesc = null;

    //Auto calculate form possession cost + O&M cost during improvement
    @JsonProperty("totalCost")
    private String totalCost = null;

    @JsonProperty("depreciationRate")
    private String depreciationRate = null;

    //Auto calculate on totalcost
    @JsonProperty("costAfterDepreciation")
    private String costAfterDepreciation = null;

    @JsonProperty("revenueGeneratedByAsset")
    private String revenueGeneratedByAsset = null;

    @JsonProperty("lastMaintenanceDate")
    private String lastMaintenanceDate = null;

    @JsonProperty("estimatedNextMaintenanceDate")
    private String estimatedNextMaintenanceDate = null;

>>>>>>> niua-upstream/niua-dev-2.0

}
