package org.egov.web.notification.sms.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationMailTrackerResponse {

    private NotificationMailTracker notificationMailTracker;
}
