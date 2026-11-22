package com.example.deployintel.project.member.dto;

import com.example.deployintel.project.member.entity.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(
        @NotNull(message = "Role is required")
        ProjectRole role
) {}
