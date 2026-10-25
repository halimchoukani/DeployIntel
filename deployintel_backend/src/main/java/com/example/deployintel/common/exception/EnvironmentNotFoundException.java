package com.example.deployintel.common.exception;

public class EnvironmentNotFoundException extends RuntimeException {
    public EnvironmentNotFoundException(String message) {
        super(message);
    }
}
