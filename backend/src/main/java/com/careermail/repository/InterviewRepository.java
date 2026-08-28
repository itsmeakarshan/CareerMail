package com.careermail.repository;

import com.careermail.model.entity.Interview;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.User;
import com.careermail.model.enums.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByUserOrderByInterviewDateAsc(User user);

    List<Interview> findByUserAndStatusOrderByInterviewDateAsc(User user, InterviewStatus status);

    Optional<Interview> findByIdAndUser(Long id, User user);

    boolean existsByUserAndJobApplicationAndInterviewDate(User user, JobApplication jobApplication, LocalDateTime interviewDate);

    List<Interview> findByJobApplication(JobApplication jobApplication);

    long countByUser(User user);
}
