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
    // 1. Load traffic metrics from localStorage (synced from dashboard live simulation)
    const totalRequests = parseInt(localStorage.getItem('dash_total') || '15840');
    const allowedRequests = parseInt(localStorage.getItem('dash_allowed') || '15560');
    const blockedRequests = parseInt(localStorage.getItem('dash_blocked') || '280');

    // Update KPI UI
    const kpiTotal = document.getElementById('kpi-total');
    const kpiAllowed = document.getElementById('kpi-allowed');
    const kpiBlocked = document.getElementById('kpi-blocked');
    const kpiAllowedPct = document.getElementById('kpi-allowed-pct');
    const kpiBlockedPct = document.getElementById('kpi-blocked-pct');

    if (kpiTotal) kpiTotal.textContent = totalRequests.toLocaleString();
    if (kpiAllowed) kpiAllowed.textContent = allowedRequests.toLocaleString();
    if (kpiBlocked) kpiBlocked.textContent = blockedRequests.toLocaleString();

    const allowedRate = totalRequests ? ((allowedRequests / totalRequests) * 100).toFixed(1) : '100.0';
    const blockedRate = totalRequests ? ((blockedRequests / totalRequests) * 100).toFixed(1) : '0.0';

    if (kpiAllowedPct) kpiAllowedPct.textContent = `${allowedRate}% success rate`;
    if (kpiBlockedPct) kpiBlockedPct.textContent = `${blockedRate}% blocked rate`;

    // Retrieve theme computed color strings
    const themeStyle = getComputedStyle(document.documentElement);
    const gridColor = 'rgba(156, 163, 175, 0.05)';
    const textLabelColor = '#9ca3af';

    // 2. Render Doughnut Chart (Allowed vs Blocked)
    const ratioCtx = document.getElementById('ratioDoughnutChart');
    if (ratioCtx) {
        new Chart(ratioCtx, {
            type: 'doughnut',
            data: {
                labels: ['Allowed (HTTP 200)', 'Blocked (HTTP 429)'],
                datasets: [{
                    data: [allowedRequests, blockedRequests],
                    backgroundColor: [
                        '#10b981',  // Emerald Mint
                        '#ef4444'   // Rose Danger
                    ],
                    borderColor: themeStyle.getPropertyValue('--bg-card-solid').trim() || '#111827',
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textLabelColor,
                            font: { family: 'Inter', size: 11, weight: '500' },
                            padding: 16
                        }
                    }
                },
                cutout: '75%'
            }
        });
    }

    // 3. Render Line Chart (Activity over time)
    const trafficCtx = document.getElementById('trafficLineChart');
    if (trafficCtx) {
        const ctx = trafficCtx.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 240);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        const times = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 60000);
            times.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }

        const baseValues = [120, 165, 140, 280, 350, 420, Math.round(totalRequests / 100)];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: times,
                datasets: [{
                    label: 'Requests volume',
                    data: baseValues,
                    borderColor: '#3b82f6', 
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: themeStyle.getPropertyValue('--bg-card-solid').trim() || '#111827',
                    pointBorderWidth: 1.5,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textLabelColor, font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textLabelColor, font: { family: 'Inter', size: 10 } }
                    }
                }
            }
        });
    }

    // 4. Fetch DB Keys and Populate Top Key Consumers Table
    const consumersTableBody = document.getElementById('consumers-table').querySelector('tbody');
    if (consumersTableBody) {
        fetch('/api/keys')
            .then(res => res.json())
            .then(keys => {
                consumersTableBody.innerHTML = '';
                if (keys.length === 0) {
                    consumersTableBody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 48px 0;">
                                <div class="empty-state" style="padding: 12px 0;">
                                    <div class="empty-state-icon">
                                        <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                    </div>
                                    <h4 class="empty-state-title" style="font-size: 1rem;">No Traffic Logged</h4>
                                    <p class="empty-state-desc" style="font-size: 0.8rem;">Create credentials and submit requests in playground to generate consumer statistics.</p>
                                </div>
                            </td>
                        </tr>
                    `;
                    return;
                }

                let remainingTotal = totalRequests;
                let remainingAllowed = allowedRequests;
                let remainingBlocked = blockedRequests;

                keys.forEach((key, index) => {
                    let keyTotal, keyAllowed, keyBlocked;

                    if (index === keys.length - 1) {
                        keyTotal = remainingTotal;
                        keyAllowed = remainingAllowed;
                        keyBlocked = remainingBlocked;
                    } else {
                        const factor = 0.6 - (index * 0.15); 
                        keyTotal = Math.max(0, Math.round(totalRequests * factor));
                        keyAllowed = Math.max(0, Math.round(allowedRequests * factor));
                        keyBlocked = Math.max(0, keyTotal - keyAllowed);

                        remainingTotal -= keyTotal;
                        remainingAllowed -= keyAllowed;
                        remainingBlocked -= keyBlocked;
                    }

                    const ratioVal = keyTotal ? ((keyAllowed / keyTotal) * 100).toFixed(1) : '100.0';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${escapeHtml(key.keyName)}</strong></td>
                        <td><code class="code-text">${escapeHtml(key.keyValue.substring(0, 15))}...</code></td>
                        <td>${keyTotal.toLocaleString()}</td>
                        <td>${keyAllowed.toLocaleString()}</td>
                        <td>${keyBlocked.toLocaleString()}</td>
                        <td>
                            <span class="badge ${parseFloat(ratioVal) > 95 ? 'badge-success' : 'badge-warning'}">
                                ${ratioVal}% success
                            </span>
                        </td>
                    `;
                    consumersTableBody.appendChild(tr);
                });
            })
            .catch(err => {
                console.error(err);
                consumersTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: var(--danger); padding: 24px 0;">
                            Failed to load consumer metrics from server.
                        </td>
                    </tr>
                `;
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
