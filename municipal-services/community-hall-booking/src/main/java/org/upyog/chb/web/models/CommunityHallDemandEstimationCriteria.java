package org.upyog.chb.web.models;

import java.util.List;

<<<<<<< HEAD
import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
=======
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
>>>>>>> niua-upstream/niua-dev-2.0

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class CommunityHallDemandEstimationCriteria {
	
	@Valid
	@JsonProperty("RequestInfo")
    private RequestInfo requestInfo;
	
	@JsonProperty("tenantId")
	private String tenantId;

	@NotBlank
<<<<<<< HEAD
	private String communityHallCode;
=======
	private String venueCode;
>>>>>>> niua-upstream/niua-dev-2.0

	@NotNull                                             
	@Valid                                               
	private List<BookingSlotDetail> bookingSlotDetails;  

}
