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
    const createKeyForm = document.getElementById('create-key-form');
    const keyNameInput = document.getElementById('keyName');
    const rateLimitSelect = document.getElementById('rateLimit');
    const keysTableBody = document.getElementById('keys-table').querySelector('tbody');
    const keyCountBadge = document.getElementById('key-count-badge');
    const generateBtn = document.getElementById('generate-btn');

    // Modal elements
    const openCreateModalBtn = document.getElementById('open-create-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const createKeyModal = document.getElementById('create-key-modal');

    let apiKeys = [];

    // Modal controller triggers
    if (openCreateModalBtn && createKeyModal) {
        openCreateModalBtn.addEventListener('click', () => {
            createKeyModal.classList.add('active');
            keyNameInput.focus();
        });
    }

    function hideModal() {
        if (createKeyModal) {
            createKeyModal.classList.remove('active');
            createKeyForm.reset();
        }
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', hideModal);

    // 1. Fetch keys on load
    function loadApiKeys() {
        fetch('/api/keys')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load API keys.');
                return res.json();
            })
            .then(data => {
                apiKeys = data;
                renderKeysTable();
            })
            .catch(err => {
                console.error(err);
                window.toastNotification.show('Error loading API keys from database.', 'error');
            });
    }

    // 2. Render Keys Table
    function renderKeysTable() {
        keysTableBody.innerHTML = '';
        keyCountBadge.textContent = `${apiKeys.length} ${apiKeys.length === 1 ? 'key' : 'keys'}`;

        if (apiKeys.length === 0) {
            keysTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 48px 0;">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </div>
                            <h4 class="empty-state-title">No API Credentials</h4>
                            <p class="empty-state-desc">Generate your first secret key above to start securing your application thresholds.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        apiKeys.forEach(key => {
            const tr = document.createElement('tr');
            
            const prefix = "rg_live_";
            const rawToken = key.keyValue;
            const tokenValueWithoutPrefix = rawToken.replace(prefix, "");
            const maskedToken = prefix + "•".repeat(tokenValueWithoutPrefix.length);

            tr.innerHTML = `
                <td><strong>${escapeHtml(key.keyName)}</strong></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <code class="code-text token-value-display" data-raw="${rawToken}" data-masked="${maskedToken}">${maskedToken}</code>
                        <button type="button" class="password-toggle reveal-key-btn" style="position:static; padding:4px;" aria-label="Toggle key visibility">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button type="button" class="password-toggle copy-key-btn" style="position:static; padding:4px;" aria-label="Copy key to clipboard">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                </td>
                <td><span class="badge badge-info">${key.rateLimit} req/min</span></td>
                <td>
                    <span class="badge ${key.active ? 'badge-success' : 'badge-danger'}">
                        ${key.active ? 'Active' : 'Revoked'}
                    </span>
                </td>
                <td style="text-align: right;">
                    <button type="button" class="password-toggle delete-key-btn" data-id="${key.id}" style="position:static; color:var(--danger); padding:4px;" aria-label="Revoke key">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:18px; height:18px;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </td>
            `;

            // Setup button interactions on this row
            const revealBtn = tr.querySelector('.reveal-key-btn');
            const copyBtn = tr.querySelector('.copy-key-btn');
            const deleteBtn = tr.querySelector('.delete-key-btn');
            const codeEl = tr.querySelector('.token-value-display');

            // 2a. Reveal/Mask toggle
            revealBtn.addEventListener('click', () => {
                const isMasked = codeEl.textContent === maskedToken;
                codeEl.textContent = isMasked ? rawToken : maskedToken;
                
                const eyeOpenSvg = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
                const eyeClosedSvg = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
                revealBtn.querySelector('svg').innerHTML = isMasked ? eyeClosedSvg : eyeOpenSvg;
            });

            // 2b. Copy to clipboard
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(rawToken).then(() => {
                    const originalSvg = copyBtn.innerHTML;
                    copyBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" style="width:16px; height:16px;">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    `;
                    window.toastNotification.show('Key copied to clipboard!');
                    setTimeout(() => {
                        copyBtn.innerHTML = originalSvg;
                    }, 1500);
                });
            });

            // 2c. Delete API key
            deleteBtn.addEventListener('click', () => {
                const confirmDelete = confirm(`Are you sure you want to revoke and delete "${key.keyName}"?`);
                if (confirmDelete) {
                    deleteApiKey(key.id);
                }
            });

            keysTableBody.appendChild(tr);
        });
    }

    // 3. Create key submission
    createKeyForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const keyName = keyNameInput.value.trim();
        const rateLimit = parseInt(rateLimitSelect.value);

        if (!keyName) {
            window.toastNotification.show('Please enter a key name.', 'warning');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.7';
        generateBtn.querySelector('span').textContent = 'Generating...';

        fetch('/api/keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyName, rateLimit })
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to create key.');
            return res.json();
        })
        .then(newKey => {
            apiKeys.push(newKey);
            renderKeysTable();
            hideModal();
            window.toastNotification.show('API key generated successfully!', 'success');
        })
        .catch(err => {
            console.error(err);
            window.toastNotification.show('Error generating API key.', 'error');
        })
        .finally(() => {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            generateBtn.querySelector('span').textContent = 'Generate Key';
        });
    });

    // 4. Delete API Key AJAX Call
    function deleteApiKey(id) {
        fetch(`/api/keys/${id}`, {
            method: 'DELETE'
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete API key.');
            return res.json();
        })
        .then(data => {
            apiKeys = apiKeys.filter(key => key.id !== id);
            renderKeysTable();
            window.toastNotification.show('API Key revoked and deleted.', 'success');
        })
        .catch(err => {
            console.error(err);
            window.toastNotification.show('Error deleting API key.', 'error');
        });
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    loadApiKeys();

    // 5. Responsive Sidebar drawer
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (sidebarToggle && sidebar && sidebarOverlay) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }

    // 6. Profile Dropdown Trigger
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        document.addEventListener('click', () => {
            profileDropdown.classList.remove('active');
        });
    }

    // 7. Theme toggle implementation
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('rg_theme', nextTheme);
        });
    }
});
