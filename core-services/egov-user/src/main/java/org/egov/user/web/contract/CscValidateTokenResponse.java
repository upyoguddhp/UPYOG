package org.egov.user.web.contract;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CscValidateTokenResponse {

	    private String pager;

	    private String username;

	    private String email;

	    @JsonProperty("mobileno")
	    private String mobileNumber;

	    private String address;

	    @JsonProperty("csc_id")
	    private String cscId;

	    @JsonProperty("fullname")
	    private String fullName;

	    private String owner;

	    @JsonProperty("vle_check")
	    private String vleCheck;

	    @JsonProperty("state_code")
	    private String stateCode;

	    @JsonProperty("active_status")
	    private String activeStatus;

	    @JsonProperty("user_type")
	    private String userType;

	    @JsonProperty("last_active")
	    private String lastActive;

	    @JsonProperty("lg_state_code")
	    private String lgStateCode;

	    @JsonProperty("lg_district_code")
	    private String lgDistrictCode;

	    @JsonProperty("RAP")
	    private String rap;

	    @JsonProperty("POS")
	    private String pos;

}
