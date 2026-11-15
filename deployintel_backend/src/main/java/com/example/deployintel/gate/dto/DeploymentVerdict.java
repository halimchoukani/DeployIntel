package com.example.deployintel.gate.dto;

import com.example.deployintel.gate.entity.RiskLevel;

/**
 * Composite deployment verdict produced by {@link com.example.deployintel.gate.service.CompositeRiskScoreService}.
 * <p>
 * Verdict values: "PASS", "WARN", "BLOCK"
 */
public record DeploymentVerdict(
        double compositeScore,
        double securityScore,
        double performanceScore,
        double testScore,
        double regressionScore,
        String verdict,       // "PASS", "WARN", "BLOCK"
        String reason,
        RiskLevel riskLevel
) {
    public boolean isBlocked() {
        return "BLOCK".equals(verdict);
    }

    public boolean isPassed() {
        return "PASS".equals(verdict) || "WARN".equals(verdict);
    }
}
