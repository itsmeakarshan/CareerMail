package com.careermail.config;

import com.careermail.model.entity.User;
import com.careermail.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Only initialize default demo user account if not already registered, with completely clean empty pipeline
        if (userRepository.findByEmail("arjun.sharma@email.com").isEmpty()) {
            User user = new User();
            user.setName("Arjun Sharma");
            user.setEmail("arjun.sharma@email.com");
            user.setPassword(passwordEncoder.encode("password123"));
            user.setAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
            userRepository.save(user);
        }
    }
}
