package com.example.deployintel.admin.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record AdminKpiResponse(
        UserKpis userKpis,
        ProjectKpis projectKpis,
        PlatformOverview overview,
        List<TopContributor> topContributors,
        OffsetDateTime generatedAt
) {
    public record UserKpis(
            long totalUsers,
            long activeUsers,
            long blockedUsers,
            long inactiveUsers,
            long adminUsers,
            long developerUsers,
            long githubConnectedUsers,
            long localUsers,
            long newUsersLast7Days,
            long newUsersLast30Days
    ) {}

    public record ProjectKpis(
            long totalProjects,
            long activeProjects,
            long archivedProjects,
            long newProjectsLast7Days,
            long newProjectsLast30Days,
            double averageProjectsPerUser,
            Map<String, Long> projectsByLanguage
    ) {}

    public record PlatformOverview(
            long totalUsers,
            long totalProjects,
            double activeUsersRate,
            double activeProjectsRate
    ) {}

    public record TopContributor(
            UUID userId,
            String email,
            String name,
            long projectCount
    ) {}
}
