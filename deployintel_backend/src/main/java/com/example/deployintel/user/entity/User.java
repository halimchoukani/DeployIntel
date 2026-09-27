package com.example.deployintel.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_users_email",
                        columnNames = "email"
                )
        }
)
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(length = 30)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "provider_id", length = 100)
    private String providerId;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public User() {
    }

    public static User create(
            String email,
            String passwordHash,
            String firstName,
            String lastName,
            String phone
    ) {
        User user = new User();

        user.email = email;
        user.passwordHash = passwordHash;
        user.firstName = firstName;
        user.lastName = lastName;
        user.phone = phone;
        user.status = UserStatus.ACTIVE;
        user.role = UserRole.DEVELOPER;
        user.provider = AuthProvider.LOCAL;

        OffsetDateTime now = OffsetDateTime.now();
        user.createdAt = now;
        user.updatedAt = now;
        return user;
    }

    public static User createOAuth2User(
            String email,
            String firstName,
            String lastName,
            AuthProvider provider,
            String providerId,
            String avatarUrl
    ) {
        User user = new User();

        user.email = email;
        user.passwordHash = null;
        user.firstName = firstName;
        user.lastName = lastName;
        user.phone = null;
        user.status = UserStatus.ACTIVE;
        user.role = UserRole.DEVELOPER;
        user.provider = provider;
        user.providerId = providerId;
        user.avatarUrl = avatarUrl;

        OffsetDateTime now = OffsetDateTime.now();
        user.createdAt = now;
        user.updatedAt = now;
        return user;
    }
}
