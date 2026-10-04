package com.example.deployintel.project.service;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.ProjectAccessDeniedException;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.common.exception.UserNotFoundException;
import com.example.deployintel.project.dto.*;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.entity.ProjectStatus;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GithubRepositoryService githubRepositoryService;

    @InjectMocks
    private ProjectService projectService;

    private User owner;
    private User otherUser;
    private UserPrincipal ownerPrincipal;
    private UserPrincipal otherPrincipal;
    private UserPrincipal adminPrincipal;
    private Project project;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(UUID.randomUUID());
        owner.setEmail("owner@example.com");
        owner.setRole(UserRole.DEVELOPER);

        otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        otherUser.setEmail("other@example.com");
        otherUser.setRole(UserRole.DEVELOPER);

        ownerPrincipal = new UserPrincipal(owner.getId(), owner.getEmail(), owner.getRole());
        otherPrincipal = new UserPrincipal(otherUser.getId(), otherUser.getEmail(), otherUser.getRole());
        adminPrincipal = new UserPrincipal(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN);

        projectId = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();
        project = Project.builder()
                .id(projectId)
                .name("DeployIntel Backend")
                .description("Production backend monitoring")
                .repositoryUrl("https://github.com/halimchoukani/deployintel_backend.git")
                .defaultBranch("main")
                .language("Java")
                .owner(owner)
                .status(ProjectStatus.ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    @Test
    @DisplayName("createProject should create and return ProjectResponse")
    void testCreateProjectSuccess() {
        CreateProjectRequest request = new CreateProjectRequest(
                "DeployIntel Backend",
                "Production backend monitoring",
                "https://github.com/halimchoukani/deployintel_backend.git",
                "main",
                "Java"
        );

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project p = invocation.getArgument(0);
            p.setId(projectId);
            return p;
        });

        ProjectResponse response = projectService.createProject(owner.getId(), request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(projectId);
        assertThat(response.name()).isEqualTo("DeployIntel Backend");
        assertThat(response.repositoryUrl()).isEqualTo("https://github.com/halimchoukani/deployintel_backend.git");
        assertThat(response.defaultBranch()).isEqualTo("main");
        assertThat(response.language()).isEqualTo("Java");
        assertThat(response.ownerId()).isEqualTo(owner.getId());
        assertThat(response.status()).isEqualTo(ProjectStatus.ACTIVE);

        verify(projectRepository).save(any(Project.class));
    }

    @Test
    @DisplayName("createProject should default defaultBranch to main if null or blank")
    void testCreateProjectDefaultBranch() {
        CreateProjectRequest request = new CreateProjectRequest(
                "My Project",
                null,
                "https://github.com/test/repo.git",
                null,
                null
        );

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project p = invocation.getArgument(0);
            p.setId(projectId);
            return p;
        });

        ProjectResponse response = projectService.createProject(owner.getId(), request);

        assertThat(response.defaultBranch()).isEqualTo("main");
    }

    @Test
    @DisplayName("createProject throws UserNotFoundException when owner does not exist")
    void testCreateProjectOwnerNotFound() {
        CreateProjectRequest request = new CreateProjectRequest(
                "My Project",
                null,
                "https://github.com/test/repo.git",
                "main",
                null
        );

        when(userRepository.findById(owner.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.createProject(owner.getId(), request))
                .isInstanceOf(UserNotFoundException.class);

        verify(projectRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateProject should update fields when user is the owner")
    void testUpdateProjectSuccessAsOwner() {
        UpdateProjectRequest request = new UpdateProjectRequest(
                "Updated Project Name",
                "Updated description",
                "https://github.com/test/updated-repo.git",
                "develop",
                "Kotlin",
                ProjectStatus.ARCHIVED
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProjectResponse response = projectService.updateProject(ownerPrincipal, projectId, request);

        assertThat(response.name()).isEqualTo("Updated Project Name");
        assertThat(response.description()).isEqualTo("Updated description");
        assertThat(response.repositoryUrl()).isEqualTo("https://github.com/test/updated-repo.git");
        assertThat(response.defaultBranch()).isEqualTo("develop");
        assertThat(response.language()).isEqualTo("Kotlin");
        assertThat(response.status()).isEqualTo(ProjectStatus.ARCHIVED);
    }

    @Test
    @DisplayName("updateProject should succeed when user is ADMIN even if not owner")
    void testUpdateProjectSuccessAsAdmin() {
        UpdateProjectRequest request = new UpdateProjectRequest(
                "Admin Updated",
                "Admin desc",
                "https://github.com/test/repo.git",
                "main",
                "Java",
                null
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProjectResponse response = projectService.updateProject(adminPrincipal, projectId, request);

        assertThat(response.name()).isEqualTo("Admin Updated");
    }

    @Test
    @DisplayName("updateProject throws ProjectAccessDeniedException when user is not owner or admin")
    void testUpdateProjectAccessDenied() {
        UpdateProjectRequest request = new UpdateProjectRequest(
                "Hacked Name",
                null,
                "https://github.com/test/repo.git",
                "main",
                null,
                null
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> projectService.updateProject(otherPrincipal, projectId, request))
                .isInstanceOf(ProjectAccessDeniedException.class);

        verify(projectRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateProject throws ProjectNotFoundException when project not found")
    void testUpdateProjectNotFound() {
        UpdateProjectRequest request = new UpdateProjectRequest(
                "Name",
                null,
                "https://github.com/test/repo.git",
                "main",
                null,
                null
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.updateProject(ownerPrincipal, projectId, request))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    @DisplayName("getProjectById should return project when authorized")
    void testGetProjectByIdSuccess() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        ProjectResponse response = projectService.getProjectById(ownerPrincipal, projectId);

        assertThat(response.id()).isEqualTo(projectId);
        assertThat(response.name()).isEqualTo("DeployIntel Backend");
    }

    @Test
    @DisplayName("getUserProjects should filter by status when provided")
    void testGetUserProjectsWithStatus() {
        when(projectRepository.findByOwnerIdAndStatusOrderByCreatedAtDesc(owner.getId(), ProjectStatus.ACTIVE))
                .thenReturn(List.of(project));

        List<ProjectResponse> result = projectService.getUserProjects(owner.getId(), ProjectStatus.ACTIVE);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).status()).isEqualTo(ProjectStatus.ACTIVE);
    }

    @Test
    @DisplayName("archiveProject should change status to ARCHIVED")
    void testArchiveProject() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProjectResponse response = projectService.archiveProject(ownerPrincipal, projectId);

        assertThat(response.status()).isEqualTo(ProjectStatus.ARCHIVED);
    }

    @Test
    @DisplayName("createProjectFromGithub creates project from repository metadata")
    void testCreateProjectFromGithub() {
        CreateProjectFromGithubRequest request = new CreateProjectFromGithubRequest(
                "halim/deployintel",
                null,
                null,
                null,
                null
        );

        GithubRepoResponse repoDetails = new GithubRepoResponse(
                123L,
                "deployintel",
                "halim/deployintel",
                "Observability system",
                "https://github.com/halim/deployintel",
                "https://github.com/halim/deployintel.git",
                "main",
                "TypeScript",
                false,
                null
        );

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(githubRepositoryService.parseRepository("halim/deployintel"))
                .thenReturn(new GithubRepositoryService.RepoIdentifier("halim", "deployintel"));
        when(githubRepositoryService.getRepositoryDetails("halim", "deployintel", null))
                .thenReturn(repoDetails);
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project p = invocation.getArgument(0);
            p.setId(projectId);
            return p;
        });

        ProjectResponse response = projectService.createProjectFromGithub(owner.getId(), request, null);

        assertThat(response.name()).isEqualTo("deployintel");
        assertThat(response.description()).isEqualTo("Observability system");
        assertThat(response.repositoryUrl()).isEqualTo("https://github.com/halim/deployintel.git");
        assertThat(response.defaultBranch()).isEqualTo("main");
        assertThat(response.language()).isEqualTo("TypeScript");
    }

    @Test
    @DisplayName("getUserGithubRepositories throws if no token available")
    void testGetUserGithubRepositoriesNoToken() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> projectService.getUserGithubRepositories(owner.getId(), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No GitHub access token available");
    }

    @Test
    @DisplayName("getUserGithubRepositories returns repositories when token available")
    void testGetUserGithubRepositoriesSuccess() {
        owner.setGithubAccessToken("user-token");
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));

        GithubRepoResponse repo = new GithubRepoResponse(
                1L, "repo", "owner/repo", "desc", "url", "clone", "main", "Java", false, null
        );
        when(githubRepositoryService.getUserRepositories("user-token")).thenReturn(List.of(repo));

        List<GithubRepoResponse> repos = projectService.getUserGithubRepositories(owner.getId(), null);

        assertThat(repos).hasSize(1);
        assertThat(repos.get(0).name()).isEqualTo("repo");
    }
}
