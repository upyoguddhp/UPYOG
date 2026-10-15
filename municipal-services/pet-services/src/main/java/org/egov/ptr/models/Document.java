package org.egov.ptr.models;

<<<<<<< HEAD
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
=======
import jakarta.validation.constraints.Size;

import org.egov.ptr.validator.SanitizeHtml;
>>>>>>> niua-upstream/niua-dev-2.0

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(of = { "filestoreid", "documentuid", "id" })
public class Document {

	@Size(max = 64)
	@SanitizeHtml
	@JsonProperty("id")
	private String id;

	@JsonProperty("active")
	private Boolean active;

	@Size(max = 64)
	@SanitizeHtml
	@JsonProperty("tenantId")
	private String tenantId = null;

	@Size(max = 64)
<<<<<<< HEAD
	@SafeHtml
	@NotNull
=======
	@SanitizeHtml
>>>>>>> niua-upstream/niua-dev-2.0
	@JsonProperty("documentType")
	private String documentType = null;

	@Size(max = 64)
	@SanitizeHtml
	@JsonProperty("filestoreId")
	private String filestoreId = null;

	@Size(max = 64)
	@SanitizeHtml
	@JsonProperty("documentUid")
	private String documentUid;

	@JsonProperty("auditDetails")
	private AuditDetails auditDetails = null;

}
