package com.example.hpgarbageservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class GrbgCollectionStaff {

    private String uuid;
    private String grbgCollectionUnitUuid;
    private String employeeId;
    private String role;
    private Boolean isActive;
}
