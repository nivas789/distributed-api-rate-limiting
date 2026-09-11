package com.rateguard.service;

import com.rateguard.entity.User;
import com.rateguard.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;

    @Autowired
    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Registers a new user in the system after validating that the email is unique.
     * Note: In a production system, passwords should be encrypted using BCrypt.
     */
    @Transactional
    public User registerUser(User user) {
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            throw new IllegalArgumentException("An account with email " + user.getEmail() + " already exists.");
        }
        return userRepository.save(user);
    }

    /**
     * Authenticates a user using email and password.
     * Returns the authenticated User if credentials are valid, or empty if invalid.
     */
    @Transactional(readOnly = true)
    public Optional<User> authenticateUser(String email, String password) {
        return userRepository.findByEmail(email)
                .filter(user -> user.getPassword().equals(password));
    }
}
