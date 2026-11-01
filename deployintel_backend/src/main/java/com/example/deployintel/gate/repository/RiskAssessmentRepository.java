package com.example.deployintel.gate.repository;

import com.example.deployintel.gate.entity.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, UUID> {
    Optional<RiskAssessment> findFirstByDeploymentIdOrderByCalculatedAtDesc(UUID deploymentId);
}

