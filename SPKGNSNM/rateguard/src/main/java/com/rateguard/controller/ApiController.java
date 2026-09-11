package com.rateguard.controller;

import com.rateguard.entity.ApiKey;
import com.rateguard.entity.User;
import com.rateguard.service.ApiKeyService;
import com.rateguard.service.RateLimiterService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final ApiKeyService apiKeyService;
    private final RateLimiterService rateLimiterService;

    @Autowired
    public ApiController(ApiKeyService apiKeyService, RateLimiterService rateLimiterService) {
        this.apiKeyService = apiKeyService;
        this.rateLimiterService = rateLimiterService;
    }

    // Helper method to retrieve user from session
    private User getSessionUser(HttpSession session) {
        return (User) session.getAttribute("user");
    }

    // 1. GET /api/keys - Retrieve all API keys for the logged-in user
    @GetMapping("/keys")
    public ResponseEntity<?> getApiKeys(HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Unauthorized. Please log in."));
        }
        
        List<ApiKey> keys = apiKeyService.getKeysByUser(user);
        return ResponseEntity.ok(keys);
    }

    // 2. POST /api/keys - Create a new API key for the logged-in user
    @PostMapping("/keys")
    public ResponseEntity<?> createApiKey(@RequestBody Map<String, Object> payload, HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Unauthorized. Please log in."));
        }

        String keyName = (String) payload.getOrDefault("keyName", "Unnamed Key");
        int rateLimit = Integer.parseInt(payload.getOrDefault("rateLimit", 5).toString());

        try {
            ApiKey newKey = apiKeyService.createKey(keyName, rateLimit, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(newKey);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to generate key."));
        }
    }

    // 3. DELETE /api/keys/{id} - Delete an API key belonging to the logged-in user
    @DeleteMapping("/keys/{id}")
    public ResponseEntity<?> deleteApiKey(@PathVariable Long id, HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Unauthorized. Please log in."));
        }

        // Enforce security: verify the user owns the key they are trying to delete
        List<ApiKey> keys = apiKeyService.getKeysByUser(user);
        boolean ownsKey = keys.stream().anyMatch(key -> key.getId().equals(id));

        if (!ownsKey) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Forbidden. You do not own this API key."));
        }

        try {
            apiKeyService.deleteKey(id);
            return ResponseEntity.ok(Map.of("message", "API key deleted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to delete API key."));
        }
    }

    // 4. GET /api/test - Verify API rate limit logic
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testRateLimit(
            @RequestParam(required = false) String apiKey,
            @RequestParam(required = false) String endpoint) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        response.put("endpoint", endpoint != null ? endpoint : "/api/v1/resource");

        if (apiKey == null || apiKey.trim().isEmpty()) {
            response.put("status", "BLOCKED");
            response.put("code", 400);
            response.put("message", "API key is missing.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        boolean allowed = rateLimiterService.isAllowed(apiKey);

        if (allowed) {
            response.put("status", "ALLOWED");
            response.put("code", 200);
            response.put("message", "Request completed successfully.");
            return ResponseEntity.ok(response);
        } else {
            // Check if key is completely invalid or just rate limited
            Optional<ApiKey> keyOpt = apiKeyService.getKeyByValue(apiKey);
            response.put("status", "BLOCKED");
            
            if (keyOpt.isEmpty()) {
                response.put("code", 401);
                response.put("message", "Unauthorized. API Key is invalid.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            } else {
                response.put("code", 429);
                response.put("message", "Rate limit exceeded (Too Many Requests). Limit: " + keyOpt.get().getRateLimit() + " req/min.");
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
            }
        }
    }
}
