package com.example.deployintel.project.member.entity;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

public enum ProjectRole {
    OWNER(EnumSet.allOf(ProjectPermission.class)),

    MAINTAINER(EnumSet.of(
            ProjectPermission.VIEW_PROJECT,
            ProjectPermission.TRIGGER_GATES,
            ProjectPermission.MANAGE_RELEASES,
            ProjectPermission.MANAGE_ENVIRONMENTS,
            ProjectPermission.MANAGE_MEMBERS,
            ProjectPermission.MANAGE_SETTINGS
    )),

    DEVELOPER(EnumSet.of(
            ProjectPermission.VIEW_PROJECT,
            ProjectPermission.TRIGGER_GATES,
            ProjectPermission.MANAGE_RELEASES,
            ProjectPermission.MANAGE_ENVIRONMENTS
    )),

    VIEWER(EnumSet.of(
            ProjectPermission.VIEW_PROJECT
    ));

    private final Set<ProjectPermission> permissions;

    ProjectRole(Set<ProjectPermission> permissions) {
        this.permissions = Collections.unmodifiableSet(permissions);
    }

    public Set<ProjectPermission> getPermissions() {
        return permissions;
    }

    public boolean hasPermission(ProjectPermission permission) {
        return permissions.contains(permission);
    }
}
