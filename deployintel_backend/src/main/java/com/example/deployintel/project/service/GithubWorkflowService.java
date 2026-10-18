package com.example.deployintel.project.service;

import com.example.deployintel.common.exception.ProjectAccessDeniedException;
import com.example.deployintel.project.dto.WorkflowPushResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;

/**
 * Service that uses the GitHub Contents API to create or update
 * the DeployIntel release workflow file in a user's repository.
 *
 * <p>GitHub API reference:
 * <a href="https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents">
 *   Create or update file contents
 * </a>
 */
@Slf4j
@Service
public class GithubWorkflowService {

    static final String WORKFLOW_PATH = ".github/workflows/deployintel-release.yml";
    private static final String GITHUB_API = "https://api.github.com";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GithubWorkflowService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    // Secondary constructor for testing
    public GithubWorkflowService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Pushes {@code workflowContent} to {@code .github/workflows/deployintel-release.yml}
     * inside the repository identified by {@code owner/repo}.
     *
     * <p>If the file already exists it will be updated (GitHub requires the current blob SHA).
     *
     * @param owner           repository owner (user or org)
     * @param repo            repository name
     * @param accessToken     GitHub PAT or OAuth token with {@code contents:write} scope
     * @param workflowContent raw YAML content to write
     * @param commitMessage   commit message (defaults to a sensible default if null/blank)
     * @return response with commit info
     */
    public WorkflowPushResponse pushWorkflowFile(
            String owner,
            String repo,
            String accessToken,
            String workflowContent,
            String commitMessage
    ) {
        return pushWorkflowFile(owner, repo, null, accessToken, workflowContent, commitMessage);
    }

    /**
     * Pushes {@code workflowContent} to {@code .github/workflows/deployintel-release.yml}
     * inside the repository identified by {@code owner/repo} on the specified {@code branch}.
     *
     * <p>If the file already exists it will be updated (GitHub requires the current blob SHA).
     *
     * @param owner           repository owner (user or org)
     * @param repo            repository name
     * @param branch          target branch (optional, defaults to repository default branch)
     * @param accessToken     GitHub PAT or OAuth token with {@code contents:write} and {@code workflow} scope
     * @param workflowContent raw YAML content to write
     * @param commitMessage   commit message (defaults to a sensible default if null/blank)
     * @return response with commit info
     */
    public WorkflowPushResponse pushWorkflowFile(
            String owner,
            String repo,
            String branch,
            String accessToken,
            String workflowContent,
            String commitMessage
    ) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalArgumentException(
                    "A GitHub access token with 'repo' and 'workflow' (or 'Workflows: Read and write') permission is required.");
        }

        String message = (commitMessage != null && !commitMessage.isBlank())
                ? commitMessage
                : "ci: add DeployIntel release tracker workflow";

        String contentBase64 = Base64.getEncoder().encodeToString(workflowContent.getBytes());

        // Check if file already exists so we can pass its SHA for an update
        String existingSha = getExistingFileSha(owner, repo, branch, accessToken);
        boolean isCreate = existingSha == null;

        // Build request body
        ObjectNode body = objectMapper.createObjectNode();
        body.put("message", message);
        body.put("content", contentBase64);
        if (existingSha != null) {
            body.put("sha", existingSha);
        }
        if (branch != null && !branch.isBlank()) {
            body.put("branch", branch);
        }

        String url = String.format("%s/repos/%s/%s/contents/%s", GITHUB_API, owner, repo, WORKFLOW_PATH);
        HttpHeaders headers = buildHeaders(accessToken);
        HttpEntity<String> request;
        try {
            request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize GitHub request body", e);
        }

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PUT, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("GitHub API returned unexpected status: " + response.getStatusCode());
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode commit = root.path("commit");
            String commitSha = commit.path("sha").asText(null);
            String commitUrl = commit.path("html_url").asText(null);

            log.info("Workflow file {} {} in {}/{} (branch: {}) — commit {}",
                    WORKFLOW_PATH, isCreate ? "created" : "updated", owner, repo, branch, commitSha);

            return new WorkflowPushResponse(WORKFLOW_PATH, commitSha, commitUrl, isCreate);

        } catch (HttpClientErrorException e) {
            handleHttpError(e, owner, repo);
            throw new IllegalStateException("Unreachable");
        } catch (WorkflowPushException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error pushing workflow file to {}/{}: {}", owner, repo, e.getMessage(), e);
            throw new IllegalStateException("Failed to push workflow file to GitHub: " + e.getMessage(), e);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Returns the current blob SHA of the workflow file if it exists, or {@code null}.
     * GitHub requires the SHA when updating an existing file.
     */
    private String getExistingFileSha(String owner, String repo, String branch, String accessToken) {
        String query = (branch != null && !branch.isBlank()) ? "?ref=" + branch : "";
        String url = String.format("%s/repos/%s/%s/contents/%s%s", GITHUB_API, owner, repo, WORKFLOW_PATH, query);
        HttpEntity<Void> request = new HttpEntity<>(buildHeaders(accessToken));
        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode node = objectMapper.readTree(response.getBody());
                return node.path("sha").asText(null);
            }
            return null;
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                return null; // file doesn't exist yet — that's fine
            }
            throw e;
        } catch (Exception e) {
            log.warn("Could not check existing workflow file SHA: {}", e.getMessage());
            return null;
        }
    }

    private HttpHeaders buildHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/vnd.github.v3+json");
        headers.set("User-Agent", "DeployIntel-App");
        headers.setBearerAuth(accessToken);
        return headers;
    }

    private void handleHttpError(HttpClientErrorException e, String owner, String repo) {
        HttpStatusCode status = e.getStatusCode();
        if (status == HttpStatus.UNAUTHORIZED) {
            throw new IllegalArgumentException(
                    "GitHub authentication failed (401). Please verify that your GitHub token is valid and not expired.");
        }
        if (status == HttpStatus.FORBIDDEN) {
            throw new IllegalArgumentException(
                    "GitHub permission denied (403) for '" + owner + "/" + repo + "'. " +
                    "Ensure your token has the 'workflow' scope (classic PAT) or 'Workflows: Read and write' permission (fine-grained PAT).");
        }
        if (status == HttpStatus.NOT_FOUND) {
            throw new IllegalArgumentException(
                    "GitHub returned 404 Not Found for repository '" + owner + "/" + repo + "'. " +
                    "GitHub returns 404 if the repository is private or does not exist, OR if your token lacks the required permissions. " +
                    "Please ensure: 1) The repository exists and your account has write access. " +
                    "2) For classic PAT: both 'repo' and 'workflow' scopes must be enabled. " +
                    "3) For fine-grained PAT: select repository access and grant 'Workflows: Read and write' and 'Contents: Read and write' permissions.");
        }
        if (status == HttpStatus.UNPROCESSABLE_ENTITY) {
            throw new IllegalArgumentException(
                    "GitHub rejected the request (422). " +
                    "The branch may not exist or the file SHA is stale. Try again.");
        }
        throw new IllegalStateException("GitHub API error (" + status + "): " + e.getMessage());
    }

    /** Marker exception — used to re-throw handled errors cleanly. */
    static class WorkflowPushException extends RuntimeException {
        WorkflowPushException(String msg) { super(msg); }
    }
}
