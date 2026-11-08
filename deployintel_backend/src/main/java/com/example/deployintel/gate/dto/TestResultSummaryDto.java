package com.example.deployintel.gate.dto;

import com.example.deployintel.gate.entity.Severity;
import com.example.deployintel.gate.entity.TestResultStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestResultSummaryDto {
    private UUID id;
    private String testName;
    private TestResultStatus status;
    private Severity severity;
    private Long durationMs;
    private String errorMessage;
}

