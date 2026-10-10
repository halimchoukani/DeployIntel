package com.example.deployintel.user.repository;

import com.example.deployintel.user.entity.AuthProvider;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
    boolean existsByEmail(String email);

    long countByStatus(UserStatus status);
    long countByRole(UserRole role);
    long countByProvider(AuthProvider provider);
    long countByCreatedAtAfter(OffsetDateTime dateTime);
    long countByGithubAccessTokenIsNotNull();

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:role IS NULL OR u.role = :role) " +
           "ORDER BY u.createdAt DESC")
    List<User> searchUsers(
            @Param("search") String search,
            @Param("status") UserStatus status,
            @Param("role") UserRole role
    );
}
