package com.example.deployintel.user.service;


import com.example.deployintel.auth.dto.UserResponse;
import com.example.deployintel.common.exception.UserNotFoundException;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserRole;
import com.example.deployintel.user.entity.UserStatus;
import com.example.deployintel.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.time.OffsetDateTime;
import com.example.deployintel.user.dto.UpdateProfileRequest;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public UserResponse assignRole(
            UUID userId,
            UserRole role
    ){
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new UserNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        user.setRole(role);

        User savedUser = userRepository.save(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                savedUser.getPhone(),
                savedUser.getStatus(),
                savedUser.getCreatedAt(),
                savedUser.getRole()
        );
    }

    @Transactional
    public UserResponse deactivateUser(UUID userId) {
        return updateUserStatus(userId, UserStatus.INACTIVE);
    }

    @Transactional
    public UserResponse blockUser(UUID userId) {
        return updateUserStatus(userId, UserStatus.BLOCKED);
    }

    @Transactional
    public UserResponse activateUser(UUID userId) {
        return updateUserStatus(userId, UserStatus.ACTIVE);
    }

    @Transactional
    public UserResponse updateUserStatus(UUID userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new UserNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        user.setStatus(status);
        user.setUpdatedAt(OffsetDateTime.now());

        User savedUser = userRepository.save(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                savedUser.getPhone(),
                savedUser.getStatus(),
                savedUser.getCreatedAt(),
                savedUser.getRole()
        );
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new UserNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }
        user.setUpdatedAt(OffsetDateTime.now());

        User savedUser = userRepository.save(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                savedUser.getPhone(),
                savedUser.getStatus(),
                savedUser.getCreatedAt(),
                savedUser.getRole()
        );
    }
}
