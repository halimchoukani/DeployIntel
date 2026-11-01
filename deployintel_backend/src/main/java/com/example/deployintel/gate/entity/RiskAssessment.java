package com.example.deployintel.gate.entity;

import com.example.deployintel.deployment.entity.Deployment;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "risk_assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_id")
    private Deployment deployment;

    @Column(name = "security_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal securityScore;

    @Column(name = "test_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal testScore;

    @Column(name = "performance_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal performanceScore;

    @Column(name = "regression_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal regressionScore;

    @Column(name = "final_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal finalScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 50)
    private RiskLevel riskLevel;

    @Column(name = "rule_version", nullable = false, length = 30)
    private String ruleVersion;

    @Column(name = "calculated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime calculatedAt = OffsetDateTime.now();
}

