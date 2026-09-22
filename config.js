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
  const dashboardBtns = document.querySelectorAll('.nav-dashboard-link, #dashboardNavButton, #heroDashboardButton, #mobileDashboard');
  const authLinks = document.querySelectorAll('.nav-auth-link, #loginNavButton, #registerNavButton');

  if (!token) {
    dashboardBtns.forEach(el => el.hidden = true);
    return;
  }

  try {
    const res = await fetch(API + '/api/me', {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      dashboardBtns.forEach(el => el.hidden = false);
    }
  } catch (e) {
    console.debug('Session check bypassed:', e);
  }
}

// Helper: Mobile menu toggle
function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  syncGlobalNav();
});
