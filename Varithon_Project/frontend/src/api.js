const API_BASE = 'https://varkari-mitra.onrender.com/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('vm_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (email, password, name, role) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, role }) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  googleLogin: (email, name, googleId, role) => request('/auth/google', { method: 'POST', body: JSON.stringify({ email, name, googleId, role }) }),
  me: () => request('/auth/me'),
  ekyc: (data) => request('/kyc/ekyc', { method: 'POST', body: JSON.stringify(data) }),
  kycStatus: () => request('/kyc/status'),
  updateLocation: (lat, lon) => request('/varkari/location', { method: 'POST', body: JSON.stringify({ latitude: lat, longitude: lon }) }),
  setSharing: (enabled) => request('/varkari/sharing', { method: 'PUT', body: JSON.stringify({ enabled }) }),
  addFamily: (email, name, relation) => request('/family/add', { method: 'POST', body: JSON.stringify({ email, name, relation }) }),
  myFamily: () => request('/family/mine'),
  trackVarkari: (varkariId) => request(`/family/track/${varkariId}`),
  createSeva: (data) => request('/sevas/create', { method: 'POST', body: JSON.stringify(data) }),
  mySevas: () => request('/sevas/mine'),
  allSevas: () => request('/sevas'),
  emergencyReport: (data) => request('/emergency/report', { method: 'POST', body: JSON.stringify(data) }),
  trafficUpdate: (data) => request('/traffic/update-vari-location', { method: 'POST', body: JSON.stringify(data) }),
  adminAll: () => request('/admin/all'),
  palkhiList: () => request('/palkhi/list'),
  palkhiSchedule: (name, year) => request(`/palkhi/${encodeURIComponent(name)}?year=${year || new Date().getFullYear()}`),
};

export function getToken() { return localStorage.getItem('vm_token'); }
export function setToken(t) { localStorage.setItem('vm_token', t); }
export function clearToken() { localStorage.removeItem('vm_token'); }
