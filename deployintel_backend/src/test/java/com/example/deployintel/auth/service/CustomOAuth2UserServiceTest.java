package com.example.deployintel.auth.service;

import com.example.deployintel.auth.dto.GithubUserInfo;
import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.user.entity.AuthProvider;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

    @Mock
    private GithubOAuth2Service githubOAuth2Service;

    @InjectMocks
    private CustomOAuth2UserService customOAuth2UserService;

    @Test
    @DisplayName("processGithubOAuth2User should resolve missing email and return UserPrincipal")
    void testProcessGithubOAuth2UserWithNullEmail() {
        OAuth2UserRequest request = mock(OAuth2UserRequest.class);
        OAuth2User oauth2User = mock(OAuth2User.class);
        OAuth2AccessToken accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "mock-token-val",
                Instant.now(),
                Instant.now().plusSeconds(3600)
        );

        when(request.getAccessToken()).thenReturn(accessToken);
        when(oauth2User.getAttribute("id")).thenReturn(99999);
        when(oauth2User.getAttribute("login")).thenReturn("devgithub");
        when(oauth2User.getAttribute("name")).thenReturn("Developer GitHub");
        when(oauth2User.getAttribute("email")).thenReturn(null);
        when(oauth2User.getAttribute("avatar_url")).thenReturn("https://avatar");
        when(oauth2User.getAttributes()).thenReturn(Map.of("id", 99999, "login", "devgithub"));

        when(githubOAuth2Service.fetchPrimaryEmail("mock-token-val", "99999", "devgithub"))
                .thenReturn("resolved@email.com");

        User savedUser = User.createOAuth2User(
                "resolved@email.com",
                "Developer",
                "GitHub",
                AuthProvider.GITHUB,
                "99999",
                "https://avatar"
        );
        UUID userId = UUID.randomUUID();
        savedUser.setId(userId);
        savedUser.setRole(UserRole.DEVELOPER);

        when(githubOAuth2Service.findOrCreateUser(any(GithubUserInfo.class), eq("resolved@email.com")))
                .thenReturn(savedUser);

        UserPrincipal principal = customOAuth2UserService.processGithubOAuth2User(request, oauth2User);

        assertThat(principal).isNotNull();
        assertThat(principal.getId()).isEqualTo(userId);
        assertThat(principal.getEmail()).isEqualTo("resolved@email.com");
        assertThat(principal.getRole()).isEqualTo(UserRole.DEVELOPER);
        assertThat(principal.getAttributes().get("email")).isEqualTo("resolved@email.com");
        assertThat(principal.getAttributes().get("userId")).isEqualTo(userId);
    }
}
