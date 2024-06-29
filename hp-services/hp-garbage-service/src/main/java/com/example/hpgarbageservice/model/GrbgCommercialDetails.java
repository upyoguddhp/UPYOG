package com.example.hpgarbageservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class GrbgCommercialDetails {

    private String uuid;
    private Long garbageId;
    private String businessName;
    private String businessType;
    private String ownerUserUuid;
}