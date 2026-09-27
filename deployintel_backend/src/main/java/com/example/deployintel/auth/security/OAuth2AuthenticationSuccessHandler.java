package com.example.deployintel.auth.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;

    @Value("${security.oauth2.redirect-uri:${FRONTEND_REDIRECT_URI:http://localhost:3000/oauth2/redirect}}")
    private String defaultRedirectUri;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {

        if (response.isCommitted()) {
            log.debug("Response has already been committed. Unable to redirect.");
            return;
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        String token = jwtService.generateToken(
                principal.getId(),
                principal.getUsername(),
                principal.getRole()
        );

        String targetUrl = UriComponentsBuilder.fromUriString(defaultRedirectUri)
                .queryParam("token", token)
                .queryParam("userId", principal.getId().toString())
                .queryParam("email", principal.getUsername())
                .build().toUriString();

        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
