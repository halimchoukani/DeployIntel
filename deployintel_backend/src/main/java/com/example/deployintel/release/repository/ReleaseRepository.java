package com.example.deployintel.release.repository;

import com.example.deployintel.release.entity.Release;
import com.example.deployintel.release.entity.ReleaseEnvironment;
import com.example.deployintel.release.entity.ReleaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReleaseRepository extends JpaRepository<Release, UUID> {

    List<Release> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    List<Release> findByProjectIdAndEnvironmentOrderByCreatedAtDesc(UUID projectId, ReleaseEnvironment environment);

    List<Release> findByProjectIdAndStatusOrderByCreatedAtDesc(UUID projectId, ReleaseStatus status);

    boolean existsByProjectIdAndVersionNumber(UUID projectId, String versionNumber);

    long countByProjectId(UUID projectId);
}
