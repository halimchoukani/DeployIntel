package com.example.deployintel.release.service;

import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.release.dto.CreateReleaseRequest;
import com.example.deployintel.release.dto.ReleaseResponse;
import com.example.deployintel.release.entity.Release;
import com.example.deployintel.release.entity.ReleaseStatus;
import com.example.deployintel.release.repository.ReleaseRepository;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReleaseService {

    private final ReleaseRepository releaseRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    /**
     * Creates a new release record, called from the GitHub Actions workflow.
     * The authenticated user (token owner) becomes the release author.
     *
     * @param callerId the UUID of the authenticated user making the request
     * @param request  the release data sent from GitHub Actions
     * @return the persisted release as a response DTO
     */
    @Transactional
    public ReleaseResponse createRelease(UUID callerId, CreateReleaseRequest request) {
        // Resolve project — must exist
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ProjectNotFoundException(
                        "Project not found: " + request.projectId()));

        // Resolve the author from the authenticated caller
        User author = userRepository.findById(callerId).orElse(null);

        Release release = Release.create(
                project,
                request.versionNumber(),
                request.commitSha(),
                request.branch(),
                request.tag(),
                author,
                request.environment(),
                ReleaseStatus.SUCCESS
        );

        release = releaseRepository.save(release);

        log.info("Release created via GitHub Actions: id={}, project={}, version={}, env={}, author={}",
                release.getId(),
                project.getId(),
                release.getVersionNumber(),
                release.getEnvironment(),
                callerId);

        return ReleaseResponse.fromEntity(release);
    }

    /**
     * Returns all releases for a given project, newest first.
     */
    @Transactional(readOnly = true)
    public List<ReleaseResponse> getReleasesForProject(UUID projectId) {
        // Ensure project exists before querying
        if (!projectRepository.existsById(projectId)) {
            throw new ProjectNotFoundException("Project not found: " + projectId);
        }
        return releaseRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(ReleaseResponse::fromEntity)
                .toList();
    }

    /**
     * Finds a single release by its UUID.
     */
    @Transactional(readOnly = true)
    public Optional<ReleaseResponse> findById(UUID releaseId) {
        return releaseRepository.findById(releaseId)
                .map(ReleaseResponse::fromEntity);
    }
}
