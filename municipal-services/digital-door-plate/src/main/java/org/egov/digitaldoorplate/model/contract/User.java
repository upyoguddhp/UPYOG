package org.egov.digitaldoorplate.model.contract;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * Minimal mirror of the egov-user contract, carrying just the fields this
 * service needs to create/search for a garbage collector's login.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class User {

	@JsonProperty("id")
	private Long id;

	@JsonProperty("uuid")
	private String uuid;

	@JsonProperty("userName")
	private String userName;

	@JsonProperty("password")
	private String password;

	@JsonProperty("name")
	private String name;

	@JsonProperty("gender")
	private String gender;

	@JsonProperty("mobileNumber")
	private String mobileNumber;

	@JsonProperty("emailId")
	private String emailId;

	@JsonProperty("active")
	private Boolean active;

	@JsonProperty("dob")
	private Long dob;

	@JsonProperty("pwdExpiryDate")
	private Long pwdExpiryDate;

	@JsonProperty("type")
	private String type;

	@JsonProperty("roles")
	private List<Role> roles;

	@JsonProperty("createdBy")
	private String createdBy;

	@JsonProperty("createdDate")
	private Long createdDate;

	@JsonProperty("lastModifiedBy")
	private String lastModifiedBy;

	@JsonProperty("lastModifiedDate")
	private Long lastModifiedDate;

	@JsonProperty("tenantId")
	private String tenantId;

	public User addRolesItem(Role rolesItem) {
		if (this.roles == null) {
			this.roles = new ArrayList<>();
		}
		this.roles.add(rolesItem);
		return this;
	}
}
