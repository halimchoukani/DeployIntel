-- V13: Create tables for Test Runs, Test Results, Security Findings, Performance Metrics, Risk Assessments, and Risk Rules

-- 1. Deployments table (if not exists) to satisfy deployment_id foreign keys
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    environment VARCHAR(50) DEFAULT 'DEVELOPMENT',
    status VARCHAR(50) DEFAULT 'COMPLETED',
    version VARCHAR(50),
    commit_sha VARCHAR(100),
    branch VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_deployments_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments (project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments (created_at DESC);

-- 2. 7.7 TestRun
CREATE TABLE IF NOT EXISTS test_runs (
    id UUID PRIMARY KEY,
    deployment_id UUID,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_tests INT NOT NULL DEFAULT 0,
    passed_tests INT NOT NULL DEFAULT 0,
    failed_tests INT NOT NULL DEFAULT 0,
    skipped_tests INT NOT NULL DEFAULT 0,
    duration_ms BIGINT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    logs TEXT,

    CONSTRAINT fk_test_runs_deployment FOREIGN KEY (deployment_id) REFERENCES deployments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_test_runs_deployment_id ON test_runs (deployment_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_type ON test_runs (type);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs (status);
CREATE INDEX IF NOT EXISTS idx_test_runs_started_at ON test_runs (started_at DESC);

-- 3. 7.8 TestResult
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY,
    test_run_id UUID NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    severity VARCHAR(50),
    duration_ms BIGINT,
    error_message TEXT,
    stack_trace TEXT,

    CONSTRAINT fk_test_results_test_run FOREIGN KEY (test_run_id) REFERENCES test_runs (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_test_results_test_run_id ON test_results (test_run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results (status);

-- 4. 7.9 SecurityFinding
CREATE TABLE IF NOT EXISTS security_findings (
    id UUID PRIMARY KEY,
    deployment_id UUID,
    tool VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL,
    file_path TEXT,
    line_number INT,
    rule_id VARCHAR(100),
    remediation TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_security_findings_deployment FOREIGN KEY (deployment_id) REFERENCES deployments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_security_findings_deployment_id ON security_findings (deployment_id);
CREATE INDEX IF NOT EXISTS idx_security_findings_tool ON security_findings (tool);
CREATE INDEX IF NOT EXISTS idx_security_findings_severity ON security_findings (severity);
CREATE INDEX IF NOT EXISTS idx_security_findings_status ON security_findings (status);

-- 5. 7.10 PerformanceMetric
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY,
    deployment_id UUID,
    metric_name VARCHAR(100) NOT NULL,
    previous_value DECIMAL(12,4),
    current_value DECIMAL(12,4),
    unit VARCHAR(30),
    change_percent DECIMAL(8,2),
    threshold DECIMAL(12,4),
    status VARCHAR(50) NOT NULL,

    CONSTRAINT fk_performance_metrics_deployment FOREIGN KEY (deployment_id) REFERENCES deployments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_deployment_id ON performance_metrics (deployment_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics (metric_name);

-- 6. 7.11 RiskAssessment
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY,
    deployment_id UUID,
    security_score DECIMAL(5,2) NOT NULL,
    test_score DECIMAL(5,2) NOT NULL,
    performance_score DECIMAL(5,2) NOT NULL,
    regression_score DECIMAL(5,2) NOT NULL,
    final_score DECIMAL(5,2) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    rule_version VARCHAR(30) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_risk_assessments_deployment FOREIGN KEY (deployment_id) REFERENCES deployments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_deployment_id ON risk_assessments (deployment_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_calculated_at ON risk_assessments (calculated_at DESC);

-- 7. 7.12 RiskRule
CREATE TABLE IF NOT EXISTS risk_rules (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    threshold DECIMAL(8,2),
    severity VARCHAR(50),
    enabled BOOLEAN NOT NULL DEFAULT true,
    version VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_rules_category ON risk_rules (category);
CREATE INDEX IF NOT EXISTS idx_risk_rules_enabled ON risk_rules (enabled);

-- Default rules seed
INSERT INTO risk_rules (id, name, category, weight, threshold, severity, enabled, version, created_at)
VALUES
    (gen_random_uuid(), 'Critical Security Vulnerabilities', 'SECURITY', 40.00, 0.00, 'CRITICAL', true, 'v1.0', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'High Security Vulnerabilities', 'SECURITY', 25.00, 0.00, 'HIGH', true, 'v1.0', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'HTTP Error Rate SLA Threshold', 'PERFORMANCE', 20.00, 1.00, 'HIGH', true, 'v1.0', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'p95 Response Time SLA Threshold', 'PERFORMANCE', 15.00, 500.00, 'MEDIUM', true, 'v1.0', CURRENT_TIMESTAMP);

