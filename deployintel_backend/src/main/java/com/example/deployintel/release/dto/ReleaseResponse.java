package com.example.deployintel.release.dto;

import com.example.deployintel.gate.dto.TestRunSummaryDto;
import com.example.deployintel.release.entity.Release;
import com.example.deployintel.release.entity.ReleaseEnvironment;
import com.example.deployintel.release.entity.ReleaseStatus;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public record ReleaseResponse(
        UUID id,
        UUID projectId,
        String versionNumber,
        String commitSha,
        String branch,
        String tag,
        UUID authorId,
        ReleaseEnvironment environment,
        ReleaseStatus status,
        OffsetDateTime createdAt,
        UUID deploymentId,
        String testVerdict,
        List<TestRunSummaryDto> testRuns
) {
    public static ReleaseResponse fromEntity(Release release) {
        return fromEntity(release, null, null, Collections.emptyList());
    }

    public static ReleaseResponse fromEntity(
            Release release,
            UUID deploymentId,
            String testVerdict,
            List<TestRunSummaryDto> testRuns
    ) {
        return new ReleaseResponse(
                release.getId(),
                release.getProject() != null ? release.getProject().getId() : null,
                release.getVersionNumber(),
                release.getCommitSha(),
                release.getBranch(),
                release.getTag(),
                release.getAuthor() != null ? release.getAuthor().getId() : null,
                release.getEnvironment(),
                release.getStatus(),
                release.getCreatedAt(),
                deploymentId,
                testVerdict,
                testRuns != null ? testRuns : Collections.emptyList()
        );
    }
}
