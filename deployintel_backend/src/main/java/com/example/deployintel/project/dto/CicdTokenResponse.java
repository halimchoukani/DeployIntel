package com.example.deployintel.project.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CicdTokenResponse(
        String token,
        String tokenType,
        OffsetDateTime expiresAt,
        UUID projectId,
        String createdBy
) {
}
