package com.example.deployintel.admin.dto;

import com.example.deployintel.user.entity.AuthProvider;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.entity.UserStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String phone,
        UserStatus status,
        UserRole role,
        AuthProvider provider,
        String avatarUrl,
        boolean githubConnected,
        long projectCount,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static AdminUserResponse fromUser(User user, long projectCount) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getStatus(),
                user.getRole(),
                user.getProvider(),
                user.getAvatarUrl(),
                user.getGithubAccessToken() != null && !user.getGithubAccessToken().isBlank(),
                projectCount,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
