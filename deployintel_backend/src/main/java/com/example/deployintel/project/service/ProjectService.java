package com.example.deployintel.project.service;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.ProjectAccessDeniedException;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.common.exception.UserNotFoundException;
import com.example.deployintel.project.dto.CreateProjectRequest;
import com.example.deployintel.project.dto.ProjectResponse;
import com.example.deployintel.project.dto.UpdateProjectRequest;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.entity.ProjectStatus;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.example.deployintel.project.dto.CreateProjectFromGithubRequest;
import com.example.deployintel.project.dto.GithubRepoResponse;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final GithubRepositoryService githubRepositoryService;

    @Transactional
    public ProjectResponse createProject(UUID ownerId, CreateProjectRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + ownerId));

        Project project = Project.create(
                request.name().trim(),
                request.description(),
                request.repositoryUrl().trim(),
                request.defaultBranch() != null && !request.defaultBranch().isBlank() ? request.defaultBranch().trim() : "main",
                request.language() != null && !request.language().isBlank() ? request.language().trim() : null,
                owner
        );

        Project savedProject = projectRepository.save(project);
        return ProjectResponse.fromEntity(savedProject);
    }

    @Transactional
    public ProjectResponse updateProject(UserPrincipal currentUser, UUID projectId, UpdateProjectRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + projectId));

        validateOwnershipOrAdmin(currentUser, project);

        project.setName(request.name().trim());
        project.setDescription(request.description());
        project.setRepositoryUrl(request.repositoryUrl().trim());
        project.setDefaultBranch(request.defaultBranch().trim());
        project.setLanguage(request.language() != null && !request.language().isBlank() ? request.language().trim() : null);
        if (request.status() != null) {
            project.setStatus(request.status());
        }
        project.setUpdatedAt(OffsetDateTime.now());

        Project savedProject = projectRepository.save(project);
        return ProjectResponse.fromEntity(savedProject);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(UserPrincipal currentUser, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + projectId));

        validateOwnershipOrAdmin(currentUser, project);

        return ProjectResponse.fromEntity(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getUserProjects(UUID userId, ProjectStatus status) {
        List<Project> projects;
        if (status != null) {
            projects = projectRepository.findByOwnerIdAndStatusOrderByCreatedAtDesc(userId, status);
        } else {
            projects = projectRepository.findByOwnerIdOrderByCreatedAtDesc(userId);
        }
        return projects.stream()
                .map(ProjectResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ProjectResponse archiveProject(UserPrincipal currentUser, UUID projectId) {
        return updateProjectStatus(currentUser, projectId, ProjectStatus.ARCHIVED);
    }

    @Transactional
    public ProjectResponse activateProject(UserPrincipal currentUser, UUID projectId) {
        return updateProjectStatus(currentUser, projectId, ProjectStatus.ACTIVE);
    }

    @Transactional
    public ProjectResponse updateProjectStatus(UserPrincipal currentUser, UUID projectId, ProjectStatus status) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + projectId));

        validateOwnershipOrAdmin(currentUser, project);

        project.setStatus(status);
        project.setUpdatedAt(OffsetDateTime.now());

        Project savedProject = projectRepository.save(project);
        return ProjectResponse.fromEntity(savedProject);
    }

    @Transactional
    public void deleteProject(UserPrincipal currentUser, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + projectId));

        validateOwnershipOrAdmin(currentUser, project);

        projectRepository.delete(project);
    }

    @Transactional
    public ProjectResponse createProjectFromGithub(
            UUID ownerId,
            CreateProjectFromGithubRequest request,
            String optionalGithubToken
    ) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + ownerId));

        String token = resolveGithubToken(owner, optionalGithubToken);

        GithubRepositoryService.RepoIdentifier identifier =
                githubRepositoryService.parseRepository(request.repository());

        GithubRepoResponse repoDetails = githubRepositoryService.getRepositoryDetails(
                identifier.owner(),
                identifier.repo(),
                token
        );

        String projectName = request.name() != null && !request.name().isBlank()
                ? request.name().trim()
                : repoDetails.name();

        String description = request.description() != null
                ? request.description()
                : repoDetails.description();

        String repoUrl = repoDetails.cloneUrl() != null && !repoDetails.cloneUrl().isBlank()
                ? repoDetails.cloneUrl()
                : repoDetails.htmlUrl();

        String defaultBranch = request.defaultBranch() != null && !request.defaultBranch().isBlank()
                ? request.defaultBranch().trim()
                : (repoDetails.defaultBranch() != null && !repoDetails.defaultBranch().isBlank() ? repoDetails.defaultBranch() : "main");

        String language = request.language() != null && !request.language().isBlank()
                ? request.language().trim()
                : repoDetails.language();

        Project project = Project.create(
                projectName,
                description,
                repoUrl,
                defaultBranch,
                language,
                owner
        );

        Project savedProject = projectRepository.save(project);
        return ProjectResponse.fromEntity(savedProject);
    }

    @Transactional(readOnly = true)
    public List<GithubRepoResponse> getUserGithubRepositories(UUID userId, String optionalGithubToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        String token = resolveGithubToken(user, optionalGithubToken);
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("No GitHub access token available. Please log in with GitHub or provide a GitHub token in the X-GitHub-Token header.");
        }

        return githubRepositoryService.getUserRepositories(token);
    }

    @Transactional(readOnly = true)
    public GithubRepoResponse getGithubRepositoryDetails(UUID userId, String repoOrUrl, String optionalGithubToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        String token = resolveGithubToken(user, optionalGithubToken);
        GithubRepositoryService.RepoIdentifier identifier = githubRepositoryService.parseRepository(repoOrUrl);

        return githubRepositoryService.getRepositoryDetails(identifier.owner(), identifier.repo(), token);
    }

    private String resolveGithubToken(User user, String optionalGithubToken) {
        if (optionalGithubToken != null && !optionalGithubToken.isBlank()) {
            return optionalGithubToken.trim();
        }
        return user.getGithubAccessToken();
    }

    private void validateOwnershipOrAdmin(UserPrincipal currentUser, Project project) {
        boolean isOwner = project.getOwner() != null && project.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ProjectAccessDeniedException("You do not have permission to access or modify this project");
        }
    }
}
