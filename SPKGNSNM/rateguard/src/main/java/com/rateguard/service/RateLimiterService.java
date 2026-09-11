package com.rateguard.service;

import com.rateguard.entity.ApiKey;
import com.rateguard.repository.ApiKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimiterService {

    private final ApiKeyRepository apiKeyRepository;
    
    // Thread-safe in-memory map to store request counts.
    // Key format: "<api_key_secret>:<minute_timestamp_window>"
    private final ConcurrentHashMap<String, AtomicInteger> windowCounts = new ConcurrentHashMap<>();

    @Autowired
    public RateLimiterService(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    /**
     * Validates and applies the Fixed Window Rate Limiting algorithm.
     * Window Size: 1 minute (60,000 milliseconds).
     * 
     * @param keyValue The raw API key value prefix (e.g. rg_live_...)
     * @return true if the key exists, is active, and request count is within threshold; false otherwise.
     */
    public boolean isAllowed(String keyValue) {
        Optional<ApiKey> apiKeyOpt = apiKeyRepository.findByKeyValue(keyValue);
        if (apiKeyOpt.isEmpty()) {
            return false; // Reject unregistered key
        }
        
        ApiKey apiKey = apiKeyOpt.get();
        if (!apiKey.isActive()) {
            return false; // Reject deactivated key
        }

        int limit = apiKey.getRateLimit();
        long currentWindow = System.currentTimeMillis() / 60000; // Unique ID representing the current minute
        String countKey = keyValue + ":" + currentWindow;

        // Clean up memory from past windows to prevent memory leaks
        cleanupOldWindows(currentWindow);

        // Fetch or create count atomically
        AtomicInteger counter = windowCounts.computeIfAbsent(countKey, k -> new AtomicInteger(0));
        int requestCount = counter.incrementAndGet();

        // Return true if within rate limits, otherwise return false
        return requestCount <= limit;
    }

    /**
     * Prunes expired window metrics from memory.
     * ConcurrentHashMap key sets are safe to remove items from while iterating.
     */
    private void cleanupOldWindows(long currentWindow) {
        windowCounts.keySet().removeIf(key -> {
            String[] parts = key.split(":");
            if (parts.length == 2) {
                try {
                    long windowTime = Long.parseLong(parts[1]);
                    return windowTime < currentWindow; // Remove old minute windows
                } catch (NumberFormatException e) {
                    return true; // Prune malformed keys
                }
            }
            return true; // Prune malformed keys
        });
    }

    /**
     * Clears all counters. Helpful for resetting simulation data.
     */
    public void resetAllCounters() {
        windowCounts.clear();
    }
}
