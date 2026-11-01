package com.example.deployintel.gate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class K6CheckItem {
    private String name;
    private int passes;
    private int fails;
    private boolean passed;
}

