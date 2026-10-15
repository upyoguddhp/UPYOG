package org.egov.asset.web.models;

<<<<<<< HEAD
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.util.ArrayList;
import java.util.List;
import org.egov.asset.web.models.Boundary;
import org.springframework.validation.annotation.Validated;

import javax.persistence.Embeddable;
import javax.validation.Valid;
import javax.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;
=======
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
>>>>>>> niua-upstream/niua-dev-2.0

/**
 * Boundary
 */
@Validated
<<<<<<< HEAD
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")

=======
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")
>>>>>>> niua-upstream/niua-dev-2.0
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
<<<<<<< HEAD
public class Boundary   {
        @JsonProperty("code")
        private String code = null;

        @JsonProperty("name")
        private String name = null;

        @JsonProperty("label")
        private String label = null;

        @JsonProperty("latitude")
        private Double latitude = null;

        @JsonProperty("longitude")
        private Double longitude = null;

        @JsonProperty("children")
        @Valid
        private List<Boundary> children = null;

        @JsonProperty("materializedPath")
        private String materializedPath = null;


        public Boundary addChildrenItem(Boundary childrenItem) {
            if (this.children == null) {
            this.children = new ArrayList<>();
            }
        this.children.add(childrenItem);
        return this;
        }
=======
public class Boundary {
    @JsonProperty("code")
    private String code = null;

    @JsonProperty("name")
    private String name = null;

    @JsonProperty("label")
    private String label = null;

    @JsonProperty("latitude")
    private String latitude = null;

    @JsonProperty("longitude")
    private String longitude = null;

    @JsonProperty("children")
    @Valid
    private List<Boundary> children = null;

    @JsonProperty("materializedPath")
    private String materializedPath = null;


    public Boundary addChildrenItem(Boundary childrenItem) {
        if (this.children == null) {
            this.children = new ArrayList<>();
        }
        this.children.add(childrenItem);
        return this;
    }
>>>>>>> niua-upstream/niua-dev-2.0

}

