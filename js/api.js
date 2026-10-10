/**
 * Car Tuning - Unified REST API Client & Authentication Layer
 * Replaces fake localStorage authentication with real JWT backend communication.
 */

// 1. API Base URL Configuration
// In production on Vercel, this points to your deployed Render web service.
// During local development, automatically points to http://localhost:5000/api
const DEFAULT_RENDER_URL = 'https://car-tuning-app.onrender.com/api';
const DEFAULT_LOCAL_URL = 'http://localhost:5000/api';

const isLocalHost = 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '' ||
  window.location.protocol === 'file:';

const API_BASE = window.API_BASE_OVERRIDE || (isLocalHost ? DEFAULT_LOCAL_URL : DEFAULT_RENDER_URL);

// Storage keys
const TOKEN_KEY = 'tuning_app_token';
const USER_KEY = 'tuning_app_current_user';

console.log(`🔌 Car Tuning API initialized. Target: ${API_BASE}`);

// 2. Cold Start Indicator & Toast UI
function createApiStatusIndicator() {
  if (document.getElementById('api-status-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'api-status-banner';
  banner.style.cssText = `
    display: none;
    position: fixed;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 140, 0, 0.95);
    color: #fff;
    padding: 10px 24px;
    border-radius: 30px;
    font-size: 0.92rem;
    font-weight: 600;
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    z-index: 100000;
    backdrop-filter: blur(8px);
    transition: all 0.3s ease;
    align-items: center;
    gap: 10px;
  `;
  banner.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span id="api-status-text">Server waking up (cold start ~30-60s)...</span>`;
  document.body.appendChild(banner);
}

function showColdStartIndicator(show, customText) {
  let banner = document.getElementById('api-status-banner');
  if (!banner) {
    createApiStatusIndicator();
    banner = document.getElementById('api-status-banner');
  }
  if (!banner) return;

  if (show) {
    if (customText) {
      const textEl = document.getElementById('api-status-text');
      if (textEl) textEl.textContent = customText;
    }
    banner.style.display = 'inline-flex';
  } else {
    banner.style.display = 'none';
  }
}

function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('app-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'app-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bg = type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#ff8c00';
  toast.style.cssText = `
    background: ${bg};
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 0.95rem;
    box-shadow: 0 6px 20px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    gap: 10px;
    opacity: 0;
    transform: translateY(15px);
    transition: all 0.3s ease;
    pointer-events: auto;
  `;
  const icon = type === 'error' ? 'fa-circle-xmark' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 350);
  }, 4500);
}

// 3. Centralized API Fetcher
async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = { ...options.headers };

  // Attach token if present
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set json content-type if body is an object and not FormData
  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  // Detect slow requests / Render free tier cold starts (> 3.5s)
  const coldStartTimer = setTimeout(() => {
    showColdStartIndicator(true, 'Server waking up (~30-60s on Render free tier)...');
  }, 3500);

  try {
    const res = await fetch(url, { ...options, headers });
    clearTimeout(coldStartTimer);
    showColdStartIndicator(false);

    // Unpack response body
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      // Automatic logout and redirect on 401 Unauthorized
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('login.html')) {
          localStorage.setItem('returnUrl', window.location.href);
          window.location.href = 'login.html';
        }
      }

      const errorMessage = (data && data.error) || (data && data.message) || `Request failed (${res.status})`;
      const error = new Error(errorMessage);
      error.status = res.status;
      error.details = data && data.details;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(coldStartTimer);
    showColdStartIndicator(false);

    // Check for network errors (API offline or cold starting)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showColdStartIndicator(true, 'Connecting to server...');
      setTimeout(() => showColdStartIndicator(false), 5000);
      throw new Error('Server is unreachable. If this is a free tier instance, please allow 30–60s for cold start.');
    }

    throw error;
  }
}

// 4. Authentication Methods
async function register(userData) {
  const result = await apiFetch('/auth/register', {
    method: 'POST',
    body: userData
  });

  if (result.token) {
    localStorage.setItem(TOKEN_KEY, result.token);
  }
  if (result.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  }
  return result;
}

async function login(email, password) {
  const result = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password }
  });

  if (result.token) {
    localStorage.setItem(TOKEN_KEY, result.token);
  }
  if (result.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  }
  return result;
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = 'homepage.html';
}

function getCurrentUser() {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

function isLoggedIn() {
  return !!localStorage.getItem(TOKEN_KEY);
}

// 5. Global Window Interface for Existing Pages Compatibility
window.API_BASE = API_BASE;
window.apiFetch = apiFetch;
window.showToast = showToast;

window.signInUser = async function(email, password) {
  try {
    const result = await login(email, password);
    return { success: true, user: result.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

window.signUpUser = async function(email, password, userData) {
  try {
    const result = await register({
      email,
      password,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName
    });
    return { success: true, user: result.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

window.signOutUser = async function() {
  try {
    logout();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

window.getCurrentUser = getCurrentUser;
window.isUserAuthenticated = isLoggedIn;

window.onAuthStateChange = function(callback) {
  const user = getCurrentUser();
  if (user && isLoggedIn()) {
    callback(user);
  } else {
    callback(null);
  }

  // Storage listener across tabs
  const listener = (e) => {
    if (e.key === TOKEN_KEY || e.key === USER_KEY) {
      const updatedUser = getCurrentUser();
      callback(isLoggedIn() ? updatedUser : null);
    }
  };
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
};

// Builds API Helpers
window.saveBuildToApi = async function(buildPayload) {
  return apiFetch('/builds', {
    method: 'POST',
    body: buildPayload
  });
};

window.getMyBuilds = async function() {
  return apiFetch('/builds/mine', {
    method: 'GET'
  });
};

window.deleteBuild = async function(buildId) {
  return apiFetch(`/builds/${buildId}`, {
    method: 'DELETE'
  });
};

window.saveProject = async function(projectData) {
  // Map saveProject to builds endpoint for full persistence
  try {
    const build = await window.saveBuildToApi(projectData);
    return { success: true, id: build._id, build };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

window.getUserProjects = async function() {
  try {
    const builds = await window.getMyBuilds();
    return { success: true, projects: builds };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

document.addEventListener('DOMContentLoaded', () => {
  createApiStatusIndicator();
});
