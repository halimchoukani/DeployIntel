package com.example.deployintel.gate.entity;

import com.example.deployintel.deployment.entity.Deployment;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_findings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityFinding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_id")
    private Deployment deployment;

    @Column(nullable = false, length = 100)
    private String tool;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private SecurityCategory category;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Severity severity;

    @Column(name = "file_path", columnDefinition = "TEXT")
    private String filePath;

    @Column(name = "line_number")
    private Integer lineNumber;

    @Column(name = "rule_id", length = 100)
    private String ruleId;

    @Column(columnDefinition = "TEXT")
    private String remediation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private FindingStatus status;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}

