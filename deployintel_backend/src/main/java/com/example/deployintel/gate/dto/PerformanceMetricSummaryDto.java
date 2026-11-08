package com.example.deployintel.gate.dto;

import com.example.deployintel.gate.entity.MetricStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceMetricSummaryDto {
    private UUID id;
    private String metricName;
    private BigDecimal previousValue;
    private BigDecimal currentValue;
    private String unit;
    private BigDecimal changePercent;
    private BigDecimal threshold;
    private MetricStatus status;
}

