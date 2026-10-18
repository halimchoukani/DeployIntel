package com.example.deployintel.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request to push a GitHub Actions workflow file to the project's repository.
 */
public record WorkflowPushRequest(

        /**
         * The YAML content to write to .github/workflows/deployintel-release.yml
         */
        @NotBlank(message = "workflowContent must not be blank")
        String workflowContent,

        /**
         * Optional commit message. Defaults to "ci: add DeployIntel release workflow" if omitted.
         */
        @Size(max = 200)
        String commitMessage,

        /**
         * Optional GitHub Personal Access Token (PAT). When provided it takes precedence
         * over the token stored on the user's account. Useful for users who signed up
         * with email/password and haven't connected GitHub via OAuth.
         */
        String githubToken
) {}
