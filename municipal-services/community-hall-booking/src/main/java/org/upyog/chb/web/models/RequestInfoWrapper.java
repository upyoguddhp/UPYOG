package org.upyog.chb.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;

<<<<<<< HEAD
import javax.validation.Valid;
=======
import jakarta.validation.Valid;
>>>>>>> niua-upstream/niua-dev-2.0


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RequestInfoWrapper {

	@NonNull
	@Valid
	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;
}
