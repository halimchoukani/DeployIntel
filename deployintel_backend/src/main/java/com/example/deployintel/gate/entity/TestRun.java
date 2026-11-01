package com.example.deployintel.gate.entity;

import com.example.deployintel.deployment.entity.Deployment;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "test_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_id")
    private Deployment deployment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TestRunType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TestRunStatus status;

    @Column(name = "total_tests", nullable = false)
    @Builder.Default
    private Integer totalTests = 0;

    @Column(name = "passed_tests", nullable = false)
    @Builder.Default
    private Integer passedTests = 0;

    @Column(name = "failed_tests", nullable = false)
    @Builder.Default
    private Integer failedTests = 0;

    @Column(name = "skipped_tests", nullable = false)
    @Builder.Default
    private Integer skippedTests = 0;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String logs;

    @OneToMany(mappedBy = "testRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TestResult> results = new ArrayList<>();
}

