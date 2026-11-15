package com.example.deployintel.gate.service;

import com.example.deployintel.deployment.entity.Deployment;
import com.example.deployintel.deployment.repository.DeploymentRepository;
import com.example.deployintel.gate.dto.DeploymentVerdict;
import com.example.deployintel.gate.dto.GateCheckResponse;
import com.example.deployintel.gate.dto.K6CheckResponse;
import com.example.deployintel.gate.dto.SemgrepFinding;
import com.example.deployintel.gate.entity.RiskAssessment;
import com.example.deployintel.gate.entity.RiskLevel;
import com.example.deployintel.gate.repository.RiskAssessmentRepository;
import com.example.deployintel.project.entity.Project;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Computes a weighted composite risk score from Semgrep SAST and k6 performance results,
 * then makes a binary PASS / BLOCK deployment decision.
 *
 * <h3>Score Weights</h3>
 * <ul>
 *   <li>Security (Semgrep SAST): <b>40 %</b></li>
 *   <li>Performance (k6):        <b>35 %</b></li>
 *   <li>Test checks success:     <b>15 %</b></li>
 *   <li>Regression baseline:     <b>10 %</b> (always 100 until regression data exists)</li>
 * </ul>
 *
 * <h3>Decision thresholds</h3>
 * <ul>
 *   <li>Any CRITICAL / ERROR-severity Semgrep finding  → <b>BLOCK</b> (hard block)</li>
 *   <li>compositeScore &lt; 60                          → <b>BLOCK</b></li>
 *   <li>compositeScore 60–79 (or HIGH findings present) → <b>WARN</b> (deploy allowed, flagged)</li>
 *   <li>compositeScore ≥ 80                             → <b>PASS</b></li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CompositeRiskScoreService {

    // ── weights (must sum to 1.0) ─────────────────────────────────────────────
    private static final double W_SECURITY    = 0.40;
    private static final double W_PERFORMANCE = 0.35;
    private static final double W_TEST        = 0.15;
    private static final double W_REGRESSION  = 0.10;

    // ── thresholds ────────────────────────────────────────────────────────────
    /** Composite score below this → BLOCK. */
    private static final double BLOCK_THRESHOLD = 60.0;
    /** Composite score below this → WARN (above BLOCK_THRESHOLD). */
    private static final double WARN_THRESHOLD  = 80.0;

    // ── performance scoring constants (aligned with seeded RiskRules) ─────────
    /** p95 latency above this (ms) subtracts 30 pts from perf score. */
    private static final double P95_THRESHOLD_MS   = 500.0;
    /** Points deducted per percentage point of error rate (×100 of rate). */
    private static final double ERROR_RATE_PENALTY  = 5.0;
    /** Points deducted per failed k6 check. */
    private static final double CHECK_FAIL_PENALTY  = 15.0;

    // ── security scoring constants ────────────────────────────────────────────
    private static final double ERROR_PENALTY   = 25.0;
    private static final double WARNING_PENALTY = 10.0;
    private static final double INFO_PENALTY    =  2.0;

    private final RiskAssessmentRepository riskAssessmentRepository;
    private final DeploymentRepository     deploymentRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compute the composite score from both gate results, persist a single
     * {@link RiskAssessment}, update the deployment status, and return the verdict.
     *
     * @param project         the project under test (for logging)
     * @param deployment      the deployment entity to update
     * @param semgrepResult   Semgrep SAST response (may be {@code null} if scan was skipped)
     * @param k6Result        k6 performance response (may be {@code null} if test was skipped)
     * @return composite verdict with all sub-scores
     */
    @Transactional
    public DeploymentVerdict computeAndPersist(
            Project project,
            Deployment deployment,
            GateCheckResponse semgrepResult,
            K6CheckResponse k6Result
    ) {
        // ── 1. Compute sub-scores ─────────────────────────────────────────────
        double securityScore    = computeSecurityScore(semgrepResult);
        double performanceScore = computePerformanceScore(k6Result);
        double testScore        = computeTestScore(k6Result);
        double regressionScore  = 100.0;   // no regression baseline data yet

        // ── 2. Weighted composite ─────────────────────────────────────────────
        double composite = (securityScore    * W_SECURITY)
                         + (performanceScore * W_PERFORMANCE)
                         + (testScore        * W_TEST)
                         + (regressionScore  * W_REGRESSION);
        composite = clamp(composite);

        // ── 3. Hard-block: any CRITICAL / ERROR Semgrep finding ───────────────
        boolean hasCriticalFinding = hasCriticalSecurityFinding(semgrepResult);

        // ── 4. Verdict ────────────────────────────────────────────────────────
        String verdict;
        String reason;

        if (hasCriticalFinding) {
            verdict = "BLOCK";
            reason  = "Hard block: CRITICAL/ERROR-severity security finding(s) detected by Semgrep SAST";
        } else if (composite < BLOCK_THRESHOLD) {
            verdict = "BLOCK";
            reason  = String.format(
                    "Composite risk score %.1f is below the minimum threshold of %.0f",
                    composite, BLOCK_THRESHOLD);
        } else if (composite < WARN_THRESHOLD || hasHighSecurityFinding(semgrepResult)) {
            verdict = "WARN";
            reason  = composite < WARN_THRESHOLD
                    ? String.format("Composite score %.1f is acceptable but below optimal (%.0f). Deploy with caution.", composite, WARN_THRESHOLD)
                    : String.format("Composite score %.1f is good but HIGH-severity findings are present. Review before releasing.", composite);
        } else {
            verdict = "PASS";
            reason  = String.format("Composite risk score %.1f meets all quality gates. Deployment approved.", composite);
        }

        // ── 5. Risk level ─────────────────────────────────────────────────────
        RiskLevel riskLevel = deriveRiskLevel(composite, hasCriticalFinding);

        // ── 6. Persist single RiskAssessment ──────────────────────────────────
        RiskAssessment assessment = RiskAssessment.builder()
                .deployment(deployment)
                .securityScore(bd(securityScore))
                .performanceScore(bd(performanceScore))
                .testScore(bd(testScore))
                .regressionScore(bd(regressionScore))
                .finalScore(bd(composite))
                .riskLevel(riskLevel)
                .ruleVersion("v2.0")
                .calculatedAt(OffsetDateTime.now())
                .build();
        riskAssessmentRepository.save(assessment);

        // ── 7. Update deployment status ───────────────────────────────────────
        String deploymentStatus = "BLOCK".equals(verdict) ? "BLOCKED" : "PASSED";
        deployment.setStatus(deploymentStatus);
        deploymentRepository.save(deployment);

        DeploymentVerdict dv = new DeploymentVerdict(
                composite, securityScore, performanceScore, testScore, regressionScore,
                verdict, reason, riskLevel);

        log.info(
                "[CompositeRisk] project={} | security={:.1f} perf={:.1f} test={:.1f} reg={:.1f} " +
                "→ composite={:.1f} | verdict={} | {}",
                project.getName(),
                securityScore, performanceScore, testScore, regressionScore,
                composite, verdict, reason);

        return dv;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Sub-score calculators
    // ─────────────────────────────────────────────────────────────────────────

    private double computeSecurityScore(GateCheckResponse r) {
        if (r == null) return 100.0;   // no scan → assume clean
        double score = 100.0
                - (r.getErrorCount()   * ERROR_PENALTY)
                - (r.getWarningCount() * WARNING_PENALTY)
                - (r.getInfoCount()    * INFO_PENALTY);
        return clamp(score);
    }

    private double computePerformanceScore(K6CheckResponse r) {
        if (r == null) return 100.0;   // no test → assume healthy
        double errorRatePenalty = r.getFailedRequestRate() * 100.0 * ERROR_RATE_PENALTY;
        double latencyPenalty   = r.getP95DurationMs() > P95_THRESHOLD_MS ? 30.0 : 0.0;
        double checkPenalty     = r.getChecksFailed() * CHECK_FAIL_PENALTY;
        return clamp(100.0 - errorRatePenalty - latencyPenalty - checkPenalty);
    }

    /**
     * Test score = k6 check success rate (0-100 %).
     * Falls back to 100 when no test was run.
     */
    private double computeTestScore(K6CheckResponse r) {
        if (r == null) return 100.0;
        // checkSuccessRate is already expressed as a percentage (0-100)
        return clamp(r.getCheckSuccessRate());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private boolean hasCriticalSecurityFinding(GateCheckResponse r) {
        if (r == null || r.getFindings() == null) return false;
        List<SemgrepFinding> findings = r.getFindings();
        return findings.stream().anyMatch(f -> {
            String sev = f.getSeverity();
            return "ERROR".equalsIgnoreCase(sev) || "CRITICAL".equalsIgnoreCase(sev);
        });
    }

    private boolean hasHighSecurityFinding(GateCheckResponse r) {
        if (r == null || r.getFindings() == null) return false;
        return r.getFindings().stream()
                .anyMatch(f -> "WARNING".equalsIgnoreCase(f.getSeverity())
                            || "HIGH".equalsIgnoreCase(f.getSeverity()));
    }

    private RiskLevel deriveRiskLevel(double composite, boolean hasCritical) {
        if (hasCritical || composite < 40.0) return RiskLevel.CRITICAL;
        if (composite < 60.0)                return RiskLevel.HIGH;
        if (composite < 80.0)                return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    private static double clamp(double value) {
        return Math.max(0.0, Math.min(100.0, value));
    }

    private static BigDecimal bd(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }
}
