package com.example.deployintel.auth.service;

import com.example.deployintel.auth.dto.GithubUserInfo;
import com.example.deployintel.user.entity.AuthProvider;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubOAuth2Service {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${spring.security.oauth2.client.registration.github.client-id:${GITHUB_CLIENT_ID:Ov23libdfTKCeuJqMkRK}}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.github.client-secret:${GITHUB_CLIENT_SECRET:54fee15c746bdc340472ad0c42e05837714c89e3}}")
    private String clientSecret;

    public String buildAuthorizationUrl(String redirectUri, String state) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString("https://github.com/login/oauth/authorize")
                .queryParam("client_id", clientId)
                .queryParam("scope", "read:user user:email");

        if (redirectUri != null && !redirectUri.isBlank()) {
            builder.queryParam("redirect_uri", redirectUri);
        }
        if (state != null && !state.isBlank()) {
            builder.queryParam("state", state);
        }

        return builder.build().toUriString();
    }

    public String exchangeCodeForAccessToken(String code, String redirectUri) {
        String tokenUrl = "https://github.com/login/oauth/access_token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        Map<String, String> body = new HashMap<>();
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("code", code);
        if (redirectUri != null && !redirectUri.isBlank()) {
            body.put("redirect_uri", redirectUri);
        }

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalArgumentException("Failed to exchange code with GitHub: status " + response.getStatusCode());
            }

            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            if (jsonNode.has("error")) {
                String errorDescription = jsonNode.has("error_description")
                        ? jsonNode.get("error_description").asText()
                        : jsonNode.get("error").asText();
                log.error("GitHub OAuth token exchange error: {}", errorDescription);
                throw new IllegalArgumentException("GitHub authentication failed: " + errorDescription);
            }

            JsonNode accessTokenNode = jsonNode.get("access_token");
            if (accessTokenNode == null || accessTokenNode.asText().isBlank()) {
                throw new IllegalArgumentException("GitHub did not return an access token");
            }

            return accessTokenNode.asText();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error communicating with GitHub token endpoint", e);
            throw new IllegalArgumentException("Failed to exchange GitHub authorization code: " + e.getMessage(), e);
        }
    }

    public GithubUserInfo getGithubUserInfo(String accessToken) {
        String userUrl = "https://api.github.com/user";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("User-Agent", "DeployIntel-App");
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(userUrl, HttpMethod.GET, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalArgumentException("Failed to fetch GitHub user info: status " + response.getStatusCode());
            }

            JsonNode node = objectMapper.readTree(response.getBody());

            String id = node.has("id") ? node.get("id").asText() : null;
            String login = node.has("login") ? node.get("login").asText() : null;
            String name = (node.has("name") && !node.get("name").isNull()) ? node.get("name").asText() : null;
            String email = (node.has("email") && !node.get("email").isNull()) ? node.get("email").asText() : null;
            String avatarUrl = (node.has("avatar_url") && !node.get("avatar_url").isNull()) ? node.get("avatar_url").asText() : null;

            return new GithubUserInfo(id, login, name, email, avatarUrl);
        } catch (Exception e) {
            log.error("Error fetching GitHub user info", e);
            throw new IllegalArgumentException("Failed to fetch user info from GitHub: " + e.getMessage(), e);
        }
    }

    public String fetchPrimaryEmail(String accessToken, String githubId, String login) {
        String emailsUrl = "https://api.github.com/user/emails";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("User-Agent", "DeployIntel-App");
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(emailsUrl, HttpMethod.GET, request, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> emailList = objectMapper.readValue(
                        response.getBody(),
                        new TypeReference<List<Map<String, Object>>>() {}
                );

                for (Map<String, Object> emailObj : emailList) {
                    Boolean primary = (Boolean) emailObj.get("primary");
                    Boolean verified = (Boolean) emailObj.get("verified");
                    if (Boolean.TRUE.equals(primary) && Boolean.TRUE.equals(verified)) {
                        return (String) emailObj.get("email");
                    }
                }

                for (Map<String, Object> emailObj : emailList) {
                    Boolean primary = (Boolean) emailObj.get("primary");
                    if (Boolean.TRUE.equals(primary)) {
                        return (String) emailObj.get("email");
                    }
                }

                for (Map<String, Object> emailObj : emailList) {
                    Boolean verified = (Boolean) emailObj.get("verified");
                    if (Boolean.TRUE.equals(verified)) {
                        return (String) emailObj.get("email");
                    }
                }

                if (!emailList.isEmpty() && emailList.get(0).get("email") != null) {
                    return (String) emailList.get(0).get("email");
                }
            }
        } catch (Exception e) {
            log.warn("Could not retrieve emails list from GitHub API: {}", e.getMessage());
        }

        // Fallback to GitHub noreply email address
        String fallbackLogin = (login != null && !login.isBlank()) ? login : "user";
        String fallbackId = (githubId != null && !githubId.isBlank()) ? githubId : UUID.randomUUID().toString();
        return fallbackId + "+" + fallbackLogin + "@users.noreply.github.com";
    }

    @Transactional
    public User findOrCreateUser(GithubUserInfo userInfo, String resolvedEmail) {
        if (userInfo.id() == null || userInfo.id().isBlank()) {
            throw new IllegalArgumentException("GitHub user ID cannot be null");
        }

        Optional<User> existingByProvider = userRepository.findByProviderAndProviderId(AuthProvider.GITHUB, userInfo.id());
        if (existingByProvider.isPresent()) {
            User user = existingByProvider.get();
            if (resolvedEmail != null && !resolvedEmail.isBlank()) {
                user.setEmail(resolvedEmail);
            }
            if (userInfo.avatarUrl() != null) {
                user.setAvatarUrl(userInfo.avatarUrl());
            }
            user.setUpdatedAt(OffsetDateTime.now());
            return userRepository.save(user);
        }

        if (resolvedEmail != null && !resolvedEmail.isBlank()) {
            Optional<User> existingByEmail = userRepository.findByEmail(resolvedEmail);
            if (existingByEmail.isPresent()) {
                User user = existingByEmail.get();
                user.setProviderId(userInfo.id());
                if (user.getProvider() == null || user.getProvider() == AuthProvider.LOCAL) {
                    user.setProvider(AuthProvider.GITHUB);
                }
                if (userInfo.avatarUrl() != null) {
                    user.setAvatarUrl(userInfo.avatarUrl());
                }
                user.setUpdatedAt(OffsetDateTime.now());
                return userRepository.save(user);
            }
        }

        String firstName;
        String lastName;
        if (userInfo.name() != null && !userInfo.name().trim().isEmpty()) {
            String[] parts = userInfo.name().trim().split("\\s+", 2);
            firstName = parts[0];
            lastName = parts.length > 1 ? parts[1] : parts[0];
        } else {
            firstName = (userInfo.login() != null && !userInfo.login().isBlank()) ? userInfo.login() : "GitHub";
            lastName = "User";
        }

        User newUser = User.createOAuth2User(
                resolvedEmail,
                firstName,
                lastName,
                AuthProvider.GITHUB,
                userInfo.id(),
                userInfo.avatarUrl()
        );

        return userRepository.save(newUser);
    }
}
