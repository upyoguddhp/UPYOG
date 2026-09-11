package org.egov.web.controller;

import jakarta.validation.Valid;
import org.egov.domain.model.Token;
import org.egov.domain.service.TokenService;
import org.egov.web.contract.GetUserTokenRequest;
import org.egov.web.contract.GetUserTokenResponse;
import org.egov.web.contract.OtpRequest;
import org.egov.web.contract.OtpResponse;
import org.egov.web.contract.OtpValidateRequest;
import org.springframework.beans.factory.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class OtpController {

    private TokenService tokenService;

    public OtpController(TokenService tokenService) {

        this.tokenService = tokenService;
    }

    @PostMapping("v1/_create")
    @ResponseStatus(HttpStatus.CREATED)
    public OtpResponse createOtp(@RequestBody @Valid OtpRequest otpRequest) {
        final Token token = tokenService.create(otpRequest.getTokenRequest());
        return new OtpResponse(token);
    }

    @PostMapping("v1/_validate")
    public OtpResponse validateOtp(@RequestBody @Valid OtpValidateRequest request) {
        final Token token = tokenService.validate(request.toDomainValidateRequest());
        token.setNumber(request.toDomainValidateRequest().getOtp());
        if (Boolean.TRUE.equals(request.getReturnToken())) {
            String accessToken = tokenService.getUserAccesToken(request.toDomainValidateRequest().getIdentity());
            token.setAccessToken(accessToken);
        }
        return new OtpResponse(token);
    }

    // HP-specific: issues a user access token for a known uuid, without an OTP
    // round-trip - proxies egov-user's own /login/_uuid endpoint.
    @PostMapping("v1/_getUserToken")
    public GetUserTokenResponse getUserToken(@RequestBody @Valid GetUserTokenRequest request) {
        String accessToken = tokenService.getUserAccesToken(request.getUuid());
        return new GetUserTokenResponse(accessToken);
    }

    @PostMapping("v1/_search")
    public OtpResponse search(@RequestBody OtpRequest request) {
        final Token token = tokenService.search(request.toSearchCriteria());
        return new OtpResponse(token);
    }
}

