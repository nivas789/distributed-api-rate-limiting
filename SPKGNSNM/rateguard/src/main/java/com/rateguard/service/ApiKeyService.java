package com.rateguard.service;

import com.rateguard.entity.ApiKey;
import com.rateguard.entity.User;
import com.rateguard.repository.ApiKeyRepository;
import com.rateguard.util.ApiKeyGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;

    @Autowired
    public ApiKeyService(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    /**
     * Retrieves all API keys registered to a specific user.
     */
    @Transactional(readOnly = true)
    public List<ApiKey> getKeysByUser(User user) {
        return apiKeyRepository.findByUser(user);
    }

    /**
     * Retrieves all API keys registered to a specific user ID.
     */
    @Transactional(readOnly = true)
    public List<ApiKey> getKeysByUserId(Long userId) {
        return apiKeyRepository.findByUserId(userId);
    }

    /**
     * Generates and registers a new API key for the given user.
     */
    @Transactional
    public ApiKey createKey(String keyName, int rateLimit, User user) {
        String token = ApiKeyGenerator.generateKey();
        ApiKey apiKey = new ApiKey(keyName, token, rateLimit, user);
        return apiKeyRepository.save(apiKey);
    }

    /**
     * Deletes an API key by its database primary key ID.
     */
    @Transactional
    public void deleteKey(Long keyId) {
        if (!apiKeyRepository.existsById(keyId)) {
            throw new IllegalArgumentException("API key with ID " + keyId + " does not exist.");
        }
        apiKeyRepository.deleteById(keyId);
    }

    /**
     * Looks up an API key by its token value.
     */
    @Transactional(readOnly = true)
    public Optional<ApiKey> getKeyByValue(String keyValue) {
        return apiKeyRepository.findByKeyValue(keyValue);
    }
}
