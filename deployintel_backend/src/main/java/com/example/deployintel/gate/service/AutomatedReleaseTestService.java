package com.example.deployintel.gate.service;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.deployment.entity.Deployment;
import com.example.deployintel.deployment.repository.DeploymentRepository;
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

    /**
     * Executes gate checks (Semgrep SAST and k6 load tests) automatically in the background
     * whenever a new release is created.
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

        boolean securityPassed = false;
        boolean k6Passed = false;

        try {
            log.info("Executing automated Semgrep scan for release {} (project {})...", release.getVersionNumber(), project.getName());
            GateCheckResponse semgrepRes = gateService.runSemgrepCheck(principal, project.getId(), deployment);
            securityPassed = semgrepRes.isPassed() || "PASSED".equalsIgnoreCase(semgrepRes.getVerdict());
            log.info("Semgrep scan finished for release {}: verdict={}, passed={}",
                    release.getVersionNumber(), semgrepRes.getVerdict(), securityPassed);
        } catch (Exception e) {
            log.error("Automated Semgrep test failed for release {}: {}", releaseId, e.getMessage(), e);
        }

        try {
            log.info("Executing automated k6 performance test for release {} (project {})...", release.getVersionNumber(), project.getName());
            K6CheckResponse k6Res = gateService.runK6PerformanceCheck(principal, project.getId(), deployment);
            k6Passed = k6Res.isPassed() || "PASSED".equalsIgnoreCase(k6Res.getVerdict());
            log.info("k6 performance test finished for release {}: verdict={}, passed={}",
                    release.getVersionNumber(), k6Res.getVerdict(), k6Passed);
        } catch (Exception e) {
            log.error("Automated k6 test failed for release {}: {}", releaseId, e.getMessage(), e);
        }

        // Update Release and Deployment status based on gate verdict
        if (securityPassed && k6Passed) {
            release.setStatus(ReleaseStatus.SUCCESS);
            deployment.setStatus("COMPLETED");
            log.info("All automated gate checks PASSED for release {}", release.getVersionNumber());
        } else {
            release.setStatus(ReleaseStatus.FAILED);
            deployment.setStatus("FAILED");
            log.warn("Automated gate checks FAILED/BLOCKED for release {}: securityPassed={}, k6Passed={}",
                    release.getVersionNumber(), securityPassed, k6Passed);
        }
        releaseRepository.save(release);
        deploymentRepository.save(deployment);
    }
}

