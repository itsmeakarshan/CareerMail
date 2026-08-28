package com.careermail.repository;

import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.User;
import com.careermail.model.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByUser(User user);

    List<JobApplication> findByUserOrderByDateAppliedDesc(User user);

    List<JobApplication> findByUserAndStatus(User user, ApplicationStatus status);

    Optional<JobApplication> findByIdAndUser(Long id, User user);

    Optional<JobApplication> findTopByUserAndCompanyIgnoreCase(User user, String company);

    long countByUser(User user);

    long countByUserAndStatus(User user, ApplicationStatus status);

    @Query("SELECT COUNT(j) FROM JobApplication j WHERE j.user = :user AND j.dateApplied >= :sinceDate")
    long countByUserAndDateAppliedAfter(@Param("user") User user, @Param("sinceDate") LocalDate sinceDate);

    @Query("SELECT j FROM JobApplication j WHERE j.user = :user AND (" +
           "LOWER(j.company) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(j.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(j.recruiterName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(j.location) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY j.dateApplied DESC")
    List<JobApplication> searchApplications(@Param("user") User user, @Param("query") String query);
}
