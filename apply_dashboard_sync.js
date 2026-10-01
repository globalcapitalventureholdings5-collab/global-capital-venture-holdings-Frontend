const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname);

const pages = [
  { file: 'dashboard-signals.html', key: 'nav-signals' },
  { file: 'dashboard-market.html', key: 'nav-market' },
  { file: 'dashboard-earnings.html', key: 'nav-earnings' },
  { file: 'dashboard-withdrawals.html', key: 'nav-withdrawals' },
  { file: 'dashboard-referrals.html', key: 'nav-referrals' },
  { file: 'dashboard-salary.html', key: 'nav-salary' },
  { file: 'dashboard-videos.html', key: 'nav-videos' }
];

function buildSidebarNav(activeKey) {
  return `<nav class="sidebar-navigation">
        <a href="dashboard.html" class="${activeKey === 'nav-overview' ? 'active' : ''}"><span>▦</span> Portfolio Overview</a>
        <a href="dashboard.html#userDetailsSection" class="${activeKey === 'nav-user-details' ? 'active' : ''}"><span>👤</span> User & Wallet Details</a>
        <a href="dashboard-signals.html" class="${activeKey === 'nav-signals' ? 'active' : ''}"><span>⚡</span> Daily Signals & 1% ROI</a>
        <a href="dashboard-market.html" class="${activeKey === 'nav-market' ? 'active' : ''}"><span>◈</span> Live XAUUSD Terminal</a>
        <a href="dashboard-earnings.html" class="${activeKey === 'nav-earnings' ? 'active' : ''}"><span>📈</span> Earnings & ROI Ledger</a>
        <a href="dashboard-withdrawals.html" class="${activeKey === 'nav-withdrawals' ? 'active' : ''}"><span>↗</span> Fortnightly Withdrawals</a>
        <a href="dashboard-referrals.html" class="${activeKey === 'nav-referrals' ? 'active' : ''}"><span>%</span> 3-Tier Affiliate Team</a>
        <a href="dashboard-salary.html" class="${activeKey === 'nav-salary' ? 'active' : ''}"><span>◷</span> Monthly Salary Matrix</a>
        <a href="dashboard-videos.html" class="${activeKey === 'nav-videos' ? 'active' : ''}"><span>🎬</span> My Videos & Content Studio</a>
        <div style="height:1px;background:var(--border);margin:8px 0;"></div>
        <a href="deposit.html" style="color:var(--gold);"><span>↓</span> Fund Investment (Deposit)</a>
        <a href="packages.html"><span>💎</span> Investment Packages</a>
        <a href="/api/download-apk" download="GlobalCapitalHoldings.apk" style="color:var(--gold);font-weight:700;"><span>📱</span> Download Android App (APK)</a>
        <a href="blogs.html"><span>📰</span> Community & News Briefings</a>
      </nav>`;
}

function buildSidebarHeaderAndProfile() {
  return `      <div class="sidebar-header">
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
      </div>`;
}

function buildSidebarBottom() {
  return `      <div class="sidebar-bottom">
        <div class="account-badge-box">
          <span>PRIVATE PORTFOLIO</span>
          <p>1.00% daily compounding ROI with fortnightly cashout settlements.</p>
        </div>
        <a href="index.html" class="sidebar-home-link">← Return to Homepage</a>
        <button id="sidebarLogout" class="sidebar-logout-btn" type="button">
          <span>🚪</span> Sign Out / Logout
        </button>
      </div>`;
}

function buildMobileHeader() {
  return `  <!-- MOBILE TOP BAR -->
  <header class="mobile-header">
    <a href="index.html" class="mobile-brand">
      <span class="brand-mark">✦</span>
      <span>Global Capital <b>Holdings</b></span>
    </a>
    <button id="mobileMenuButton" class="mobile-menu-btn" type="button" aria-label="Open sidebar menu">☰</button>
  </header>

  <!-- BACKDROP OVERLAY FOR MOBILE SIDEBAR -->
  <div id="sidebarBackdrop" class="sidebar-backdrop"></div>`;
}

const profileScript = `
    function updateUnifiedSidebarProfile(u) {
      if (!u) return;
      const name = u.full_name || u.fullName || u.email || 'Private Client';
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
        const isActive = (u.status === 'active' || Number(u.principal || 0) > 0);
        statusEl.textContent = isActive ? 'Account Active' : 'Account Pending';
      }
    }

    // Initialize mobile sidebar drawer listeners
    const sidebarEl = document.getElementById('sidebar');
    const backdropEl = document.getElementById('sidebarBackdrop');
    const mobileMenuBtnEl = document.getElementById('mobileMenuButton');
    const sidebarCloseBtnEl = document.getElementById('sidebarCloseBtn');

    function openSidebarDrawer() {
      if (sidebarEl) sidebarEl.classList.add('mobile-open');
      if (backdropEl) backdropEl.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebarDrawer() {
      if (sidebarEl) sidebarEl.classList.remove('mobile-open');
      if (backdropEl) backdropEl.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (mobileMenuBtnEl) mobileMenuBtnEl.onclick = openSidebarDrawer;
    if (sidebarCloseBtnEl) sidebarCloseBtnEl.onclick = closeSidebarDrawer;
    if (backdropEl) backdropEl.onclick = closeSidebarDrawer;

    const logoutBtnEl = document.getElementById('sidebarLogout');
    if (logoutBtnEl) {
      logoutBtnEl.onclick = () => {
        if (confirm('Are you sure you want to sign out of your account?')) {
          localStorage.removeItem('gcvh_customer_token');
          localStorage.removeItem('gcvh_customer_user');
          localStorage.removeItem('globeCapitalInvestment');
          localStorage.removeItem('gcvh_selected_package');
          location.href = 'login.html';
        }
      };
    }

    try {
      const cached = JSON.parse(localStorage.getItem('gcvh_customer_user') || '{}');
      if (cached && (cached.full_name || cached.email)) updateUnifiedSidebarProfile(cached);
    } catch (_) {}

    const authToken = localStorage.getItem('gcvh_customer_token');
    if (authToken) {
      fetch((window.API_BASE_URL || '') + '/api/me', {
        headers: { Authorization: 'Bearer ' + authToken },
        cache: 'no-store'
      })
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (me) {
          localStorage.setItem('gcvh_customer_user', JSON.stringify(me));
          updateUnifiedSidebarProfile(me);
        }
      })
      .catch(() => {});
    }
`;

for (const p of pages) {
  const filePath = path.join(frontendDir, p.file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace header & sidebar
  content = content.replace(/<header class="mobile-header">[\s\S]*?<\/header>/, buildMobileHeader());
  if (!content.includes('sidebar-backdrop')) {
    content = content.replace(/<div class="dashboard-layout">/, '<div id="sidebarBackdrop" class="sidebar-backdrop"></div>\n<div class="dashboard-layout">');
  }

  // Replace sidebar header and profile
  content = content.replace(/<div class="sidebar-header">[\s\S]*?<div class="sidebar-profile">[\s\S]*?<\/div>\s*<\/div>/, buildSidebarHeaderAndProfile());
  // Replace navigation
  content = content.replace(/<nav class="sidebar-navigation">[\s\S]*?<\/nav>/, buildSidebarNav(p.key));
  // Replace bottom
  content = content.replace(/<div class="sidebar-bottom">[\s\S]*?<\/div>\s*<\/aside>/, buildSidebarBottom() + '\n    </aside>');

  // Add profile script if not present
  if (!content.includes('updateUnifiedSidebarProfile')) {
    content = content.replace(/<\/body>/, `<script>${profileScript}</script>\n</body>`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Updated ${p.file}`);
}
