package com.example.deployintel.project.member.service;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.ProjectAccessDeniedException;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.common.exception.UserNotFoundException;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.member.dto.InviteMemberRequest;
import com.example.deployintel.project.member.dto.ProjectInvitationResponse;
import com.example.deployintel.project.member.dto.ProjectMemberResponse;
import com.example.deployintel.project.member.dto.UpdateMemberRoleRequest;
import com.example.deployintel.project.member.entity.InvitationStatus;
import com.example.deployintel.project.member.entity.ProjectInvitation;
import com.example.deployintel.project.member.entity.ProjectMember;
import com.example.deployintel.project.member.entity.ProjectPermission;
import com.example.deployintel.project.member.entity.ProjectRole;
import com.example.deployintel.project.member.repository.ProjectInvitationRepository;
import com.example.deployintel.project.member.repository.ProjectMemberRepository;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectMemberService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectInvitationRepository projectInvitationRepository;
    private final UserRepository userRepository;

    /**
     * Lists all active members of the project.
     */
    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getProjectMembers(UserPrincipal currentUser, UUID projectId) {
        Project project = getProjectAndValidatePermission(currentUser, projectId, ProjectPermission.VIEW_PROJECT);
        List<ProjectMember> members = projectMemberRepository.findByProjectIdWithUser(projectId);

        UUID ownerId = project.getOwner() != null ? project.getOwner().getId() : null;
        return members.stream()
                .map(m -> ProjectMemberResponse.fromEntity(m, ownerId != null && m.getUser() != null && ownerId.equals(m.getUser().getId())))
                .toList();
    }

    /**
     * Invites a member by email or adds them directly if their user account already exists.
     */
    @Transactional
    public ProjectMemberResponse inviteOrAddMember(UserPrincipal currentUser, UUID projectId, InviteMemberRequest request) {
        Project project = getProjectAndValidatePermission(currentUser, projectId, ProjectPermission.MANAGE_MEMBERS);
        String targetEmail = request.email().trim().toLowerCase();

        // Check if user already exists in the system
        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(targetEmail);

        if (existingUserOpt.isPresent()) {
            User targetUser = existingUserOpt.get();

            // Check if already a member
            if (projectMemberRepository.existsByProjectIdAndUserId(projectId, targetUser.getId())) {
                throw new IllegalArgumentException("User " + targetEmail + " is already a member of this project");
            }

            // Directly add existing user as project member
            ProjectMember newMember = ProjectMember.create(project, targetUser, request.role());
            newMember = projectMemberRepository.save(newMember);

            // Close any pending invitations for this email
            projectInvitationRepository.findByProjectIdAndEmailIgnoreCaseAndStatus(projectId, targetEmail, InvitationStatus.PENDING)
                    .ifPresent(inv -> {
                        inv.setStatus(InvitationStatus.ACCEPTED);
                        projectInvitationRepository.save(inv);
                    });

            log.info("Directly added user {} as {} to project {}", targetEmail, request.role(), project.getName());
            return ProjectMemberResponse.fromEntity(newMember, false);
        } else {
            // User does not exist yet -> create an invitation
            User inviter = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new UserNotFoundException("User not found: " + currentUser.getId()));

            ProjectInvitation invitation = projectInvitationRepository
                    .findByProjectIdAndEmailIgnoreCaseAndStatus(projectId, targetEmail, InvitationStatus.PENDING)
                    .orElseGet(() -> ProjectInvitation.builder()
                            .project(project)
                            .email(targetEmail)
                            .role(request.role())
                            .invitedBy(inviter)
                            .status(InvitationStatus.PENDING)
                            .token(UUID.randomUUID().toString())
                            .createdAt(OffsetDateTime.now())
                            .expiresAt(OffsetDateTime.now().plusDays(7))
                            .build()
                    );

            invitation.setRole(request.role());
            invitation.setExpiresAt(OffsetDateTime.now().plusDays(7));
            invitation = projectInvitationRepository.save(invitation);

            log.info("Created project invitation for email {} with role {} for project {}", targetEmail, request.role(), project.getName());

            // Return pending placeholder representation
            return ProjectMemberResponse.builder()
                    .id(invitation.getId())
                    .projectId(projectId)
                    .email(targetEmail)
                    .fullName("Invited User (Pending)")
                    .role(request.role())
                    .permissions(request.role().getPermissions())
                    .joinedAt(invitation.getCreatedAt())
                    .isOwner(false)
                    .build();
        }
    }

    /**
     * Updates an existing member's role.
     */
    @Transactional
    public ProjectMemberResponse updateMemberRole(UserPrincipal currentUser, UUID projectId, UUID memberId, UpdateMemberRoleRequest request) {
        Project project = getProjectAndValidatePermission(currentUser, projectId, ProjectPermission.MANAGE_MEMBERS);
        ProjectMember member = projectMemberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Project member not found with id: " + memberId));

        if (!member.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Member does not belong to project: " + projectId);
        }

        // Project primary owner cannot be demoted via role change
        if (project.getOwner() != null && member.getUser() != null && project.getOwner().getId().equals(member.getUser().getId())) {
            throw new IllegalArgumentException("Cannot change the role of the primary project owner");
        }

        member.setRole(request.role());
        member = projectMemberRepository.save(member);

        log.info("Updated role of member {} in project {} to {}", memberId, project.getName(), request.role());
        return ProjectMemberResponse.fromEntity(member, false);
    }

    /**
     * Removes a member from the project.
     */
    @Transactional
    public void removeMember(UserPrincipal currentUser, UUID projectId, UUID memberId) {
        Project project = getProjectAndValidatePermission(currentUser, projectId, ProjectPermission.MANAGE_MEMBERS);
        ProjectMember member = projectMemberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Project member not found with id: " + memberId));

        if (!member.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Member does not belong to project: " + projectId);
        }

        // Cannot remove project owner
        if (project.getOwner() != null && member.getUser() != null && project.getOwner().getId().equals(member.getUser().getId())) {
            throw new IllegalArgumentException("Cannot remove the primary project owner");
        }

        projectMemberRepository.delete(member);
        log.info("Removed member {} from project {}", memberId, project.getName());
    }

    /**
     * Allows a member to leave a project.
     */
    @Transactional
    public void leaveProject(UserPrincipal currentUser, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + projectId));

        if (project.getOwner() != null && project.getOwner().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Primary project owner cannot leave the project. Please transfer ownership or archive the project.");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this project"));

        projectMemberRepository.delete(member);
        log.info("User {} left project {}", currentUser.getEmail(), project.getName());
    }

    /**
     * Lists all pending invitations for a project.
     */
    @Transactional(readOnly = true)
    public List<ProjectInvitationResponse> getProjectInvitations(UserPrincipal currentUser, UUID projectId) {
        getProjectAndValidatePermission(currentUser, projectId, ProjectPermission.MANAGE_MEMBERS);
        List<ProjectInvitation> invitations = projectInvitationRepository
                .findByProjectIdAndStatusWithInviter(projectId, InvitationStatus.PENDING);

        return invitations.stream()
                .filter(i -> !i.isExpired())
                .map(ProjectInvitationResponse::fromEntity)
                .toList();
    }

    /**
     * Revokes a pending invitation.
     */
    @Transactional
    public void revokeInvitation(UserPrincipal currentUser, UUID projectId, UUID invitationId) {
        getProjectAndValidatePermission(currentUser, projectId, ProjectPermission.MANAGE_MEMBERS);
        ProjectInvitation invitation = projectInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found: " + invitationId));

        if (!invitation.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Invitation does not belong to project: " + projectId);
        }

        invitation.setStatus(InvitationStatus.REVOKED);
        projectInvitationRepository.save(invitation);
        log.info("Revoked invitation {} for project {}", invitationId, projectId);
    }

    /**
     * Gets pending invitations for the currently authenticated user.
     */
    @Transactional(readOnly = true)
    public List<ProjectInvitationResponse> getMyPendingInvitations(UserPrincipal currentUser) {
        List<ProjectInvitation> invitations = projectInvitationRepository
                .findByEmailAndStatusWithProject(currentUser.getEmail(), InvitationStatus.PENDING);

        return invitations.stream()
                .filter(i -> !i.isExpired())
                .map(ProjectInvitationResponse::fromEntity)
                .toList();
    }

    /**
     * Accepts a pending invitation.
     */
    @Transactional
    public void acceptInvitation(UserPrincipal currentUser, UUID invitationId) {
        ProjectInvitation invitation = projectInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found: " + invitationId));

        if (!invitation.getEmail().equalsIgnoreCase(currentUser.getEmail()) && currentUser.getRole() != UserRole.ADMIN) {
            throw new ProjectAccessDeniedException("This invitation was sent to a different email address");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING || invitation.isExpired()) {
            throw new IllegalStateException("Invitation is no longer active");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new UserNotFoundException("User not found: " + currentUser.getId()));

        if (!projectMemberRepository.existsByProjectIdAndUserId(invitation.getProject().getId(), user.getId())) {
            ProjectMember member = ProjectMember.create(invitation.getProject(), user, invitation.getRole());
            projectMemberRepository.save(member);
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        projectInvitationRepository.save(invitation);
        log.info("User {} accepted invitation to join project {}", currentUser.getEmail(), invitation.getProject().getName());
    }

    /**
     * Declines a pending invitation.
     */
    @Transactional
    public void declineInvitation(UserPrincipal currentUser, UUID invitationId) {
        ProjectInvitation invitation = projectInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found: " + invitationId));

        if (!invitation.getEmail().equalsIgnoreCase(currentUser.getEmail()) && currentUser.getRole() != UserRole.ADMIN) {
            throw new ProjectAccessDeniedException("This invitation was sent to a different email address");
        }

        invitation.setStatus(InvitationStatus.DECLINED);
        projectInvitationRepository.save(invitation);
        log.info("User {} declined invitation for project {}", currentUser.getEmail(), invitation.getProject().getName());
    }

    /**
     * Validates that the current user has the required permission on the project.
     */
    public Project getProjectAndValidatePermission(UserPrincipal currentUser, UUID projectId, ProjectPermission permission) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + projectId));

        if (currentUser.getRole() == UserRole.ADMIN) {
            return project;
        }

        if (project.getOwner() != null && project.getOwner().getId().equals(currentUser.getId())) {
            return project;
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, currentUser.getId())
                .orElseThrow(() -> new ProjectAccessDeniedException("You do not have permission to access project: " + projectId));

        if (!member.getRole().hasPermission(permission)) {
            throw new ProjectAccessDeniedException("Your role (" + member.getRole() + ") does not grant permission: " + permission);
        }

        return project;
    }

    /**
     * Checks if current user is an active member or owner of the project.
     */
    public boolean hasProjectAccess(UserPrincipal currentUser, UUID projectId) {
        if (currentUser.getRole() == UserRole.ADMIN) {
            return true;
        }
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return false;
        }
        Project project = projectOpt.get();
        if (project.getOwner() != null && project.getOwner().getId().equals(currentUser.getId())) {
            return true;
        }
        return projectMemberRepository.existsByProjectIdAndUserId(projectId, currentUser.getId());
    }
}
