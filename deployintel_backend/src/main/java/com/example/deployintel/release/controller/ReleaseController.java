package com.example.deployintel.release.controller;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.release.dto.CreateReleaseRequest;
import com.example.deployintel.release.dto.ReleaseResponse;
import com.example.deployintel.release.service.ReleaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for release management.
 *
 * <p>Intended to be called from a <strong>GitHub Actions</strong> workflow step
 * using the authenticated user's DeployIntel JWT token stored as a GitHub secret.
 *
 * <p>Example workflow step:
 * <pre>
 * - name: Notify DeployIntel of new release
 *   if: github.event_name == 'release' && github.event.action == 'published'
 *   run: |
 *     curl -s -X POST "${{ secrets.DEPLOYINTEL_API_URL }}/api/v1/releases" \
 *       -H "Authorization: Bearer ${{ secrets.DEPLOYINTEL_TOKEN }}" \
 *       -H "Content-Type: application/json" \
 *       -d '{
 *             "projectId": "${{ secrets.DEPLOYINTEL_PROJECT_ID }}",
 *             "versionNumber": "${{ github.ref_name }}",
 *             "commitSha": "${{ github.sha }}",
 *             "branch": "${{ github.ref_name }}",
 *             "tag": "${{ github.ref_name }}",
 *             "environment": "PRODUCTION"
 *           }'
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/releases")
@RequiredArgsConstructor
public class ReleaseController {

    private final ReleaseService releaseService;

    /**
     * Creates a new release entry.
     * Called by a GitHub Actions step — authenticated via Bearer JWT.
     */
    @PostMapping
    public ResponseEntity<ReleaseResponse> createRelease(
            Authentication authentication,
            @Valid @RequestBody CreateReleaseRequest request
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        ReleaseResponse response = releaseService.createRelease(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists all releases for a given project, newest first.
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ReleaseResponse>> getReleasesForProject(
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(releaseService.getReleasesForProject(projectId));
    }

    /**
     * Gets a single release by ID.
     */
    @GetMapping("/{releaseId}")
    public ResponseEntity<ReleaseResponse> getReleaseById(
            @PathVariable UUID releaseId
    ) {
        return releaseService.findById(releaseId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
