// Reusable Toast Notification Utility
class ToastNotification {
    constructor() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        let iconSvg = '';
        let titleText = 'Success';
        if (type === 'success') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" style="width:20px; height:20px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            titleText = 'Operation Successful';
        } else if (type === 'error') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.5" style="width:20px; height:20px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
            titleText = 'System Exception';
        } else if (type === 'warning') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2.5" style="width:20px; height:20px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>`;
            titleText = 'Threshold Alert';
        } else {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2.5" style="width:20px; height:20px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
            titleText = 'Notification';
        }

        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <div class="toast-body">
                <div class="toast-title">${titleText}</div>
                <div class="toast-desc">${message}</div>
            </div>
            <div class="toast-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
        `;
        
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
        this.container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('removing');
                toast.addEventListener('animationend', () => toast.remove());
            }
        }, duration);
    }
}
window.toastNotification = new ToastNotification();

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
    if (passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            eyeIcon.innerHTML = isPassword ? eyeClosedSvg : eyeOpenSvg;
        });
    }

    // Helper functions for showing/hiding error alerts
    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('hidden');
        errorAlert.classList.add('shake');
        setTimeout(() => errorAlert.classList.remove('shake'), 400);
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

        // Real API authentication call
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Authentication failed.');
                });
            }
            return response.json();
        })
        .then(data => {
            window.toastNotification.show('Authentication successful!', 'success');
            setTimeout(() => {
                window.location.href = data.redirect || '/dashboard';
            }, 600);
        })
        .catch(err => {
            showError(err.message);
            submitBtn.disabled = false;
            submitText.textContent = originalText;
            submitBtn.style.opacity = '1';
        });
    });
});
