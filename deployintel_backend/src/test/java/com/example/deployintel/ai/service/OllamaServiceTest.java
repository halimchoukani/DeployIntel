package com.example.deployintel.ai.service;

import com.example.deployintel.ai.config.OllamaProperties;
import com.example.deployintel.gate.dto.GateCheckResponse;
import com.example.deployintel.gate.dto.K6CheckItem;
import com.example.deployintel.gate.dto.K6CheckResponse;
import com.example.deployintel.gate.dto.SemgrepFinding;
import com.example.deployintel.project.entity.Project;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class OllamaServiceTest {

    private OllamaProperties properties;
    private OllamaService ollamaService;

    @BeforeEach
    void setUp() {
        properties = new OllamaProperties();
        properties.setEnabled(false); // Disable live HTTP network calls in unit tests
        properties.setBaseUrl("http://localhost:11434");
        properties.setModel("qwen2.5-coder:7b");
        ollamaService = new OllamaService(properties, new ObjectMapper());
    }

    @Test
    @DisplayName("isAvailable should return false when ollama is disabled")
    void testIsAvailableWhenDisabled() {
        assertThat(ollamaService.isAvailable()).isFalse();
    }

    @Test
    @DisplayName("generateText should gracefully return null when disabled")
    void testGenerateTextWhenDisabled() {
        String result = ollamaService.generateText("system prompt", "user prompt");
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("analyzeSecurityReport should return null when disabled or report is null")
    void testAnalyzeSecurityReportWhenDisabled() {
        Project project = Project.builder()
                .id(UUID.randomUUID())
                .name("Checkout Engine")
                .language("TypeScript")
                .build();

        GateCheckResponse report = GateCheckResponse.builder()
                .projectId(project.getId().toString())
                .verdict("FAILED")
                .totalFindings(1)
                .findings(List.of(
                        SemgrepFinding.builder()
                                .checkId("security.hardcoded-jwt")
                                .path("src/auth.ts")
                                .startLine(42)
                                .message("Hardcoded token detected")
                                .severity("ERROR")
                                .build()
                ))
                .build();

        String suggestion = ollamaService.analyzeSecurityReport(project, report);
        assertThat(suggestion).isNull();
    }

    @Test
    @DisplayName("analyzePerformanceReport should return null when disabled or report is null")
    void testAnalyzePerformanceReportWhenDisabled() {
        Project project = Project.builder()
                .id(UUID.randomUUID())
                .name("Payment Gateway")
                .build();

        K6CheckResponse report = K6CheckResponse.builder()
                .projectId(project.getId().toString())
                .verdict("PASSED")
                .totalRequests(100)
                .p95DurationMs(250.0)
                .failedRequestRate(0.0)
                .checks(List.of(K6CheckItem.builder().name("status 200").passed(true).build()))
                .build();

        String suggestion = ollamaService.analyzePerformanceReport(project, report);
        assertThat(suggestion).isNull();
    }
}
