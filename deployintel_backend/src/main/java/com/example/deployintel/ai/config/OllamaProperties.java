package com.example.deployintel.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "ollama")
public class OllamaProperties {

    /**
     * Whether local Ollama integration is enabled.
     */
    private boolean enabled = true;

    /**
     * Base URL for the Ollama server (e.g., http://localhost:11434).
     */
    private String baseUrl = "http://localhost:11434";

    /**
     * Ollama model name to use for test analysis (e.g. qwen2.5-coder:7b, llama3, codellama).
     */
    private String model = "qwen2.5-coder:7b";

    /**
     * HTTP connect timeout in milliseconds.
     */
    private int connectTimeoutMs = 5000;

    /**
     * HTTP read/response timeout in milliseconds.
     */
    private int readTimeoutMs = 60000;
}
