package com.example.deployintel.gate.repository;

import com.example.deployintel.gate.entity.RiskRule;
import com.example.deployintel.gate.entity.RuleCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RiskRuleRepository extends JpaRepository<RiskRule, UUID> {
    List<RiskRule> findByEnabledTrue();
    List<RiskRule> findByCategoryAndEnabledTrue(RuleCategory category);
}

