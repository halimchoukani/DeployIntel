package com.example.deployintel.gate.repository;

import com.example.deployintel.gate.entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, UUID> {
    List<TestResult> findByTestRunId(UUID testRunId);
}

