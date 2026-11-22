package com.example.deployintel.project.member.repository;

import com.example.deployintel.project.member.entity.InvitationStatus;
import com.example.deployintel.project.member.entity.ProjectInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {

    @Query("SELECT pi FROM ProjectInvitation pi JOIN FETCH pi.invitedBy WHERE pi.project.id = :projectId AND pi.status = :status ORDER BY pi.createdAt DESC")
    List<ProjectInvitation> findByProjectIdAndStatusWithInviter(@Param("projectId") UUID projectId, @Param("status") InvitationStatus status);

    @Query("SELECT pi FROM ProjectInvitation pi JOIN FETCH pi.project p JOIN FETCH pi.invitedBy WHERE LOWER(pi.email) = LOWER(:email) AND pi.status = :status ORDER BY pi.createdAt DESC")
    List<ProjectInvitation> findByEmailAndStatusWithProject(@Param("email") String email, @Param("status") InvitationStatus status);

    Optional<ProjectInvitation> findByProjectIdAndEmailIgnoreCaseAndStatus(UUID projectId, String email, InvitationStatus status);

    Optional<ProjectInvitation> findByToken(String token);
}
