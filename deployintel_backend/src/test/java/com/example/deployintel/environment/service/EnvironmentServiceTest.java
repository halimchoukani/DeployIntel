package com.example.deployintel.environment.service;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.DockerOperationException;
import com.example.deployintel.common.exception.ProjectAccessDeniedException;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.environment.dto.CommandExecutionResponse;
import com.example.deployintel.environment.dto.CreateEnvironmentRequest;
import com.example.deployintel.environment.dto.EnvironmentLogsResponse;
import com.example.deployintel.environment.dto.EnvironmentResponse;
import com.example.deployintel.environment.dto.ExecuteCommandRequest;
import com.example.deployintel.environment.entity.EnvironmentStatus;
import com.example.deployintel.environment.entity.TestEnvironment;
import com.example.deployintel.environment.repository.TestEnvironmentRepository;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnvironmentServiceTest {

    @Mock
    private TestEnvironmentRepository testEnvironmentRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private DockerService dockerService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private EnvironmentService environmentService;

    private User owner;
    private User otherUser;
    private UserPrincipal ownerPrincipal;
    private UserPrincipal otherPrincipal;
    private Project project;
    private UUID projectId;
    private UUID environmentId;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(UUID.randomUUID());
        owner.setEmail("alice@example.com");
        owner.setRole(UserRole.DEVELOPER);

        otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        otherUser.setEmail("bob@example.com");
        otherUser.setRole(UserRole.DEVELOPER);

        ownerPrincipal = new UserPrincipal(owner.getId(), owner.getEmail(), owner.getRole());
        otherPrincipal = new UserPrincipal(otherUser.getId(), otherUser.getEmail(), otherUser.getRole());

        projectId = UUID.randomUUID();
        project = Project.builder()
                .id(projectId)
                .name("DeployIntel API")
                .language("Java")
                .repositoryUrl("https://github.com/example/deployintel-api.git")
                .defaultBranch("main")
                .owner(owner)
                .build();

        environmentId = UUID.randomUUID();
    }

    @Test
    @DisplayName("createEnvironment successfully auto-detects Java image and starts container")
    void createEnvironment_AutoDetectsJavaImage_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(dockerService.isDockerAvailable()).thenReturn(true);
        when(dockerService.createAndStartContainer(any(), eq("maven:3.9-eclipse-temurin-17"), any(), any(), any(), any()))
                .thenReturn("container-12345");

        when(testEnvironmentRepository.save(any(TestEnvironment.class)))
                .thenAnswer(inv -> {
                    TestEnvironment env = inv.getArgument(0);
                    if (env.getId() == null) env.setId(environmentId);
                    return env;
                });

        CreateEnvironmentRequest request = new CreateEnvironmentRequest(
                "Java Test Container",
                null, // will auto-detect Java -> maven:3.9-eclipse-temurin-17
                8080,
                Map.of("TEST_VAR", "value123"),
                "/workspace",
                true
        );

        EnvironmentResponse response = environmentService.createEnvironment(ownerPrincipal, projectId, request);

        assertThat(response).isNotNull();
        assertThat(response.image()).isEqualTo("maven:3.9-eclipse-temurin-17");
        assertThat(response.containerId()).isEqualTo("container-12345");
        assertThat(response.status()).isEqualTo(EnvironmentStatus.RUNNING);
        verify(dockerService, times(1)).createAndStartContainer(any(), eq("maven:3.9-eclipse-temurin-17"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("createEnvironment throws DockerOperationException when Docker daemon is offline")
    void createEnvironment_DockerUnavailable_ThrowsException() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(dockerService.isDockerAvailable()).thenReturn(false);

        CreateEnvironmentRequest request = new CreateEnvironmentRequest(null, null, null, null, null, null);

        assertThatThrownBy(() -> environmentService.createEnvironment(ownerPrincipal, projectId, request))
                .isInstanceOf(DockerOperationException.class)
                .hasMessageContaining("Docker daemon is not available");

        verify(dockerService, never()).createAndStartContainer(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("createEnvironment denies access when user is not the project owner")
    void createEnvironment_NonOwner_AccessDenied() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        CreateEnvironmentRequest request = new CreateEnvironmentRequest(null, null, null, null, null, null);

        assertThatThrownBy(() -> environmentService.createEnvironment(otherPrincipal, projectId, request))
                .isInstanceOf(ProjectAccessDeniedException.class);
    }

    @Test
    @DisplayName("startEnvironment starts container and updates status to RUNNING")
    void startEnvironment_Success() {
        TestEnvironment env = TestEnvironment.create(project, "Test Env", "ubuntu:22.04", "container-name", null, "/workspace");
        env.setId(environmentId);
        env.setContainerId("container-123");
        env.setStatus(EnvironmentStatus.STOPPED);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)).thenReturn(Optional.of(env));
        when(testEnvironmentRepository.save(any(TestEnvironment.class))).thenAnswer(inv -> inv.getArgument(0));

        EnvironmentResponse response = environmentService.startEnvironment(ownerPrincipal, projectId, environmentId);

        assertThat(response.status()).isEqualTo(EnvironmentStatus.RUNNING);
        verify(dockerService, times(1)).startContainer("container-123");
    }

    @Test
    @DisplayName("stopEnvironment stops container and updates status to STOPPED")
    void stopEnvironment_Success() {
        TestEnvironment env = TestEnvironment.create(project, "Test Env", "ubuntu:22.04", "container-name", null, "/workspace");
        env.setId(environmentId);
        env.setContainerId("container-123");
        env.setStatus(EnvironmentStatus.RUNNING);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)).thenReturn(Optional.of(env));
        when(testEnvironmentRepository.save(any(TestEnvironment.class))).thenAnswer(inv -> inv.getArgument(0));

        EnvironmentResponse response = environmentService.stopEnvironment(ownerPrincipal, projectId, environmentId);

        assertThat(response.status()).isEqualTo(EnvironmentStatus.STOPPED);
        verify(dockerService, times(1)).stopContainer("container-123");
    }

    @Test
    @DisplayName("deleteEnvironment removes container and deletes environment entity")
    void deleteEnvironment_Success() {
        TestEnvironment env = TestEnvironment.create(project, "Test Env", "ubuntu:22.04", "container-name", null, "/workspace");
        env.setId(environmentId);
        env.setContainerId("container-123");

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)).thenReturn(Optional.of(env));

        environmentService.deleteEnvironment(ownerPrincipal, projectId, environmentId);

        verify(dockerService, times(1)).removeContainer("container-123");
        verify(testEnvironmentRepository, times(1)).delete(env);
    }

    @Test
    @DisplayName("executeCommand runs command inside container and returns output and exit code")
    void executeCommand_Success() {
        TestEnvironment env = TestEnvironment.create(project, "Test Env", "ubuntu:22.04", "container-name", null, "/workspace");
        env.setId(environmentId);
        env.setContainerId("container-123");

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)).thenReturn(Optional.of(env));
        when(dockerService.executeCommand("container-123", "mvn clean test", "/workspace"))
                .thenReturn(new CommandExecutionResponse(0, "BUILD SUCCESS", true));

        ExecuteCommandRequest req = new ExecuteCommandRequest("mvn clean test", "/workspace");
        CommandExecutionResponse resp = environmentService.executeCommand(ownerPrincipal, projectId, environmentId, req);

        assertThat(resp.exitCode()).isEqualTo(0);
        assertThat(resp.success()).isTrue();
        assertThat(resp.output()).contains("BUILD SUCCESS");
    }

    @Test
    @DisplayName("getEnvironmentLogs returns container logs")
    void getEnvironmentLogs_Success() {
        TestEnvironment env = TestEnvironment.create(project, "Test Env", "ubuntu:22.04", "container-name", null, "/workspace");
        env.setId(environmentId);
        env.setContainerId("container-123");

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)).thenReturn(Optional.of(env));
        when(dockerService.getContainerLogs("container-123", 50)).thenReturn("Line 1\nLine 2");

        EnvironmentLogsResponse logs = environmentService.getEnvironmentLogs(ownerPrincipal, projectId, environmentId, 50);

        assertThat(logs.logs()).isEqualTo("Line 1\nLine 2");
        assertThat(logs.containerId()).isEqualTo("container-123");
    }
}
