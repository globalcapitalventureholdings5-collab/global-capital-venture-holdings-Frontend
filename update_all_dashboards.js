const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname);

const files = [
  { name: 'dashboard-signals.html', activeClass: 'nav-signals', title: 'GCVH — Daily Signals & 1% ROI' },
  { name: 'dashboard-market.html', activeClass: 'nav-market', title: 'GCVH — Live XAUUSD Terminal' },
  { name: 'dashboard-earnings.html', activeClass: 'nav-earnings', title: 'GCVH — Earnings & ROI Ledger' },
  { name: 'dashboard-withdrawals.html', activeClass: 'nav-withdrawals', title: 'GCVH — Fortnightly Withdrawals Desk' },
  { name: 'dashboard-referrals.html', activeClass: 'nav-referrals', title: 'GCVH — 3-Tier Affiliate Team' },
  { name: 'dashboard-salary.html', activeClass: 'nav-salary', title: 'GCVH — Monthly Leadership Salary' },
  { name: 'dashboard-videos.html', activeClass: 'nav-videos', title: 'GCVH — My Videos & Content Studio' }
];

function getSidebarHtml(activeClass) {
  return `  <!-- MOBILE TOP BAR -->
  <header class="mobile-header">
    <a href="index.html" class="mobile-brand">
      <span class="brand-mark">✦</span>
      <span>Global Capital <b>Holdings</b></span>
    </a>
    <button id="mobileMenuButton" class="mobile-menu-btn" type="button" aria-label="Open sidebar menu">☰</button>
  </header>

  <!-- BACKDROP OVERLAY FOR MOBILE SIDEBAR -->
  <div id="sidebarBackdrop" class="sidebar-backdrop"></div>

  <!-- DASHBOARD WRAPPER -->
  <div class="dashboard-layout">
    <!-- SIDEBAR DRAWER -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <a href="index.html" class="sidebar-logo">
          <span class="brand-mark">✦</span>
          <span>Global Capital<br><b>Holdings, Inc.</b></span>
        </a>
        <button id="sidebarCloseBtn" class="sidebar-close-btn" type="button" aria-label="Close sidebar">✕</button>
      </div>

      <div class="sidebar-profile">
        <div class="profile-avatar" id="sidebarAvatar">GC</div>
        <div class="profile-info">
          <strong id="sidebarUserName">Private Client</strong>
          <span id="sidebarAccountStatus">Account Active</span>
        </div>
      </div>

      <nav class="sidebar-navigation">
        <a href="dashboard.html" class="${activeClass === 'nav-overview' ? 'active' : ''}"><span>▦</span> Portfolio Overview</a>
        <a href="dashboard.html#userDetailsSection" class="${activeClass === 'nav-user-details' ? 'active' : ''}"><span>👤</span> User & Wallet Details</a>
        <a href="dashboard-signals.html" class="${activeClass === 'nav-signals' ? 'active' : ''}"><span>⚡</span> Daily Signals & 1% ROI</a>
        <a href="dashboard-market.html" class="${activeClass === 'nav-market' ? 'active' : ''}"><span>◈</span> Live XAUUSD Terminal</a>
        <a href="dashboard-earnings.html" class="${activeClass === 'nav-earnings' ? 'active' : ''}"><span>📈</span> Earnings & ROI Ledger</a>
        <a href="dashboard-withdrawals.html" class="${activeClass === 'nav-withdrawals' ? 'active' : ''}"><span>↗</span> Fortnightly Withdrawals</a>
        <a href="dashboard-referrals.html" class="${activeClass === 'nav-referrals' ? 'active' : ''}"><span>%</span> 3-Tier Affiliate Team</a>
        <a href="dashboard-salary.html" class="${activeClass === 'nav-salary' ? 'active' : ''}"><span>◷</span> Monthly Salary Matrix</a>
        <a href="dashboard-videos.html" class="${activeClass === 'nav-videos' ? 'active' : ''}"><span>🎬</span> My Videos & Content Studio</a>
        <div style="height:1px;background:var(--border);margin:8px 0;"></div>
        <a href="deposit.html" style="color:var(--gold);"><span>↓</span> Fund Investment (Deposit)</a>
        <a href="packages.html"><span>💎</span> Investment Packages</a>
        <a href="/api/download-apk" download="GlobalCapitalHoldings.apk" style="color:var(--gold);font-weight:700;"><span>📱</span> Download Android App (APK)</a>
        <a href="blogs.html"><span>📰</span> Community & News Briefings</a>
      </nav>

      <div class="sidebar-bottom">
        <div class="account-badge-box">
          <span>PRIVATE PORTFOLIO</span>
          <p>1.00% daily compounding ROI with fortnightly cashout settlements.</p>
        </div>
        <a href="index.html" class="sidebar-home-link">← Return to Homepage</a>
        <button id="sidebarLogout" class="sidebar-logout-btn" type="button">
          <span>🚪</span> Sign Out / Logout
        </button>
      </div>
    </aside>`;
}

const standardJs = `
  <script src="config.js"></script>
  <script>
    'use strict';
    const customerToken = localStorage.getItem('gcvh_customer_token');
    if (!customerToken) {
      location.href = 'login.html?redirect=' + encodeURIComponent(location.pathname);
    }

    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const mobileMenuBtn = document.getElementById('mobileMenuButton');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

    function openSidebar() {
      if (sidebar) sidebar.classList.add('mobile-open');
      if (backdrop) backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (mobileMenuBtn) mobileMenuBtn.onclick = openSidebar;
    if (sidebarCloseBtn) sidebarCloseBtn.onclick = closeSidebar;
    if (backdrop) backdrop.onclick = closeSidebar;

    const logoutBtn = document.getElementById('sidebarLogout');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        if (confirm('Are you sure you want to sign out of your account?')) {
          localStorage.removeItem('gcvh_customer_token');
          localStorage.removeItem('gcvh_customer_user');
          localStorage.removeItem('globeCapitalInvestment');
          localStorage.removeItem('gcvh_selected_package');
          location.href = 'login.html';
        }
      };
    }

    function updateSidebarProfile(user) {
      if (!user) return;
      const name = user.full_name || user.fullName || user.email || 'Private Client';
      const names = name.trim().split(/\\s+/);
      let initials = 'GC';
      if (names.length >= 2) {
        initials = (names[0][0] + names[1][0]).toUpperCase();
      } else if (names[0]) {
        initials = names[0].slice(0, 2).toUpperCase();
      }

      const avatarEl = document.getElementById('sidebarAvatar') || document.querySelector('.profile-avatar');
      if (avatarEl) avatarEl.textContent = initials;

      const nameEl = document.getElementById('sidebarUserName');
      if (nameEl) nameEl.textContent = name;

      const statusEl = document.getElementById('sidebarAccountStatus');
      if (statusEl) {
        const isActive = (user.status === 'active' || Number(user.principal || 0) > 0);
        statusEl.textContent = isActive ? 'Account Active' : 'Account Pending';
      }
    }

    try {
      const cached = JSON.parse(localStorage.getItem('gcvh_customer_user') || '{}');
      if (cached && (cached.full_name || cached.email)) updateSidebarProfile(cached);
    } catch (_) {}

    if (customerToken) {
      fetch((window.API_BASE_URL || '') + '/api/me', {
        headers: { Authorization: 'Bearer ' + customerToken },
        cache: 'no-store'
      })
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (me) {
          localStorage.setItem('gcvh_customer_user', JSON.stringify(me));
          updateSidebarProfile(me);
        }
      })
      .catch(() => {});
    }
  </script>
`;

console.log('Script template ready.');
