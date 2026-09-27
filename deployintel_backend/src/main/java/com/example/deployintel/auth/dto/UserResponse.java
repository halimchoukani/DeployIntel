package com.example.deployintel.auth.dto;

import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.entity.UserStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String phone,
        UserStatus status,
        OffsetDateTime createdAt,
        UserRole role
) {
}