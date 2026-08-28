package com.careermail.repository;

import com.careermail.model.entity.FollowUp;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.User;
import com.careermail.model.enums.FollowUpStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    List<FollowUp> findByUserOrderByDueDateAsc(User user);

    List<FollowUp> findByUserAndStatusOrderByDueDateAsc(User user, FollowUpStatus status);

    Optional<FollowUp> findByIdAndUser(Long id, User user);

    boolean existsByUserAndJobApplicationAndDueDate(User user, JobApplication jobApplication, LocalDate dueDate);

    List<FollowUp> findByJobApplication(JobApplication jobApplication);

    long countByUser(User user);

    long countByUserAndStatus(User user, FollowUpStatus status);
}
