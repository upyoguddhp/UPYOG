package org.egov.web.notification.sms.models;


import lombok.*;

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
    private String jobno;

    private int messagestatus;

    private String DoneTime;

    private String usernameHash;
}
