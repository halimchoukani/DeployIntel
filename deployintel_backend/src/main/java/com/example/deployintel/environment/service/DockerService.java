package com.example.deployintel.environment.service;

import com.example.deployintel.environment.dto.CommandExecutionResponse;
import com.example.deployintel.environment.dto.DockerDaemonInfoResponse;
import com.example.deployintel.environment.entity.EnvironmentStatus;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.*;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.command.ExecStartResultCallback;
import com.github.dockerjava.core.command.LogContainerResultCallback;
import com.github.dockerjava.core.command.PullImageResultCallback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class DockerService {

    private final DockerClient dockerClient;

    /**
     * Checks whether the Docker daemon is accessible and responding to pings.
     */
    public boolean isDockerAvailable() {
        try {
            dockerClient.pingCmd().exec();
            return true;
        } catch (Exception e) {
            log.warn("Docker ping failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Retrieves Docker daemon diagnostic details.
     */
    public DockerDaemonInfoResponse getDockerInfo() {
        try {
            dockerClient.pingCmd().exec();
            Info info = dockerClient.infoCmd().exec();
            Version version = dockerClient.versionCmd().exec();

            return new DockerDaemonInfoResponse(
                    true,
                    version.getApiVersion() != null ? "API v" + version.getApiVersion() : "Connected",
                    version.getVersion(),
                    info.getOperatingSystem(),
                    info.getContainers(),
                    "Docker daemon connected successfully"
            );
        } catch (Exception e) {
            return new DockerDaemonInfoResponse(
                    false,
                    "Unknown",
                    "N/A",
                    "N/A",
                    0,
                    "Docker daemon is not reachable: " + e.getMessage()
            );
        }
    }

    /**
     * Pulls the image if not already present locally.
     */
    public void ensureImageAvailable(String image) {
        try {
            List<Image> images = dockerClient.listImagesCmd().withImageNameFilter(image).exec();
            if (images.isEmpty()) {
                log.info("Image {} not found locally, pulling from registry...", image);
                dockerClient.pullImageCmd(image)
                        .exec(new PullImageResultCallback())
                        .awaitCompletion(5, TimeUnit.MINUTES);
                log.info("Successfully pulled image: {}", image);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while pulling Docker image: " + image, e);
        } catch (Exception e) {
            log.error("Failed to pull image {}: {}", image, e.getMessage());
            throw new RuntimeException("Failed to pull image " + image + ": " + e.getMessage(), e);
        }
    }

    /**
     * Creates and starts a container designed for testing a project.
     * The container keeps running using an idle loop so interactive test commands can be executed inside it.
     */
    public String createAndStartContainer(
            String containerName,
            String image,
            String workspacePath,
            Map<String, String> envVars,
            Integer hostPort,
            Integer containerPort
    ) {
        ensureImageAvailable(image);

        List<String> environmentList = new ArrayList<>();
        environmentList.add("CI=true");
        environmentList.add("DEPLOYINTEL_ENV=test");
        if (envVars != null) {
            envVars.forEach((k, v) -> environmentList.add(k + "=" + v));
        }

        HostConfig hostConfig = HostConfig.newHostConfig();
        List<ExposedPort> exposedPorts = new ArrayList<>();

        if (hostPort != null && containerPort != null) {
            ExposedPort tcpPort = ExposedPort.tcp(containerPort);
            exposedPorts.add(tcpPort);
            Ports portBindings = new Ports();
            portBindings.bind(tcpPort, Ports.Binding.bindPort(hostPort));
            hostConfig.withPortBindings(portBindings);
        }

        CreateContainerCmd createCmd = dockerClient.createContainerCmd(image)
                .withName(containerName)
                .withWorkingDir(workspacePath != null && !workspacePath.isBlank() ? workspacePath : "/workspace")
                .withEnv(environmentList)
                .withHostConfig(hostConfig)
                // Keep the container running in the background for interactive execution
                .withCmd("sh", "-c", "mkdir -p " + (workspacePath != null ? workspacePath : "/workspace") + " && tail -f /dev/null");

        if (!exposedPorts.isEmpty()) {
            createCmd.withExposedPorts(exposedPorts);
        }

        CreateContainerResponse containerResponse = createCmd.exec();
        String containerId = containerResponse.getId();

        log.info("Starting Docker container {} (id: {})", containerName, containerId);
        dockerClient.startContainerCmd(containerId).exec();

        return containerId;
    }

    /**
     * Starts an existing container.
     */
    public void startContainer(String containerId) {
        log.info("Starting container: {}", containerId);
        dockerClient.startContainerCmd(containerId).exec();
    }

    /**
     * Stops a running container.
     */
    public void stopContainer(String containerId) {
        try {
            log.info("Stopping container: {}", containerId);
            dockerClient.stopContainerCmd(containerId).withTimeout(10).exec();
        } catch (Exception e) {
            log.warn("Error while stopping container {}: {}", containerId, e.getMessage());
        }
    }

    /**
     * Removes a container (forcing removal if running).
     */
    public void removeContainer(String containerId) {
        try {
            log.info("Removing container: {}", containerId);
            dockerClient.removeContainerCmd(containerId).withForce(true).withRemoveVolumes(true).exec();
        } catch (Exception e) {
            log.warn("Error while removing container {}: {}", containerId, e.getMessage());
        }
    }

    /**
     * Inspects the current state of a container.
     */
    public EnvironmentStatus getContainerStatus(String containerId) {
        try {
            InspectContainerResponse inspect = dockerClient.inspectContainerCmd(containerId).exec();
            InspectContainerResponse.ContainerState state = inspect.getState();
            if (Boolean.TRUE.equals(state.getRunning())) {
                return EnvironmentStatus.RUNNING;
            } else if (Boolean.TRUE.equals(state.getRestarting())) {
                return EnvironmentStatus.STARTING;
            } else {
                return EnvironmentStatus.STOPPED;
            }
        } catch (Exception e) {
            log.warn("Failed to inspect container {}: {}", containerId, e.getMessage());
            return EnvironmentStatus.FAILED;
        }
    }

    /**
     * Retrieves the logs from the container.
     */
    public String getContainerLogs(String containerId, int tailLines) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            LogContainerResultCallback callback = new LogContainerResultCallback() {
                @Override
                public void onNext(Frame frame) {
                    try {
                        outputStream.write(frame.getPayload());
                    } catch (IOException ignored) {}
                    super.onNext(frame);
                }
            };

            dockerClient.logContainerCmd(containerId)
                    .withStdOut(true)
                    .withStdErr(true)
                    .withTail(tailLines > 0 ? tailLines : 100)
                    .exec(callback)
                    .awaitCompletion(15, TimeUnit.SECONDS);

            return outputStream.toString(StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to get logs for container {}: {}", containerId, e.getMessage());
            return "Failed to fetch logs: " + e.getMessage();
        }
    }

    /**
     * Executes a command inside the running container and returns stdout/stderr and exit code.
     */
    public CommandExecutionResponse executeCommand(String containerId, String command, String workingDir) {
        try {
            ExecCreateCmd createCmd = dockerClient.execCreateCmd(containerId)
                    .withAttachStdout(true)
                    .withAttachStderr(true)
                    .withCmd("sh", "-c", command);

            if (workingDir != null && !workingDir.isBlank()) {
                createCmd.withWorkingDir(workingDir);
            }

            ExecCreateCmdResponse execCreate = createCmd.exec();
            String execId = execCreate.getId();

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ExecStartResultCallback callback = new ExecStartResultCallback(outputStream, outputStream);

            dockerClient.execStartCmd(execId)
                    .exec(callback)
                    .awaitCompletion(5, TimeUnit.MINUTES);

            InspectExecResponse inspectExec = dockerClient.inspectExecCmd(execId).exec();
            Long exitCodeLong = inspectExec.getExitCodeLong();
            int exitCode = exitCodeLong != null ? exitCodeLong.intValue() : 0;

            String output = outputStream.toString(StandardCharsets.UTF_8);
            return new CommandExecutionResponse(exitCode, output, exitCode == 0);
        } catch (Exception e) {
            log.error("Failed executing command '{}' in container {}: {}", command, containerId, e.getMessage());
            return new CommandExecutionResponse(-1, "Command execution failed: " + e.getMessage(), false);
        }
    }
}
