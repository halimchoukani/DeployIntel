package com.example.deployintel.gate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class K6CheckResponse {
    private String projectId;
    private String projectName;
    private java.util.UUID testRunId;
    private java.util.UUID deploymentId;
    private String verdict; // PASSED, WARNING, BLOCKED, FAILED
    private boolean passed;
    private String summaryMessage;
    private String targetUrl;
    private int vus;
    private double testDurationSeconds;
    private long totalRequests;
    private double requestsPerSecond;
    private double avgDurationMs;
    private double minDurationMs;
    private double medDurationMs;
    private double maxDurationMs;
    private double p90DurationMs;
    private double p95DurationMs;
    private double failedRequestRate;
    private int checksPassed;
    private int checksFailed;
    private double checkSuccessRate;
    private List<K6CheckItem> checks;
    private Map<String, Boolean> thresholds;
    private long dataReceivedBytes;
    private long dataSentBytes;
    private String containerId;
    private OffsetDateTime timestamp;
    private String rawOutput;
}

