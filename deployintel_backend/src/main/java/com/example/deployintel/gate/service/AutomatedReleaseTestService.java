package com.example.deployintel.gate.service;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.deployment.entity.Deployment;
import com.example.deployintel.deployment.repository.DeploymentRepository;
import com.example.deployintel.gate.dto.DeploymentVerdict;
import com.example.deployintel.gate.dto.GateCheckResponse;
import com.example.deployintel.gate.dto.K6CheckResponse;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.release.entity.Release;
import com.example.deployintel.release.entity.ReleaseStatus;
import com.example.deployintel.release.repository.ReleaseRepository;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AutomatedReleaseTestService {

    private final ReleaseRepository releaseRepository;
    private final DeploymentRepository deploymentRepository;
    private final GateService gateService;
    private final CompositeRiskScoreService compositeRiskScoreService;

    /**
     * Executes gate checks (Semgrep SAST and k6 load tests) automatically in the background
     * whenever a new release is created.
     * <p>
     * After both tests complete, {@link CompositeRiskScoreService} computes a weighted
     * composite score and makes a single PASS / WARN / BLOCK deployment decision.
     */
    @Async
    public void runAutomatedTestsForRelease(UUID releaseId) {
        log.info("Starting automated gate checks for release: {}", releaseId);

        Release release = null;
        for (int attempt = 1; attempt <= 5; attempt++) {
            release = releaseRepository.findByIdWithProjectAndAuthor(releaseId).orElse(null);
            if (release != null) {
                break;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        if (release == null) {
            log.warn("Cannot run tests: release not found with id {}", releaseId);
            return;
        }

        final Release finalRelease = release;
        Project project = finalRelease.getProject();
        Deployment deployment = deploymentRepository.findByReleaseId(releaseId)
                .orElseGet(() -> deploymentRepository.save(
                        Deployment.builder()
                                .project(project)
                                .release(finalRelease)
                                .environment(finalRelease.getEnvironment() != null ? finalRelease.getEnvironment().name() : "PRODUCTION")
                                .status("RUNNING")
                                .version(finalRelease.getVersionNumber())
                                .commitSha(finalRelease.getCommitSha())
                                .branch(finalRelease.getBranch())
                                .createdAt(OffsetDateTime.now())
                                .build()
                ));

        deployment.setStatus("RUNNING");
        deployment = deploymentRepository.save(deployment);

        User author = release.getAuthor();
        UserPrincipal principal;
        if (author != null) {
            principal = new UserPrincipal(author.getId(), author.getEmail(), author.getRole());
        } else if (project.getOwner() != null) {
            principal = new UserPrincipal(project.getOwner().getId(), project.getOwner().getEmail(), project.getOwner().getRole());
        } else {
            principal = new UserPrincipal(UUID.randomUUID(), "system@deployintel.io", UserRole.ADMIN);
        }

        // ── Run gate checks, capture both results ──────────────────────────────
        GateCheckResponse semgrepResult = null;
        K6CheckResponse   k6Result      = null;

        try {
            log.info("Executing automated Semgrep scan for release {} (project {})...",
                    release.getVersionNumber(), project.getName());
            semgrepResult = gateService.runSemgrepCheck(principal, project.getId(), deployment);
            log.info("Semgrep scan finished for release {}: verdict={}",
                    release.getVersionNumber(), semgrepResult.getVerdict());
        } catch (Exception e) {
            log.error("Automated Semgrep test failed for release {}: {}", releaseId, e.getMessage(), e);
        }

        try {
            log.info("Executing automated k6 performance test for release {} (project {})...",
                    release.getVersionNumber(), project.getName());
            k6Result = gateService.runK6PerformanceCheck(principal, project.getId(), deployment);
            log.info("k6 performance test finished for release {}: verdict={}",
                    release.getVersionNumber(), k6Result.getVerdict());
        } catch (Exception e) {
            log.error("Automated k6 test failed for release {}: {}", releaseId, e.getMessage(), e);
        }

        // ── Composite scoring → single PASS / WARN / BLOCK decision ───────────
        // CompositeRiskScoreService also persists the RiskAssessment and updates deployment.status
        try {
            com.example.deployintel.gate.dto.DeploymentVerdict verdict =
                    compositeRiskScoreService.computeAndPersist(project, deployment, semgrepResult, k6Result);

            log.info("Composite risk assessment for release {}: score={:.1f}, verdict={}, reason={}",
                    release.getVersionNumber(), verdict.compositeScore(), verdict.verdict(), verdict.reason());

            if (verdict.isBlocked()) {
                release.setStatus(ReleaseStatus.BLOCKED);
                log.warn("Deployment BLOCKED for release {} — {}", release.getVersionNumber(), verdict.reason());
            } else {
                release.setStatus(ReleaseStatus.SUCCESS);
                log.info("Deployment PASSED for release {} — {}", release.getVersionNumber(), verdict.reason());
            }
        } catch (Exception e) {
            log.error("Composite risk scoring failed for release {}: {}", releaseId, e.getMessage(), e);
            // Fall back to simple boolean logic if composite scoring itself errors
            boolean semgrepOk = semgrepResult != null &&
                    ("PASSED".equalsIgnoreCase(semgrepResult.getVerdict()) || semgrepResult.isPassed());
            boolean k6Ok = k6Result != null &&
                    ("PASSED".equalsIgnoreCase(k6Result.getVerdict()) || k6Result.isPassed());
            if (semgrepOk && k6Ok) {
                release.setStatus(ReleaseStatus.SUCCESS);
                deployment.setStatus("PASSED");
            } else {
                release.setStatus(ReleaseStatus.FAILED);
                deployment.setStatus("FAILED");
            }
            deploymentRepository.save(deployment);
        }

        releaseRepository.save(release);
    }
}

