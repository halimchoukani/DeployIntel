package com.example.deployintel.auth.service;

import com.example.deployintel.auth.dto.LoginRequest;
import com.example.deployintel.auth.dto.LoginResponse;
import com.example.deployintel.auth.dto.RegisterRequest;
import com.example.deployintel.auth.dto.UserResponse;
import com.example.deployintel.auth.security.JwtService;
import com.example.deployintel.user.entity.User;
import com.example.deployintel.user.entity.UserStatus;
import com.example.deployintel.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private GithubOAuth2Service githubOAuth2Service;


    @Transactional
    public UserResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        String passwordHash =
                passwordEncoder.encode(request.password());

        User user = User.create(
                request.email(),
                passwordHash,
                request.firstName(),
                request.lastName(),
                request.phone()
        );

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

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        User user = userRepository
                .findByEmail(request.email())
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid email or password")
                );

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new IllegalArgumentException("User account is blocked");
        }
        if (!user.getStatus().equals(UserStatus.ACTIVE)) {
            throw new IllegalArgumentException("User account is inactive");
        }
        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new IllegalArgumentException(
                    "Invalid email or password"
            );
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole()
        );

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                token,
                "Bearer"
        );
    }

    @Transactional
    public LoginResponse loginWithGithub(String code, String redirectUri) {
        String accessToken = githubOAuth2Service.exchangeCodeForAccessToken(code, redirectUri);
        var userInfo = githubOAuth2Service.getGithubUserInfo(accessToken);

        String email = userInfo.email();
        if (email == null || email.isBlank()) {
            email = githubOAuth2Service.fetchPrimaryEmail(accessToken, userInfo.id(), userInfo.login());
        }

        User user = githubOAuth2Service.findOrCreateUser(userInfo, email, accessToken);

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new IllegalArgumentException("User account is blocked");
        }
        if (!user.getStatus().equals(UserStatus.ACTIVE)) {
            throw new IllegalArgumentException("User account is inactive");
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole()
        );

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                token,
                "Bearer"
        );
    }

    public LoginResponse loginWithGithub(String code) {
        return loginWithGithub(code, null);
    }
}