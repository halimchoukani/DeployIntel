package com.example.deployintel.gate.dto;

import com.example.deployintel.gate.entity.FindingStatus;
import com.example.deployintel.gate.entity.SecurityCategory;
import com.example.deployintel.gate.entity.Severity;
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
public class SecurityFindingSummaryDto {
    private UUID id;
    private String tool;
    private SecurityCategory category;
    private String title;
    private String description;
    private Severity severity;
    private String filePath;
    private Integer lineNumber;
    private String ruleId;
    private String remediation;
    private FindingStatus status;
    private OffsetDateTime createdAt;
}

