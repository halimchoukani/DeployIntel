package com.example.deployintel.gate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SemgrepFinding {
    private String checkId;
    private String path;
    private Integer startLine;
    private Integer startCol;
    private Integer endLine;
    private Integer endCol;
    private String severity;
    private String message;
    private String category;
    private List<String> cwe;
    private List<String> owasp;
    private String impact;
    private String confidence;
    private String shortlink;
}

