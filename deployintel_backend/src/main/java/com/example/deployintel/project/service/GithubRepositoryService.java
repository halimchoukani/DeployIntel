package com.example.deployintel.project.service;

import com.example.deployintel.common.exception.ProjectAccessDeniedException;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.project.dto.GithubRepoResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class GithubRepositoryService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GithubRepositoryService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public GithubRepositoryService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public record RepoIdentifier(String owner, String repo) {}

    public RepoIdentifier parseRepository(String input) {
        if (input == null || input.isBlank()) {
            throw new IllegalArgumentException("Repository identifier or URL cannot be empty");
        }
        String trimmed = input.trim();
        if (trimmed.endsWith(".git")) {
            trimmed = trimmed.substring(0, trimmed.length() - 4);
        }
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }

        if (trimmed.contains("github.com/")) {
            int index = trimmed.indexOf("github.com/") + "github.com/".length();
            trimmed = trimmed.substring(index);
        } else if (trimmed.contains("github.com:")) {
            int index = trimmed.indexOf("github.com:") + "github.com:".length();
            trimmed = trimmed.substring(index);
        }

        String[] parts = trimmed.split("/");
        if (parts.length < 2 || parts[0].isBlank() || parts[1].isBlank()) {
            throw new IllegalArgumentException("Invalid repository format. Expected 'owner/repo' or GitHub URL, got: " + input);
        }
        return new RepoIdentifier(parts[0], parts[1]);
    }

    public List<GithubRepoResponse> getUserRepositories(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalArgumentException("GitHub access token is required to fetch repositories");
        }

        String url = "https://api.github.com/user/repos?sort=updated&per_page=100&type=all";

        HttpHeaders headers = createHeaders(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalArgumentException("Failed to fetch repositories from GitHub: " + response.getStatusCode());
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            List<GithubRepoResponse> repositories = new ArrayList<>();
            if (root.isArray()) {
                for (JsonNode node : root) {
                    repositories.add(mapNodeToRepoResponse(node));
                }
            }
            return repositories;
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED || e.getStatusCode() == HttpStatus.FORBIDDEN) {
                log.error("GitHub API unauthorized or forbidden when fetching user repos: {}", e.getMessage());
                throw new ProjectAccessDeniedException("GitHub access token is invalid or does not have sufficient permissions");
            }
            throw new IllegalArgumentException("Failed to fetch GitHub repositories: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error communicating with GitHub API: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Failed to fetch GitHub repositories: " + e.getMessage(), e);
        }
    }

    public GithubRepoResponse getRepositoryDetails(String owner, String repo, String accessToken) {
        String url = String.format("https://api.github.com/repos/%s/%s", owner, repo);

        HttpHeaders headers = createHeaders(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new ProjectNotFoundException("GitHub repository not found: " + owner + "/" + repo);
            }

            JsonNode node = objectMapper.readTree(response.getBody());
            return mapNodeToRepoResponse(node);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new ProjectNotFoundException("GitHub repository not found: " + owner + "/" + repo);
            }
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED || e.getStatusCode() == HttpStatus.FORBIDDEN) {
                log.error("GitHub API unauthorized/forbidden for {}/{}: {}", owner, repo, e.getMessage());
                throw new ProjectAccessDeniedException("Cannot access GitHub repository '" + owner + "/" + repo + "'. It may be private or token has expired.");
            }
            throw new IllegalArgumentException("Failed to fetch repository details: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error fetching repository details from GitHub: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Failed to fetch repository details: " + e.getMessage(), e);
        }
    }

    private HttpHeaders createHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "DeployIntel-App");
        headers.set("Accept", "application/vnd.github.v3+json");
        if (accessToken != null && !accessToken.isBlank()) {
            headers.setBearerAuth(accessToken);
        }
        return headers;
    }

    private GithubRepoResponse mapNodeToRepoResponse(JsonNode node) {
        Long id = node.hasNonNull("id") ? node.get("id").asLong() : null;
        String name = node.hasNonNull("name") ? node.get("name").asText() : "";
        String fullName = node.hasNonNull("full_name") ? node.get("full_name").asText() : name;
        String description = node.hasNonNull("description") ? node.get("description").asText() : null;
        String htmlUrl = node.hasNonNull("html_url") ? node.get("html_url").asText() : "";
        String cloneUrl = node.hasNonNull("clone_url") ? node.get("clone_url").asText() : htmlUrl + ".git";
        String defaultBranch = node.hasNonNull("default_branch") ? node.get("default_branch").asText() : "main";
        String language = node.hasNonNull("language") ? node.get("language").asText() : null;
        boolean isPrivate = node.has("private") && node.get("private").asBoolean();
        String updatedAt = node.hasNonNull("updated_at") ? node.get("updated_at").asText() : null;

        return new GithubRepoResponse(
                id,
                name,
                fullName,
                description,
                htmlUrl,
                cloneUrl,
                defaultBranch,
                language,
                isPrivate,
                updatedAt
        );
    }
}
