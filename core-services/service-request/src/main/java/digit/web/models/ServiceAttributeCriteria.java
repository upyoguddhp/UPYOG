package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * The object will contain all the search parameters for Service .
 */
@Schema(description = "The object will contain all the search parameters for Service .")
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ServiceAttributeCriteria {
    @JsonProperty("attributeCode")
    private String attributeCode = null;

    @JsonProperty("value")
    private String value = null;

}
