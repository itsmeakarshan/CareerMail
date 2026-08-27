package com.careermail.repository;

import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.TimelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimelineEventRepository extends JpaRepository<TimelineEvent, Long> {
    List<TimelineEvent> findByJobApplicationOrderByEventDateDesc(JobApplication jobApplication);
}
