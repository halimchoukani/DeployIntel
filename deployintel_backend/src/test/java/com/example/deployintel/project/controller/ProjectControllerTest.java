package com.example.deployintel.project.controller;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.GlobalExceptionHandler;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.project.dto.*;
import com.example.deployintel.project.entity.ProjectStatus;
import com.example.deployintel.project.service.ProjectService;
import com.example.deployintel.user.entity.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProjectControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private ProjectController projectController;

    private UserPrincipal principal;
    private Authentication authentication;
    private UUID projectId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(projectController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        userId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        principal = new UserPrincipal(userId, "user@example.com", UserRole.DEVELOPER);
        authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    @DisplayName("POST /api/v1/projects creates project and returns 201 Created")
    void testCreateProject() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "DeployIntel",
                "Observability dashboard",
                "https://github.com/halimchoukani/deployintel.git",
                "main",
                "TypeScript"
        );

        ProjectResponse response = new ProjectResponse(
                projectId,
                "DeployIntel",
                "Observability dashboard",
                "https://github.com/halimchoukani/deployintel.git",
                "main",
                "TypeScript",
                userId,
                ProjectStatus.ACTIVE,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(projectService.createProject(eq(userId), any(CreateProjectRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/projects")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(projectId.toString()))
                .andExpect(jsonPath("$.name").value("DeployIntel"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.ownerId").value(userId.toString()));
    }

    @Test
    @DisplayName("PUT /api/v1/projects/{id} updates project and returns 200 OK")
    void testUpdateProject() throws Exception {
        UpdateProjectRequest request = new UpdateProjectRequest(
                "DeployIntel Updated",
                "New description",
                "https://github.com/halimchoukani/deployintel.git",
                "develop",
                "Go",
                ProjectStatus.ACTIVE
        );

        ProjectResponse response = new ProjectResponse(
                projectId,
                "DeployIntel Updated",
                "New description",
                "https://github.com/halimchoukani/deployintel.git",
                "develop",
                "Go",
                userId,
                ProjectStatus.ACTIVE,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(projectService.updateProject(eq(principal), eq(projectId), any(UpdateProjectRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/projects/" + projectId)
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("DeployIntel Updated"))
                .andExpect(jsonPath("$.language").value("Go"));
    }

    @Test
    @DisplayName("GET /api/v1/projects/{id} returns 200 OK")
    void testGetProject() throws Exception {
        ProjectResponse response = new ProjectResponse(
                projectId,
                "DeployIntel",
                "Desc",
                "https://github.com/test/repo.git",
                "main",
                "Java",
                userId,
                ProjectStatus.ACTIVE,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(projectService.getProjectById(eq(principal), eq(projectId))).thenReturn(response);

        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId.toString()))
                .andExpect(jsonPath("$.name").value("DeployIntel"));
    }

    @Test
    @DisplayName("GET /api/v1/projects/{id} returns 404 when project not found")
    void testGetProjectNotFound() throws Exception {
        when(projectService.getProjectById(eq(principal), eq(projectId)))
                .thenThrow(new ProjectNotFoundException("Project not found with id: " + projectId));

        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .principal(authentication))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /api/v1/projects returns list of projects")
    void testGetUserProjects() throws Exception {
        ProjectResponse response = new ProjectResponse(
                projectId,
                "DeployIntel",
                "Desc",
                "https://github.com/test/repo.git",
                "main",
                "Java",
                userId,
                ProjectStatus.ACTIVE,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(projectService.getUserProjects(userId, null)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/projects")
                        .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("DeployIntel"));
    }

    @Test
    @DisplayName("PATCH /api/v1/projects/{id}/archive returns archived project")
    void testArchiveProject() throws Exception {
        ProjectResponse response = new ProjectResponse(
                projectId,
                "DeployIntel",
                "Desc",
                "https://github.com/test/repo.git",
                "main",
                "Java",
                userId,
                ProjectStatus.ARCHIVED,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(projectService.archiveProject(principal, projectId)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/projects/" + projectId + "/archive")
                        .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));
    }

    @Test
    @DisplayName("DELETE /api/v1/projects/{id} returns 204 No Content")
    void testDeleteProject() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/" + projectId)
                        .principal(authentication))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("POST /api/v1/projects/github creates project from GitHub repository")
    void testCreateProjectFromGithub() throws Exception {
        CreateProjectFromGithubRequest request = new CreateProjectFromGithubRequest(
                "halim/deployintel",
                null,
                null,
                null,
                null
        );

        ProjectResponse response = new ProjectResponse(
                projectId,
                "deployintel",
                "Observability system",
                "https://github.com/halim/deployintel.git",
                "main",
                "TypeScript",
                userId,
                ProjectStatus.ACTIVE,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(projectService.createProjectFromGithub(eq(userId), any(CreateProjectFromGithubRequest.class), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/projects/github")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(projectId.toString()))
                .andExpect(jsonPath("$.name").value("deployintel"))
                .andExpect(jsonPath("$.repositoryUrl").value("https://github.com/halim/deployintel.git"));
    }

    @Test
    @DisplayName("GET /api/v1/projects/github/repositories returns user's GitHub repos")
    void testGetGithubRepositories() throws Exception {
        GithubRepoResponse repo = new GithubRepoResponse(
                101L,
                "deployintel",
                "halim/deployintel",
                "Observability",
                "https://github.com/halim/deployintel",
                "https://github.com/halim/deployintel.git",
                "main",
                "Java",
                false,
                null
        );

        when(projectService.getUserGithubRepositories(eq(userId), any()))
                .thenReturn(List.of(repo));

        mockMvc.perform(get("/api/v1/projects/github/repositories")
                        .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("deployintel"))
                .andExpect(jsonPath("$[0].fullName").value("halim/deployintel"));
    }

    @Test
    @DisplayName("GET /api/v1/projects/github/repository returns repo metadata")
    void testGetGithubRepositoryDetails() throws Exception {
        GithubRepoResponse repo = new GithubRepoResponse(
                101L,
                "deployintel",
                "halim/deployintel",
                "Observability",
                "https://github.com/halim/deployintel",
                "https://github.com/halim/deployintel.git",
                "main",
                "Java",
                false,
                null
        );

        when(projectService.getGithubRepositoryDetails(eq(userId), eq("halim/deployintel"), any()))
                .thenReturn(repo);

        mockMvc.perform(get("/api/v1/projects/github/repository")
                        .principal(authentication)
                        .param("url", "halim/deployintel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("deployintel"));
    }
}
