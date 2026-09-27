/**
 * Global Capital Venture Holdings, Inc. - Global Configuration & Core Utilities
 */
const CONFIG = {
  API_URL: (() => {
    try {
      const custom = localStorage.getItem('gcvh_api_endpoint');
      if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');
    } catch (e) {}
    if (window.location.protocol === 'file:' || !window.location.hostname) {
      return (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('Android'))
        ? 'http://10.0.2.2:8080'
        : 'http://localhost:8080';
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    }
    return window.location.origin;
  })(),
  TRC20_WALLET: 'TLYNo7HqiDBMzRPuuSPu3SQsL1Fx9gfD5w',
  BEP20_WALLET: '0xda9362094e07897b9fbcad372d353bcfec2cd88c',
  BINANCE_UID: '55868490',
  SUPPORT_EMAIL: 'globalcapitalventureholdings5@gmail.com'
};

const API = CONFIG.API_URL;
window.GCVH_CONFIG = window.GCVH_CONFIG || {
  API_BASE_URL: CONFIG.API_URL + '/api',
  TRC20_WALLET: CONFIG.TRC20_WALLET,
  BEP20_WALLET: CONFIG.BEP20_WALLET,
  BINANCE_UID: CONFIG.BINANCE_UID,
  SUPPORT_EMAIL: CONFIG.SUPPORT_EMAIL
};

// Helper: Get stored auth token
function getCustomerToken() {
  return localStorage.getItem('gcvh_customer_token') || sessionStorage.getItem('gcvh_customer_token');
}

// Helper: Get stored user data
function getCustomerUser() {
  try {
    return JSON.parse(localStorage.getItem('gcvh_customer_user') || sessionStorage.getItem('gcvh_customer_user') || '{}');
  } catch (e) {
    return {};
  }
}

// Helper: Global Copy to Clipboard with Visual Toast Feedback
async function copyToClipboard(text, btnElement, successMsg = 'Copied!') {
  if (!text) return;
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch (err) {}

  if (!copied) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      copied = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {}
  }

  // Toast feedback element
  showCopyToast(successMsg);

  // Button state update if element provided
  if (btnElement) {
    const originalText = btnElement.dataset.origText || btnElement.innerHTML;
    if (!btnElement.dataset.origText) btnElement.dataset.origText = originalText;
    btnElement.classList.add('btn-copied-state');
    btnElement.innerHTML = `<span>✓</span> ${successMsg}`;
    setTimeout(() => {
      btnElement.innerHTML = btnElement.dataset.origText;
      btnElement.classList.remove('btn-copied-state');
    }, 1800);
  }
}

