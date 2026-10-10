package com.example.deployintel.admin.service;

import com.example.deployintel.admin.dto.AdminKpiResponse;
import com.example.deployintel.admin.dto.AdminProjectResponse;
import com.example.deployintel.admin.dto.AdminUserResponse;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.common.exception.UserNotFoundException;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.entity.ProjectStatus;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.user.entity.AuthProvider;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.entity.UserStatus;
import com.example.deployintel.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private AdminService adminService;

    private UUID userId;
    private UUID projectId;
    private User testUser;
    private Project testProject;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testUser = User.createOAuth2User(
                "user@example.com",
                "John",
                "Doe",
                AuthProvider.LOCAL,
                null,
                null
        );
        testUser.setId(userId);
        testUser.setRole(UserRole.DEVELOPER);
        testUser.setStatus(UserStatus.ACTIVE);
    }

    // ─── User Tests ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllUsers should return mapped AdminUserResponse list")
    void getAllUsers_returnsMappedList() {
        when(userRepository.searchUsers(any(), any(), any())).thenReturn(List.of(testUser));
        when(projectRepository.countByOwnerId(userId)).thenReturn(3L);

        List<AdminUserResponse> result = adminService.getAllUsers(null, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).email()).isEqualTo("user@example.com");
        assertThat(result.get(0).status()).isEqualTo(UserStatus.ACTIVE);
        assertThat(result.get(0).projectCount()).isEqualTo(3L);
    }

    @Test
    @DisplayName("getUserById should throw UserNotFoundException when not found")
    void getUserById_notFound_throwsException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.getUserById(userId))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining(userId.toString());
    }

    @Test
    @DisplayName("blockUser should set status to BLOCKED")
    void blockUser_setsStatusBlocked() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(projectRepository.countByOwnerId(userId)).thenReturn(0L);

        AdminUserResponse result = adminService.blockUser(userId);

        assertThat(result.status()).isEqualTo(UserStatus.BLOCKED);
        verify(userRepository).save(argThat(u -> u.getStatus() == UserStatus.BLOCKED));
    }

    @Test
    @DisplayName("activateUser should set status to ACTIVE")
    void activateUser_setsStatusActive() {
        testUser.setStatus(UserStatus.BLOCKED);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(projectRepository.countByOwnerId(userId)).thenReturn(0L);

        AdminUserResponse result = adminService.activateUser(userId);

        assertThat(result.status()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("updateUserRole should change user role")
    void updateUserRole_changesRole() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(projectRepository.countByOwnerId(userId)).thenReturn(0L);

        AdminUserResponse result = adminService.updateUserRole(userId, UserRole.ADMIN);

        assertThat(result.role()).isEqualTo(UserRole.ADMIN);
    }

    // ─── Project Tests ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllProjects should return mapped AdminProjectResponse list")
    void getAllProjects_returnsMappedList() {
        testProject = Project.create("MyProject", "desc", "https://github.com/x/y", "main", "Java", testUser);
        testProject.setId(projectId);

        when(projectRepository.searchProjects(any(), any(), any(), any())).thenReturn(List.of(testProject));

        List<AdminProjectResponse> result = adminService.getAllProjects(null, null, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("MyProject");
        assertThat(result.get(0).language()).isEqualTo("Java");
        assertThat(result.get(0).ownerEmail()).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("archiveProject should set project status to ARCHIVED")
    void archiveProject_setsArchivedStatus() {
        testProject = Project.create("MyProject", "desc", "https://github.com/x/y", "main", "Java", testUser);
        testProject.setId(projectId);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminProjectResponse result = adminService.archiveProject(projectId);

        assertThat(result.status()).isEqualTo(ProjectStatus.ARCHIVED);
    }

    @Test
    @DisplayName("activateProject should set project status to ACTIVE")
    void activateProject_setsActiveStatus() {
        testProject = Project.create("MyProject", "desc", "https://github.com/x/y", "main", "Java", testUser);
        testProject.setId(projectId);
        testProject.setStatus(ProjectStatus.ARCHIVED);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminProjectResponse result = adminService.activateProject(projectId);

        assertThat(result.status()).isEqualTo(ProjectStatus.ACTIVE);
    }

    @Test
    @DisplayName("deleteProject should throw ProjectNotFoundException when not found")
    void deleteProject_notFound_throwsException() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.deleteProject(projectId))
                .isInstanceOf(ProjectNotFoundException.class)
                .hasMessageContaining(projectId.toString());
    }

    // ─── KPI Tests ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getKpis should return populated KPI response with correct counts")
    void getKpis_returnsPopulatedKpiResponse() {
        when(userRepository.count()).thenReturn(50L);
        when(userRepository.countByStatus(UserStatus.ACTIVE)).thenReturn(40L);
        when(userRepository.countByStatus(UserStatus.BLOCKED)).thenReturn(5L);
        when(userRepository.countByStatus(UserStatus.INACTIVE)).thenReturn(5L);
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(2L);
        when(userRepository.countByRole(UserRole.DEVELOPER)).thenReturn(48L);
        when(userRepository.countByGithubAccessTokenIsNotNull()).thenReturn(20L);
        when(userRepository.countByProvider(AuthProvider.LOCAL)).thenReturn(30L);
        when(userRepository.countByCreatedAtAfter(any(OffsetDateTime.class))).thenReturn(5L);

        when(projectRepository.count()).thenReturn(100L);
        when(projectRepository.countByStatus(ProjectStatus.ACTIVE)).thenReturn(80L);
        when(projectRepository.countByStatus(ProjectStatus.ARCHIVED)).thenReturn(20L);
        when(projectRepository.countByCreatedAtAfter(any(OffsetDateTime.class))).thenReturn(10L);
        List<Object[]> languageRows = new ArrayList<>();
        languageRows.add(new Object[]{"Java", 40L});
        languageRows.add(new Object[]{"Python", 30L});
        when(projectRepository.countProjectsByLanguage()).thenReturn(languageRows);
        List<Object[]> ownerRows = new ArrayList<>();
        ownerRows.add(new Object[]{userId, "user@example.com", "John", "Doe", 10L});
        when(projectRepository.findTopProjectOwners(any(Pageable.class))).thenReturn(ownerRows);

        AdminKpiResponse kpis = adminService.getKpis();

        assertThat(kpis).isNotNull();
        assertThat(kpis.userKpis().totalUsers()).isEqualTo(50L);
        assertThat(kpis.userKpis().activeUsers()).isEqualTo(40L);
        assertThat(kpis.userKpis().blockedUsers()).isEqualTo(5L);
        assertThat(kpis.userKpis().inactiveUsers()).isEqualTo(5L);
        assertThat(kpis.projectKpis().totalProjects()).isEqualTo(100L);
        assertThat(kpis.projectKpis().activeProjects()).isEqualTo(80L);
        assertThat(kpis.projectKpis().archivedProjects()).isEqualTo(20L);
        assertThat(kpis.projectKpis().projectsByLanguage()).containsEntry("Java", 40L);
        assertThat(kpis.projectKpis().averageProjectsPerUser()).isEqualTo(2.0);
        assertThat(kpis.overview().activeUsersRate()).isEqualTo(80.0);
        assertThat(kpis.topContributors()).hasSize(1);
        assertThat(kpis.topContributors().get(0).email()).isEqualTo("user@example.com");
        assertThat(kpis.topContributors().get(0).name()).isEqualTo("John Doe");
        assertThat(kpis.topContributors().get(0).projectCount()).isEqualTo(10L);
        assertThat(kpis.generatedAt()).isNotNull();
    }

    @Test
    @DisplayName("getKpis averageProjectsPerUser is 0 when no users")
    void getKpis_noUsers_zeroAverage() {
        when(userRepository.count()).thenReturn(0L);
        when(userRepository.countByStatus(any())).thenReturn(0L);
        when(userRepository.countByRole(any())).thenReturn(0L);
        when(userRepository.countByGithubAccessTokenIsNotNull()).thenReturn(0L);
        when(userRepository.countByProvider(any())).thenReturn(0L);
        when(userRepository.countByCreatedAtAfter(any())).thenReturn(0L);
        when(projectRepository.count()).thenReturn(0L);
        when(projectRepository.countByStatus(any())).thenReturn(0L);
        when(projectRepository.countByCreatedAtAfter(any())).thenReturn(0L);
        when(projectRepository.countProjectsByLanguage()).thenReturn(List.of());
        when(projectRepository.findTopProjectOwners(any())).thenReturn(List.of());

        AdminKpiResponse kpis = adminService.getKpis();

        assertThat(kpis.projectKpis().averageProjectsPerUser()).isEqualTo(0.0);
        assertThat(kpis.overview().activeUsersRate()).isEqualTo(0.0);
        assertThat(kpis.overview().activeProjectsRate()).isEqualTo(0.0);
        assertThat(kpis.topContributors()).isEmpty();
        assertThat(kpis.projectKpis().projectsByLanguage()).isEmpty();
    }
}
