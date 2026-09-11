document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('password-toggle');
    const eyeIcon = document.getElementById('eye-icon');
    const errorAlert = document.getElementById('error-alert');
    const errorMessage = document.getElementById('error-message');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = submitBtn.querySelector('span');

    // SVG templates for show/hide password
    const eyeOpenSvg = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    `;
    const eyeClosedSvg = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    `;

    // Toggle Password Visibility
    passwordToggle.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        eyeIcon.innerHTML = isPassword ? eyeClosedSvg : eyeOpenSvg;
    });

    // Helper functions for showing/hiding error alerts
    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('hidden');
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideError() {
        errorAlert.classList.add('hidden');
    }

    // Email pattern validation
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.toLowerCase());
    }

    // Handle Form Submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validations
        if (!email) {
            showError('Please enter your email address.');
            emailInput.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address.');
            emailInput.focus();
            return;
        }

        if (!password) {
            showError('Please enter your password.');
            passwordInput.focus();
            return;
        }

        if (password.length < 4) {
            showError('Password must be at least 4 characters long.');
            passwordInput.focus();
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        const originalText = submitText.textContent;
        submitText.textContent = 'Authenticating...';
        submitBtn.style.opacity = '0.75';

        // Simulate authentication API call (Phase 1 Mock Logic)
        setTimeout(() => {
            if (email === 'admin@rateguard.io' && password === 'admin123') {
                // Success - redirect to dashboard (to be built in Step 3)
                window.location.href = 'dashboard.html';
            } else {
                // Fail
                showError('Invalid email or password. Hint: Use admin@rateguard.io / admin123');
                submitBtn.disabled = false;
                submitText.textContent = originalText;
                submitBtn.style.opacity = '1';
            }
        }, 1200);
    });
});
