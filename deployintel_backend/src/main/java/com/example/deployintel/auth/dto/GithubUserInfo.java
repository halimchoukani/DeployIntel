package com.example.deployintel.auth.dto;

public record GithubUserInfo(
        String id,
        String login,
        String name,
        String email,
        String avatarUrl
) {
}
