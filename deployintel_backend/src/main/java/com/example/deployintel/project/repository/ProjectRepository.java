package com.example.deployintel.project.repository;

import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<Project> findByOwnerIdAndStatusOrderByCreatedAtDesc(UUID ownerId, ProjectStatus status);

    Optional<Project> findByIdAndOwnerId(UUID id, UUID ownerId);

    boolean existsByNameIgnoreCaseAndOwnerId(String name, UUID ownerId);
}
