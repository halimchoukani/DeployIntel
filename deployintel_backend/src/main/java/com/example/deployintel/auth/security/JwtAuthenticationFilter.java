package com.example.deployintel.auth.security;

import com.example.deployintel.user.entity.UserRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserStatus;
import com.example.deployintel.user.repository.UserRepository;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader("Authorization");

        if (authorizationHeader == null ||
                !authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token =
                authorizationHeader.substring(7);

        try {

            if (jwtService.isTokenValid(token)) {

                UUID userId = jwtService.extractUserId(token);
                String email = jwtService.extractEmail(token);
                UserRole role = jwtService.extractRole(token);

                if (userRepository != null) {
                    Optional<User> userOptional = userRepository.findById(userId);
                    if (userOptional.isEmpty() || userOptional.get().getStatus() != UserStatus.ACTIVE) {
                        filterChain.doFilter(request, response);
                        return;
                    }
                    User user = userOptional.get();
                    email = user.getEmail();
                    role = user.getRole();
                }

                UserPrincipal principal = new UserPrincipal(
                        userId,
                        email,
                        role
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                principal.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);
            }

        } catch (Exception ignored) {
            // Invalid JWT → remain unauthenticated
        }

        filterChain.doFilter(request, response);
    }
}