package com.rateguard.controller;

import com.rateguard.entity.User;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardController {

    /**
     * Extracts the first initials from the user's full name.
     * E.g. "John Doe" -> "JD", "Admin" -> "AD"
     */
    private String getInitials(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "RG";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
    }

    /**
     * Checks if the session contains an authenticated user.
     * If true, binds user parameters to Thymeleaf context model.
     */
    private boolean checkSession(HttpSession session, Model model) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return false;
        }
        model.addAttribute("user", user);
        model.addAttribute("initials", getInitials(user.getFullName()));
        return true;
    }

    @GetMapping("/dashboard")
    public String dashboard(HttpSession session, Model model) {
        if (!checkSession(session, model)) {
            return "redirect:/login";
        }
        return "dashboard";
    }

    @GetMapping("/api-keys")
    public String apiKeys(HttpSession session, Model model) {
        if (!checkSession(session, model)) {
            return "redirect:/login";
        }
        return "api_keys";
    }

    @GetMapping("/playground")
    public String playground(HttpSession session, Model model) {
        if (!checkSession(session, model)) {
            return "redirect:/login";
        }
        return "playground";
    }

    @GetMapping("/analytics")
    public String analytics(HttpSession session, Model model) {
        if (!checkSession(session, model)) {
            return "redirect:/login";
        }
        return "analytics";
    }

    @GetMapping("/settings")
    public String settings(HttpSession session, Model model) {
        if (!checkSession(session, model)) {
            return "redirect:/login";
        }
        return "settings";
    }
}
