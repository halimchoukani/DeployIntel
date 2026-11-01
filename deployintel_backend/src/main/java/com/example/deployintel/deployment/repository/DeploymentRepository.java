package com.example.deployintel.deployment.repository;

import com.example.deployintel.deployment.entity.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, UUID> {
    List<Deployment> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    Optional<Deployment> findFirstByProjectIdOrderByCreatedAtDesc(UUID projectId);
}

