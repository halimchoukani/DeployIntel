package com.example.deployintel.admin.service;

import com.example.deployintel.admin.dto.AdminKpiResponse;
import com.example.deployintel.admin.dto.AdminProjectResponse;
import com.example.deployintel.admin.dto.AdminUserResponse;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.common.exception.UserNotFoundException;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.entity.ProjectStatus;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.user.entity.AuthProvider;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.entity.UserStatus;
import com.example.deployintel.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    // ─── User Accessibility Management ──────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers(String search, UserStatus status, UserRole role) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        List<User> users = userRepository.searchUsers(cleanSearch, status, role);

        return users.stream()
                .map(u -> {
                    long projectCount = projectRepository.countByOwnerId(u.getId());
                    return AdminUserResponse.fromUser(u, projectCount);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        long projectCount = projectRepository.countByOwnerId(user.getId());
        return AdminUserResponse.fromUser(user, projectCount);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(UUID userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        user.setStatus(status);
        user.setUpdatedAt(OffsetDateTime.now());

        User savedUser = userRepository.save(user);
        long projectCount = projectRepository.countByOwnerId(savedUser.getId());
        return AdminUserResponse.fromUser(savedUser, projectCount);
    }

    @Transactional
    public AdminUserResponse blockUser(UUID userId) {
        return updateUserStatus(userId, UserStatus.BLOCKED);
    }

    @Transactional
    public AdminUserResponse activateUser(UUID userId) {
        return updateUserStatus(userId, UserStatus.ACTIVE);
    }

    @Transactional
    public AdminUserResponse updateUserRole(UUID userId, UserRole role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        user.setRole(role);
        user.setUpdatedAt(OffsetDateTime.now());

        User savedUser = userRepository.save(user);
        long projectCount = projectRepository.countByOwnerId(savedUser.getId());
        return AdminUserResponse.fromUser(savedUser, projectCount);
    }

    // ─── Project Control Management ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminProjectResponse> getAllProjects(
            String search,
            ProjectStatus status,
            String language,
            UUID ownerId
    ) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        String cleanLanguage = (language != null && !language.isBlank()) ? language.trim() : null;

        List<Project> projects = projectRepository.searchProjects(cleanSearch, status, cleanLanguage, ownerId);

        return projects.stream()
                .map(AdminProjectResponse::fromProject)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminProjectResponse getProjectById(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + projectId));

        return AdminProjectResponse.fromProject(project);
    }

    @Transactional
    public AdminProjectResponse updateProjectStatus(UUID projectId, ProjectStatus status) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + projectId));

        project.setStatus(status);
        project.setUpdatedAt(OffsetDateTime.now());

        Project savedProject = projectRepository.save(project);
        return AdminProjectResponse.fromProject(savedProject);
    }

    @Transactional
    public AdminProjectResponse archiveProject(UUID projectId) {
        return updateProjectStatus(projectId, ProjectStatus.ARCHIVED);
    }

    @Transactional
    public AdminProjectResponse activateProject(UUID projectId) {
        return updateProjectStatus(projectId, ProjectStatus.ACTIVE);
    }

    @Transactional
    public void deleteProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + projectId));

        projectRepository.delete(project);
    }

    // ─── KPI Grabbing ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminKpiResponse getKpis() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime sevenDaysAgo = now.minusDays(7);
        OffsetDateTime thirtyDaysAgo = now.minusDays(30);

        // User metrics
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long blockedUsers = userRepository.countByStatus(UserStatus.BLOCKED);
        long inactiveUsers = userRepository.countByStatus(UserStatus.INACTIVE);
        long adminUsers = userRepository.countByRole(UserRole.ADMIN);
        long developerUsers = userRepository.countByRole(UserRole.DEVELOPER);
        long githubUsers = userRepository.countByGithubAccessTokenIsNotNull();
        long localUsers = userRepository.countByProvider(AuthProvider.LOCAL);
        long newUsers7Days = userRepository.countByCreatedAtAfter(sevenDaysAgo);
        long newUsers30Days = userRepository.countByCreatedAtAfter(thirtyDaysAgo);

        AdminKpiResponse.UserKpis userKpis = new AdminKpiResponse.UserKpis(
                totalUsers,
                activeUsers,
                blockedUsers,
                inactiveUsers,
                adminUsers,
                developerUsers,
                githubUsers,
                localUsers,
                newUsers7Days,
                newUsers30Days
        );

        // Project metrics
        long totalProjects = projectRepository.count();
        long activeProjects = projectRepository.countByStatus(ProjectStatus.ACTIVE);
        long archivedProjects = projectRepository.countByStatus(ProjectStatus.ARCHIVED);
        long newProjects7Days = projectRepository.countByCreatedAtAfter(sevenDaysAgo);
        long newProjects30Days = projectRepository.countByCreatedAtAfter(thirtyDaysAgo);
        double avgProjectsPerUser = totalUsers > 0
                ? Math.round(((double) totalProjects / totalUsers) * 100.0) / 100.0
                : 0.0;

        // Languages breakdown
        Map<String, Long> projectsByLanguage = new LinkedHashMap<>();
        List<Object[]> languageRows = projectRepository.countProjectsByLanguage();
        if (languageRows != null) {
            for (Object[] row : languageRows) {
                if (row.length >= 2 && row[0] != null) {
                    String lang = row[0].toString();
                    Long count = ((Number) row[1]).longValue();
                    projectsByLanguage.put(lang, count);
                }
            }
        }

        AdminKpiResponse.ProjectKpis projectKpis = new AdminKpiResponse.ProjectKpis(
                totalProjects,
                activeProjects,
                archivedProjects,
                newProjects7Days,
                newProjects30Days,
                avgProjectsPerUser,
                projectsByLanguage
        );

        // Overview
        double activeUsersRate = totalUsers > 0
                ? Math.round(((double) activeUsers / totalUsers * 100.0) * 10.0) / 10.0
                : 0.0;
        double activeProjectsRate = totalProjects > 0
                ? Math.round(((double) activeProjects / totalProjects * 100.0) * 10.0) / 10.0
                : 0.0;

        AdminKpiResponse.PlatformOverview overview = new AdminKpiResponse.PlatformOverview(
                totalUsers,
                totalProjects,
                activeUsersRate,
                activeProjectsRate
        );

        // Top contributors
        List<AdminKpiResponse.TopContributor> topContributors = new ArrayList<>();
        List<Object[]> contributorRows = projectRepository.findTopProjectOwners(PageRequest.of(0, 5));
        if (contributorRows != null) {
            for (Object[] row : contributorRows) {
                if (row.length >= 5 && row[0] != null) {
                    UUID id = (UUID) row[0];
                    String email = row[1] != null ? row[1].toString() : "";
                    String firstName = row[2] != null ? row[2].toString() : "";
                    String lastName = row[3] != null ? row[3].toString() : "";
                    String name = (firstName + " " + lastName).trim();
                    if (name.isEmpty()) {
                        name = email;
                    }
                    long count = ((Number) row[4]).longValue();
                    topContributors.add(new AdminKpiResponse.TopContributor(id, email, name, count));
                }
            }
        }

        return new AdminKpiResponse(
                userKpis,
                projectKpis,
                overview,
                topContributors,
                now
        );
    }
}
