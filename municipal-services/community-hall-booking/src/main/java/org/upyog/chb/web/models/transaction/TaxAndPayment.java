package org.upyog.chb.web.models.transaction;

import lombok.*;

<<<<<<< HEAD
import javax.validation.constraints.NotNull;
=======
import jakarta.validation.constraints.NotNull;
>>>>>>> niua-upstream/niua-dev-2.0
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
	
	@NotNull
	private String billId;
}
