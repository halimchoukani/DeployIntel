package com.example.deployintel.deployment.entity;

import com.example.deployintel.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "deployments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(length = 50)
    @Builder.Default
    private String environment = "DEVELOPMENT";

    @Column(length = 50)
    @Builder.Default
    private String status = "COMPLETED";

    @Column(length = 50)
    private String version;

    @Column(name = "commit_sha", length = 100)
    private String commitSha;

    @Column(length = 150)
    private String branch;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}

