package com.example.deployintel.release.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.example.deployintel.release.entity.ReleaseEnvironment;

import java.util.UUID;

/**
 * Request body sent by the GitHub Actions workflow step.
 *
 * Example GitHub Actions step:
 * <pre>
 *   - name: Notify DeployIntel
 *     run: |
 *       curl -s -X POST ${{ secrets.DEPLOYINTEL_API_URL }}/api/v1/releases \
 *         -H "Authorization: Bearer ${{ secrets.DEPLOYINTEL_TOKEN }}" \
 *         -H "Content-Type: application/json" \
 *         -d '{
 *           "projectId": "${{ secrets.DEPLOYINTEL_PROJECT_ID }}",
 *           "versionNumber": "${{ github.ref_name }}",
 *           "commitSha": "${{ github.sha }}",
 *           "branch": "${{ github.ref_name }}",
 *           "tag": "${{ github.ref_name }}",
 *           "environment": "PRODUCTION"
 *         }'
 * </pre>
 */
public record CreateReleaseRequest(

        @NotNull(message = "projectId is required")
        UUID projectId,

        @NotBlank(message = "versionNumber is required")
        @Size(max = 50, message = "versionNumber must not exceed 50 characters")
        String versionNumber,

        @NotBlank(message = "commitSha is required")
        @Size(max = 100, message = "commitSha must not exceed 100 characters")
        String commitSha,

        @Size(max = 150, message = "branch must not exceed 150 characters")
        String branch,

        @Size(max = 100, message = "tag must not exceed 100 characters")
        String tag,

        @NotNull(message = "environment is required")
        ReleaseEnvironment environment
) {}