function showCopyToast(msg = 'Copied to clipboard!') {
  let toast = document.getElementById('gcvhGlobalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'gcvhGlobalToast';
    toast.className = 'gcvh-toast-notification';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="font-size:16px;">✓</span> <span>${msg}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// Helper: Check login & update nav across all pages
async function syncGlobalNav() {
  const token = getCustomerToken();
  let user = getCustomerUser();

  const guestElements = document.querySelectorAll('.nav-guest-item, .mobile-guest-item');
  const userElements = document.querySelectorAll('.user-nav-profile, .mobile-user-card, .nav-user-item');

  function renderUser(userData) {
    const name = (userData && (userData.full_name || userData.fullName || userData.name)) || 'Private Client';
    const email = (userData && userData.email) || 'Active Account';
    const initials = name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'GC';

    document.querySelectorAll('.user-text-name, .mobile-user-name').forEach(el => { el.textContent = name; el.title = name; });
    document.querySelectorAll('.user-text-email, .mobile-user-email').forEach(el => { el.textContent = email; el.title = email; });
    document.querySelectorAll('.user-avatar-sm, .mobile-user-avatar').forEach(el => el.textContent = initials);
  }

  if (!token) {
    guestElements.forEach(el => el.style.display = '');
    userElements.forEach(el => el.style.display = 'none');
    return;
  }

  // User is logged in
  guestElements.forEach(el => el.style.display = 'none');
  userElements.forEach(el => el.style.display = '');
  renderUser(user);

  // Background fetch to ensure fresh profile data
  try {
    const res = await fetch(API + '/api/me', {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      const updated = { ...user, full_name: data.full_name || user.full_name, email: data.email || user.email, referral_code: data.referral_code };
      localStorage.setItem('gcvh_customer_user', JSON.stringify(updated));
      renderUser(updated);
    } else if (res.status === 401) {
      localStorage.removeItem('gcvh_customer_token');
      localStorage.removeItem('gcvh_customer_user');
      guestElements.forEach(el => el.style.display = '');
      userElements.forEach(el => el.style.display = 'none');
    }
  } catch (e) {
    console.debug('Session profile check bypassed:', e);
  }
}

// Helper: Setup user dropdown and logout listeners
function initUserDropdown() {
  const userChip = document.getElementById('userNavChip');
  const userMenu = document.getElementById('userNavDropdown');

  if (userChip && userMenu) {
    userChip.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target) && !userChip.contains(e.target)) {
        userMenu.classList.remove('show');
      }
    });
  }

  // Universal Logout Handlers
  document.querySelectorAll('.nav-logout-btn, #mobileLogoutBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('gcvh_customer_token');
        localStorage.removeItem('gcvh_customer_user');
        sessionStorage.removeItem('gcvh_customer_token');
        sessionStorage.removeItem('gcvh_customer_user');
        localStorage.removeItem('globeCapitalInvestment');
        localStorage.removeItem('gcvh_selected_package');
        location.href = 'index.html';
      }
    });
  });
}

// Helper: Mobile menu toggle with overlay drawer support
function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn') || document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu') || document.getElementById('sidebar');
  let navBackdrop = document.getElementById('navBackdrop') || document.getElementById('sidebarBackdrop');
  const mobileCloseBtn = document.getElementById('mobileCloseBtn') || document.getElementById('sidebarCloseBtn');

  if (!mobileMenu) return;

  if (!navBackdrop) {
    navBackdrop = document.createElement('div');
    navBackdrop.id = 'navBackdrop';
    navBackdrop.className = 'nav-backdrop';
    document.body.appendChild(navBackdrop);
  }

  function openDrawer() {
    mobileMenu.classList.add('open');
    mobileMenu.classList.add('active');
    if (navBackdrop) {
      navBackdrop.classList.add('active');
      navBackdrop.classList.add('open');
    }
    document.body.style.overflow = 'hidden';
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    mobileMenu.classList.remove('open');
    mobileMenu.classList.remove('active');
    if (navBackdrop) {
      navBackdrop.classList.remove('active');
      navBackdrop.classList.remove('open');
    }
    document.body.style.overflow = '';
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  if (menuBtn) {
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      if (mobileMenu.classList.contains('open') || mobileMenu.classList.contains('active')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    };
  }

  if (mobileCloseBtn) {
    mobileCloseBtn.onclick = (e) => {
      e.stopPropagation();
      closeDrawer();
    };
  }

  if (navBackdrop) {
    navBackdrop.onclick = () => {
      closeDrawer();
    };
  }

  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      if (!a.classList.contains('no-close')) {
        closeDrawer();
      }
    });
  });
}

