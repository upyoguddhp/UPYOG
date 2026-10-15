package org.egov.asset.web.models;

<<<<<<< HEAD
import java.util.Collections;
import java.util.List;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

=======
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;

import java.util.Collections;
import java.util.List;

>>>>>>> niua-upstream/niua-dev-2.0
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserSearchCriteria {
<<<<<<< HEAD
	
	    @JsonProperty("tenantId")
	    private String tenantId;
	    
	    @JsonProperty("assetClassification")
	    private String assetClassification;
	    
	    @JsonProperty("assetParentCategory")
	    private String assetParentCategory;
	    
	    @JsonProperty("assetBookRefNo")
	    private String assetBookRefNo;

	    @JsonProperty("RequestInfo")
		private RequestInfo requestInfo;

		@JsonProperty("uuid")
		private List<String> uuid;	

		@JsonProperty("id")
		private List<String> id;

		@JsonProperty("userName")
		private String userName;

		@JsonProperty("name")
		private String name;

	
		@JsonProperty("active")
		@Setter
		private Boolean active;


		@JsonProperty("pageSize")
		private int pageSize;

		@JsonProperty("pageNumber")
		private int pageNumber = 0;

		@JsonProperty("sort")
		private List<String> sort = Collections.singletonList("name");

		@JsonProperty("userType")
		private String userType;

		@JsonProperty("roleCodes")
		private List<String> roleCodes;
=======

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("assetClassification")
    private String assetClassification;

    @JsonProperty("assetParentCategory")
    private String assetParentCategory;

    @JsonProperty("assetBookRefNo")
    private String assetBookRefNo;

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("uuid")
    private List<String> uuid;

    @JsonProperty("id")
    private List<String> id;

    @JsonProperty("userName")
    private String userName;

    @JsonProperty("name")
    private String name;


    @JsonProperty("active")
    @Setter
    private Boolean active;


    @JsonProperty("pageSize")
    private int pageSize;

    @JsonProperty("pageNumber")
    private int pageNumber = 0;

    @JsonProperty("sort")
    private List<String> sort = Collections.singletonList("name");

    @JsonProperty("userType")
    private String userType;

    @JsonProperty("roleCodes")
    private List<String> roleCodes;
>>>>>>> niua-upstream/niua-dev-2.0


}
