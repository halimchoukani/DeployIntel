package com.example.deployintel.project.member.controller;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.project.member.dto.InviteMemberRequest;
import com.example.deployintel.project.member.dto.ProjectInvitationResponse;
import com.example.deployintel.project.member.dto.ProjectMemberResponse;
import com.example.deployintel.project.member.dto.UpdateMemberRoleRequest;
import com.example.deployintel.project.member.service.ProjectMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    /**
     * Lists all members of a project.
     */
    @GetMapping("/api/v1/projects/{projectId}/members")
    public ResponseEntity<List<ProjectMemberResponse>> getMembers(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(projectMemberService.getProjectMembers(principal, projectId));
    }

    /**
     * Invites a new member or adds them directly if user account exists.
     */
    @PostMapping("/api/v1/projects/{projectId}/members")
    public ResponseEntity<ProjectMemberResponse> inviteOrAddMember(
            Authentication authentication,
            @PathVariable UUID projectId,
            @Valid @RequestBody InviteMemberRequest request
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        ProjectMemberResponse response = projectMemberService.inviteOrAddMember(principal, projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Updates an existing member's role and permissions.
     */
    @PatchMapping("/api/v1/projects/{projectId}/members/{memberId}")
    public ResponseEntity<ProjectMemberResponse> updateMemberRole(
            Authentication authentication,
            @PathVariable UUID projectId,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRoleRequest request
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(projectMemberService.updateMemberRole(principal, projectId, memberId, request));
    }

    /**
     * Removes a member from the project.
     */
    @DeleteMapping("/api/v1/projects/{projectId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            Authentication authentication,
            @PathVariable UUID projectId,
            @PathVariable UUID memberId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        projectMemberService.removeMember(principal, projectId, memberId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Allows the current authenticated user to leave a project.
     */
    @PostMapping("/api/v1/projects/{projectId}/members/leave")
    public ResponseEntity<Void> leaveProject(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        projectMemberService.leaveProject(principal, projectId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lists pending invitations for a project.
     */
    @GetMapping("/api/v1/projects/{projectId}/invitations")
    public ResponseEntity<List<ProjectInvitationResponse>> getInvitations(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(projectMemberService.getProjectInvitations(principal, projectId));
    }

    /**
     * Revokes a pending invitation.
     */
    @DeleteMapping("/api/v1/projects/{projectId}/invitations/{invitationId}")
    public ResponseEntity<Void> revokeInvitation(
            Authentication authentication,
            @PathVariable UUID projectId,
            @PathVariable UUID invitationId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        projectMemberService.revokeInvitation(principal, projectId, invitationId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lists pending invitations for the current user across all projects.
     */
    @GetMapping("/api/v1/invitations/pending")
    public ResponseEntity<List<ProjectInvitationResponse>> getMyPendingInvitations(
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(projectMemberService.getMyPendingInvitations(principal));
    }

    /**
     * Accepts a project invitation.
     */
    @PostMapping("/api/v1/invitations/{invitationId}/accept")
    public ResponseEntity<Void> acceptInvitation(
            Authentication authentication,
            @PathVariable UUID invitationId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        projectMemberService.acceptInvitation(principal, invitationId);
        return ResponseEntity.ok().build();
    }

    /**
     * Declines a project invitation.
     */
    @PostMapping("/api/v1/invitations/{invitationId}/decline")
    public ResponseEntity<Void> declineInvitation(
            Authentication authentication,
            @PathVariable UUID invitationId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        projectMemberService.declineInvitation(principal, invitationId);
        return ResponseEntity.ok().build();
    }
}
