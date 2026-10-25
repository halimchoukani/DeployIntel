package com.example.deployintel.environment.entity;

import com.example.deployintel.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "test_environments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestEnvironment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "container_id", length = 128)
    private String containerId;

    @Column(name = "container_name", length = 150)
    private String containerName;

    @Column(nullable = false, length = 255)
    private String image;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EnvironmentStatus status = EnvironmentStatus.PENDING;

    @Column(name = "port_mapping", length = 100)
    private String portMapping;

    @Column(name = "environment_variables", columnDefinition = "TEXT")
    private String environmentVariables;

    @Column(name = "workspace_path", nullable = false, length = 255)
    @Builder.Default
    private String workspacePath = "/workspace";

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public static TestEnvironment create(
            Project project,
            String name,
            String image,
            String containerName,
            String environmentVariables,
            String workspacePath
    ) {
        OffsetDateTime now = OffsetDateTime.now();
        return TestEnvironment.builder()
                .project(project)
                .name(name != null && !name.isBlank() ? name : "Test Environment")
                .image(image)
                .containerName(containerName)
                .status(EnvironmentStatus.PENDING)
                .environmentVariables(environmentVariables)
                .workspacePath(workspacePath != null && !workspacePath.isBlank() ? workspacePath : "/workspace")
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    public void updateStatus(EnvironmentStatus newStatus, String errorMessage) {
        this.status = newStatus;
        this.errorMessage = errorMessage;
        this.updatedAt = OffsetDateTime.now();
    }
}
