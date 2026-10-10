package com.example.deployintel.admin.dto;

import com.example.deployintel.user.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "Status is required")
        UserStatus status
) {
}
