package com.rateguard.util;

import java.security.SecureRandom;
import java.util.HexFormat;

public class ApiKeyGenerator {

    private static final String KEY_PREFIX = "rg_live_";
    private static final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generates a cryptographically secure random API key value.
     * Output format: rg_live_<32-char-hex-token>
     */
    public static String generateKey() {
        byte[] randomBytes = new byte[16]; // 128-bit random token
        secureRandom.nextBytes(randomBytes);
        
        // Convert to a hex string representation (Java 17+)
        String token = HexFormat.of().formatHex(randomBytes);
        return KEY_PREFIX + token;
    }
}
