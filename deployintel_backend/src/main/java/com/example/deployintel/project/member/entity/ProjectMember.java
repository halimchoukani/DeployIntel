package com.example.deployintel.project.member.entity;

import com.example.deployintel.project.entity.Project;
import com.example.deployintel.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "project_members",
        uniqueConstraints = @UniqueConstraint(name = "uk_project_members_project_user", columnNames = {"project_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ProjectRole role;

    @Column(name = "joined_at", nullable = false)
    private OffsetDateTime joinedAt;

    public static ProjectMember create(Project project, User user, ProjectRole role) {
        return ProjectMember.builder()
                .project(project)
                .user(user)
                .role(role)
                .joinedAt(OffsetDateTime.now())
                .build();
    }
}
