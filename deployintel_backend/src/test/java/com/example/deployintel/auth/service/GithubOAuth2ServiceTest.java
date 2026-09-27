package com.example.deployintel.auth.service;

import com.example.deployintel.auth.dto.GithubUserInfo;
import com.example.deployintel.user.entity.AuthProvider;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.entity.UserStatus;
import com.example.deployintel.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GithubOAuth2ServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GithubOAuth2Service githubOAuth2Service;

    @Test
    @DisplayName("findOrCreateUser creates new user when user does not exist")
    void testCreateNewUser() {
        when(userRepository.findByProviderAndProviderId(AuthProvider.GITHUB, "12345"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail("octocat@github.com"))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class)))
                .thenAnswer(returnsFirstArg());

        GithubUserInfo userInfo = new GithubUserInfo(
                "12345",
                "octocat",
                "Mona Lisa Octocat",
                "octocat@github.com",
                "https://avatar.url"
        );

        User user = githubOAuth2Service.findOrCreateUser(userInfo, "octocat@github.com");

        assertThat(user).isNotNull();
        assertThat(user.getEmail()).isEqualTo("octocat@github.com");
        assertThat(user.getFirstName()).isEqualTo("Mona");
        assertThat(user.getLastName()).isEqualTo("Lisa Octocat");
        assertThat(user.getProvider()).isEqualTo(AuthProvider.GITHUB);
        assertThat(user.getProviderId()).isEqualTo("12345");
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(user.getRole()).isEqualTo(UserRole.DEVELOPER);
        assertThat(user.getPasswordHash()).isNull();

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("findOrCreateUser links account when user already exists with same email")
    void testLinkExistingUserByEmail() {
        User existingUser = User.create(
                "octocat@github.com",
                "hashedpassword",
                "Existing",
                "User",
                "123456"
        );

        when(userRepository.findByProviderAndProviderId(AuthProvider.GITHUB, "12345"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail("octocat@github.com"))
                .thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class)))
                .thenAnswer(returnsFirstArg());

        GithubUserInfo userInfo = new GithubUserInfo(
                "12345",
                "octocat",
                "Mona Lisa Octocat",
                "octocat@github.com",
                "https://avatar.url"
        );

        User user = githubOAuth2Service.findOrCreateUser(userInfo, "octocat@github.com");

        assertThat(user).isNotNull();
        assertThat(user.getProviderId()).isEqualTo("12345");
        assertThat(user.getProvider()).isEqualTo(AuthProvider.GITHUB);
        assertThat(user.getAvatarUrl()).isEqualTo("https://avatar.url");
    }

    @Test
    @DisplayName("findOrCreateUser updates existing OAuth2 user on repeat login")
    void testRepeatLogin() {
        User existingUser = User.createOAuth2User(
                "old@github.com",
                "Mona",
                "Lisa",
                AuthProvider.GITHUB,
                "12345",
                "https://old-avatar.url"
        );

        when(userRepository.findByProviderAndProviderId(AuthProvider.GITHUB, "12345"))
                .thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class)))
                .thenAnswer(returnsFirstArg());

        GithubUserInfo userInfo = new GithubUserInfo(
                "12345",
                "octocat",
                "Mona Lisa",
                "new@github.com",
                "https://new-avatar.url"
        );

        User user = githubOAuth2Service.findOrCreateUser(userInfo, "new@github.com");

        assertThat(user).isNotNull();
        assertThat(user.getEmail()).isEqualTo("new@github.com");
        assertThat(user.getAvatarUrl()).isEqualTo("https://new-avatar.url");
    }
}
