package com.example.deployintel.project.service;

import com.example.deployintel.common.exception.ProjectAccessDeniedException;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.project.dto.GithubRepoResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GithubRepositoryServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private GithubRepositoryService service;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        service = new GithubRepositoryService(restTemplate, objectMapper);
    }

    @Test
    @DisplayName("parseRepository handles full HTTPS git url")
    void testParseHttpsGitUrl() {
        var id = service.parseRepository("https://github.com/facebook/react.git");
        assertThat(id.owner()).isEqualTo("facebook");
        assertThat(id.repo()).isEqualTo("react");
    }

    @Test
    @DisplayName("parseRepository handles owner/repo shorthand")
    void testParseOwnerRepoShorthand() {
        var id = service.parseRepository("facebook/react");
        assertThat(id.owner()).isEqualTo("facebook");
        assertThat(id.repo()).isEqualTo("react");
    }

    @Test
    @DisplayName("parseRepository handles trailing slash and spaces")
    void testParseTrailingSlash() {
        var id = service.parseRepository("  https://github.com/spring-projects/spring-boot/  ");
        assertThat(id.owner()).isEqualTo("spring-projects");
        assertThat(id.repo()).isEqualTo("spring-boot");
    }

    @Test
    @DisplayName("parseRepository throws on invalid input")
    void testParseInvalidInput() {
        assertThatThrownBy(() -> service.parseRepository("invalid-input"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("getUserRepositories returns parsed list of repositories")
    void testGetUserRepositories() {
        String json = """
                [
                  {
                    "id": 12345,
                    "name": "deployintel",
                    "full_name": "halim/deployintel",
                    "description": "Smart observability",
                    "html_url": "https://github.com/halim/deployintel",
                    "clone_url": "https://github.com/halim/deployintel.git",
                    "default_branch": "main",
                    "language": "Java",
                    "private": false,
                    "updated_at": "2026-10-04T12:00:00Z"
                  }
                ]
                """;

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(new ResponseEntity<>(json, HttpStatus.OK));

        List<GithubRepoResponse> repos = service.getUserRepositories("mock-token");

        assertThat(repos).hasSize(1);
        assertThat(repos.get(0).name()).isEqualTo("deployintel");
        assertThat(repos.get(0).language()).isEqualTo("Java");
        assertThat(repos.get(0).defaultBranch()).isEqualTo("main");
    }

    @Test
    @DisplayName("getUserRepositories throws ProjectAccessDeniedException on 401")
    void testGetUserRepositoriesUnauthorized() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED));

        assertThatThrownBy(() -> service.getUserRepositories("bad-token"))
                .isInstanceOf(ProjectAccessDeniedException.class);
    }

    @Test
    @DisplayName("getRepositoryDetails returns repository metadata")
    void testGetRepositoryDetails() {
        String json = """
                {
                  "id": 12345,
                  "name": "deployintel",
                  "full_name": "halim/deployintel",
                  "description": "Smart observability",
                  "html_url": "https://github.com/halim/deployintel",
                  "clone_url": "https://github.com/halim/deployintel.git",
                  "default_branch": "master",
                  "language": "Kotlin",
                  "private": true
                }
                """;

        when(restTemplate.exchange(eq("https://api.github.com/repos/halim/deployintel"), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(new ResponseEntity<>(json, HttpStatus.OK));

        GithubRepoResponse repo = service.getRepositoryDetails("halim", "deployintel", "mock-token");

        assertThat(repo.name()).isEqualTo("deployintel");
        assertThat(repo.defaultBranch()).isEqualTo("master");
        assertThat(repo.language()).isEqualTo("Kotlin");
        assertThat(repo.isPrivate()).isTrue();
    }

    @Test
    @DisplayName("getRepositoryDetails throws ProjectNotFoundException on 404")
    void testGetRepositoryDetailsNotFound() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> service.getRepositoryDetails("owner", "unknown", null))
                .isInstanceOf(ProjectNotFoundException.class);
    }
}
