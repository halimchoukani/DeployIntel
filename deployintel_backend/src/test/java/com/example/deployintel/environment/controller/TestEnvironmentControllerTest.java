package com.example.deployintel.environment.controller;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.GlobalExceptionHandler;
import com.example.deployintel.environment.dto.*;
import com.example.deployintel.environment.entity.EnvironmentStatus;
import com.example.deployintel.environment.service.EnvironmentService;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TestEnvironmentControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private EnvironmentService environmentService;

    @InjectMocks
    private TestEnvironmentController testEnvironmentController;

    private UserPrincipal principal;
    private Authentication authentication;
    private UUID projectId;
    private UUID environmentId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(testEnvironmentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        UUID userId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        environmentId = UUID.randomUUID();

        principal = new UserPrincipal(userId, "dev@example.com", UserRole.DEVELOPER);
        authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    @DisplayName("POST /api/v1/projects/{projectId}/environments creates test environment")
    void testCreateEnvironment() throws Exception {
        EnvironmentResponse response = new EnvironmentResponse(
                environmentId,
                projectId,
                "Test Env",
                "container-abc",
                "deployintel-test-123",
                "maven:3.9-eclipse-temurin-17",
                EnvironmentStatus.RUNNING,
                null,
                null,
                "/workspace",
                null,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(environmentService.createEnvironment(any(), eq(projectId), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/projects/{projectId}/environments", projectId)
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(environmentId.toString()))
                .andExpect(jsonPath("$.containerId").value("container-abc"))
                .andExpect(jsonPath("$.status").value("RUNNING"));
    }

    @Test
    @DisplayName("GET /api/v1/projects/{projectId}/environments returns list of environments")
    void testGetEnvironments() throws Exception {
        EnvironmentResponse response = new EnvironmentResponse(
                environmentId,
                projectId,
                "Test Env",
                "container-abc",
                "deployintel-test-123",
                "maven:3.9-eclipse-temurin-17",
                EnvironmentStatus.RUNNING,
                null,
                null,
                "/workspace",
                null,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(environmentService.getEnvironmentsByProject(any(), eq(projectId)))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/projects/{projectId}/environments", projectId)
                        .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(environmentId.toString()));
    }

    @Test
    @DisplayName("POST /api/v1/projects/{projectId}/environments/{environmentId}/exec executes command")
    void testExecuteCommand() throws Exception {
        CommandExecutionResponse response = new CommandExecutionResponse(0, "BUILD SUCCESS", true);

        when(environmentService.executeCommand(any(), eq(projectId), eq(environmentId), any()))
                .thenReturn(response);

        ExecuteCommandRequest req = new ExecuteCommandRequest("mvn clean test", "/workspace");

        mockMvc.perform(post("/api/v1/projects/{projectId}/environments/{environmentId}/exec", projectId, environmentId)
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exitCode").value(0))
                .andExpect(jsonPath("$.output").value("BUILD SUCCESS"))
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /api/v1/projects/{projectId}/environments/{environmentId}/logs fetches logs")
    void testGetLogs() throws Exception {
        EnvironmentLogsResponse response = new EnvironmentLogsResponse(environmentId, "container-abc", "log output");

        when(environmentService.getEnvironmentLogs(any(), eq(projectId), eq(environmentId), eq(50)))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/projects/{projectId}/environments/{environmentId}/logs", projectId, environmentId)
                        .principal(authentication)
                        .param("tail", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logs").value("log output"));
    }

    @Test
    @DisplayName("DELETE /api/v1/projects/{projectId}/environments/{environmentId} deletes environment")
    void testDeleteEnvironment() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/{projectId}/environments/{environmentId}", projectId, environmentId)
                        .principal(authentication))
                .andExpect(status().isNoContent());

        verify(environmentService).deleteEnvironment(any(), eq(projectId), eq(environmentId));
    }
}
