package com.example.deployintel.auth.controller;

import com.example.deployintel.auth.dto.LoginResponse;
import com.example.deployintel.auth.dto.OAuth2LoginRequest;
import com.example.deployintel.auth.security.JwtService;
import com.example.deployintel.auth.service.AuthService;
import com.example.deployintel.auth.service.GithubOAuth2Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OAuth2ControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AuthService authService;

    @Mock
    private GithubOAuth2Service githubOAuth2Service;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private OAuth2Controller oauth2Controller;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(oauth2Controller).build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/oauth2/github should return LoginResponse with JWT")
    void testLoginWithGithubPost() throws Exception {
        UUID userId = UUID.randomUUID();
        LoginResponse response = new LoginResponse(userId, "test@github.com", "mock-jwt-token", "Bearer");

        when(authService.loginWithGithub(eq("test-code"), eq(null))).thenReturn(response);

        OAuth2LoginRequest request = new OAuth2LoginRequest("test-code");

        mockMvc.perform(post("/api/v1/auth/oauth2/github")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId.toString()))
                .andExpect(jsonPath("$.email").value("test@github.com"))
                .andExpect(jsonPath("$.accessToken").value("mock-jwt-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/oauth2/github/callback should return LoginResponse")
    void testLoginWithGithubCallback() throws Exception {
        UUID userId = UUID.randomUUID();
        LoginResponse response = new LoginResponse(userId, "test@github.com", "mock-jwt-token", "Bearer");

        when(authService.loginWithGithub(eq("test-code"), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/auth/oauth2/github/callback")
                        .param("code", "test-code"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId.toString()))
                .andExpect(jsonPath("$.email").value("test@github.com"))
                .andExpect(jsonPath("$.accessToken").value("mock-jwt-token"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/oauth2/authorize/github should return authorization url")
    void testGetGithubAuthorizationUrl() throws Exception {
        when(githubOAuth2Service.buildAuthorizationUrl(any(), any()))
                .thenReturn("https://github.com/login/oauth/authorize?client_id=123");

        mockMvc.perform(get("/api/v1/auth/oauth2/authorize/github"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorizationUrl").value("https://github.com/login/oauth/authorize?client_id=123"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/oauth2/success should return LoginResponse for valid token")
    void testOAuth2SuccessEndpoint() throws Exception {
        UUID userId = UUID.randomUUID();
        when(jwtService.isTokenValid("valid-token")).thenReturn(true);
        when(jwtService.extractUserId("valid-token")).thenReturn(userId);
        when(jwtService.extractEmail("valid-token")).thenReturn("user@example.com");

        mockMvc.perform(get("/api/v1/auth/oauth2/success")
                        .param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId.toString()))
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.accessToken").value("valid-token"));
    }
}
