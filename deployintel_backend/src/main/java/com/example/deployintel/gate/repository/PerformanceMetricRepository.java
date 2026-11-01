package com.example.deployintel.gate.repository;

import com.example.deployintel.gate.entity.PerformanceMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PerformanceMetricRepository extends JpaRepository<PerformanceMetric, UUID> {
    List<PerformanceMetric> findByDeploymentId(UUID deploymentId);
}

