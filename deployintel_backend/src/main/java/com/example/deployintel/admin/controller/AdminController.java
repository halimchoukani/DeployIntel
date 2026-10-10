package com.example.deployintel.admin.controller;

import com.example.deployintel.admin.dto.*;
import com.example.deployintel.admin.service.AdminService;
import com.example.deployintel.project.entity.ProjectStatus;
import com.example.deployintel.user.dto.AssignRoleRequest;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.entity.UserStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ─── User Management ─────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) UserRole role
    ) {
        List<AdminUserResponse> users = adminService.getAllUsers(search, status, role);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable UUID userId) {
        AdminUserResponse user = adminService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        AdminUserResponse updatedUser = adminService.updateUserStatus(userId, request.status());
        return ResponseEntity.ok(updatedUser);
    }

    @PatchMapping("/users/{userId}/block")
    public ResponseEntity<AdminUserResponse> blockUser(@PathVariable UUID userId) {
        AdminUserResponse blockedUser = adminService.blockUser(userId);
        return ResponseEntity.ok(blockedUser);
    }

    @PatchMapping("/users/{userId}/activate")
    public ResponseEntity<AdminUserResponse> activateUser(@PathVariable UUID userId) {
        AdminUserResponse activatedUser = adminService.activateUser(userId);
        return ResponseEntity.ok(activatedUser);
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignRoleRequest request
    ) {
        AdminUserResponse updatedUser = adminService.updateUserRole(userId, request.role());
        return ResponseEntity.ok(updatedUser);
    }

    // ─── Project Management ──────────────────────────────────────────────────

    @GetMapping("/projects")
    public ResponseEntity<List<AdminProjectResponse>> getAllProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) UUID ownerId
    ) {
        List<AdminProjectResponse> projects = adminService.getAllProjects(search, status, language, ownerId);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<AdminProjectResponse> getProjectById(@PathVariable UUID projectId) {
        AdminProjectResponse project = adminService.getProjectById(projectId);
        return ResponseEntity.ok(project);
    }

    @PatchMapping("/projects/{projectId}/status")
    public ResponseEntity<AdminProjectResponse> updateProjectStatus(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectStatusRequest request
    ) {
        AdminProjectResponse updatedProject = adminService.updateProjectStatus(projectId, request.status());
        return ResponseEntity.ok(updatedProject);
    }

    @PatchMapping("/projects/{projectId}/archive")
    public ResponseEntity<AdminProjectResponse> archiveProject(@PathVariable UUID projectId) {
        AdminProjectResponse archivedProject = adminService.archiveProject(projectId);
        return ResponseEntity.ok(archivedProject);
    }

    @PatchMapping("/projects/{projectId}/activate")
    public ResponseEntity<AdminProjectResponse> activateProject(@PathVariable UUID projectId) {
        AdminProjectResponse activatedProject = adminService.activateProject(projectId);
        return ResponseEntity.ok(activatedProject);
    }

    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID projectId) {
        adminService.deleteProject(projectId);
        return ResponseEntity.noContent().build();
    }

    // ─── KPI Grabbing ────────────────────────────────────────────────────────

    @GetMapping(path = {"/kpis", "/kpi"})
    public ResponseEntity<AdminKpiResponse> getKpis() {
        AdminKpiResponse kpis = adminService.getKpis();
        return ResponseEntity.ok(kpis);
    }
}
