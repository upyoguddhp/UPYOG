package org.egov.pt.web.contracts;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyBillSearchRequest {

    private String propertyUuid;
    private String billId;
}
