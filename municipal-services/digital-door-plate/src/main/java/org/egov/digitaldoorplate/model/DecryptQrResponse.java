package org.egov.digitaldoorplate.model;

import org.egov.common.contract.response.ResponseInfo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DecryptQrResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo;

	/**
	 * The original JSON string recovered after decryption.
	 */
	private String data;
}
