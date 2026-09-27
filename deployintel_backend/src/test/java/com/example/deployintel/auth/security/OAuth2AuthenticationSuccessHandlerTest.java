package com.example.deployintel.auth.security;

import com.example.deployintel.user.entity.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2AuthenticationSuccessHandlerTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private OAuth2AuthenticationSuccessHandler successHandler;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(successHandler, "defaultRedirectUri", "http://localhost:3000/oauth2/redirect");
    }

    @Test
    @DisplayName("onAuthenticationSuccess should generate JWT and redirect to frontend with token")
    void testSuccessRedirectWithToken() throws Exception {
        UUID userId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(
                userId,
                "user@example.com",
                UserRole.DEVELOPER,
                Map.of("id", "12345")
        );

        when(authentication.getPrincipal()).thenReturn(principal);
        when(jwtService.generateToken(userId, "user@example.com", UserRole.DEVELOPER))
                .thenReturn("generated-jwt-token");
        when(response.encodeRedirectURL(anyString())).thenAnswer(invocation -> invocation.getArgument(0));

        successHandler.onAuthenticationSuccess(request, response, authentication);

        verify(response).sendRedirect(argThat(url ->
                url.startsWith("http://localhost:3000/oauth2/redirect") &&
                url.contains("token=generated-jwt-token") &&
                url.contains("userId=" + userId) &&
                url.contains("email=user@example.com")
        ));
    }
}
