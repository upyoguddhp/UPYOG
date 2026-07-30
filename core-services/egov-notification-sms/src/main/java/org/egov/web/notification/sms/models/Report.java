package org.egov.web.notification.sms.models;


import org.hibernate.validator.constraints.CustomSafeHtml;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@ToString
public class Report {
    @CustomSafeHtml
    private String jobno;

    @CustomSafeHtml
    private int messagestatus;

    @CustomSafeHtml
    private String DoneTime;

    @CustomSafeHtml
    private String usernameHash;
}
