package com.careermail.repository;

import com.careermail.model.entity.Email;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.User;
import com.careermail.model.enums.EmailFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailRepository extends JpaRepository<Email, Long> {
    List<Email> findByUserAndFolderOrderByTimestampDesc(User user, EmailFolder folder);

    List<Email> findByUserOrderByTimestampDesc(User user);

    List<Email> findByUserOrderByTimestampAsc(User user);

    List<Email> findByUserAndJobApplication(User user, JobApplication jobApplication);

    List<Email> findByUserAndIsStarredTrueOrderByTimestampDesc(User user);

    List<Email> findByUserAndIsImportantTrueOrderByTimestampDesc(User user);

    Optional<Email> findByIdAndUser(Long id, User user);

    boolean existsByUserAndGmailMessageId(User user, String gmailMessageId);

    Optional<Email> findByUserAndGmailMessageId(User user, String gmailMessageId);

    List<Email> findByUserAndGmailThreadId(User user, String gmailThreadId);

    List<Email> findByJobApplicationOrderByTimestampDesc(JobApplication jobApplication);

    long countByUser(User user);

    long countByUserAndFolder(User user, EmailFolder folder);

    long countByUserAndFolderAndIsReadFalse(User user, EmailFolder folder);

    long countByUserAndIsImportantTrue(User user);

    long countByUserAndIsStarredTrue(User user);

    long countByUserAndIsJobRelatedTrue(User user);

    @Modifying
    @Query("UPDATE Email e SET e.jobApplication = null WHERE e.jobApplication = :jobApplication")
    void dissociateJobApplication(@Param("jobApplication") JobApplication jobApplication);

    @Query("SELECT e FROM Email e WHERE e.user = :user AND (" +
           "LOWER(e.subject) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.sender) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.body) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY e.timestamp DESC")
    List<Email> searchEmails(@Param("user") User user, @Param("query") String query);
}
