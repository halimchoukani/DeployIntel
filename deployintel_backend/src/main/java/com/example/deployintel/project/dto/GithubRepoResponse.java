package com.example.deployintel.project.dto;

public record GithubRepoResponse(
        Long id,
        String name,
        String fullName,
        String description,
        String htmlUrl,
        String cloneUrl,
        String defaultBranch,
        String language,
        boolean isPrivate,
        String updatedAt
) {}
