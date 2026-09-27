package com.example.deployintel.user.dto;

import com.example.deployintel.user.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public record AssignRoleRequest(
        @NotNull
        UserRole role
) {
}