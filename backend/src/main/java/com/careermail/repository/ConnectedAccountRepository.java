package com.careermail.repository;

import com.careermail.model.entity.ConnectedAccount;
import com.careermail.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectedAccountRepository extends JpaRepository<ConnectedAccount, Long> {
    Optional<ConnectedAccount> findByUserAndProvider(User user, String provider);
    Optional<ConnectedAccount> findByProviderAndProviderAccountId(String provider, String providerAccountId);
    List<ConnectedAccount> findByUser(User user);
    void deleteByUserAndProvider(User user, String provider);
}
