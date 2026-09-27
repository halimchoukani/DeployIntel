package com.example.deployintel.auth.security;

import com.example.deployintel.user.entity.UserRole;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class UserPrincipal implements UserDetails, OAuth2User {

    @Getter
    private final UUID id;
    @Getter
    private final String email;
    private final String password;
    @Getter
    private final UserRole role;
    private final Map<String, Object> attributes;

    public UserPrincipal(
            UUID id,
            String email,
            UserRole role
    ) {
        this(id, email, role, Collections.emptyMap());
    }

    public UserPrincipal(
            UUID id,
            String email,
            UserRole role,
            Map<String, Object> attributes
    ) {
        this.id = id;
        this.email = email;
        this.password = null;
        this.role = role;
        this.attributes = attributes != null ? attributes : Collections.emptyMap();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(
                new SimpleGrantedAuthority(
                        "ROLE_" + role.name()
                )
        );
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public String getName() {
        return email;
    }
}