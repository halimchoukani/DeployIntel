package com.example.deployintel.environment.service;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.DockerOperationException;
import com.example.deployintel.common.exception.EnvironmentNotFoundException;
import com.example.deployintel.common.exception.ProjectAccessDeniedException;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.environment.dto.*;
import com.example.deployintel.environment.entity.EnvironmentStatus;
import com.example.deployintel.environment.entity.TestEnvironment;
import com.example.deployintel.environment.repository.TestEnvironmentRepository;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.user.entity.UserRole;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnvironmentService {

    private final TestEnvironmentRepository testEnvironmentRepository;
    private final ProjectRepository projectRepository;
    private final DockerService dockerService;
    private final ObjectMapper objectMapper;

    @Transactional
    public EnvironmentResponse createEnvironment(
            UserPrincipal currentUser,
            UUID projectId,
            CreateEnvironmentRequest request
    ) {
        Project project = getProjectAndValidateAccess(currentUser, projectId);

        if (!dockerService.isDockerAvailable()) {
            throw new DockerOperationException("Docker daemon is not available. Please verify Docker is running on the host system.");
        }

        String image = resolveDockerImage(request.image(), project.getLanguage());
        String workspacePath = (request.workspacePath() != null && !request.workspacePath().isBlank())
                ? request.workspacePath().trim()
                : "/workspace";

        String sanitizedProjectName = project.getName().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "-");
        String containerName = "deployintel-test-" + sanitizedProjectName + "-" + UUID.randomUUID().toString().substring(0, 8);

        String envVarsJson = null;
        if (request.environmentVariables() != null && !request.environmentVariables().isEmpty()) {
            try {
                envVarsJson = objectMapper.writeValueAsString(request.environmentVariables());
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize environment variables: {}", e.getMessage());
            }
        }

        TestEnvironment environment = TestEnvironment.create(
                project,
                request.name(),
                image,
                containerName,
                envVarsJson,
                workspacePath
        );

        Integer hostPort = null;
        Integer containerPort = null;
        if (request.port() != null && request.port() > 0) {
            containerPort = request.port();
            // Automatically select an available ephemeral port or use requested port
            hostPort = request.port();
            environment.setPortMapping(hostPort + ":" + containerPort);
        }

        TestEnvironment savedEnvironment = testEnvironmentRepository.save(environment);

        try {
            String containerId = dockerService.createAndStartContainer(
                    containerName,
                    image,
                    workspacePath,
                    request.environmentVariables(),
                    hostPort,
                    containerPort
            );

            savedEnvironment.setContainerId(containerId);
            savedEnvironment.setStatus(EnvironmentStatus.RUNNING);
            savedEnvironment.setUpdatedAt(OffsetDateTime.now());

            boolean shouldAutoClone = request.autoClone() == null || Boolean.TRUE.equals(request.autoClone());
            if (shouldAutoClone && project.getRepositoryUrl() != null && !project.getRepositoryUrl().isBlank()) {
                setupProjectWorkspace(containerId, project, workspacePath);
            }

            savedEnvironment = testEnvironmentRepository.save(savedEnvironment);
            log.info("Test environment container initialized successfully: {}", containerId);
            return EnvironmentResponse.fromEntity(savedEnvironment);

        } catch (Exception e) {
            log.error("Failed to provision Docker test environment: {}", e.getMessage(), e);
            savedEnvironment.setStatus(EnvironmentStatus.FAILED);
            savedEnvironment.setErrorMessage(e.getMessage());
            savedEnvironment.setUpdatedAt(OffsetDateTime.now());
            testEnvironmentRepository.save(savedEnvironment);
            throw new DockerOperationException("Failed to launch Docker container: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<EnvironmentResponse> getEnvironmentsByProject(UserPrincipal currentUser, UUID projectId) {
        getProjectAndValidateAccess(currentUser, projectId);
        List<TestEnvironment> environments = testEnvironmentRepository.findByProjectIdOrderByCreatedAtDesc(projectId);

        boolean dockerRunning = dockerService.isDockerAvailable();
        if (dockerRunning) {
            for (TestEnvironment env : environments) {
                if (env.getContainerId() != null && env.getStatus() != EnvironmentStatus.TERMINATED) {
                    EnvironmentStatus liveStatus = dockerService.getContainerStatus(env.getContainerId());
                    if (liveStatus != env.getStatus() && liveStatus != EnvironmentStatus.FAILED) {
                        env.setStatus(liveStatus);
                    }
                }
            }
        }

        return environments.stream()
                .map(EnvironmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public EnvironmentResponse getEnvironmentById(UserPrincipal currentUser, UUID projectId, UUID environmentId) {
        getProjectAndValidateAccess(currentUser, projectId);
        TestEnvironment environment = testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)
                .orElseThrow(() -> new EnvironmentNotFoundException("Test environment not found with id: " + environmentId));

        if (environment.getContainerId() != null && dockerService.isDockerAvailable()) {
            EnvironmentStatus liveStatus = dockerService.getContainerStatus(environment.getContainerId());
            if (liveStatus != environment.getStatus() && liveStatus != EnvironmentStatus.FAILED) {
                environment.setStatus(liveStatus);
            }
        }

        return EnvironmentResponse.fromEntity(environment);
    }

    @Transactional
    public EnvironmentResponse startEnvironment(UserPrincipal currentUser, UUID projectId, UUID environmentId) {
        getProjectAndValidateAccess(currentUser, projectId);
        TestEnvironment environment = testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)
                .orElseThrow(() -> new EnvironmentNotFoundException("Test environment not found with id: " + environmentId));

        if (environment.getContainerId() == null) {
            throw new DockerOperationException("No associated Docker container for environment: " + environmentId);
        }

        dockerService.startContainer(environment.getContainerId());
        environment.setStatus(EnvironmentStatus.RUNNING);
        environment.setUpdatedAt(OffsetDateTime.now());

        return EnvironmentResponse.fromEntity(testEnvironmentRepository.save(environment));
    }

    @Transactional
    public EnvironmentResponse stopEnvironment(UserPrincipal currentUser, UUID projectId, UUID environmentId) {
        getProjectAndValidateAccess(currentUser, projectId);
        TestEnvironment environment = testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)
                .orElseThrow(() -> new EnvironmentNotFoundException("Test environment not found with id: " + environmentId));

        if (environment.getContainerId() != null) {
            dockerService.stopContainer(environment.getContainerId());
        }

        environment.setStatus(EnvironmentStatus.STOPPED);
        environment.setUpdatedAt(OffsetDateTime.now());

        return EnvironmentResponse.fromEntity(testEnvironmentRepository.save(environment));
    }

    @Transactional
    public void deleteEnvironment(UserPrincipal currentUser, UUID projectId, UUID environmentId) {
        getProjectAndValidateAccess(currentUser, projectId);
        TestEnvironment environment = testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)
                .orElseThrow(() -> new EnvironmentNotFoundException("Test environment not found with id: " + environmentId));

        if (environment.getContainerId() != null) {
            dockerService.removeContainer(environment.getContainerId());
        }

        testEnvironmentRepository.delete(environment);
        log.info("Deleted test environment {} for project {}", environmentId, projectId);
    }

    public EnvironmentLogsResponse getEnvironmentLogs(
            UserPrincipal currentUser,
            UUID projectId,
            UUID environmentId,
            int tailLines
    ) {
        getProjectAndValidateAccess(currentUser, projectId);
        TestEnvironment environment = testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)
                .orElseThrow(() -> new EnvironmentNotFoundException("Test environment not found with id: " + environmentId));

        if (environment.getContainerId() == null) {
            throw new DockerOperationException("Container ID is missing for environment: " + environmentId);
        }

        String logs = dockerService.getContainerLogs(environment.getContainerId(), tailLines);
        return new EnvironmentLogsResponse(environmentId, environment.getContainerId(), logs);
    }

    public CommandExecutionResponse executeCommand(
            UserPrincipal currentUser,
            UUID projectId,
            UUID environmentId,
            ExecuteCommandRequest request
    ) {
        getProjectAndValidateAccess(currentUser, projectId);
        TestEnvironment environment = testEnvironmentRepository.findByIdAndProjectId(environmentId, projectId)
                .orElseThrow(() -> new EnvironmentNotFoundException("Test environment not found with id: " + environmentId));

        if (environment.getContainerId() == null) {
            throw new DockerOperationException("Container ID is missing for environment: " + environmentId);
        }

        String targetWorkingDir = (request.workingDir() != null && !request.workingDir().isBlank())
                ? request.workingDir()
                : environment.getWorkspacePath();

        return dockerService.executeCommand(environment.getContainerId(), request.command(), targetWorkingDir);
    }

    public DockerDaemonInfoResponse getDockerStatus() {
        return dockerService.getDockerInfo();
    }

    private void setupProjectWorkspace(String containerId, Project project, String workspacePath) {
        try {
            String repoUrl = project.getRepositoryUrl();
            String branch = project.getDefaultBranch() != null ? project.getDefaultBranch() : "main";

            String cloneCommand = "if command -v git >/dev/null 2>&1; then " +
                    "git clone --depth 1 -b " + branch + " " + repoUrl + " " + workspacePath + " || true; " +
                    "fi";

            dockerService.executeCommand(containerId, cloneCommand, "/");
        } catch (Exception e) {
            log.warn("Could not pre-clone project repository into container: {}", e.getMessage());
        }
    }

    private String resolveDockerImage(String requestedImage, String language) {
        if (requestedImage != null && !requestedImage.isBlank()) {
            return requestedImage.trim();
        }

        if (language == null || language.isBlank()) {
            return "ubuntu:22.04";
        }

        String normalized = language.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "java" -> "maven:3.9-eclipse-temurin-17";
            case "python" -> "python:3.11-slim";
            case "javascript", "typescript", "node", "nodejs" -> "node:20-alpine";
            case "golang", "go" -> "golang:1.22-alpine";
            case "rust" -> "rust:1.75-slim";
            case "php" -> "php:8.3-cli";
            case "ruby" -> "ruby:3.3-slim";
            default -> "ubuntu:22.04";
        };
    }

    private Project getProjectAndValidateAccess(UserPrincipal currentUser, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + projectId));

        boolean isOwner = project.getOwner() != null && project.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ProjectAccessDeniedException("You do not have permission to access or modify this project");
        }

        return project;
    }
}
