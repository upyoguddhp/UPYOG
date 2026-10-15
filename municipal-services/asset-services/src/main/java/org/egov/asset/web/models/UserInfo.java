package org.egov.asset.web.models;

<<<<<<< HEAD
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.util.ArrayList;
import java.util.List;
import org.egov.asset.web.models.Role;
import org.egov.asset.web.models.TenantRole;
import org.springframework.validation.annotation.Validated;
import javax.validation.Valid;
import javax.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;
=======
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
>>>>>>> niua-upstream/niua-dev-2.0

/**
 * This is acting ID token of the authenticated user on the server. Any value provided by the clients will be ignored and actual user based on authtoken will be used on the server.
 */
<<<<<<< HEAD
@ApiModel(description = "This is acting ID token of the authenticated user on the server. Any value provided by the clients will be ignored and actual user based on authtoken will be used on the server.")
@Validated
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")

=======
@Schema(description = "This is acting ID token of the authenticated user on the server. Any value provided by the clients will be ignored and actual user based on authtoken will be used on the server.")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-12T12:56:34.514+05:30")
>>>>>>> niua-upstream/niua-dev-2.0
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
<<<<<<< HEAD
public class UserInfo   {
        @JsonProperty("tenantId")
        private String tenantId = null;

        @JsonProperty("uuid")
        private String uuid = null;

        @JsonProperty("userName")
        private String userName = null;

        @JsonProperty("password")
        private String password = null;

        @JsonProperty("idToken")
        private String idToken = null;

        @JsonProperty("mobile")
        private String mobile = null;

        @JsonProperty("email")
        private String email = null;

        @JsonProperty("primaryrole")
        @Valid
        private List<Role> primaryrole = new ArrayList<>();

        @JsonProperty("additionalroles")
        @Valid
        private List<TenantRole> additionalroles = null;


        public UserInfo addPrimaryroleItem(Role primaryroleItem) {
        this.primaryrole.add(primaryroleItem);
        return this;
        }

        public UserInfo addAdditionalrolesItem(TenantRole additionalrolesItem) {
            if (this.additionalroles == null) {
            this.additionalroles = new ArrayList<>();
            }
        this.additionalroles.add(additionalrolesItem);
        return this;
        }
=======
public class UserInfo {
    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("uuid")
    private String uuid = null;

    @JsonProperty("userName")
    private String userName = null;

    @JsonProperty("password")
    private String password = null;

    @JsonProperty("idToken")
    private String idToken = null;

    @JsonProperty("mobile")
    private String mobile = null;

    @JsonProperty("email")
    private String email = null;

    @JsonProperty("primaryrole")
    @Valid
    private List<Role> primaryrole = new ArrayList<>();

    @JsonProperty("additionalroles")
    @Valid
    private List<TenantRole> additionalroles = null;


    public UserInfo addPrimaryroleItem(Role primaryroleItem) {
        this.primaryrole.add(primaryroleItem);
        return this;
    }

    public UserInfo addAdditionalrolesItem(TenantRole additionalrolesItem) {
        if (this.additionalroles == null) {
            this.additionalroles = new ArrayList<>();
        }
        this.additionalroles.add(additionalrolesItem);
        return this;
    }
>>>>>>> niua-upstream/niua-dev-2.0

}

