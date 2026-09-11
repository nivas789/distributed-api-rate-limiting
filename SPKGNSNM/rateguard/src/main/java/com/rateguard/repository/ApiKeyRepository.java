package com.rateguard.repository;

import com.rateguard.entity.ApiKey;
import com.rateguard.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    
    // Find key details by its secret token value (used in rate limiting checks)
    Optional<ApiKey> findByKeyValue(String keyValue);
    
    // Find all API keys registered to a specific user
    List<ApiKey> findByUser(User user);

    // Find all API keys registered to a specific user ID
    List<ApiKey> findByUserId(Long userId);
}
