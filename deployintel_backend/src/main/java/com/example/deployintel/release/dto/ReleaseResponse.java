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
        Double compositeScore,
        Double securityScore,
        Double performanceScore,
        Double testScore,
        Double regressionScore,
        String deploymentDecision,   // "PASS", "WARN", "BLOCK"
        String decisionReason,
        String aiSuggestion,
        List<TestRunSummaryDto> testRuns
) {
    public static ReleaseResponse fromEntity(Release release) {
        return fromEntity(release, null, null, null, null, null, null, null, null, null, null, Collections.emptyList());
    }

    public static ReleaseResponse fromEntity(
            Release release,
            UUID deploymentId,
            String testVerdict,
            List<TestRunSummaryDto> testRuns
    ) {
        return fromEntity(release, deploymentId, testVerdict, null, null, null, null, null, null, null, release != null ? release.getAiSuggestion() : null, testRuns);
    }

    public static ReleaseResponse fromEntity(
            Release release,
            UUID deploymentId,
            String testVerdict,
            Double compositeScore,
            String deploymentDecision,
            String decisionReason,
            List<TestRunSummaryDto> testRuns
    ) {
        return fromEntity(release, deploymentId, testVerdict, compositeScore, null, null, null, null, deploymentDecision, decisionReason, release != null ? release.getAiSuggestion() : null, testRuns);
    }

    public static ReleaseResponse fromEntity(
            Release release,
            UUID deploymentId,
            String testVerdict,
            Double compositeScore,
            Double securityScore,
            Double performanceScore,
            Double testScore,
            Double regressionScore,
            String deploymentDecision,
            String decisionReason,
            List<TestRunSummaryDto> testRuns
    ) {
        return fromEntity(release, deploymentId, testVerdict, compositeScore, securityScore, performanceScore, testScore, regressionScore, deploymentDecision, decisionReason, release != null ? release.getAiSuggestion() : null, testRuns);
    }

    public static ReleaseResponse fromEntity(
            Release release,
            UUID deploymentId,
            String testVerdict,
            Double compositeScore,
            Double securityScore,
            Double performanceScore,
            Double testScore,
            Double regressionScore,
            String deploymentDecision,
            String decisionReason,
            String aiSuggestion,
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
                compositeScore,
                securityScore,
                performanceScore,
                testScore,
                regressionScore,
                deploymentDecision,
                decisionReason,
                aiSuggestion != null ? aiSuggestion : (release != null ? release.getAiSuggestion() : null),
                testRuns != null ? testRuns : Collections.emptyList()
        );
    }
}
