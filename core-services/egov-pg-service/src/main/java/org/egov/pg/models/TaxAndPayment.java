package org.egov.pg.models;

import lombok.*;
import org.hibernate.validator.constraints.CustomSafeHtml;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TaxAndPayment {

	private BigDecimal taxAmount;

	@NotNull
	private BigDecimal amountPaid;

	@CustomSafeHtml
	@NotNull
	private String billId;
}