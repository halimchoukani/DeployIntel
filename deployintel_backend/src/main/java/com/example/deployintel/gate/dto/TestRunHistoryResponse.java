package com.example.deployintel.gate.dto;

import com.example.deployintel.gate.entity.TestRunStatus;
import com.example.deployintel.gate.entity.TestRunType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestRunHistoryResponse {
    private UUID id;
    private UUID projectId;
    private UUID deploymentId;
    private UUID releaseId;
    private String releaseVersion;
    private String environment;
    private String branch;
    private String commitSha;
    private TestRunType type;
    private TestRunStatus status;
    private int totalTests;
    private int passedTests;
    private int failedTests;
    private int skippedTests;
    private Long durationMs;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;
    private String logs;
    private int findingsCount;
    private List<SecurityFindingSummaryDto> findings;
    private List<PerformanceMetricSummaryDto> metrics;
    private List<TestResultSummaryDto> results;
    private String aiSuggestion;
    private String aiModel;
}

