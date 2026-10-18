package com.example.deployintel.release.entity;

import com.example.deployintel.project.entity.Project;
import com.example.deployintel.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "releases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Release {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "version_number", nullable = false, length = 50)
    private String versionNumber;

    @Column(name = "commit_sha", nullable = false, length = 100)
    private String commitSha;

    @Column(length = 150)
    private String branch;

    @Column(length = 100)
    private String tag;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReleaseEnvironment environment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReleaseStatus status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public static Release create(
            Project project,
            String versionNumber,
            String commitSha,
            String branch,
            String tag,
            User author,
            ReleaseEnvironment environment,
            ReleaseStatus status
    ) {
        return Release.builder()
                .project(project)
                .versionNumber(versionNumber)
                .commitSha(commitSha)
                .branch(branch)
                .tag(tag)
                .author(author)
                .environment(environment)
                .status(status)
                .createdAt(OffsetDateTime.now())
                .build();
    }
}
