package com.example.deployintel.gate.entity;

import com.example.deployintel.deployment.entity.Deployment;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "performance_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_id")
    private Deployment deployment;

    @Column(name = "metric_name", nullable = false, length = 100)
    private String metricName;

    @Column(name = "previous_value", precision = 12, scale = 4)
    private BigDecimal previousValue;

    @Column(name = "current_value", precision = 12, scale = 4)
    private BigDecimal currentValue;

    @Column(length = 30)
    private String unit;

    @Column(name = "change_percent", precision = 8, scale = 2)
    private BigDecimal changePercent;

    @Column(precision = 12, scale = 4)
    private BigDecimal threshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private MetricStatus status;
}

