package com.example.deployintel.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {

        OAuth2User oauth2User = super.loadUser(userRequest);

        String provider = userRequest
                .getClientRegistration()
                .getRegistrationId();

        if ("github".equals(provider)) {
            processGithubUser(oauth2User);
        }

        return oauth2User;
    }

    private void processGithubUser(OAuth2User oauth2User) {

        Object githubId = oauth2User.getAttribute("id");
        String username = oauth2User.getAttribute("login");
        String email = oauth2User.getAttribute("email");

        System.out.println("GitHub ID: " + githubId);
        System.out.println("GitHub ID type: " + githubId.getClass().getSimpleName());
        System.out.println("GitHub username: " + username);
        System.out.println("GitHub email: " + email);
    }
}