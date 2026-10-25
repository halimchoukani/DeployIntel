package com.example.deployintel.environment.dto;

public record CommandExecutionResponse(
        int exitCode,
        String output,
        boolean success
) {}
