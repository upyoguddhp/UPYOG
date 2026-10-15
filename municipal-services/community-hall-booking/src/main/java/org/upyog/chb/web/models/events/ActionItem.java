package org.upyog.chb.web.models.events;

import lombok.*;
import org.springframework.validation.annotation.Validated;

<<<<<<< HEAD
import javax.validation.constraints.NotNull;
=======
import jakarta.validation.constraints.NotNull;
>>>>>>> niua-upstream/niua-dev-2.0

@Validated
@AllArgsConstructor
@EqualsAndHashCode
@Getter
@NoArgsConstructor
@Setter
@ToString
@Builder
public class ActionItem {

	@NotNull
	private String actionUrl;

	@NotNull
	private String code;

}
