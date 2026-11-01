package com.example.deployintel.gate.controller;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.GlobalExceptionHandler;
import com.example.deployintel.gate.dto.GateCheckResponse;
import com.example.deployintel.gate.dto.K6CheckResponse;
import com.example.deployintel.gate.service.GateService;
import com.example.deployintel.user.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class GateControllerTest {

    private MockMvc mockMvc;

    @Mock
    private GateService gateService;

    @InjectMocks
    private GateController gateController;

    private UserPrincipal principal;
    private Authentication authentication;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(gateController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        UUID userId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        principal = new UserPrincipal(userId, "user@example.com", UserRole.DEVELOPER);
        authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    @DisplayName("POST /api/v1/projects/{projectId}/gate/semgrep - Success")
    void testRunSemgrepGateCheck() throws Exception {
        GateCheckResponse response = GateCheckResponse.builder()
                .projectId(projectId.toString())
                .projectName("Checkout Engine")
                .verdict("PASSED")
                .passed(true)
                .summaryMessage("Clean scan")
                .totalFindings(0)
                .errorCount(0)
                .warningCount(0)
                .infoCount(0)
                .scannedFilesCount(10)
                .rulesCount(254)
                .scanDurationSeconds(2.4)
                .timestamp(OffsetDateTime.now())
                .findings(Collections.emptyList())
                .build();

        when(gateService.runSemgrepCheck(any(UserPrincipal.class), eq(projectId))).thenReturn(response);

        mockMvc.perform(post("/api/v1/projects/{projectId}/gate/semgrep", projectId)
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verdict").value("PASSED"))
                .andExpect(jsonPath("$.passed").value(true))
                .andExpect(jsonPath("$.totalFindings").value(0));
    }

    @Test
    @DisplayName("POST /api/v1/projects/{projectId}/gate/k6 - Success")
    void testRunK6PerformanceCheck() throws Exception {
        K6CheckResponse response = K6CheckResponse.builder()
                .projectId(projectId.toString())
                .projectName("Checkout Engine")
                .verdict("PASSED")
                .passed(true)
                .summaryMessage("Performance gate passed")
                .targetUrl("https://test.k6.io")
                .vus(5)
                .totalRequests(100)
                .requestsPerSecond(33.3)
                .p95DurationMs(220.0)
                .failedRequestRate(0.0)
                .timestamp(OffsetDateTime.now())
                .checks(Collections.emptyList())
                .build();

        when(gateService.runK6PerformanceCheck(any(UserPrincipal.class), eq(projectId))).thenReturn(response);

        mockMvc.perform(post("/api/v1/projects/{projectId}/gate/k6", projectId)
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verdict").value("PASSED"))
                .andExpect(jsonPath("$.passed").value(true))
                .andExpect(jsonPath("$.totalRequests").value(100))
                .andExpect(jsonPath("$.p95DurationMs").value(220.0));
    }
}
