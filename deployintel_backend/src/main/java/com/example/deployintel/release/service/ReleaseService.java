package com.example.deployintel.release.service;

import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.deployment.entity.Deployment;
import com.example.deployintel.deployment.repository.DeploymentRepository;
import com.example.deployintel.gate.dto.TestRunSummaryDto;
import com.example.deployintel.gate.entity.TestRun;
import com.example.deployintel.gate.entity.TestRunStatus;
import com.example.deployintel.gate.repository.TestRunRepository;
import com.example.deployintel.gate.service.AutomatedReleaseTestService;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.release.dto.CreateReleaseRequest;
import com.example.deployintel.release.dto.ReleaseResponse;
import com.example.deployintel.release.entity.Release;
import com.example.deployintel.release.entity.ReleaseStatus;
import com.example.deployintel.release.repository.ReleaseRepository;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.repository.UserRepository;
import com.example.deployintel.gate.entity.RiskAssessment;
import com.example.deployintel.gate.entity.RiskLevel;
import com.example.deployintel.gate.repository.RiskAssessmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReleaseService {

    private final ReleaseRepository releaseRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final DeploymentRepository deploymentRepository;
    private final TestRunRepository testRunRepository;
    private final AutomatedReleaseTestService automatedReleaseTestService;
    private final RiskAssessmentRepository riskAssessmentRepository;

    /**
     * Creates a new release record and automatically triggers background gate tests.
     * The authenticated user (token owner) becomes the release author.
     */
    @Transactional
    public ReleaseResponse createRelease(UUID callerId, CreateReleaseRequest request) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ProjectNotFoundException(
                        "Project not found: " + request.projectId()));

        User author = userRepository.findById(callerId).orElse(null);

        // Initially create release in PENDING state so tests evaluate it
        Release release = Release.create(
                project,
                request.versionNumber(),
                request.commitSha(),
                request.branch(),
                request.tag(),
                author,
                request.environment(),
                ReleaseStatus.PENDING
        );
        release = releaseRepository.save(release);

        // Create deployment record linked to this release
        Deployment deployment = Deployment.builder()
                .project(project)
                .release(release)
                .environment(request.environment() != null ? request.environment().name() : "PRODUCTION")
                .status("PENDING")
                .version(request.versionNumber())
                .commitSha(request.commitSha())
                .branch(request.branch())
                .createdAt(OffsetDateTime.now())
                .build();
        deployment = deploymentRepository.save(deployment);

        log.info("Release created: id={}, project={}, version={}, env={}, triggering automated tests...",
                release.getId(),
                project.getId(),
                release.getVersionNumber(),
                release.getEnvironment());

        // Trigger automated tests asynchronously after the transaction commits to guarantee database visibility
        UUID finalReleaseId = release.getId();
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    automatedReleaseTestService.runAutomatedTestsForRelease(finalReleaseId);
                }
            });
        } else {
            automatedReleaseTestService.runAutomatedTestsForRelease(finalReleaseId);
        }

        return ReleaseResponse.fromEntity(release, deployment.getId(), "PENDING", Collections.emptyList());
    }

    /**
     * Returns all releases for a given project, newest first, including gate test status.
     */
    @Transactional(readOnly = true)
    public List<ReleaseResponse> getReleasesForProject(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ProjectNotFoundException("Project not found: " + projectId);
        }

        List<Release> releases = releaseRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        if (releases.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> releaseIds = releases.stream().map(Release::getId).toList();
        List<Deployment> deployments = deploymentRepository.findByReleaseIdIn(releaseIds);
        Map<UUID, Deployment> depByRelease = new HashMap<>();
        for (Deployment d : deployments) {
            if (d.getRelease() != null) {
                depByRelease.put(d.getRelease().getId(), d);
            }
        }

        List<UUID> depIds = deployments.stream().map(Deployment::getId).toList();
        List<TestRun> allTestRuns = depIds.isEmpty() ? Collections.emptyList() : testRunRepository.findByDeploymentIdInOrderByStartedAtDesc(depIds);

        Map<UUID, List<TestRun>> testRunsByDep = new HashMap<>();
        for (TestRun tr : allTestRuns) {
            if (tr.getDeployment() != null) {
                testRunsByDep.computeIfAbsent(tr.getDeployment().getId(), k -> new ArrayList<>()).add(tr);
            }
        }

        List<RiskAssessment> allAssessments = depIds.isEmpty() ? Collections.emptyList()
                : riskAssessmentRepository.findByDeploymentIdInOrderByCalculatedAtDesc(depIds);
        Map<UUID, RiskAssessment> assessmentByDep = new HashMap<>();
        for (RiskAssessment ra : allAssessments) {
            if (ra.getDeployment() != null) {
                // keep the latest calculation
                assessmentByDep.putIfAbsent(ra.getDeployment().getId(), ra);
            }
        }

        return releases.stream().map(r -> {
            Deployment dep = depByRelease.get(r.getId());
            List<TestRun> runs = dep != null ? testRunsByDep.getOrDefault(dep.getId(), Collections.emptyList()) : Collections.emptyList();
            RiskAssessment assessment = dep != null ? assessmentByDep.get(dep.getId()) : null;

            String testVerdict = computeTestVerdict(r.getStatus(), runs);
            List<TestRunSummaryDto> summaries = runs.stream().map(tr -> TestRunSummaryDto.builder()
                    .id(tr.getId())
                    .type(tr.getType())
                    .status(tr.getStatus())
                    .totalTests(tr.getTotalTests())
                    .passedTests(tr.getPassedTests())
                    .failedTests(tr.getFailedTests())
                    .durationMs(tr.getDurationMs())
                    .completedAt(tr.getCompletedAt())
                    .aiSuggestion(tr.getAiSuggestion())
                    .aiModel(tr.getAiModel())
                    .build()).toList();

            AssessmentDetails ad = extractAssessmentDetails(r, dep, assessment);

            return ReleaseResponse.fromEntity(
                    r,
                    dep != null ? dep.getId() : null,
                    testVerdict,
                    ad.compositeScore(),
                    ad.securityScore(),
                    ad.performanceScore(),
                    ad.testScore(),
                    ad.regressionScore(),
                    ad.decision(),
                    ad.reason(),
                    summaries
            );
        }).toList();
    }

    /**
     * Finds a single release by its UUID with gate test details.
     */
    @Transactional(readOnly = true)
    public Optional<ReleaseResponse> findById(UUID releaseId) {
        return releaseRepository.findById(releaseId).map(r -> {
            Deployment dep = deploymentRepository.findByReleaseId(releaseId).orElse(null);
            List<TestRun> runs = dep != null
                    ? testRunRepository.findByDeploymentIdOrderByStartedAtDesc(dep.getId())
                    : Collections.emptyList();
            RiskAssessment assessment = dep != null
                    ? riskAssessmentRepository.findFirstByDeploymentIdOrderByCalculatedAtDesc(dep.getId()).orElse(null)
                    : null;

            String testVerdict = computeTestVerdict(r.getStatus(), runs);
            List<TestRunSummaryDto> summaries = runs.stream().map(tr -> TestRunSummaryDto.builder()
                    .id(tr.getId())
                    .type(tr.getType())
                    .status(tr.getStatus())
                    .totalTests(tr.getTotalTests())
                    .passedTests(tr.getPassedTests())
                    .failedTests(tr.getFailedTests())
                    .durationMs(tr.getDurationMs())
                    .completedAt(tr.getCompletedAt())
                    .aiSuggestion(tr.getAiSuggestion())
                    .aiModel(tr.getAiModel())
                    .build()).toList();

            AssessmentDetails ad = extractAssessmentDetails(r, dep, assessment);

            return ReleaseResponse.fromEntity(
                    r,
                    dep != null ? dep.getId() : null,
                    testVerdict,
                    ad.compositeScore(),
                    ad.securityScore(),
                    ad.performanceScore(),
                    ad.testScore(),
                    ad.regressionScore(),
                    ad.decision(),
                    ad.reason(),
                    summaries
            );
        });
    }

    private record AssessmentDetails(
            Double compositeScore,
            Double securityScore,
            Double performanceScore,
            Double testScore,
            Double regressionScore,
            String decision,
            String reason
    ) {}

    private AssessmentDetails extractAssessmentDetails(Release release, Deployment dep, RiskAssessment ra) {
        if (ra == null) {
            if (release.getStatus() == ReleaseStatus.BLOCKED || (dep != null && "BLOCKED".equalsIgnoreCase(dep.getStatus()))) {
                return new AssessmentDetails(null, null, null, null, null, "BLOCK", "Deployment blocked by automated gate checks.");
            }
            return new AssessmentDetails(null, null, null, null, null, null, null);
        }

        Double composite = ra.getFinalScore() != null ? ra.getFinalScore().doubleValue() : null;
        Double security = ra.getSecurityScore() != null ? ra.getSecurityScore().doubleValue() : null;
        Double perf = ra.getPerformanceScore() != null ? ra.getPerformanceScore().doubleValue() : null;
        Double test = ra.getTestScore() != null ? ra.getTestScore().doubleValue() : null;
        Double reg = ra.getRegressionScore() != null ? ra.getRegressionScore().doubleValue() : null;

        String decision;
        String reason;

        if (release.getStatus() == ReleaseStatus.BLOCKED || (dep != null && "BLOCKED".equalsIgnoreCase(dep.getStatus()))
                || ra.getRiskLevel() == RiskLevel.CRITICAL || (composite != null && composite < 60.0)) {
            decision = "BLOCK";
            reason = composite != null && composite < 60.0
                    ? String.format("Composite risk score %.1f is below the minimum threshold of 60.", composite)
                    : "Hard block: Critical security finding or gate failure detected.";
        } else if ((composite != null && composite < 80.0) || ra.getRiskLevel() == RiskLevel.HIGH) {
            decision = "WARN";
            reason = composite != null
                    ? String.format("Composite score %.1f is acceptable but below optimal (80). Deploy with caution.", composite)
                    : "High risk level detected. Deploy with caution.";
        } else {
            decision = "PASS";
            reason = composite != null
                    ? String.format("Composite risk score %.1f meets all quality gates. Deployment approved.", composite)
                    : "Deployment approved.";
        }

        return new AssessmentDetails(composite, security, perf, test, reg, decision, reason);
    }

    private String computeTestVerdict(ReleaseStatus releaseStatus, List<TestRun> runs) {
        if (releaseStatus == ReleaseStatus.PENDING) {
            return "PENDING";
        }
        if (runs.stream().anyMatch(tr -> tr.getStatus() == TestRunStatus.RUNNING || tr.getStatus() == TestRunStatus.PENDING)) {
            return "RUNNING";
        }
        if (runs.stream().anyMatch(tr -> tr.getStatus() == TestRunStatus.FAILED || tr.getStatus() == TestRunStatus.ERROR)) {
            return "FAILED";
        }
        if (!runs.isEmpty() && runs.stream().allMatch(tr -> tr.getStatus() == TestRunStatus.PASSED)) {
            return "PASSED";
        }
        return releaseStatus == ReleaseStatus.SUCCESS ? "PASSED" : "NOT_RUN";
    }
}
