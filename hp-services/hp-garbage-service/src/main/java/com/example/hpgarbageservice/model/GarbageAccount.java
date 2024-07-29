package com.example.hpgarbageservice.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@EqualsAndHashCode(exclude = {"id","grbgApplication","grbgCommercialDetails","auditDetails","garbageBills","childGarbageAccounts"})
public class GarbageAccount {

	private Long id;
	
	private String uuid;

	private Long garbageId;

	private Long propertyId;

	private String type;

	private String name;

	private String mobileNumber;

//	private Long parentId;
	private Boolean isOwner; 
	
	private String userUuid;

	private String declarationUuid;

	private String grbgCollectionAddressUuid;

	private String status;
	
	private GrbgApplication grbgApplication;

	private GrbgCommercialDetails grbgCommercialDetails;
	
	private List<GrbgDocument> documents;

	private AuditDetails auditDetails;
	
	private List<GarbageBill> garbageBills;

	private List<GarbageAccount> childGarbageAccounts;
}