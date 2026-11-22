package com.example.deployintel.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OllamaGenerateRequest {
    private String model;
    private String prompt;
    private String system;
    @Builder.Default
    private boolean stream = false;
    private Map<String, Object> options;
}