// ============================================================================
// STATE-OF-THE-ART AI FINTECH SPLASH SCREEN
// ============================================================================
function initSplashScreen() {
  const hasSeenSplash = sessionStorage.getItem('gcvh_splash_seen');
  // Allow splash on first entry or direct refresh on key landing/dashboard
  const isDirect = !hasSeenSplash || window.location.search.includes('splash=1');
  if (!isDirect) return;

  const splash = document.createElement('div');
  splash.id = 'gcvhSplashScreen';
  splash.className = 'gcvh-splash-container';
  splash.innerHTML = `
    <div class="gcvh-splash-backdrop"></div>
    <div class="gcvh-splash-content">
      <div class="gcvh-ai-brand-wrap">
        <div class="gcvh-ai-orb-pulse"></div>
        <div class="gcvh-ai-core-icon">
          <svg viewBox="0 0 100 100" class="gcvh-ai-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" stroke="url(#gcvhGoldGrad)" stroke-width="1.5" stroke-dasharray="6 4" class="gcvh-rot-ring" />
            <circle cx="50" cy="50" r="38" stroke="url(#gcvhEmeraldGrad)" stroke-width="1.2" stroke-opacity="0.6" />
            <polygon points="50,16 80,50 50,84 20,50" stroke="url(#gcvhGoldGrad)" stroke-width="2" fill="url(#gcvhCoreDark)" />
            <polygon points="50,26 70,50 50,74 30,50" stroke="#5eead4" stroke-width="1.5" fill="none" class="gcvh-inner-diamond" />
            <circle cx="50" cy="50" r="6" fill="#f3cf7a" class="gcvh-ai-pulse-dot" />
            <line x1="50" y1="16" x2="50" y2="26" stroke="#f3cf7a" stroke-width="1.5" />
            <line x1="50" y1="74" x2="50" y2="84" stroke="#f3cf7a" stroke-width="1.5" />
            <line x1="20" y1="50" x2="30" y2="50" stroke="#5eead4" stroke-width="1.5" />
            <line x1="70" y1="50" x2="80" y2="50" stroke="#5eead4" stroke-width="1.5" />
            <defs>
              <linearGradient id="gcvhGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f3cf7a" />
                <stop offset="100%" stop-color="#c59b27" />
              </linearGradient>
              <linearGradient id="gcvhEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#10b981" />
                <stop offset="100%" stop-color="#059669" />
              </linearGradient>
              <linearGradient id="gcvhCoreDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#071c14" />
                <stop offset="100%" stop-color="#040e0a" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      <div class="gcvh-splash-text">
        <h1 class="gcvh-splash-brand">Global Capital</h1>
        <div class="gcvh-splash-sub">Venture Holdings, Inc.</div>
        <div class="gcvh-splash-ai-badge">✦ AI Quantitative Trading & Wealth Architecture ✦</div>
      </div>

      <div class="gcvh-splash-loader">
        <div class="gcvh-splash-bar-wrap">
          <div class="gcvh-splash-bar" id="gcvhSplashBar"></div>
        </div>
        <div class="gcvh-splash-status" id="gcvhSplashStatus">Initializing Neural Execution Engine...</div>
      </div>
    </div>
  `;

  document.body.appendChild(splash);
  sessionStorage.setItem('gcvh_splash_seen', '1');

  const statusEl = document.getElementById('gcvhSplashStatus');
  const barEl = document.getElementById('gcvhSplashBar');

  setTimeout(() => {
    if (barEl) barEl.style.width = '45%';
    if (statusEl) statusEl.textContent = 'Synchronizing Multi-Asset Liquidity Pools...';
  }, 400);

  setTimeout(() => {
    if (barEl) barEl.style.width = '85%';
    if (statusEl) statusEl.textContent = 'Validating Cryptographic Ledger & Vault...';
  }, 900);

  setTimeout(() => {
    if (barEl) barEl.style.width = '100%';
    if (statusEl) statusEl.textContent = 'Access Granted. Welcome.';
  }, 1300);

  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    }, 500);
  }, 1600);

  splash.addEventListener('click', () => {
    splash.classList.add('fade-out');
    setTimeout(() => {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    }, 400);
  });
}

