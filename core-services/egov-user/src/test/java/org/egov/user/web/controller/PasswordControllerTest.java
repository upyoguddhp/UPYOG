package org.egov.user.web.controller;

import org.egov.common.contract.request.RequestInfo;
import org.egov.user.Resources;
import org.egov.user.domain.model.NonLoggedInUserUpdatePasswordRequest;
import org.egov.user.domain.service.UserService;
import org.egov.user.security.CustomAuthenticationKeyGenerator;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class PasswordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @MockBean
    private CustomAuthenticationKeyGenerator authenticationKeyGenerator;

    private final Resources resources = new Resources();

    @Test
    @WithMockUser
    @Disabled("Disabled pending logged-in password update test verification")
    public void test_should_update_password_for_logged_in_user() throws Exception {

        mockMvc.perform(post("/password/_update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resources.getFileContents(
                                "loggedInUserUpdatePasswordRequest.json")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json(
                        resources.getFileContents("updatePasswordResponse.json")));
    }

    @Test
    @WithMockUser
    @Disabled("Disabled pending non-logged-in password update test verification")
    public void test_should_update_password_for_non_logged_in_user() throws Exception {

        mockMvc.perform(post("/password/nologin/_update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resources.getFileContents(
                                "nonLoggedInUserUpdatePasswordRequest.json")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json(
                        resources.getFileContents("updatePasswordResponse.json")));

        final NonLoggedInUserUpdatePasswordRequest expectedRequest =
                NonLoggedInUserUpdatePasswordRequest.builder()
                        .tenantId("tenant")
                        .newPassword("newPassword")
                        .otpReference("otpReference")
                        .userName("userName")
                        .build();

        verify(userService).updatePasswordForNonLoggedInUser(
                eq(expectedRequest),
                any(RequestInfo.class));
    }
}