package com.example.deployintel.release.service;

import com.example.deployintel.deployment.entity.Deployment;
import com.example.deployintel.deployment.repository.DeploymentRepository;
import com.example.deployintel.gate.entity.TestRun;
import com.example.deployintel.gate.entity.TestRunStatus;
import com.example.deployintel.gate.entity.TestRunType;
import com.example.deployintel.gate.repository.RiskAssessmentRepository;
import com.example.deployintel.gate.repository.TestRunRepository;
import com.example.deployintel.gate.service.AutomatedReleaseTestService;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.release.dto.CreateReleaseRequest;
import com.example.deployintel.release.dto.ReleaseResponse;
import com.example.deployintel.release.entity.Release;
import com.example.deployintel.release.entity.ReleaseEnvironment;
import com.example.deployintel.release.entity.ReleaseStatus;
import com.example.deployintel.release.repository.ReleaseRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReleaseServiceTest {

    @Mock
    private ReleaseRepository releaseRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DeploymentRepository deploymentRepository;

    @Mock
    private TestRunRepository testRunRepository;

    @Mock
    private RiskAssessmentRepository riskAssessmentRepository;

    @Mock
    private AutomatedReleaseTestService automatedReleaseTestService;

    @InjectMocks
    private ReleaseService releaseService;

    private UUID projectId;
    private UUID userId;
    private Project project;
    private User author;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();

        author = new User();
        author.setId(userId);
        author.setEmail("developer@example.com");
        author.setRole(UserRole.DEVELOPER);

        project = Project.builder()
                .id(projectId)
                .name("Order Service")
                .defaultBranch("main")
                .owner(author)
                .build();

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectRepository.existsById(projectId)).thenReturn(true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(author));

        when(releaseRepository.save(any(Release.class))).thenAnswer(inv -> {
            Release r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        when(deploymentRepository.save(any(Deployment.class))).thenAnswer(inv -> {
            Deployment d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });
    }

    @Test
    @DisplayName("createRelease should persist release with PENDING status, create deployment, and trigger automated tests")
    void testCreateReleaseTriggersAutomatedTests() {
        CreateReleaseRequest request = new CreateReleaseRequest(
                projectId,
                "v2.1.0",
                "a1b2c3d4e5f6",
                "main",
                "v2.1.0",
                ReleaseEnvironment.PRODUCTION
        );

        ReleaseResponse response = releaseService.createRelease(userId, request);

        assertThat(response).isNotNull();
        assertThat(response.versionNumber()).isEqualTo("v2.1.0");
        assertThat(response.status()).isEqualTo(ReleaseStatus.PENDING);
        assertThat(response.testVerdict()).isEqualTo("PENDING");

        // Verify deployment created
        verify(deploymentRepository, times(1)).save(any(Deployment.class));

        // Verify automated tests triggered asynchronously
        verify(automatedReleaseTestService, times(1)).runAutomatedTestsForRelease(any(UUID.class));
    }

    @Test
    @DisplayName("getReleasesForProject should return releases enriched with test runs and test verdict")
    void testGetReleasesWithTestRuns() {
        UUID releaseId = UUID.randomUUID();
        UUID depId = UUID.randomUUID();

        Release release = Release.create(
                project,
                "v2.0.0",
                "abcdef123456",
                "main",
                "v2.0.0",
                author,
                ReleaseEnvironment.PRODUCTION,
                ReleaseStatus.SUCCESS
        );
        release.setId(releaseId);

        Deployment deployment = Deployment.builder()
                .id(depId)
                .project(project)
                .release(release)
                .version("v2.0.0")
                .status("COMPLETED")
                .build();

        TestRun securityRun = TestRun.builder()
                .id(UUID.randomUUID())
                .deployment(deployment)
                .project(project)
                .type(TestRunType.SECURITY)
                .status(TestRunStatus.PASSED)
                .totalTests(10)
                .passedTests(10)
                .durationMs(1500L)
                .completedAt(OffsetDateTime.now())
                .build();

        TestRun perfRun = TestRun.builder()
                .id(UUID.randomUUID())
                .deployment(deployment)
                .project(project)
                .type(TestRunType.PERFORMANCE)
                .status(TestRunStatus.PASSED)
                .totalTests(2)
                .passedTests(2)
                .durationMs(3000L)
                .completedAt(OffsetDateTime.now())
                .build();

        when(releaseRepository.findByProjectIdOrderByCreatedAtDesc(projectId)).thenReturn(List.of(release));
        when(deploymentRepository.findByReleaseIdIn(List.of(releaseId))).thenReturn(List.of(deployment));
        when(testRunRepository.findByDeploymentIdInOrderByStartedAtDesc(List.of(depId))).thenReturn(List.of(securityRun, perfRun));

        List<ReleaseResponse> releases = releaseService.getReleasesForProject(projectId);

        assertThat(releases).hasSize(1);
        ReleaseResponse r = releases.get(0);
        assertThat(r.versionNumber()).isEqualTo("v2.0.0");
        assertThat(r.testVerdict()).isEqualTo("PASSED");
        assertThat(r.testRuns()).hasSize(2);
    }
}

