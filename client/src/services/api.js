/**
 * ELEVATE — API Client Service
 * Handles JWT storage, refresh rotation, and unified error handling
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let accessToken = null;
let refreshToken = null;
let onAuthChange = null;

export function setAuthTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (refresh) {
    localStorage.setItem('elevate_refresh_token', refresh);
  }
}

export function clearAuth() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('elevate_refresh_token');
  localStorage.removeItem('elevate_user');
}

export function getStoredRefreshToken() {
  return localStorage.getItem('elevate_refresh_token');
}

export function registerAuthChangeListener(callback) {
  onAuthChange = callback;
}

export const setTokens = setAuthTokens;
export const setAuthChangeCallback = registerAuthChangeListener;

/**
 * Clean query string serializer — completely removes undefined, null, empty strings, and 'All'
 */
function buildQuery(params) {
  if (!params || typeof params !== 'object') return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'All' &&
      value !== 'undefined' &&
      value !== 'null'
    ) {
      searchParams.append(key, value);
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Attempt to refresh the access token
 */
async function tryRefresh() {
  const token = refreshToken || getStoredRefreshToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });

    if (!res.ok) {
      clearAuth();
      return false;
    }

    const data = await res.json();
    setAuthTokens(data.data.accessToken, data.data.refreshToken);
    if (onAuthChange) onAuthChange(data.data.user);
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

/**
 * Core fetch wrapper with auth handling
 */
async function apiFetch(endpoint, options = {}, retry = true) {
  const url = `${API_BASE}${endpoint}`;

  const headers = { ...options.headers };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Don't set Content-Type for FormData (let browser set multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 — try refresh
  if (response.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch(endpoint, options, false);
    }
    clearAuth();
    if (onAuthChange) onAuthChange(null);
    throw new ApiError('Session expired. Please sign in again.', 401);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || `Request failed with status ${response.status}`,
      response.status,
      data.errors
    );
  }

  return data;
}

/**
 * Custom API Error
 */
export class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// ════════════════════════════════════════════════════════════════
// API Methods
// ════════════════════════════════════════════════════════════════

