package com.example.deployintel.user.controller;


import com.example.deployintel.auth.dto.UserResponse;
import com.example.deployintel.user.dto.AssignRoleRequest;
import com.example.deployintel.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import org.springframework.security.core.Authentication;
import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.user.dto.UpdateProfileRequest;
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PatchMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> assignRole(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignRoleRequest request
    ) {
        return ResponseEntity.ok(
                userService.assignRole(
                        userId,
                        request.role()
                )
        );
    }

    @PatchMapping("/{userId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> deactivateUser(
            @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(userService.deactivateUser(userId));
    }

    @PatchMapping("/{userId}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> blockUser(
            @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(userService.blockUser(userId));
    }

    @PatchMapping("/{userId}/activate-user")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> activateUser(
            @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(userService.activateUser(userId));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(userService.updateProfile(principal.getId(), request));
    }
}
