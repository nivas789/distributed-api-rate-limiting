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
    const keySelect = document.getElementById('playground-key-select');
    const endpointSelect = document.getElementById('playground-endpoint-select');
    const sendRequestBtn = document.getElementById('send-request-btn');
    const stressTestBtn = document.getElementById('stress-test-btn');
    const statusBadge = document.getElementById('console-status-badge');
    const responseLatency = document.getElementById('response-latency');
    const responseBody = document.getElementById('response-body');
    const logsTableBody = document.getElementById('playground-logs-table').querySelector('tbody');
    const clearLogsBtn = document.getElementById('clear-logs-btn');

    let keyMap = new Map(); // Store token -> name map

    // 1. Fetch API Keys on load to populate dropdown
    function loadKeysDropdown() {
        fetch('/api/keys')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load keys.');
                return res.json();
            })
            .then(keys => {
                keySelect.innerHTML = '';
                keyMap.clear();

                if (keys.length === 0) {
                    keySelect.innerHTML = '<option value="">-- Generate keys in API Keys page first --</option>';
                    sendRequestBtn.disabled = true;
                    stressTestBtn.disabled = true;
                    return;
                }

                keySelect.innerHTML = '<option value="">-- Choose an API Key --</option>';
                keys.forEach(key => {
                    keyMap.set(key.keyValue, key.keyName);
                    
                    const option = document.createElement('option');
                    option.value = key.keyValue;
                    option.textContent = `${key.keyName} (${key.keyValue.substring(0, 12)}...)`;
                    keySelect.appendChild(option);
                });

                sendRequestBtn.disabled = false;
                stressTestBtn.disabled = false;
            })
            .catch(err => {
                console.error(err);
                keySelect.innerHTML = '<option value="">-- Error loading keys --</option>';
            });
    }

    // 2. Perform Single API request
    function sendSingleRequest() {
        const apiKey = keySelect.value;
        const endpoint = endpointSelect.value;

        if (!apiKey) {
            window.toastNotification.show('Please select an API key to send request.', 'warning');
            return;
        }

        statusBadge.textContent = 'PENDING';
        statusBadge.className = 'badge badge-info';
        responseBody.textContent = '// Sending query...';
        responseLatency.textContent = '...';

        const startTime = performance.now();

        fetch(`/api/test?apiKey=${apiKey}&endpoint=${encodeURIComponent(endpoint)}`)
            .then(res => {
                const endTime = performance.now();
                const latency = Math.round(endTime - startTime);
                responseLatency.textContent = `${latency}ms`;

                statusBadge.textContent = `HTTP ${res.status}`;
                if (res.status === 200) {
                    statusBadge.className = 'badge badge-success';
                } else if (res.status === 429) {
                    statusBadge.className = 'badge badge-danger';
                } else {
                    statusBadge.className = 'badge badge-warning';
                }

                return res.json();
            })
            .then(data => {
                responseBody.textContent = JSON.stringify(data, null, 4);
                responseBody.style.color = data.status === 'ALLOWED' ? '#a7f3d0' : '#fca5a5';

                addLogEntry(keyMap.get(apiKey), endpoint, data.code, data.message);
                if (data.status === 'ALLOWED') {
                    window.toastNotification.show('Request allowed successfully!', 'success');
                } else {
                    window.toastNotification.show(data.message, 'error');
                }
            })
            .catch(err => {
                console.error(err);
                statusBadge.textContent = 'ERROR';
                statusBadge.className = 'badge badge-danger';
                responseBody.textContent = `// Network or server error: ${err.message}`;
                responseBody.style.color = '#fca5a5';
                window.toastNotification.show('API invocation failed.', 'error');
            });
    }

    // 3. Stress Test (Burst Traffic simulation)
    function runStressTest() {
        const apiKey = keySelect.value;
        const endpoint = endpointSelect.value;

        if (!apiKey) {
            window.toastNotification.show('Please select an API key to run simulation.', 'warning');
            return;
        }

        sendRequestBtn.disabled = true;
        stressTestBtn.disabled = true;
        
        statusBadge.textContent = 'RUNNING BURST';
        statusBadge.className = 'badge badge-info';
        responseBody.textContent = '// Running 10-requests burst stress simulation... Check history logs below.';
        responseBody.style.color = 'var(--text-secondary)';

        let count = 0;
        const maxBurst = 10;
        let blockedCount = 0;

        window.toastNotification.show('Starting 10-requests concurrent burst load...', 'info');

        const interval = setInterval(() => {
            if (count >= maxBurst) {
                clearInterval(interval);
                sendRequestBtn.disabled = false;
                stressTestBtn.disabled = false;
                statusBadge.textContent = 'BURST DONE';
                statusBadge.className = 'badge badge-success';
                
                if (blockedCount > 0) {
                    window.toastNotification.show(`Simulation done. ${blockedCount} calls blocked by rate limit thresholds.`, 'warning');
                } else {
                    window.toastNotification.show('Simulation done. All calls succeeded.', 'success');
                }
                return;
            }

            fetch(`/api/test?apiKey=${apiKey}&endpoint=${encodeURIComponent(endpoint)}`)
                .then(res => {
                    if (res.status === 429) blockedCount++;
                    return res.json();
                })
                .then(data => {
                    addLogEntry(keyMap.get(apiKey), endpoint, data.code, data.message);
                })
                .catch(err => console.error(err));

            count++;
        }, 150); 
    }

    // 4. Log Entry to table
    function addLogEntry(keyAlias, endpoint, statusCode, message) {
        const placeholder = logsTableBody.querySelector('.placeholder-row');
        if (placeholder) {
            placeholder.remove();
        }

        const tr = document.createElement('tr');
        const timeStr = new Date().toLocaleTimeString();

        let badgeClass = 'badge-info';
        if (statusCode === 200) badgeClass = 'badge-success';
        if (statusCode === 429) badgeClass = 'badge-danger';
        if (statusCode === 401 || statusCode === 400) badgeClass = 'badge-warning';

        tr.innerHTML = `
            <td>${timeStr}</td>
            <td><span class="code-text">${escapeHtml(keyAlias)}</span></td>
            <td><span class="code-text">${escapeHtml(endpoint)}</span></td>
            <td><span class="badge ${badgeClass}">HTTP ${statusCode}</span></td>
            <td style="font-size: 0.85rem; color: ${statusCode === 200 ? 'var(--text-secondary)' : '#fca5a5'};">${escapeHtml(message)}</td>
        `;

        logsTableBody.insertBefore(tr, logsTableBody.firstChild);

        while (logsTableBody.children.length > 30) {
            logsTableBody.removeChild(logsTableBody.lastChild);
        }
    }

    // 5. Clear Logs
    clearLogsBtn.addEventListener('click', () => {
        logsTableBody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px 0;">
                    No queries run in this session yet.
                </td>
            </tr>
        `;
        responseBody.textContent = '// Click "Send Request" to invoke API and inspect response.';
        responseBody.style.color = 'var(--text-muted)';
        statusBadge.textContent = 'Idle';
        statusBadge.className = 'badge badge-info';
        responseLatency.textContent = '-';
        window.toastNotification.show('Console logs buffer cleared.', 'info');
    });

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    loadKeysDropdown();

    sendRequestBtn.addEventListener('click', sendSingleRequest);
    stressTestBtn.addEventListener('click', runStressTest);

    // 6. Responsive Sidebar drawer
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

    // 7. Profile Dropdown Trigger
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

    // 8. Theme toggle implementation
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
