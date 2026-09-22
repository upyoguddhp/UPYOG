package org.egov.web.notification.sms.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationMailTrackerRequest {

    private RequestInfo requestInfo;

    private NotificationMailTracker notificationMailTracker;
}
