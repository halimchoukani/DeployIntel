package com.example.deployintel.gate.dto;

import com.example.deployintel.gate.entity.TestRunStatus;
import com.example.deployintel.gate.entity.TestRunType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestRunSummaryDto {
    private UUID id;
    private TestRunType type;
    private TestRunStatus status;
    private int totalTests;
    private int passedTests;
    private int failedTests;
    private Long durationMs;
    private OffsetDateTime completedAt;
    private String aiSuggestion;
    private String aiModel;
}

