package com.example.deployintel.environment.dto;

import jakarta.validation.constraints.NotBlank;

public record ExecuteCommandRequest(
        @NotBlank(message = "Command must not be blank")
        String command,
        String workingDir
) {}
