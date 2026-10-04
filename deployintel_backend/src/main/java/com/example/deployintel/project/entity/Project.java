package com.example.deployintel.project.entity;

import com.example.deployintel.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "repository_url", nullable = false, columnDefinition = "TEXT")
    private String repositoryUrl;

    @Column(name = "default_branch", nullable = false, length = 100)
    private String defaultBranch;

    @Column(length = 50)
    private String language;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public static Project create(
            String name,
            String description,
            String repositoryUrl,
            String defaultBranch,
            String language,
            User owner
    ) {
        OffsetDateTime now = OffsetDateTime.now();
        return Project.builder()
                .name(name)
                .description(description)
                .repositoryUrl(repositoryUrl)
                .defaultBranch(defaultBranch != null && !defaultBranch.isBlank() ? defaultBranch : "main")
                .language(language)
                .owner(owner)
                .status(ProjectStatus.ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
