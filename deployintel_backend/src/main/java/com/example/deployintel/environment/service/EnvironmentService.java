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

import java.io.IOException;
import java.net.ServerSocket;
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

        Integer containerPort = request.port();
        if (containerPort == null || containerPort <= 0) {
            containerPort = resolveDefaultPort(project.getLanguage());
        }

        Integer hostPort = findAvailableHostPort(containerPort);
        environment.setPortMapping(hostPort + ":" + containerPort);

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

            if (request.environmentVariables() != null && !request.environmentVariables().isEmpty()) {
                writeEnvFile(containerId, workspacePath, request.environmentVariables());
            }

            // Install Semgrep SAST scanner in container (non-blocking)
            boolean shouldInstallSemgrep = request.installSemgrep() == null || Boolean.TRUE.equals(request.installSemgrep());
            if (shouldInstallSemgrep) {
                installSemgrep(containerId, workspacePath);
            }

            // Automatically download dependencies and start the project with the exposed port
            launchAutoStartup(containerId, workspacePath, containerPort, project.getLanguage());

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
            String repoUrl = resolveAuthenticatedCloneUrl(project);
            if (repoUrl == null || repoUrl.isBlank()) {
                log.warn("Project has no repository URL defined; skipping clone for container {}", containerId);
                return;
            }

            String branch = (project.getDefaultBranch() != null && !project.getDefaultBranch().isBlank())
                    ? project.getDefaultBranch().trim()
                    : "main";

            String safeRepoUrl = repoUrl.replace("'", "'\\''");
            String safeBranch = branch.replace("'", "'\\''");
            String safeWorkspace = (workspacePath != null && !workspacePath.isBlank() ? workspacePath.trim() : "/workspace")
                    .replace("'", "'\\''");

            // Install git if not already present, configure safe.directory, and clone into workspace
            String cloneScript = String.format(
                    "if ! command -v git >/dev/null 2>&1; then " +
                    "  if command -v apk >/dev/null 2>&1; then " +
                    "    apk add --no-cache git ca-certificates >/dev/null 2>&1; " +
                    "  elif command -v apt-get >/dev/null 2>&1; then " +
                    "    export DEBIAN_FRONTEND=noninteractive; " +
                    "    apt-get update -qq >/dev/null 2>&1 && apt-get install -y -qq --no-install-recommends git ca-certificates >/dev/null 2>&1; " +
                    "  elif command -v yum >/dev/null 2>&1; then " +
                    "    yum install -y -q git ca-certificates >/dev/null 2>&1; " +
                    "  elif command -v dnf >/dev/null 2>&1; then " +
                    "    dnf install -y -q git ca-certificates >/dev/null 2>&1; " +
                    "  fi; " +
                    "fi; " +
                    "if command -v git >/dev/null 2>&1; then " +
                    "  git config --global --add safe.directory '*' >/dev/null 2>&1; " +
                    "  rm -rf /tmp/clone_repo; " +
                    "  mkdir -p /tmp/clone_repo; " +
                    "  (git clone --depth 1 -b '%s' '%s' /tmp/clone_repo 2>&1 || git clone --depth 1 '%s' /tmp/clone_repo 2>&1); " +
                    "  if [ -d /tmp/clone_repo/.git ]; then " +
                    "    mkdir -p '%s'; " +
                    "    cp -a /tmp/clone_repo/. '%s'/; " +
                    "    rm -rf /tmp/clone_repo; " +
                    "    echo 'CLONE_SUCCESS'; " +
                    "  else " +
                    "    echo 'CLONE_FAILED'; " +
                    "  fi; " +
                    "else " +
                    "  echo 'GIT_NOT_FOUND'; " +
                    "fi",
                    safeBranch, safeRepoUrl, safeRepoUrl, safeWorkspace, safeWorkspace
            );

            log.info("Provisioning repository in container {} for project '{}' (branch: {})...", containerId, project.getName(), branch);
            CommandExecutionResponse res = dockerService.executeCommand(containerId, cloneScript, "/");
            if (res != null && res.output() != null && res.output().contains("CLONE_SUCCESS")) {
                log.info("Successfully cloned repository into container {} at {}", containerId, workspacePath);
            } else {
                log.warn("Repository clone in container {} reported: {}", containerId, res != null ? res.output().trim() : "null");
            }
        } catch (Exception e) {
            log.warn("Could not pre-clone project repository into container: {}", e.getMessage(), e);
        }
    }

    private String resolveAuthenticatedCloneUrl(Project project) {
        String repoUrl = project.getRepositoryUrl();
        if (repoUrl == null || repoUrl.isBlank()) {
            return repoUrl;
        }
        String token = project.getOwner() != null ? project.getOwner().getGithubAccessToken() : null;
        if (token != null && !token.isBlank() && repoUrl.contains("github.com/")) {
            return repoUrl.replace("https://github.com/", "https://x-access-token:" + token + "@github.com/");
        }
        return repoUrl;
    }

    private void writeEnvFile(String containerId, String workspacePath, Map<String, String> envVars) {
        try {
            StringBuilder sb = new StringBuilder();
            envVars.forEach((k, v) -> {
                if (k != null && !k.isBlank()) {
                    sb.append(k.trim()).append("=").append(v != null ? v : "").append("\n");
                }
            });
            String content = sb.toString().replace("'", "'\\''");
            String cmd = "mkdir -p " + workspacePath + " && printf '%s' '" + content + "' > " + workspacePath + "/.env";
            dockerService.executeCommand(containerId, cmd, "/");
            log.info("Wrote {} environment variable(s) to {}/.env in container {}", envVars.size(), workspacePath, containerId);
        } catch (Exception e) {
            log.warn("Could not write .env file into container workspace: {}", e.getMessage());
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

    private int resolveDefaultPort(String language) {
        if (language == null || language.isBlank()) {
            return 8080;
        }
        String normalized = language.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "javascript", "typescript", "node", "nodejs" -> 3000;
            case "python" -> 8000;
            case "ruby" -> 3000;
            case "php" -> 8000;
            default -> 8080;
        };
    }

    private int findAvailableHostPort(int preferredPort) {
        try (ServerSocket socket = new ServerSocket(preferredPort)) {
            return preferredPort;
        } catch (IOException e) {
            try (ServerSocket socket = new ServerSocket(0)) {
                return socket.getLocalPort();
            } catch (IOException ex) {
                return preferredPort;
            }
        }
    }

    private void installSemgrep(String containerId, String workspacePath) {
        try {
            String targetWorkspace = (workspacePath != null && !workspacePath.isBlank()) ? workspacePath : "/workspace";
            String installerScript = String.join("\n",
                    "#!/bin/sh",
                    "LOG_FILE=\"" + targetWorkspace + "/app.log\"",
                    "log() {",
                    "  TS=$(date '+%Y-%m-%d %H:%M:%S')",
                    "  M=\"[$TS] [DeployIntel] [Security] $1\"",
                    "  echo \"$M\" >> \"$LOG_FILE\" 2>/dev/null",
                    "  echo \"$M\" > /proc/1/fd/1 2>/dev/null || true",
                    "}",
                    "if command -v semgrep >/dev/null 2>&1; then",
                    "  V=$(semgrep --version 2>/dev/null || echo \"ready\")",
                    "  log \"Semgrep SAST scanner is already available ($V).\"",
                    "  exit 0",
                    "fi",
                    "log \"Starting background installation of Semgrep SAST scanner...\"",
                    "if ! command -v pip3 >/dev/null 2>&1 && ! command -v pip >/dev/null 2>&1; then",
                    "  if command -v apk >/dev/null 2>&1; then",
                    "    log \"Alpine environment detected: installing python3 and py3-pip via apk...\"",
                    "    apk add --no-cache python3 py3-pip >> \"$LOG_FILE\" 2>&1",
                    "  elif command -v apt-get >/dev/null 2>&1; then",
                    "    log \"Debian/Ubuntu environment detected: installing python3 and python3-pip via apt-get...\"",
                    "    export DEBIAN_FRONTEND=noninteractive",
                    "    apt-get update -qq >> \"$LOG_FILE\" 2>&1",
                    "    apt-get install -y -qq --no-install-recommends python3 python3-pip >> \"$LOG_FILE\" 2>&1",
                    "  fi",
                    "fi",
                    "P=\"\"",
                    "if command -v pip3 >/dev/null 2>&1; then",
                    "  P=\"pip3\"",
                    "elif command -v pip >/dev/null 2>&1; then",
                    "  P=\"pip\"",
                    "fi",
                    "if [ -n \"$P\" ]; then",
                    "  log \"Downloading and installing Semgrep wheel via $P (~75MB binary, takes 1-2 min)...\"",
                    "  $P install --break-system-packages --no-cache-dir semgrep >> \"$LOG_FILE\" 2>&1",
                    "fi",
                    "if command -v semgrep >/dev/null 2>&1; then",
                    "  V=$(semgrep --version 2>/dev/null || echo \"ready\")",
                    "  log \"Semgrep SAST scanner installed successfully ($V)! Ready for 'semgrep scan --config=auto'.\"",
                    "else",
                    "  log \"Semgrep installation completed with warnings. Check logs for details.\"",
                    "fi"
            );

            String safeScript = installerScript.replace("'", "'\\''");
            String cmd = "printf '%s' '" + safeScript + "' > /tmp/.semgrep_install.sh && " +
                    "chmod +x /tmp/.semgrep_install.sh && " +
                    "/tmp/.semgrep_install.sh >/dev/null 2>&1 &";

            dockerService.executeCommand(containerId, cmd, targetWorkspace);
            log.info("Semgrep background installation initiated for container {}", containerId);
        } catch (Exception e) {
            log.warn("Could not initiate Semgrep installation in container {}: {}", containerId, e.getMessage());
        }
    }

    private void launchAutoStartup(String containerId, String workspacePath, int port, String language) {
        try {
            String script = generateStartupScript(workspacePath, port, language);
            String safeScript = script.replace("'", "'\\''");
            String cmd = "printf '%s' '" + safeScript + "' > " + workspacePath + "/.deployintel_startup.sh && " +
                    "chmod +x " + workspacePath + "/.deployintel_startup.sh && " +
                    "nohup " + workspacePath + "/.deployintel_startup.sh >/dev/null 2>&1 &";

            dockerService.executeCommand(containerId, cmd, workspacePath);
            log.info("Auto-dependency download and project launch triggered in container {} on port {}", containerId, port);
        } catch (Exception e) {
            log.warn("Could not launch auto-startup in container {}: {}", containerId, e.getMessage());
        }
    }

    private String generateStartupScript(String workspacePath, int port, String language) {
        return "#!/bin/sh\n" +
                "WORKSPACE=\"" + workspacePath + "\"\n" +
                "PORT=\"" + port + "\"\n" +
                "export PORT=\"" + port + "\"\n" +
                "export SERVER_PORT=\"" + port + "\"\n" +
                "\n" +
                "cd \"$WORKSPACE\" || exit 1\n" +
                "touch \"$WORKSPACE/app.log\"\n" +
                "\n" +
                "# Stream all output from app.log to container console (PID 1) for 'docker logs'\n" +
                "tail -n 0 -F \"$WORKSPACE/app.log\" > /proc/1/fd/1 2>/dev/null &\n" +
                "\n" +
                "log() {\n" +
                "  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')\n" +
                "  echo \"[$TIMESTAMP] [DeployIntel] $1\" >> \"$WORKSPACE/app.log\"\n" +
                "}\n" +
                "\n" +
                "log \"==========================================================\"\n" +
                "log \" DeployIntel Auto-Dependency & Project Runner\"\n" +
                "log \" Workspace: $WORKSPACE | Target Port: $PORT\"\n" +
                "log \"==========================================================\"\n" +
                "\n" +
                "# 1. Java (Maven / Gradle)\n" +
                "if [ -f \"pom.xml\" ]; then\n" +
                "  log \"Detected Java project with Maven (pom.xml found).\"\n" +
                "  MVN_CMD=\"mvn\"\n" +
                "  if [ -f \"./mvnw\" ]; then\n" +
                "    chmod +x ./mvnw 2>/dev/null || true\n" +
                "    MVN_CMD=\"./mvnw\"\n" +
                "  fi\n" +
                "  log \"Downloading dependencies with $MVN_CMD...\"\n" +
                "  $MVN_CMD dependency:resolve -DskipTests=true >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  log \"Dependencies resolved. Compiling project...\"\n" +
                "  $MVN_CMD compile -DskipTests=true >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  log \"Starting Java application on port $PORT...\"\n" +
                "  if grep -q \"spring-boot\" pom.xml 2>/dev/null; then\n" +
                "    exec $MVN_CMD spring-boot:run -Dspring-boot.run.arguments=\"--server.port=$PORT\" -DskipTests=true >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  else\n" +
                "    exec $MVN_CMD test-compile >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "\n" +
                "elif [ -f \"build.gradle\" ] || [ -f \"build.gradle.kts\" ]; then\n" +
                "  log \"Detected Java project with Gradle.\"\n" +
                "  GRADLE_CMD=\"gradle\"\n" +
                "  if [ -f \"./gradlew\" ]; then\n" +
                "    chmod +x ./gradlew 2>/dev/null || true\n" +
                "    GRADLE_CMD=\"./gradlew\"\n" +
                "  fi\n" +
                "  log \"Downloading dependencies with $GRADLE_CMD...\"\n" +
                "  $GRADLE_CMD build -x test >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  log \"Starting Gradle application on port $PORT...\"\n" +
                "  exec $GRADLE_CMD bootRun --args=\"--server.port=$PORT\" >> \"$WORKSPACE/app.log\" 2>&1 || exec $GRADLE_CMD run >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "\n" +
                "# 2. Node.js / JavaScript / TypeScript\n" +
                "elif [ -f \"package.json\" ]; then\n" +
                "  log \"Detected Node.js project (package.json found).\"\n" +
                "  if [ -f \"pnpm-lock.yaml\" ]; then\n" +
                "    command -v pnpm >/dev/null 2>&1 || npm install -g pnpm >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "    log \"Installing dependencies with pnpm install...\"\n" +
                "    pnpm install >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  elif [ -f \"yarn.lock\" ]; then\n" +
                "    command -v yarn >/dev/null 2>&1 || npm install -g yarn >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "    log \"Installing dependencies with yarn install...\"\n" +
                "    yarn install >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  else\n" +
                "    log \"Installing dependencies with npm install...\"\n" +
                "    npm install >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "  log \"Dependencies installed. Starting Node application on port $PORT...\"\n" +
                "  if grep -q '\"dev\"' package.json 2>/dev/null; then\n" +
                "    exec npm run dev -- --host 0.0.0.0 --port $PORT >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  elif grep -q '\"start\"' package.json 2>/dev/null; then\n" +
                "    exec npm start >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  elif [ -f \"index.js\" ]; then\n" +
                "    exec node index.js >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  elif [ -f \"server.js\" ]; then\n" +
                "    exec node server.js >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  elif [ -f \"app.js\" ]; then\n" +
                "    exec node app.js >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "\n" +
                "# 3. Python\n" +
                "elif [ -f \"requirements.txt\" ] || [ -f \"Pipfile\" ] || [ -f \"pyproject.toml\" ] || [ -f \"setup.py\" ] || [ -f \"manage.py\" ] || [ -f \"main.py\" ] || [ -f \"app.py\" ]; then\n" +
                "  log \"Detected Python project.\"\n" +
                "  if [ -f \"requirements.txt\" ]; then\n" +
                "    log \"Installing dependencies from requirements.txt...\"\n" +
                "    pip install --no-cache-dir -r requirements.txt >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "  if [ -f \"Pipfile\" ]; then\n" +
                "    log \"Installing dependencies with pipenv...\"\n" +
                "    pip install pipenv >> \"$WORKSPACE/app.log\" 2>&1 && pipenv install --system >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "  if [ -f \"pyproject.toml\" ] && grep -q \"poetry\" pyproject.toml 2>/dev/null; then\n" +
                "    log \"Installing dependencies with poetry...\"\n" +
                "    pip install poetry >> \"$WORKSPACE/app.log\" 2>&1 && poetry config virtualenvs.create false && poetry install >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "  if [ -f \"setup.py\" ]; then\n" +
                "    pip install -e . >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "  log \"Dependencies installed. Starting Python application on port $PORT...\"\n" +
                "  if [ -f \"manage.py\" ]; then\n" +
                "    exec python manage.py runserver 0.0.0.0:$PORT >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  elif [ -f \"main.py\" ]; then\n" +
                "    exec python main.py >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  elif [ -f \"app.py\" ]; then\n" +
                "    exec python app.py >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  elif [ -f \"wsgi.py\" ]; then\n" +
                "    exec python wsgi.py >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "\n" +
                "# 4. Go\n" +
                "elif [ -f \"go.mod\" ]; then\n" +
                "  log \"Detected Go project (go.mod found).\"\n" +
                "  log \"Downloading Go modules...\"\n" +
                "  go mod download >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  log \"Starting Go application on port $PORT...\"\n" +
                "  exec go run . >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "\n" +
                "# 5. Rust\n" +
                "elif [ -f \"Cargo.toml\" ]; then\n" +
                "  log \"Detected Rust project (Cargo.toml found).\"\n" +
                "  log \"Building Rust dependencies...\"\n" +
                "  cargo build >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  log \"Starting Rust application on port $PORT...\"\n" +
                "  exec cargo run >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "\n" +
                "# 6. PHP\n" +
                "elif [ -f \"composer.json\" ] || [ -f \"index.php\" ]; then\n" +
                "  log \"Detected PHP project.\"\n" +
                "  if [ -f \"composer.json\" ]; then\n" +
                "    log \"Installing Composer dependencies...\"\n" +
                "    composer install --no-interaction >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "  log \"Starting PHP application on port $PORT...\"\n" +
                "  if [ -f \"artisan\" ]; then\n" +
                "    exec php artisan serve --host=0.0.0.0 --port=$PORT >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  elif [ -d \"public\" ]; then\n" +
                "    exec php -S 0.0.0.0:$PORT -t public >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  else\n" +
                "    exec php -S 0.0.0.0:$PORT >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "\n" +
                "# 7. Ruby\n" +
                "elif [ -f \"Gemfile\" ]; then\n" +
                "  log \"Detected Ruby project (Gemfile found).\"\n" +
                "  log \"Installing bundle dependencies...\"\n" +
                "  bundle install >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  log \"Starting Ruby application on port $PORT...\"\n" +
                "  if [ -f \"bin/rails\" ] || [ -f \"config/application.rb\" ]; then\n" +
                "    exec bundle exec rails s -b 0.0.0.0 -p $PORT >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  elif [ -f \"app.rb\" ]; then\n" +
                "    exec ruby app.rb -p $PORT -o 0.0.0.0 >> \"$WORKSPACE/app.log\" 2>&1\n" +
                "  fi\n" +
                "\n" +
                "else\n" +
                "  log \"No recognized build system detected for language '" + (language != null ? language : "unknown") + "'. Workspace ready for terminal commands.\"\n" +
                "fi\n";
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
