package com.example.deployintel.environment.repository;

import com.example.deployintel.environment.entity.TestEnvironment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestEnvironmentRepository extends JpaRepository<TestEnvironment, UUID> {

    List<TestEnvironment> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Optional<TestEnvironment> findByIdAndProjectId(UUID id, UUID projectId);

    Optional<TestEnvironment> findByContainerId(String containerId);

    boolean existsByContainerId(String containerId);
}
