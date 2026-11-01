package com.example.deployintel.gate.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "test_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_run_id", nullable = false)
    private TestRun testRun;

    @Column(name = "test_name", nullable = false, length = 255)
    private String testName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TestResultStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Severity severity;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "stack_trace", columnDefinition = "TEXT")
    private String stackTrace;
}

