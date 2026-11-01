package com.example.deployintel.gate.service;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.environment.dto.CommandExecutionResponse;
import com.example.deployintel.environment.entity.EnvironmentStatus;
import com.example.deployintel.environment.entity.TestEnvironment;
import com.example.deployintel.environment.repository.TestEnvironmentRepository;
import com.example.deployintel.environment.service.DockerService;
import com.example.deployintel.environment.service.EnvironmentService;
import com.example.deployintel.deployment.entity.Deployment;
import com.example.deployintel.deployment.repository.DeploymentRepository;
import com.example.deployintel.gate.dto.GateCheckResponse;
import com.example.deployintel.gate.dto.K6CheckResponse;
import com.example.deployintel.gate.entity.TestRun;
import com.example.deployintel.gate.repository.*;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GateServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private TestEnvironmentRepository testEnvironmentRepository;

    @Mock
    private DockerService dockerService;

    @Mock
    private EnvironmentService environmentService;

    @Mock
    private DeploymentRepository deploymentRepository;

    @Mock
    private TestRunRepository testRunRepository;

    @Mock
    private TestResultRepository testResultRepository;

    @Mock
    private SecurityFindingRepository securityFindingRepository;

    @Mock
    private PerformanceMetricRepository performanceMetricRepository;

    @Mock
    private RiskAssessmentRepository riskAssessmentRepository;

    @Mock
    private RiskRuleRepository riskRuleRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private GateService gateService;

    private User owner;
    private Project project;
    private UserPrincipal principal;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        owner = new User();
        owner.setId(UUID.randomUUID());
        owner.setEmail("test@deployintel.io");
        owner.setRole(UserRole.DEVELOPER);

        project = Project.builder()
                .id(projectId)
                .name("Checkout Engine")
                .owner(owner)
                .build();

        principal = new UserPrincipal(owner.getId(), owner.getEmail(), owner.getRole());

        Deployment deployment = Deployment.builder()
                .id(UUID.randomUUID())
                .project(project)
                .build();

        when(deploymentRepository.findFirstByProjectIdOrderByCreatedAtDesc(projectId)).thenReturn(Optional.of(deployment));
        when(testRunRepository.save(any(TestRun.class))).thenAnswer(invocation -> {
            TestRun tr = invocation.getArgument(0);
            tr.setId(UUID.randomUUID());
            return tr;
        });
    }

    @Test
    @DisplayName("Should return failed verdict when Docker is not available")
    void testDockerUnavailable() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(dockerService.isDockerAvailable()).thenReturn(false);

        GateCheckResponse response = gateService.runSemgrepCheck(principal, projectId);

        assertThat(response.isPassed()).isFalse();
        assertThat(response.getVerdict()).isEqualTo("FAILED");
        assertThat(response.getSummaryMessage()).contains("Docker daemon is unreachable");
    }

    @Test
    @DisplayName("Should parse Semgrep results and set BLOCKED verdict when ERROR findings exist")
    void testSemgrepFindingsBlocked() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(dockerService.isDockerAvailable()).thenReturn(true);

        TestEnvironment testEnv = TestEnvironment.builder()
                .id(UUID.randomUUID())
                .name("Runner")
                .containerId("container-123")
                .workspacePath("/workspace")
                .status(EnvironmentStatus.RUNNING)
                .build();

        when(testEnvironmentRepository.findByProjectIdOrderByCreatedAtDesc(projectId))
                .thenReturn(List.of(testEnv));
        when(dockerService.getContainerStatus("container-123")).thenReturn(EnvironmentStatus.RUNNING);
        when(dockerService.executeCommand(eq("container-123"), eq("command -v semgrep"), anyString()))
                .thenReturn(new CommandExecutionResponse(0, "/usr/bin/semgrep", true));

        String semgrepJson = "{\n" +
                "  \"version\": \"1.183.0\",\n" +
                "  \"results\": [\n" +
                "    {\n" +
                "      \"check_id\": \"generic.secrets.security.detected-jwt-token\",\n" +
                "      \"path\": \".github/workflows/deploy.yml\",\n" +
                "      \"start\": { \"line\": 13, \"col\": 1 },\n" +
                "      \"end\": { \"line\": 13, \"col\": 50 },\n" +
                "      \"extra\": {\n" +
                "        \"severity\": \"ERROR\",\n" +
                "        \"message\": \"Hardcoded JWT token detected\",\n" +
                "        \"metadata\": {\n" +
                "          \"category\": \"security\",\n" +
                "          \"cwe\": [\"CWE-321: Use of Hard-coded Cryptographic Key\"],\n" +
                "          \"owasp\": [\"A02:2021 - Cryptographic Failures\"]\n" +
                "        }\n" +
                "      }\n" +
                "    }\n" +
                "  ],\n" +
                "  \"paths\": { \"scanned\": [\"file1.ts\", \"file2.ts\"] },\n" +
                "  \"time\": { \"rules\": [] }\n" +
                "}";

        when(dockerService.executeCommand(eq("container-123"), eq("semgrep scan --config=auto --json --quiet"), eq("/workspace")))
                .thenReturn(new CommandExecutionResponse(0, semgrepJson, true));

        GateCheckResponse response = gateService.runSemgrepCheck(principal, projectId);

        assertThat(response.isPassed()).isFalse();
        assertThat(response.getVerdict()).isEqualTo("BLOCKED");
        assertThat(response.getTotalFindings()).isEqualTo(1);
        assertThat(response.getErrorCount()).isEqualTo(1);
        assertThat(response.getScannedFilesCount()).isEqualTo(2);
        assertThat(response.getFindings()).hasSize(1);
        assertThat(response.getFindings().get(0).getCheckId()).isEqualTo("generic.secrets.security.detected-jwt-token");
        assertThat(response.getTestRunId()).isNotNull();
        assertThat(response.getDeploymentId()).isNotNull();

        verify(testRunRepository, atLeastOnce()).save(any(TestRun.class));
        verify(securityFindingRepository, atLeastOnce()).save(any(com.example.deployintel.gate.entity.SecurityFinding.class));
        verify(testResultRepository, atLeastOnce()).save(any(com.example.deployintel.gate.entity.TestResult.class));
        verify(riskAssessmentRepository, atLeastOnce()).save(any(com.example.deployintel.gate.entity.RiskAssessment.class));
    }

    @Test
    @DisplayName("Should set PASSED verdict when Semgrep findings list is clean")
    void testSemgrepFindingsClean() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(dockerService.isDockerAvailable()).thenReturn(true);

        TestEnvironment testEnv = TestEnvironment.builder()
                .id(UUID.randomUUID())
                .name("Runner")
                .containerId("container-123")
                .workspacePath("/workspace")
                .status(EnvironmentStatus.RUNNING)
                .build();

        when(testEnvironmentRepository.findByProjectIdOrderByCreatedAtDesc(projectId))
                .thenReturn(List.of(testEnv));
        when(dockerService.getContainerStatus("container-123")).thenReturn(EnvironmentStatus.RUNNING);
        when(dockerService.executeCommand(eq("container-123"), eq("command -v semgrep"), anyString()))
                .thenReturn(new CommandExecutionResponse(0, "/usr/bin/semgrep", true));

        String semgrepJson = "{\n" +
                "  \"version\": \"1.183.0\",\n" +
                "  \"results\": [],\n" +
                "  \"paths\": { \"scanned\": [\"src/index.ts\"] },\n" +
                "  \"time\": { \"rules\": [] }\n" +
                "}";

        when(dockerService.executeCommand(eq("container-123"), eq("semgrep scan --config=auto --json --quiet"), eq("/workspace")))
                .thenReturn(new CommandExecutionResponse(0, semgrepJson, true));

        GateCheckResponse response = gateService.runSemgrepCheck(principal, projectId);

        assertThat(response.isPassed()).isTrue();
        assertThat(response.getVerdict()).isEqualTo("PASSED");
        assertThat(response.getTotalFindings()).isEqualTo(0);
        assertThat(response.getErrorCount()).isEqualTo(0);
        assertThat(response.getScannedFilesCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should execute k6 performance check and parse summary metrics")
    void testK6PerformanceCheckSuccess() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(dockerService.isDockerAvailable()).thenReturn(true);

        TestEnvironment testEnv = TestEnvironment.builder()
                .id(UUID.randomUUID())
                .name("Runner")
                .containerId("container-123")
                .workspacePath("/workspace")
                .status(EnvironmentStatus.RUNNING)
                .build();

        when(testEnvironmentRepository.findByProjectIdOrderByCreatedAtDesc(projectId))
                .thenReturn(List.of(testEnv));
        when(dockerService.getContainerStatus("container-123")).thenReturn(EnvironmentStatus.RUNNING);
        when(dockerService.executeCommand(eq("container-123"), eq("command -v k6"), anyString()))
                .thenReturn(new CommandExecutionResponse(0, "/usr/bin/k6", true));

        String k6Summary = "{\n" +
                "  \"metrics\": {\n" +
                "    \"http_req_duration\": { \"avg\": 120.5, \"min\": 80.0, \"med\": 110.0, \"max\": 210.0, \"p(90)\": 180.0, \"p(95)\": 195.0 },\n" +
                "    \"http_reqs\": { \"count\": 50, \"rate\": 16.5 },\n" +
                "    \"http_req_failed\": { \"value\": 0.0 },\n" +
                "    \"vus\": { \"max\": 5 },\n" +
                "    \"data_received\": { \"count\": 45000 },\n" +
                "    \"data_sent\": { \"count\": 8000 }\n" +
                "  },\n" +
                "  \"root_group\": {\n" +
                "    \"checks\": {\n" +
                "      \"status is 200 or healthy\": { \"passes\": 50, \"fails\": 0 },\n" +
                "      \"response duration < 500ms\": { \"passes\": 50, \"fails\": 0 }\n" +
                "    }\n" +
                "  }\n" +
                "}";

        when(dockerService.executeCommand(eq("container-123"), contains("printf"), anyString()))
                .thenReturn(new CommandExecutionResponse(0, "", true));
        when(dockerService.executeCommand(eq("container-123"), contains("k6 run"), anyString()))
                .thenReturn(new CommandExecutionResponse(0, "k6 output", true));
        when(dockerService.executeCommand(eq("container-123"), eq("cat /tmp/k6_gate_summary.json"), anyString()))
                .thenReturn(new CommandExecutionResponse(0, k6Summary, true));

        K6CheckResponse response = gateService.runK6PerformanceCheck(principal, projectId);

        assertThat(response.isPassed()).isTrue();
        assertThat(response.getVerdict()).isEqualTo("PASSED");
        assertThat(response.getTotalRequests()).isEqualTo(50);
        assertThat(response.getP95DurationMs()).isEqualTo(195.0);
        assertThat(response.getRequestsPerSecond()).isEqualTo(16.5);
        assertThat(response.getChecks()).hasSize(2);
        assertThat(response.getChecks().get(0).isPassed()).isTrue();
        assertThat(response.getTestRunId()).isNotNull();
        assertThat(response.getDeploymentId()).isNotNull();

        verify(testRunRepository, atLeastOnce()).save(any(TestRun.class));
        verify(testResultRepository, atLeastOnce()).save(any(com.example.deployintel.gate.entity.TestResult.class));
        verify(performanceMetricRepository, atLeastOnce()).save(any(com.example.deployintel.gate.entity.PerformanceMetric.class));
        verify(riskAssessmentRepository, atLeastOnce()).save(any(com.example.deployintel.gate.entity.RiskAssessment.class));
    }
}
