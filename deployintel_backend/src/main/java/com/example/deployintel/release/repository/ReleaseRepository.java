package com.example.deployintel.release.repository;

import com.example.deployintel.release.entity.Release;
import com.example.deployintel.release.entity.ReleaseEnvironment;
import com.example.deployintel.release.entity.ReleaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReleaseRepository extends JpaRepository<Release, UUID> {

    @Query("SELECT r FROM Release r LEFT JOIN FETCH r.project p LEFT JOIN FETCH p.owner LEFT JOIN FETCH r.author WHERE r.id = :id")
    Optional<Release> findByIdWithProjectAndAuthor(@Param("id") UUID id);

    List<Release> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    List<Release> findByProjectIdAndEnvironmentOrderByCreatedAtDesc(UUID projectId, ReleaseEnvironment environment);

    List<Release> findByProjectIdAndStatusOrderByCreatedAtDesc(UUID projectId, ReleaseStatus status);

    boolean existsByProjectIdAndVersionNumber(UUID projectId, String versionNumber);

    long countByProjectId(UUID projectId);
}