// ── Auth ──
export const api = {
  auth: {
    register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    google: (body) => apiFetch('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
    apple: (body) => apiFetch('/auth/apple', { method: 'POST', body: JSON.stringify(body) }),
    microsoft: (body) => apiFetch('/auth/microsoft', { method: 'POST', body: JSON.stringify(body) }),
    phoneSendOtp: (body) => apiFetch('/auth/otp/phone/send', { method: 'POST', body: JSON.stringify(body) }),
    phoneVerifyOtp: (body) => apiFetch('/auth/otp/phone/verify', { method: 'POST', body: JSON.stringify(body) }),
    sendOtp: (body) => apiFetch('/auth/otp/send', { method: 'POST', body: JSON.stringify(body) }),
    verifyOtp: (body) => apiFetch('/auth/otp/verify', { method: 'POST', body: JSON.stringify(body) }),
    emailOtpSend: (body) => apiFetch('/auth/otp/email/send', { method: 'POST', body: JSON.stringify(body) }),
    emailOtpVerify: (body) => apiFetch('/auth/otp/email/verify', { method: 'POST', body: JSON.stringify(body) }),
    magicLinkSend: (body) => apiFetch('/auth/magic-link/send', { method: 'POST', body: JSON.stringify(body) }),
    magicLinkVerify: (body) => apiFetch('/auth/magic-link/verify', { method: 'POST', body: JSON.stringify(body) }),
    verifyEmail: (body) => apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify(body) }),
    forgotPassword: (body) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
    resetPassword: (body) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
    mfaVerify: (body) => apiFetch('/auth/mfa/verify', { method: 'POST', body: JSON.stringify(body) }),
    mfaSetup: () => apiFetch('/auth/mfa/setup', { method: 'POST' }),
    mfaEnable: (body) => apiFetch('/auth/mfa/enable', { method: 'POST', body: JSON.stringify(body) }),
    mfaDisable: (body) => apiFetch('/auth/mfa/disable', { method: 'POST', body: JSON.stringify(body) }),
    getProviders: () => apiFetch('/auth/providers'),
    unlinkProvider: (provider) => apiFetch(`/auth/providers/${provider}`, { method: 'DELETE' }),
    getSessions: () => apiFetch('/auth/sessions'),
    revokeSession: (sessionId) => apiFetch(`/auth/sessions/${sessionId}`, { method: 'DELETE' }),
    revokeOtherSessions: (body) => apiFetch('/auth/sessions', { method: 'DELETE', body: JSON.stringify(body) }),
    logout: () => {
      const rt = refreshToken || getStoredRefreshToken();
      clearAuth();
      return apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: rt }) }, false).catch(() => {});
    },
    getMe: () => apiFetch('/auth/me'),
    updateMe: (body) => apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
    changePassword: (body) => apiFetch('/auth/password', { method: 'PATCH', body: JSON.stringify(body) }),
    setPassword: (body) => apiFetch('/auth/set-password', { method: 'POST', body: JSON.stringify(body) }),
  },

  // ── Goals ──
  goals: {
    list: (params) => apiFetch(`/goals${buildQuery(params)}`),
    get: (id) => apiFetch(`/goals/${id}`),
    create: (body) => apiFetch('/goals', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiFetch(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id) => apiFetch(`/goals/${id}`, { method: 'DELETE' }),
  },

  // ── Tasks ──
  tasks: {
    list: (params) => apiFetch(`/tasks${buildQuery(params)}`),
    create: (body) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    toggle: (id) => apiFetch(`/tasks/${id}/toggle`, { method: 'PATCH' }),
    delete: (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
  },

  // ── Habits ──
  habits: {
    list: () => apiFetch('/habits'),
    create: (body) => apiFetch('/habits', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiFetch(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    complete: (id) => apiFetch(`/habits/${id}/complete`, { method: 'POST' }),
    delete: (id) => apiFetch(`/habits/${id}`, { method: 'DELETE' }),
  },

  // ── Skills ──
  skills: {
    list: (params) => apiFetch(`/skills${buildQuery(params)}`),
    create: (body) => apiFetch('/skills', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiFetch(`/skills/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    toggleMilestone: (id, milestoneId) => apiFetch(`/skills/${id}/milestones/${milestoneId}`, { method: 'PATCH' }),
    delete: (id) => apiFetch(`/skills/${id}`, { method: 'DELETE' }),
  },

  // ── Journal ──
  journal: {
    list: (params) => apiFetch(`/journal${buildQuery(params)}`),
    create: (body) => apiFetch('/journal', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiFetch(`/journal/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id) => apiFetch(`/journal/${id}`, { method: 'DELETE' }),
  },

  // ── Fashion ──
  fashion: {
    categories: () => apiFetch('/fashion/categories'),
    styles: (params) => apiFetch(`/fashion/styles${buildQuery(params)}`),
    style: (id) => apiFetch(`/fashion/styles/${id}`),
    saveStyle: (id) => apiFetch(`/fashion/styles/${id}/save`, { method: 'POST' }),
    savedStyles: () => apiFetch('/fashion/saved'),
  },

  // ── Brands ──
  brands: {
    list: (params) => apiFetch(`/brands${buildQuery(params)}`),
    get: (id) => apiFetch(`/brands/${id}`),
    save: (id) => apiFetch(`/brands/${id}/save`, { method: 'POST' }),
    saved: () => apiFetch('/brands/saved'),
  },

  // ── Wardrobe ──
  wardrobe: {
    list: (params) => apiFetch(`/wardrobe${buildQuery(params)}`),
    get: (id) => apiFetch(`/wardrobe/${id}`),
    stats: () => apiFetch('/wardrobe/stats'),
    create: (formData) => apiFetch('/wardrobe', { method: 'POST', body: formData }),
    createJson: (body) => apiFetch('/wardrobe', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiFetch(`/wardrobe/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    toggleFavorite: (id) => apiFetch(`/wardrobe/${id}/favorite`, { method: 'PATCH' }),
    delete: (id) => apiFetch(`/wardrobe/${id}`, { method: 'DELETE' }),
  },

  // ── Outfits ──
  outfits: {
    list: (params) => apiFetch(`/outfits${buildQuery(params)}`),
    get: (id) => apiFetch(`/outfits/${id}`),
    create: (body) => apiFetch('/outfits', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiFetch(`/outfits/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    toggleFavorite: (id) => apiFetch(`/outfits/${id}/favorite`, { method: 'PATCH' }),
    delete: (id) => apiFetch(`/outfits/${id}`, { method: 'DELETE' }),
  },

  // ── Dashboard ──
  dashboard: {
    get: () => apiFetch('/dashboard'),
  },

  // ── Recommendations ──
  recommendations: {
    list: (params) => apiFetch(`/recommendations${buildQuery(params)}`),
  },

  // ── Notifications ──
  notifications: {
    list: () => apiFetch('/notifications'),
    markRead: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => apiFetch('/notifications/read-all', { method: 'PATCH' }),
    delete: (id) => apiFetch(`/notifications/${id}`, { method: 'DELETE' }),
  },

  // ── Admin ──
  admin: {
    stats: () => apiFetch('/admin/stats'),
    analytics: () => apiFetch('/admin/analytics'),
    // Users
    users: (params) => apiFetch(`/admin/users${buildQuery(params)}`),
    userDetail: (id) => apiFetch(`/admin/users/${id}`),
    updateRole: (id, role) => apiFetch(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    updateStatus: (id, status) => apiFetch(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    // Fashion Categories
    categories: () => apiFetch('/admin/fashion/categories'),
    createCategory: (body) => apiFetch('/admin/fashion/categories', { method: 'POST', body: JSON.stringify(body) }),
    updateCategory: (id, body) => apiFetch(`/admin/fashion/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteCategory: (id) => apiFetch(`/admin/fashion/categories/${id}`, { method: 'DELETE' }),
    // Fashion Styles
    styles: (params) => apiFetch(`/admin/fashion/styles${buildQuery(params)}`),
    createStyle: (body) => apiFetch('/admin/fashion/styles', { method: 'POST', body: JSON.stringify(body) }),
    updateStyle: (id, body) => apiFetch(`/admin/fashion/styles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteStyle: (id) => apiFetch(`/admin/fashion/styles/${id}`, { method: 'DELETE' }),
    // Brands
    brands: (params) => apiFetch(`/admin/brands${buildQuery(params)}`),
    createBrand: (body) => apiFetch('/admin/brands', { method: 'POST', body: JSON.stringify(body) }),
    updateBrand: (id, body) => apiFetch(`/admin/brands/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteBrand: (id) => apiFetch(`/admin/brands/${id}`, { method: 'DELETE' }),
    // Media Library
    media: () => apiFetch('/admin/media'),
    uploadMedia: (formData) => apiFetch('/admin/media/upload', { method: 'POST', body: formData }),
    deleteMedia: (filename) => apiFetch(`/admin/media/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
    // Moderation & Reports
    reports: (params) => apiFetch(`/admin/reports${buildQuery(params)}`),
    createReport: (body) => apiFetch('/admin/reports', { method: 'POST', body: JSON.stringify(body) }),
    resolveReport: (id, notes) => apiFetch(`/admin/reports/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
    dismissReport: (id, notes) => apiFetch(`/admin/reports/${id}/dismiss`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
    // Audit Log
    auditLog: (params) => apiFetch(`/admin/audit-log${buildQuery(params)}`),
    // System Health
    systemHealth: () => apiFetch('/admin/system/health'),
  },
};

export default api;