// Inject Global Splash & Toast Styles into Document
function injectGlobalStyles() {
  if (document.getElementById('gcvhCoreStyles')) return;
  const style = document.createElement('style');
  style.id = 'gcvhCoreStyles';
  style.textContent = `
    /* Toast Notification */
    .gcvh-toast-notification {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99999;
      background: linear-gradient(135deg, #071c14, #0b2e21);
      border: 1.5px solid #10b981;
      color: #5eead4;
      padding: 12px 22px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.25);
      transform: translateY(100px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .gcvh-toast-notification.show {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    @media (max-width: 600px) {
      .gcvh-toast-notification {
        left: 20px;
        right: 20px;
        bottom: 20px;
        justify-content: center;
      }
    }

    /* Splash Screen Container */
    .gcvh-splash-container {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #040907;
      color: #ffffff;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      padding: 24px;
      overflow: hidden;
      transition: opacity 0.5s ease, visibility 0.5s ease;
    }
    .gcvh-splash-container.fade-out {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .gcvh-splash-backdrop {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.18) 0%, rgba(197, 155, 39, 0.08) 40%, rgba(4, 9, 7, 0.98) 75%);
      pointer-events: none;
    }
    .gcvh-splash-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 480px;
      width: 100%;
    }
    .gcvh-ai-brand-wrap {
      position: relative;
      width: 110px;
      height: 110px;
      margin-bottom: 24px;
      display: grid;
      place-items: center;
    }
    .gcvh-ai-orb-pulse {
      position: absolute;
      inset: -12px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(243, 207, 122, 0.15) 50%, transparent 70%);
      animation: gcvhPulseOrb 2.5s ease-in-out infinite alternate;
    }
    .gcvh-ai-core-icon {
      width: 96px;
      height: 96px;
      position: relative;
      z-index: 2;
      filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.45));
    }
    .gcvh-ai-svg {
      width: 100%;
      height: 100%;
    }
    .gcvh-rot-ring {
      transform-origin: 50px 50px;
      animation: gcvhSpin 16s linear infinite;
    }
    .gcvh-inner-diamond {
      transform-origin: 50px 50px;
      animation: gcvhScaleDiamond 3s ease-in-out infinite alternate;
    }
    .gcvh-ai-pulse-dot {
      animation: gcvhGlowDot 1.8s ease-in-out infinite alternate;
    }
    .gcvh-splash-brand {
      font: 700 clamp(28px, 6vw, 38px)/1.1 Georgia, serif;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin: 0;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }
    .gcvh-splash-sub {
      color: #f3cf7a;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin: 6px 0 14px;
    }
    .gcvh-splash-ai-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #5eead4;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 30px;
    }
    .gcvh-splash-loader {
      width: 100%;
      max-width: 320px;
    }
    .gcvh-splash-bar-wrap {
      width: 100%;
      height: 5px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
      margin-bottom: 12px;
    }
    .gcvh-splash-bar {
      height: 100%;
      width: 15%;
      border-radius: 99px;
      background: linear-gradient(90deg, #10b981, #f3cf7a);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
      transition: width 0.45s ease-out;
    }
    .gcvh-splash-status {
      font-size: 12px;
      color: #8ba89d;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    @keyframes gcvhSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes gcvhScaleDiamond {
      0% { transform: scale(0.92); opacity: 0.7; }
      100% { transform: scale(1.06); opacity: 1; stroke: #f3cf7a; }
    }
    @keyframes gcvhGlowDot {
      0% { r: 5; fill: #10b981; filter: drop-shadow(0 0 4px #10b981); }
      100% { r: 7.5; fill: #f3cf7a; filter: drop-shadow(0 0 10px #f3cf7a); }
    }
    @keyframes gcvhPulseOrb {
      0% { transform: scale(0.9); opacity: 0.35; }
      100% { transform: scale(1.15); opacity: 0.7; }
    }
  `;
  document.head.appendChild(style);
}

// Auto Initialize Everything on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  injectGlobalStyles();
  initSplashScreen();
  initMobileMenu();
  initUserDropdown();
  syncGlobalNav();
});
