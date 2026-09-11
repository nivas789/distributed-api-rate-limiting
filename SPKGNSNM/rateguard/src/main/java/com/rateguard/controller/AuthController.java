package com.rateguard.controller;

import com.rateguard.entity.User;
import com.rateguard.service.AuthService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Controller
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/")
    public String index(HttpSession session) {
        // If session exists, bypass login and redirect to dashboard
        if (session.getAttribute("user") != null) {
            return "redirect:/dashboard";
        }
        return "landing";
    }

    @GetMapping("/login")
    public String login(HttpSession session) {
        // Prevent logged-in users from seeing the login screen again
        if (session.getAttribute("user") != null) {
            return "redirect:/dashboard";
        }
        return "login";
    }

    @GetMapping("/signup")
    public String signup(HttpSession session) {
        // Prevent logged-in users from seeing the signup screen again
        if (session.getAttribute("user") != null) {
            return "redirect:/dashboard";
        }
        return "signup";
    }

    // AJAX Endpoint for user registration
    @PostMapping("/api/auth/signup")
    @ResponseBody
    public ResponseEntity<Map<String, String>> apiSignup(@RequestBody Map<String, String> payload) {
        String fullName = payload.get("fullName");
        String email = payload.get("email");
        String password = payload.get("password");

        Map<String, String> response = new HashMap<>();
        try {
            User user = new User(fullName, email, password);
            authService.registerUser(user);
            response.put("message", "Registration successful! Please log in.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            response.put("message", "An unexpected error occurred during signup.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // AJAX Endpoint for user login
    @PostMapping("/api/auth/login")
    @ResponseBody
    public ResponseEntity<Map<String, String>> apiLogin(@RequestBody Map<String, String> payload, HttpSession session) {
        String email = payload.get("email");
        String password = payload.get("password");

        Map<String, String> response = new HashMap<>();
        Optional<User> authenticatedUser = authService.authenticateUser(email, password);

        if (authenticatedUser.isPresent()) {
            User user = authenticatedUser.get();
            // Bind user to HTTP Session
            session.setAttribute("user", user);
            response.put("message", "Login successful.");
            response.put("redirect", "/dashboard");
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Invalid email or password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    // Endpoint for logging out
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate(); // Clear all session attributes
        return "redirect:/login";
    }
}
