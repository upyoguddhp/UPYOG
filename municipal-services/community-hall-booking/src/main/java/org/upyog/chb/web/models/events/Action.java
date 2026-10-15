package org.upyog.chb.web.models.events;

import lombok.*;
import org.springframework.validation.annotation.Validated;

<<<<<<< HEAD
import javax.validation.constraints.NotNull;
=======
import jakarta.validation.constraints.NotNull;
>>>>>>> niua-upstream/niua-dev-2.0
import java.util.List;

@Validated
@AllArgsConstructor
@EqualsAndHashCode
@Getter
@NoArgsConstructor
@Setter
@ToString
@Builder
public class Action {

	private String tenantId;

	private String id;

	private String eventId;

	@NotNull
	private List<ActionItem> actionUrls;

}
