package com.example.deployintel.auth.service;

import com.example.deployintel.auth.dto.GithubUserInfo;
import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final GithubOAuth2Service githubOAuth2Service;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {

        OAuth2User oauth2User = super.loadUser(userRequest);

        String provider = userRequest
                .getClientRegistration()
                .getRegistrationId();

        if ("github".equalsIgnoreCase(provider)) {
            return processGithubOAuth2User(userRequest, oauth2User);
        }

        return oauth2User;
    }

    UserPrincipal processGithubOAuth2User(OAuth2UserRequest userRequest, OAuth2User oauth2User) {
        Object githubIdObj = oauth2User.getAttribute("id");
        String githubId = githubIdObj != null ? String.valueOf(githubIdObj) : null;
        String username = oauth2User.getAttribute("login");
        String name = oauth2User.getAttribute("name");
        String email = oauth2User.getAttribute("email");
        String avatarUrl = oauth2User.getAttribute("avatar_url");

        String accessToken = userRequest.getAccessToken().getTokenValue();
        if (email == null || email.isBlank()) {
            email = githubOAuth2Service.fetchPrimaryEmail(accessToken, githubId, username);
        }

        GithubUserInfo userInfo = new GithubUserInfo(githubId, username, name, email, avatarUrl);
        User user = githubOAuth2Service.findOrCreateUser(userInfo, email);
        if (user != null && accessToken != null) {
            user.setGithubAccessToken(accessToken);
        }

        Map<String, Object> attributes = new HashMap<>(oauth2User.getAttributes());
        attributes.put("email", user.getEmail());
        attributes.put("userId", user.getId());

        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                attributes
        );
    }
}