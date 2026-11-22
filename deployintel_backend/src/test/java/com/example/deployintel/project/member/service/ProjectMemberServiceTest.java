package com.example.deployintel.project.member.service;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.ProjectAccessDeniedException;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.member.dto.InviteMemberRequest;
import com.example.deployintel.project.member.dto.ProjectMemberResponse;
import com.example.deployintel.project.member.dto.UpdateMemberRoleRequest;
import com.example.deployintel.project.member.entity.InvitationStatus;
import com.example.deployintel.project.member.entity.ProjectInvitation;
import com.example.deployintel.project.member.entity.ProjectMember;
import com.example.deployintel.project.member.entity.ProjectRole;
import com.example.deployintel.project.member.repository.ProjectInvitationRepository;
import com.example.deployintel.project.member.repository.ProjectMemberRepository;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProjectMemberServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ProjectInvitationRepository projectInvitationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectMemberService projectMemberService;

    private User owner;
    private User collaborator;
    private User nonMember;
    private UserPrincipal ownerPrincipal;
    private UserPrincipal nonMemberPrincipal;
    private Project project;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();

        owner = new User();
        owner.setId(UUID.randomUUID());
        owner.setEmail("owner@deployintel.io");
        owner.setFirstName("Alice");
        owner.setLastName("Owner");
        owner.setRole(UserRole.DEVELOPER);

        collaborator = new User();
        collaborator.setId(UUID.randomUUID());
        collaborator.setEmail("collab@deployintel.io");
        collaborator.setFirstName("Bob");
        collaborator.setLastName("Builder");
        collaborator.setRole(UserRole.DEVELOPER);

        nonMember = new User();
        nonMember.setId(UUID.randomUUID());
        nonMember.setEmail("stranger@deployintel.io");
        nonMember.setFirstName("Charlie");
        nonMember.setLastName("Stranger");
        nonMember.setRole(UserRole.DEVELOPER);

        ownerPrincipal = new UserPrincipal(owner.getId(), owner.getEmail(), owner.getRole());
        nonMemberPrincipal = new UserPrincipal(nonMember.getId(), nonMember.getEmail(), nonMember.getRole());

        project = Project.builder()
                .id(projectId)
                .name("Alpha Service")
                .owner(owner)
                .build();

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
    }

    @Test
    @DisplayName("getProjectMembers should return all project members when caller is owner")
    void testGetProjectMembersSuccess() {
        ProjectMember ownerMember = ProjectMember.create(project, owner, ProjectRole.OWNER);
        ProjectMember collabMember = ProjectMember.create(project, collaborator, ProjectRole.DEVELOPER);

        when(projectMemberRepository.findByProjectIdWithUser(projectId))
                .thenReturn(List.of(ownerMember, collabMember));

        List<ProjectMemberResponse> responses = projectMemberService.getProjectMembers(ownerPrincipal, projectId);

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getEmail()).isEqualTo("owner@deployintel.io");
        assertThat(responses.get(0).getRole()).isEqualTo(ProjectRole.OWNER);
        assertThat(responses.get(1).getEmail()).isEqualTo("collab@deployintel.io");
        assertThat(responses.get(1).getRole()).isEqualTo(ProjectRole.DEVELOPER);
    }

    @Test
    @DisplayName("getProjectMembers should throw ProjectAccessDeniedException when caller is not a member")
    void testGetProjectMembersDenied() {
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, nonMember.getId()))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectMemberService.getProjectMembers(nonMemberPrincipal, projectId))
                .isInstanceOf(ProjectAccessDeniedException.class);
    }

    @Test
    @DisplayName("inviteOrAddMember should directly add member if user already exists")
    void testInviteOrAddMemberExistingUser() {
        when(userRepository.findByEmailIgnoreCase("collab@deployintel.io")).thenReturn(Optional.of(collaborator));
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, collaborator.getId())).thenReturn(false);
        when(projectMemberRepository.save(any(ProjectMember.class)))
                .thenAnswer(inv -> {
                    ProjectMember pm = inv.getArgument(0);
                    pm.setId(UUID.randomUUID());
                    return pm;
                });

        InviteMemberRequest request = new InviteMemberRequest("collab@deployintel.io", ProjectRole.MAINTAINER);
        ProjectMemberResponse response = projectMemberService.inviteOrAddMember(ownerPrincipal, projectId, request);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("collab@deployintel.io");
        assertThat(response.getRole()).isEqualTo(ProjectRole.MAINTAINER);
        verify(projectMemberRepository, times(1)).save(any(ProjectMember.class));
    }

    @Test
    @DisplayName("inviteOrAddMember should create invitation if user does not exist yet")
    void testInviteOrAddMemberNewUserCreatesInvitation() {
        when(userRepository.findByEmailIgnoreCase("newuser@deployintel.io")).thenReturn(Optional.empty());
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectInvitationRepository.findByProjectIdAndEmailIgnoreCaseAndStatus(eq(projectId), eq("newuser@deployintel.io"), eq(InvitationStatus.PENDING)))
                .thenReturn(Optional.empty());
        when(projectInvitationRepository.save(any(ProjectInvitation.class)))
                .thenAnswer(inv -> {
                    ProjectInvitation pi = inv.getArgument(0);
                    pi.setId(UUID.randomUUID());
                    return pi;
                });

        InviteMemberRequest request = new InviteMemberRequest("newuser@deployintel.io", ProjectRole.DEVELOPER);
        ProjectMemberResponse response = projectMemberService.inviteOrAddMember(ownerPrincipal, projectId, request);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("newuser@deployintel.io");
        assertThat(response.getFullName()).contains("Pending");
        verify(projectInvitationRepository, times(1)).save(any(ProjectInvitation.class));
    }

    @Test
    @DisplayName("updateMemberRole should update member role successfully")
    void testUpdateMemberRoleSuccess() {
        UUID memberId = UUID.randomUUID();
        ProjectMember collabMember = ProjectMember.create(project, collaborator, ProjectRole.DEVELOPER);
        collabMember.setId(memberId);

        when(projectMemberRepository.findById(memberId)).thenReturn(Optional.of(collabMember));
        when(projectMemberRepository.save(any(ProjectMember.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.MAINTAINER);
        ProjectMemberResponse response = projectMemberService.updateMemberRole(ownerPrincipal, projectId, memberId, request);

        assertThat(response.getRole()).isEqualTo(ProjectRole.MAINTAINER);
        verify(projectMemberRepository).save(collabMember);
    }

    @Test
    @DisplayName("updateMemberRole should reject changing role of primary owner")
    void testUpdateMemberRoleOwnerRejected() {
        UUID ownerMemberId = UUID.randomUUID();
        ProjectMember ownerMember = ProjectMember.create(project, owner, ProjectRole.OWNER);
        ownerMember.setId(ownerMemberId);

        when(projectMemberRepository.findById(ownerMemberId)).thenReturn(Optional.of(ownerMember));

        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.DEVELOPER);

        assertThatThrownBy(() -> projectMemberService.updateMemberRole(ownerPrincipal, projectId, ownerMemberId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot change the role of the primary project owner");
    }

    @Test
    @DisplayName("removeMember should reject removing primary owner")
    void testRemoveMemberOwnerRejected() {
        UUID ownerMemberId = UUID.randomUUID();
        ProjectMember ownerMember = ProjectMember.create(project, owner, ProjectRole.OWNER);
        ownerMember.setId(ownerMemberId);

        when(projectMemberRepository.findById(ownerMemberId)).thenReturn(Optional.of(ownerMember));

        assertThatThrownBy(() -> projectMemberService.removeMember(ownerPrincipal, projectId, ownerMemberId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot remove the primary project owner");
    }

    @Test
    @DisplayName("removeMember should remove collaborator successfully")
    void testRemoveMemberSuccess() {
        UUID memberId = UUID.randomUUID();
        ProjectMember collabMember = ProjectMember.create(project, collaborator, ProjectRole.DEVELOPER);
        collabMember.setId(memberId);

        when(projectMemberRepository.findById(memberId)).thenReturn(Optional.of(collabMember));

        projectMemberService.removeMember(ownerPrincipal, projectId, memberId);

        verify(projectMemberRepository, times(1)).delete(collabMember);
    }
}
