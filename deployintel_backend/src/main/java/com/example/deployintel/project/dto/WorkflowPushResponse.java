package com.example.deployintel.project.dto;

/**
 * Result of pushing a workflow file to GitHub.
 */
public record WorkflowPushResponse(
        /** The path of the file that was created or updated in the repository. */
        String filePath,

        /** The SHA of the commit that created or updated the file. */
        String commitSha,

        /** The URL of the commit on GitHub. */
        String commitUrl,

        /** Whether the file was newly created (true) or updated (false). */
        boolean created
) {}
