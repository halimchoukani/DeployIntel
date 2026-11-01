package com.example.deployintel.gate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GateCheckResponse {
    private String projectId;
    private String projectName;
    private java.util.UUID testRunId;
    private java.util.UUID deploymentId;
    private String verdict; // PASSED, WARNING, BLOCKED, FAILED
    private boolean passed;
    private String summaryMessage;
    private int totalFindings;
    private int errorCount;
    private int warningCount;
    private int infoCount;
    private int scannedFilesCount;
    private int rulesCount;
    private double scanDurationSeconds;
    private String containerId;
    private String environmentName;
    private OffsetDateTime timestamp;
    private List<SemgrepFinding> findings;
    private String rawOutput;
}

