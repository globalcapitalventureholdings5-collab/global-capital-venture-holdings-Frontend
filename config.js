/**
 * Global Capital Venture Holdings - Global Configuration & Utilities
 */
const CONFIG = {
  API_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8080'
    : window.location.origin
};

const API = CONFIG.API_URL;

// Helper: Get stored auth token
function getCustomerToken() {
  return localStorage.getItem('gcvh_customer_token');
}

// Helper: Get stored user data
function getCustomerUser() {
  try {
    return JSON.parse(localStorage.getItem('gcvh_customer_user') || '{}');
  } catch (e) {
    return {};
  }
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
      // Token expired or invalid
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
        localStorage.removeItem('globeCapitalInvestment');
        localStorage.removeItem('gcvh_selected_package');
        location.href = 'index.html';
      }
    });
  });
}

// Helper: Mobile menu toggle with overlay drawer support
function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  let navBackdrop = document.getElementById('navBackdrop');
  const mobileCloseBtn = document.getElementById('mobileCloseBtn');

  if (!mobileMenu) return;

  // Create backdrop element dynamically if not present in HTML
  if (!navBackdrop) {
    navBackdrop = document.createElement('div');
    navBackdrop.id = 'navBackdrop';
    navBackdrop.className = 'nav-backdrop';
    document.body.appendChild(navBackdrop);
  }

  function openDrawer() {
    mobileMenu.classList.add('open');
    if (navBackdrop) navBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    mobileMenu.classList.remove('open');
    if (navBackdrop) navBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  if (menuBtn) {
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      if (mobileMenu.classList.contains('open')) {
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

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initUserDropdown();
  syncGlobalNav();
});

