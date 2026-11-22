package com.example.deployintel.project.member.dto;

import com.example.deployintel.project.member.entity.InvitationStatus;
import com.example.deployintel.project.member.entity.ProjectInvitation;
import com.example.deployintel.project.member.entity.ProjectRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectInvitationResponse {
    private UUID id;
    private UUID projectId;
    private String projectName;
    private String email;
    private ProjectRole role;
    private String invitedByEmail;
    private String invitedByName;
    private InvitationStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime expiresAt;

    public static ProjectInvitationResponse fromEntity(ProjectInvitation invitation) {
        return ProjectInvitationResponse.builder()
                .id(invitation.getId())
                .projectId(invitation.getProject() != null ? invitation.getProject().getId() : null)
                .projectName(invitation.getProject() != null ? invitation.getProject().getName() : null)
                .email(invitation.getEmail())
                .role(invitation.getRole())
                .invitedByEmail(invitation.getInvitedBy() != null ? invitation.getInvitedBy().getEmail() : null)
                .invitedByName(invitation.getInvitedBy() != null ? invitation.getInvitedBy().getFullName() : null)
                .status(invitation.getStatus())
                .createdAt(invitation.getCreatedAt())
                .expiresAt(invitation.getExpiresAt())
                .build();
    }
}
