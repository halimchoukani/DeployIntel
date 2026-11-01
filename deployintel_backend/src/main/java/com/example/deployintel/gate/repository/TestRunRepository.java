package com.example.deployintel.gate.repository;

import com.example.deployintel.gate.entity.TestRun;
import com.example.deployintel.gate.entity.TestRunType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TestRunRepository extends JpaRepository<TestRun, UUID> {
    List<TestRun> findByDeploymentIdOrderByStartedAtDesc(UUID deploymentId);
    List<TestRun> findByDeploymentIdAndTypeOrderByStartedAtDesc(UUID deploymentId, TestRunType type);
}

