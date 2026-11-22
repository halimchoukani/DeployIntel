package com.example.deployintel.project.member.dto;

import com.example.deployintel.project.member.entity.ProjectMember;
import com.example.deployintel.project.member.entity.ProjectPermission;
import com.example.deployintel.project.member.entity.ProjectRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMemberResponse {
    private UUID id;
    private UUID userId;
    private UUID projectId;
    private String email;
    private String fullName;
    private String avatarUrl;
    private ProjectRole role;
    private Set<ProjectPermission> permissions;
    private OffsetDateTime joinedAt;
    private boolean isOwner;

    public static ProjectMemberResponse fromEntity(ProjectMember member, boolean isProjectOwner) {
        return ProjectMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser() != null ? member.getUser().getId() : null)
                .projectId(member.getProject() != null ? member.getProject().getId() : null)
                .email(member.getUser() != null ? member.getUser().getEmail() : null)
                .fullName(member.getUser() != null ? member.getUser().getFullName() : null)
                .avatarUrl(member.getUser() != null ? member.getUser().getAvatarUrl() : null)
                .role(member.getRole())
                .permissions(member.getRole() != null ? member.getRole().getPermissions() : Set.of())
                .joinedAt(member.getJoinedAt())
                .isOwner(isProjectOwner || member.getRole() == ProjectRole.OWNER)
                .build();
    }
}
