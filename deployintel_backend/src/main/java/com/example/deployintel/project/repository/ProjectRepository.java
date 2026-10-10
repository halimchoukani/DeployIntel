package com.example.deployintel.project.repository;

import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.entity.ProjectStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<Project> findByOwnerIdAndStatusOrderByCreatedAtDesc(UUID ownerId, ProjectStatus status);

    Optional<Project> findByIdAndOwnerId(UUID id, UUID ownerId);

    boolean existsByNameIgnoreCaseAndOwnerId(String name, UUID ownerId);

    long countByStatus(ProjectStatus status);

    long countByCreatedAtAfter(OffsetDateTime dateTime);

    long countByOwnerId(UUID ownerId);

    @Query("SELECT p FROM Project p JOIN FETCH p.owner WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:language IS NULL OR :language = '' OR LOWER(p.language) = LOWER(:language)) AND " +
           "(:ownerId IS NULL OR p.owner.id = :ownerId) " +
           "ORDER BY p.createdAt DESC")
    List<Project> searchProjects(
            @Param("search") String search,
            @Param("status") ProjectStatus status,
            @Param("language") String language,
            @Param("ownerId") UUID ownerId
    );

    @Query("SELECT p.language, COUNT(p) FROM Project p WHERE p.language IS NOT NULL AND p.language <> '' GROUP BY p.language ORDER BY COUNT(p) DESC")
    List<Object[]> countProjectsByLanguage();

    @Query("SELECT p.owner.id, p.owner.email, p.owner.firstName, p.owner.lastName, COUNT(p) " +
           "FROM Project p GROUP BY p.owner.id, p.owner.email, p.owner.firstName, p.owner.lastName " +
           "ORDER BY COUNT(p) DESC")
    List<Object[]> findTopProjectOwners(Pageable pageable);
}
