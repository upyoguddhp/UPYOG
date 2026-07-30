package org.egov.pt.models;

import java.math.BigDecimal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.validator.constraints.CustomSafeHtml;

/**
 * Unit
 */

@ToString
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = { "id" })
public class Unit {

	@CustomSafeHtml
	@JsonProperty("id")
	private String id;

	@CustomSafeHtml
	@JsonProperty("tenantId")
	private String tenantId;

	@Max(value = 500)
	@JsonProperty("floorNo")
	private Integer floorNo;

	@CustomSafeHtml
	@JsonProperty("unitType")
	private String unitType;

	@JsonProperty("usageCategory")
	@CustomSafeHtml
	@NotNull
	private String usageCategory;

	@CustomSafeHtml
	@JsonProperty("occupancyType")
	private String occupancyType;

	@JsonProperty("active")
	@Builder.Default
	private Boolean active = true;

	@JsonProperty("occupancyDate")
	private Long occupancyDate;

	@Valid
	@NotNull
	@JsonProperty("constructionDetail")
	private ConstructionDetail constructionDetail;

	@JsonProperty("additionalDetails")
	private Object additionalDetails;

	@JsonProperty("auditDetails")
	private AuditDetails auditDetails;

	@Digits(integer = 10, fraction = 2)
	@JsonProperty("arv")
	private BigDecimal arv;

}
