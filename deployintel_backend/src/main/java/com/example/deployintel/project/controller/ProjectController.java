package com.example.deployintel.project.controller;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.project.dto.*;
import com.example.deployintel.project.entity.ProjectStatus;
import com.example.deployintel.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            Authentication authentication,
            @Valid @RequestBody CreateProjectRequest request
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        ProjectResponse response = projectService.createProject(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/github")
    public ResponseEntity<ProjectResponse> createProjectFromGithub(
            Authentication authentication,
            @RequestHeader(value = "X-GitHub-Token", required = false) String githubToken,
            @Valid @RequestBody CreateProjectFromGithubRequest request
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        ProjectResponse response = projectService.createProjectFromGithub(principal.getId(), request, githubToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/github/repositories")
    public ResponseEntity<List<GithubRepoResponse>> getGithubRepositories(
            Authentication authentication,
            @RequestHeader(value = "X-GitHub-Token", required = false) String githubToken
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        List<GithubRepoResponse> repos = projectService.getUserGithubRepositories(principal.getId(), githubToken);
        return ResponseEntity.ok(repos);
    }

    @GetMapping("/github/repository")
    public ResponseEntity<GithubRepoResponse> getGithubRepositoryDetails(
            Authentication authentication,
            @RequestParam("url") String url,
            @RequestHeader(value = "X-GitHub-Token", required = false) String githubToken
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        GithubRepoResponse details = projectService.getGithubRepositoryDetails(principal.getId(), url, githubToken);
        return ResponseEntity.ok(details);
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(
            Authentication authentication,
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest request
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        ProjectResponse response = projectService.updateProject(principal, projectId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        ProjectResponse response = projectService.getProjectById(principal, projectId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getUserProjects(
            Authentication authentication,
            @RequestParam(required = false) ProjectStatus status
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        List<ProjectResponse> response = projectService.getUserProjects(principal.getId(), status);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{projectId}/archive")
    public ResponseEntity<ProjectResponse> archiveProject(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        ProjectResponse response = projectService.archiveProject(principal, projectId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{projectId}/activate")
    public ResponseEntity<ProjectResponse> activateProject(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        ProjectResponse response = projectService.activateProject(principal, projectId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        projectService.deleteProject(principal, projectId);
        return ResponseEntity.noContent().build();
    }
}
