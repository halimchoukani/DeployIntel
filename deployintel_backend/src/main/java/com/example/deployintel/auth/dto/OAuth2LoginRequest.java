package com.example.deployintel.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record OAuth2LoginRequest(
        @NotBlank(message = "Authorization code is required")
        String code,
        String redirectUri
) {
    public OAuth2LoginRequest(String code) {
        this(code, null);
    }
}
