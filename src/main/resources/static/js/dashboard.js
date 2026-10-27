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
    // 1. Fetch API Keys from DB for counting and simulation
    let apiKeys = [];
    const fallbackKeys = [
        { keyName: 'Prod-Key-01', keyValue: 'rg_live_9f81a7b2c3d4e5f6' },
        { keyName: 'Mobile-App-Key', keyValue: 'rg_live_2e3d4f5a6b7c8d9e' },
        { keyName: 'Staging-Dev-Key', keyValue: 'rg_live_0a1b2c3d4e5f6g7h' }
    ];

    function fetchActiveKeys() {
        fetch('/api/keys')
            .then(res => res.json())
            .then(data => {
                apiKeys = data;
                const activeKeysCountEl = document.getElementById('stat-active-keys');
                if (activeKeysCountEl) {
                    activeKeysCountEl.textContent = apiKeys.length;
                }
            })
            .catch(err => {
                console.error('Error fetching API keys', err);
                apiKeys = fallbackKeys;
            });
    }
    fetchActiveKeys();

    // 2. Stats & Traffic Simulation State
    let totalRequests = parseInt(localStorage.getItem('dash_total') || '42500');
    let allowedRequests = parseInt(localStorage.getItem('dash_allowed') || '42210');
    let blockedRequests = parseInt(localStorage.getItem('dash_blocked') || '290');
    let currentRps = 1.2;
    let systemMood = 'calm'; // calm, warning, danger

    // Elements
    const statTotalEl = document.getElementById('stat-total');
    const statAllowedEl = document.getElementById('stat-allowed');
    const statBlockedEl = document.getElementById('stat-blocked');
    const statRpsEl = document.getElementById('stat-rps');
    const statTotalTrendEl = document.getElementById('stat-total-trend');
    const statAllowedRateEl = document.getElementById('stat-allowed-rate');
    const statBlockedRateEl = document.getElementById('stat-blocked-rate');
    const liveTableBody = document.getElementById('live-requests-table').querySelector('tbody');

    // Sync elements initially
    updateMetricsUI();

    // 3. System Mood Toggle Handler
    const moodDot = document.getElementById('mood-dot');
    const moodTitle = document.getElementById('mood-title');
    const moodDescription = document.getElementById('mood-description');
    const moodButtons = document.querySelectorAll('.mood-btn');

    const moodConfig = {
        calm: {
            dotClass: 'mood-calm-state',
            title: 'System Status: Calm',
            desc: 'Traffic levels are healthy. API latency is nominal. Rate limits are handling queries smoothly.'
        },
        warning: {
            dotClass: 'mood-warning-state',
            title: 'System Status: High Load',
            desc: 'Spike in API queries detected. Rates are approaching thresholds. Minor queuing might occur.'
        },
        danger: {
            dotClass: 'mood-danger-state',
            title: 'System Status: Under DDOS/Attack',
            desc: 'Critical traffic levels! Massive volume of unauthorized/excessive calls blocked by RateGuard X.'
        }
    };

    moodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            moodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const selectedMood = btn.getAttribute('data-mood');
            changeSystemMood(selectedMood);
            window.toastNotification.show(`System mode updated to ${selectedMood.toUpperCase()}`, 'info');
        });
    });

    function changeSystemMood(newMood) {
        systemMood = newMood;
        if (moodDot) {
            moodDot.className = 'mood-indicator-dot ' + moodConfig[newMood].dotClass;
        }
        if (moodTitle) moodTitle.textContent = moodConfig[newMood].title;
        if (moodDescription) moodDescription.textContent = moodConfig[newMood].desc;
    }

    // Helper: format numbers
    function formatNum(num) {
        return num.toLocaleString();
    }

    function updateMetricsUI() {
        if (statTotalEl) statTotalEl.textContent = formatNum(totalRequests);
        if (statAllowedEl) statAllowedEl.textContent = formatNum(allowedRequests);
        if (statBlockedEl) statBlockedEl.textContent = formatNum(blockedRequests);
        if (statRpsEl) statRpsEl.textContent = currentRps.toFixed(1);

        const total = totalRequests || 1;
        const allowedPct = ((allowedRequests / total) * 100).toFixed(1);
        const blockedPct = ((blockedRequests / total) * 100).toFixed(1);

        if (statAllowedRateEl) statAllowedRateEl.textContent = `${allowedPct}%`;
        if (statBlockedRateEl) statBlockedRateEl.textContent = `${blockedPct}%`;
        
        // Save states
        localStorage.setItem('dash_total', totalRequests);
        localStorage.setItem('dash_allowed', allowedRequests);
        localStorage.setItem('dash_blocked', blockedRequests);
    }

    // 4. Traffic Simulation Loop
    const endpoints = [
        '/api/v1/users', 
        '/api/v1/auth/login', 
        '/api/v1/checkout', 
        '/api/v1/products', 
        '/api/v1/analytics/export',
        '/api/v1/keys/create'
    ];

    function simulateTraffic() {
        let iterations = 1;
        let blockChance = 0.01; 

        if (systemMood === 'calm') {
            iterations = Math.floor(Math.random() * 3) + 1; 
            blockChance = 0.02; 
            currentRps = 1.0 + Math.random() * 3;
            if (statTotalTrendEl) statTotalTrendEl.textContent = '↑ 4%';
        } else if (systemMood === 'warning') {
            iterations = Math.floor(Math.random() * 8) + 4; 
            blockChance = 0.18; 
            currentRps = 15.0 + Math.random() * 12;
            if (statTotalTrendEl) statTotalTrendEl.textContent = '↑ 45%';
        } else if (systemMood === 'danger') {
            iterations = Math.floor(Math.random() * 25) + 20; 
            blockChance = 0.82; 
            currentRps = 120.0 + Math.random() * 60;
            if (statTotalTrendEl) statTotalTrendEl.textContent = '↑ 680%';
        }

        // Remove placeholder row
        const placeholder = liveTableBody.querySelector('.placeholder-row');
        if (placeholder) {
            placeholder.remove();
        }

        for (let i = 0; i < iterations; i++) {
            totalRequests++;
            const isBlocked = Math.random() < blockChance;
            
            if (isBlocked) {
                blockedRequests++;
            } else {
                allowedRequests++;
            }

            const activeList = (apiKeys && apiKeys.length > 0) ? apiKeys : fallbackKeys;
            const chosenKey = activeList[Math.floor(Math.random() * activeList.length)];
            const keyAlias = chosenKey.keyName || chosenKey.name;
            const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
            const timeStr = new Date().toLocaleTimeString();
            const latency = isBlocked ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 65) + 10;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${timeStr}</td>
                <td><span class="code-text">${keyAlias}</span></td>
                <td><span class="code-text">${endpoint}</span></td>
                <td>
                    <span class="badge ${isBlocked ? 'badge-danger' : 'badge-success'}">
                        ${isBlocked ? 'HTTP 429' : 'HTTP 200'}
                    </span>
                </td>
                <td>${latency}ms</td>
            `;

            liveTableBody.insertBefore(tr, liveTableBody.firstChild);
        }

        while (liveTableBody.children.length > 10) {
            liveTableBody.removeChild(liveTableBody.lastChild);
        }

        updateMetricsUI();
    }

    const simInterval = setInterval(simulateTraffic, 2500);

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
