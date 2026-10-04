package com.example.deployintel.auth.controller;

import com.example.deployintel.auth.dto.LoginRequest;
import com.example.deployintel.auth.dto.LoginResponse;
import com.example.deployintel.auth.dto.RegisterRequest;
import com.example.deployintel.auth.dto.UserResponse;
import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.auth.service.AuthService;
import com.example.deployintel.common.exception.UserNotFoundException;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        UserResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/github")
    public ResponseEntity<LoginResponse> loginWithGithub(
            @Valid @RequestBody com.example.deployintel.auth.dto.OAuth2LoginRequest request
    ) {
        LoginResponse response = authService.loginWithGithub(request.code(), request.redirectUri());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {

        UserPrincipal principal =
                (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        return Map.of(
                "id", principal.getId(),
                "email", principal.getUsername(),
                "role", principal.getRole(),
                "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                "lastName", user.getLastName() != null ? user.getLastName() : "",
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                "githubConnected", user.getGithubAccessToken() != null && !user.getGithubAccessToken().isBlank()
        );
    }
    @GetMapping("/dev-only")
    @PreAuthorize("hasRole('DEVELOPER')")
    public String patientOnly() {
        return "You are a DEVELOPER";
    }
}