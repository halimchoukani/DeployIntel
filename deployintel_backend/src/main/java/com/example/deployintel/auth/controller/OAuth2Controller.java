package com.example.deployintel.auth.controller;

import com.example.deployintel.auth.dto.LoginResponse;
import com.example.deployintel.auth.dto.OAuth2LoginRequest;
import com.example.deployintel.auth.security.JwtService;
import com.example.deployintel.auth.service.AuthService;
import com.example.deployintel.auth.service.GithubOAuth2Service;
import com.example.deployintel.user.entity.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth/oauth2")
@RequiredArgsConstructor
public class OAuth2Controller {

    private final AuthService authService;
    private final GithubOAuth2Service githubOAuth2Service;
    private final JwtService jwtService;

    @PostMapping("/github")
    public ResponseEntity<LoginResponse> loginWithGithub(
            @Valid @RequestBody OAuth2LoginRequest request
    ) {
        LoginResponse response = authService.loginWithGithub(request.code(), request.redirectUri());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/github/callback")
    public ResponseEntity<LoginResponse> githubCallback(
            @RequestParam("code") String code,
            @RequestParam(value = "redirect_uri", required = false) String redirectUri
    ) {
        LoginResponse response = authService.loginWithGithub(code, redirectUri);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/authorize/github")
    public ResponseEntity<Map<String, String>> getGithubAuthorizationUrl(
            @RequestParam(value = "redirect_uri", required = false) String redirectUri,
            @RequestParam(value = "state", required = false) String state
    ) {
        String authorizationUrl = githubOAuth2Service.buildAuthorizationUrl(redirectUri, state);
        return ResponseEntity.ok(Map.of("authorizationUrl", authorizationUrl));
    }

    @GetMapping("/success")
    public ResponseEntity<LoginResponse> oauth2Success(
            @RequestParam("token") String token
    ) {
        if (!jwtService.isTokenValid(token)) {
            throw new IllegalArgumentException("Invalid token provided in OAuth2 success callback");
        }

        UUID userId = jwtService.extractUserId(token);
        String email = jwtService.extractEmail(token);

        return ResponseEntity.ok(
                new LoginResponse(userId, email, token, "Bearer")
        );
    }
}
