package com.example.deployintel.admin.controller;

import com.example.deployintel.admin.dto.*;
import com.example.deployintel.admin.service.AdminService;
import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.GlobalExceptionHandler;
import com.example.deployintel.project.entity.ProjectStatus;
import com.example.deployintel.user.dto.AssignRoleRequest;
import com.example.deployintel.user.entity.AuthProvider;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.entity.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .findAndRegisterModules()
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController adminController;

    private UUID userId;
    private UUID projectId;
    private AdminUserResponse adminUserResponse;
    private AdminProjectResponse adminProjectResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        userId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        adminUserResponse = new AdminUserResponse(
                userId,
                "user@example.com",
                "John",
                "Doe",
                "+1234567890",
                UserStatus.ACTIVE,
                UserRole.DEVELOPER,
                AuthProvider.LOCAL,
                null,
                false,
                3L,
                OffsetDateTime.now().minusDays(30),
                OffsetDateTime.now()
        );

        adminProjectResponse = new AdminProjectResponse(
                projectId,
                "Test Project",
                "A test project",
                "https://github.com/owner/repo",
                "main",
                "Java",
                ProjectStatus.ACTIVE,
                userId,
                "user@example.com",
                "John Doe",
                OffsetDateTime.now().minusDays(10),
                OffsetDateTime.now()
        );
    }

    // ─── User Management ──────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/admin/users should return list of users")
    void getAllUsers_returnsUserList() throws Exception {
        when(adminService.getAllUsers(any(), any(), any()))
                .thenReturn(List.of(adminUserResponse));

        mockMvc.perform(get("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(userId.toString()))
                .andExpect(jsonPath("$[0].email").value("user@example.com"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[0].role").value("DEVELOPER"))
                .andExpect(jsonPath("$[0].projectCount").value(3));
    }

    @Test
    @DisplayName("GET /api/v1/admin/users with filters should call service with params")
    void getAllUsers_withFilters() throws Exception {
        when(adminService.getAllUsers(eq("john"), eq(UserStatus.ACTIVE), eq(UserRole.DEVELOPER)))
                .thenReturn(List.of(adminUserResponse));

        mockMvc.perform(get("/api/v1/admin/users")
                        .param("search", "john")
                        .param("status", "ACTIVE")
                        .param("role", "DEVELOPER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/admin/users/{userId} should return user details")
    void getUserById_returnsUser() throws Exception {
        when(adminService.getUserById(userId)).thenReturn(adminUserResponse);

        mockMvc.perform(get("/api/v1/admin/users/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId.toString()))
                .andExpect(jsonPath("$.email").value("user@example.com"));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{userId}/block should block user")
    void blockUser_returnsBlockedUser() throws Exception {
        AdminUserResponse blockedUser = new AdminUserResponse(
                userId,
                "user@example.com",
                "John",
                "Doe",
                "+1234567890",
                UserStatus.BLOCKED,
                UserRole.DEVELOPER,
                AuthProvider.LOCAL,
                null,
                false,
                3L,
                OffsetDateTime.now().minusDays(30),
                OffsetDateTime.now()
        );

        when(adminService.blockUser(userId)).thenReturn(blockedUser);

        mockMvc.perform(patch("/api/v1/admin/users/{userId}/block", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("BLOCKED"));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{userId}/activate should activate user")
    void activateUser_returnsActiveUser() throws Exception {
        when(adminService.activateUser(userId)).thenReturn(adminUserResponse);

        mockMvc.perform(patch("/api/v1/admin/users/{userId}/activate", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{userId}/status should update user status")
    void updateUserStatus_updatesStatus() throws Exception {
        AdminUserResponse inactiveUser = new AdminUserResponse(
                userId,
                "user@example.com",
                "John",
                "Doe",
                "+1234567890",
                UserStatus.INACTIVE,
                UserRole.DEVELOPER,
                AuthProvider.LOCAL,
                null,
                false,
                3L,
                OffsetDateTime.now().minusDays(30),
                OffsetDateTime.now()
        );

        when(adminService.updateUserStatus(userId, UserStatus.INACTIVE)).thenReturn(inactiveUser);

        UpdateUserStatusRequest request = new UpdateUserStatusRequest(UserStatus.INACTIVE);

        mockMvc.perform(patch("/api/v1/admin/users/{userId}/status", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{userId}/role should update user role")
    void updateUserRole_updatesRole() throws Exception {
        AdminUserResponse adminUser = new AdminUserResponse(
                userId,
                "user@example.com",
                "John",
                "Doe",
                "+1234567890",
                UserStatus.ACTIVE,
                UserRole.ADMIN,
                AuthProvider.LOCAL,
                null,
                false,
                3L,
                OffsetDateTime.now().minusDays(30),
                OffsetDateTime.now()
        );

        when(adminService.updateUserRole(userId, UserRole.ADMIN)).thenReturn(adminUser);

        AssignRoleRequest request = new AssignRoleRequest(UserRole.ADMIN);

        mockMvc.perform(patch("/api/v1/admin/users/{userId}/role", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    // ─── Project Management ──────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/admin/projects should return list of projects")
    void getAllProjects_returnsProjectList() throws Exception {
        when(adminService.getAllProjects(any(), any(), any(), any()))
                .thenReturn(List.of(adminProjectResponse));

        mockMvc.perform(get("/api/v1/admin/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(projectId.toString()))
                .andExpect(jsonPath("$[0].name").value("Test Project"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[0].ownerEmail").value("user@example.com"));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/projects/{projectId}/archive should archive project")
    void archiveProject_returnsArchivedProject() throws Exception {
        AdminProjectResponse archivedProject = new AdminProjectResponse(
                projectId,
                "Test Project",
                "A test project",
                "https://github.com/owner/repo",
                "main",
                "Java",
                ProjectStatus.ARCHIVED,
                userId,
                "user@example.com",
                "John Doe",
                OffsetDateTime.now().minusDays(10),
                OffsetDateTime.now()
        );

        when(adminService.archiveProject(projectId)).thenReturn(archivedProject);

        mockMvc.perform(patch("/api/v1/admin/projects/{projectId}/archive", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/projects/{projectId}/activate should activate project")
    void activateProject_returnsActiveProject() throws Exception {
        when(adminService.activateProject(projectId)).thenReturn(adminProjectResponse);

        mockMvc.perform(patch("/api/v1/admin/projects/{projectId}/activate", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/projects/{projectId} should delete project")
    void deleteProject_returns204() throws Exception {
        doNothing().when(adminService).deleteProject(projectId);

        mockMvc.perform(delete("/api/v1/admin/projects/{projectId}", projectId))
                .andExpect(status().isNoContent());
    }

    // ─── KPI ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/admin/kpis should return KPI dashboard data")
    void getKpis_returnsKpiResponse() throws Exception {
        AdminKpiResponse kpis = new AdminKpiResponse(
                new AdminKpiResponse.UserKpis(50L, 40L, 5L, 5L, 2L, 48L, 20L, 30L, 5L, 15L),
                new AdminKpiResponse.ProjectKpis(100L, 80L, 20L, 8L, 25L, 2.0, Map.of("Java", 40L, "Python", 30L)),
                new AdminKpiResponse.PlatformOverview(50L, 100L, 80.0, 80.0),
                List.of(new AdminKpiResponse.TopContributor(userId, "user@example.com", "John Doe", 10L)),
                OffsetDateTime.now()
        );

        when(adminService.getKpis()).thenReturn(kpis);

        mockMvc.perform(get("/api/v1/admin/kpis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userKpis.totalUsers").value(50))
                .andExpect(jsonPath("$.userKpis.activeUsers").value(40))
                .andExpect(jsonPath("$.userKpis.blockedUsers").value(5))
                .andExpect(jsonPath("$.projectKpis.totalProjects").value(100))
                .andExpect(jsonPath("$.projectKpis.activeProjects").value(80))
                .andExpect(jsonPath("$.projectKpis.archivedProjects").value(20))
                .andExpect(jsonPath("$.projectKpis.projectsByLanguage.Java").value(40))
                .andExpect(jsonPath("$.overview.activeUsersRate").value(80.0))
                .andExpect(jsonPath("$.topContributors.length()").value(1))
                .andExpect(jsonPath("$.topContributors[0].email").value("user@example.com"))
                .andExpect(jsonPath("$.topContributors[0].projectCount").value(10));
    }

    @Test
    @DisplayName("GET /api/v1/admin/kpi should also return KPI (alias)")
    void getKpi_alias_returnsKpiResponse() throws Exception {
        AdminKpiResponse kpis = new AdminKpiResponse(
                new AdminKpiResponse.UserKpis(10L, 8L, 1L, 1L, 1L, 9L, 3L, 7L, 1L, 3L),
                new AdminKpiResponse.ProjectKpis(20L, 15L, 5L, 2L, 6L, 2.0, Map.of()),
                new AdminKpiResponse.PlatformOverview(10L, 20L, 80.0, 75.0),
                List.of(),
                OffsetDateTime.now()
        );

        when(adminService.getKpis()).thenReturn(kpis);

        mockMvc.perform(get("/api/v1/admin/kpi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userKpis.totalUsers").value(10));
    }
}
