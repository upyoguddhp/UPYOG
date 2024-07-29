package com.example.hpgarbageservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class GrbgAddress {

    private String uuid;
    private String addressType;
    private String address1;
    private String address2;
    private String city;
    private String state;
    private String pincode;
    private Boolean isActive;
}
