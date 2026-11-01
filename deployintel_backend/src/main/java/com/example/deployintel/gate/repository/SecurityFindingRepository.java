package com.example.deployintel.gate.repository;

import com.example.deployintel.gate.entity.FindingStatus;
import com.example.deployintel.gate.entity.SecurityFinding;
import com.example.deployintel.gate.entity.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SecurityFindingRepository extends JpaRepository<SecurityFinding, UUID> {
    List<SecurityFinding> findByDeploymentIdOrderByCreatedAtDesc(UUID deploymentId);
    List<SecurityFinding> findByDeploymentIdAndSeverity(UUID deploymentId, Severity severity);
    List<SecurityFinding> findByDeploymentIdAndStatus(UUID deploymentId, FindingStatus status);
}

