import express from 'express';
import cors from 'cors';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/admin', express.static(join(__dirname, 'admin')));
app.get('/', (req, res) => res.redirect('/admin'));

const trafficStore = new Map();
const emergencyStore = new Map();
const broadcastStore = new Map();
const usersStore = new Map();
const devicesStore = new Map();
const sessionsStore = new Map();
const familyStore = new Map();
const sevasStore = new Map();
const sanitationStore = new Map();
const lostChildStore = new Map();

function generateToken() {
  return 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getUserByEmail(email) {
  for (const u of usersStore.values()) {
    if (u.email === email) return u;
  }
  return null;
}

function getUserByToken(token) {
  const session = sessionsStore.get(token);
  if (!session) return null;
  return usersStore.get(session.userId) || null;
}

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password required' });
  }
  if (getUserByEmail(email)) {
    return res.status(409).json({ status: 'error', message: 'User already exists' });
  }
  const userId = 'usr_' + Date.now();
  const userRole = role || 'varkari';
  const user = { id: userId, email, password, name: name || email.split('@')[0], role: userRole, kycStatus: userRole === 'varkari_mitra' ? 'PENDING' : 'NOT_REQUIRED', kycData: null, createdAt: new Date().toISOString(), locationSharing: userRole === 'varkari' };
  usersStore.set(userId, user);
  const token = generateToken();
  sessionsStore.set(token, { userId, createdAt: new Date().toISOString() });
  const { password: _, ...safeUser } = user;
  res.status(201).json({ status: 'ok', token, user: safeUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }
  const token = generateToken();
  sessionsStore.set(token, { userId: user.id, createdAt: new Date().toISOString() });
  const { password: _, ...safeUser } = user;
  res.status(200).json({ status: 'ok', token, user: safeUser });
});

app.post('/api/auth/google', (req, res) => {
  const { email, name, googleId, role } = req.body || {};
  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email required' });
  }
  let user = getUserByEmail(email);
  const userRole = role || 'varkari';
  if (!user) {
    const userId = 'usr_' + Date.now();
    user = { id: userId, email, password: null, name: name || email.split('@')[0], role: userRole, kycStatus: userRole === 'varkari_mitra' ? 'PENDING' : 'NOT_REQUIRED', kycData: null, createdAt: new Date().toISOString(), googleId: googleId || null, locationSharing: userRole === 'varkari' };
    usersStore.set(userId, user);
  }
  const token = generateToken();
  sessionsStore.set(token, { userId: user.id, createdAt: new Date().toISOString() });
  const { password: _, ...safeUser } = user;
  res.status(200).json({ status: 'ok', token, user: safeUser });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const { password: _, ...safeUser } = user;
  res.status(200).json({ status: 'ok', user: safeUser });
});

app.post('/api/kyc/submit', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const { name, aadhaar, role } = req.body || {};
  user.kycStatus = 'VERIFIED';
  user.kycData = { name, aadhaar, role, submittedAt: new Date().toISOString() };
  if (name) user.name = name;
  res.status(200).json({ status: 'ok', message: 'KYC verified', kyc: user.kycData });
});

app.get('/api/kyc/status', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  res.status(200).json({ status: 'ok', kycStatus: user.kycStatus, kycData: user.kycData });
});

app.post('/api/devices/register', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const { imei, name, phone } = req.body || {};
  const deviceId = 'dev_' + Date.now();
  const device = { id: deviceId, userId: user.id, userName: user.name, imei: imei || deviceId, name: name || 'My Device', phone: phone || '', registeredAt: new Date().toISOString(), lastSeen: new Date().toISOString() };
  devicesStore.set(deviceId, device);
  res.status(201).json({ status: 'ok', device });
});

app.get('/api/devices/mine', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const myDevices = Array.from(devicesStore.values()).filter(d => d.userId === user.id).reverse();
  res.status(200).json({ status: 'ok', count: myDevices.length, data: myDevices });
});

app.post('/api/devices/track', (req, res) => {
  const { targetEmail, targetUserId, imei } = req.body || {};
  let targetUser = null;
  if (targetEmail) {
    targetUser = getUserByEmail(targetEmail);
  } else if (targetUserId) {
    targetUser = usersStore.get(targetUserId);
  }
  if (!targetUser) {
    return res.status(404).json({ status: 'error', message: 'Target user not found' });
  }
  const userDevices = Array.from(devicesStore.values()).filter(d => d.userId === targetUser.id);
  if (userDevices.length === 0) {
    return res.status(404).json({ status: 'error', message: 'No devices registered for this user' });
  }
  const device = imei ? userDevices.find(d => d.imei === imei) || userDevices[0] : userDevices[0];
  device.lastSeen = new Date().toISOString();
  res.status(200).json({ status: 'ok', message: 'Device tracked', device, owner: { name: targetUser.name, email: targetUser.email, kycStatus: targetUser.kycStatus, role: targetUser.role } });
});

// eKYC for Varkari Mitra
app.post('/api/kyc/ekyc', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  if (user.role !== 'varkari_mitra') {
    return res.status(403).json({ status: 'error', message: 'eKYC only for Varkari Mitra' });
  }
  const { fullName, aadhaarNumber, address, phone, photoBase64 } = req.body || {};
  if (!fullName || !aadhaarNumber || !phone) {
    return res.status(400).json({ status: 'error', message: 'fullName, aadhaarNumber, phone required' });
  }
  user.kycStatus = 'VERIFIED';
  user.kycData = { fullName, aadhaarNumber, address, phone, photoBase64, submittedAt: new Date().toISOString() };
  if (fullName) user.name = fullName;
  const { password: _, ...safeUser } = user;
  res.status(200).json({ status: 'ok', message: 'eKYC verified successfully', user: safeUser, kyc: user.kycData });
});

// Varkari location update
app.post('/api/varkari/location', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  if (user.role !== 'varkari') {
    return res.status(403).json({ status: 'error', message: 'Only Varkari can update location' });
  }
  const { latitude, longitude } = req.body || {};
  if (latitude == null || longitude == null) {
    return res.status(400).json({ status: 'error', message: 'latitude and longitude required' });
  }
  user.lastLocation = { latitude, longitude, updatedAt: new Date().toISOString() };
  const { password: _, ...safeUser } = user;
  res.status(200).json({ status: 'ok', message: 'Location updated', user: safeUser });
});

// Family member management
app.post('/api/family/add', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  if (user.role !== 'varkari') {
    return res.status(403).json({ status: 'error', message: 'Only Varkari can add family members' });
  }
  const { email, name, relation } = req.body || {};
  if (!email || !name) {
    return res.status(400).json({ status: 'error', message: 'email and name required' });
  }
  const familyId = 'fam_' + Date.now();
  const member = { id: familyId, varkariId: user.id, varkariName: user.name, email, name, relation: relation || 'Family', addedAt: new Date().toISOString() };
  familyStore.set(familyId, member);
  res.status(201).json({ status: 'ok', member });
});

app.get('/api/family/mine', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const members = Array.from(familyStore.values()).filter(m => m.varkariId === user.id).reverse();
  res.status(200).json({ status: 'ok', count: members.length, data: members });
});

app.get('/api/family/track/:varkariId', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const viewer = getUserByToken(token);
  if (!viewer) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const varkariId = req.params.varkariId;
  const varkari = usersStore.get(varkariId);
  if (!varkari || varkari.role !== 'varkari') {
    return res.status(404).json({ status: 'error', message: 'Varkari not found' });
  }
  const isFamily = Array.from(familyStore.values()).some(m => m.varkariId === varkariId && m.email === viewer.email);
  if (!isFamily && varkari.id !== viewer.id) {
    return res.status(403).json({ status: 'error', message: 'Not authorized to view this location' });
  }
  if (!varkari.locationSharing) {
    return res.status(200).json({ status: 'ok', sharing: false, message: 'Location sharing disabled' });
  }
  res.status(200).json({ status: 'ok', sharing: true, location: varkari.lastLocation, varkari: { id: varkari.id, name: varkari.name, email: varkari.email } });
});

app.put('/api/varkari/sharing', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  if (user.role !== 'varkari') {
    return res.status(403).json({ status: 'error', message: 'Only Varkari can change sharing' });
  }
  const { enabled } = req.body || {};
  user.locationSharing = !!enabled;
  const { password: _, ...safeUser } = user;
  res.status(200).json({ status: 'ok', sharing: user.locationSharing, user: safeUser });
});

// Seva marketplace
app.post('/api/sevas/create', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  if (user.role !== 'vari_sevak') {
    return res.status(403).json({ status: 'error', message: 'Only Vari Sevak can create sevas' });
  }
  const { title, description, category, price, location, availableFrom, availableTo } = req.body || {};
  if (!title) {
    return res.status(400).json({ status: 'error', message: 'title required' });
  }
  const sevaId = 'sev_' + Date.now();
  const seva = { id: sevaId, sevakId: user.id, sevakName: user.name, title, description: description || '', category: category || 'General', price: price || 0, location: location || '', availableFrom: availableFrom || null, availableTo: availableTo || null, createdAt: new Date().toISOString() };
  sevasStore.set(sevaId, seva);
  res.status(201).json({ status: 'ok', seva });
});

app.get('/api/sevas', (req, res) => {
  const sevas = Array.from(sevasStore.values()).reverse();
  res.status(200).json({ status: 'ok', count: sevas.length, data: sevas });
});

app.get('/api/sevas/mine', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const mySevas = Array.from(sevasStore.values()).filter(s => s.sevakId === user.id).reverse();
  res.status(200).json({ status: 'ok', count: mySevas.length, data: mySevas });
});

// Nirmal Wari Sanitation Hub - receives alerts from the sanitation hub
app.post('/api/sanitation/report', (req, res) => {
  const { issueType, location, latitude, longitude, photoBase64, reportedBy, status } = req.body || {};
  const ticketId = 'SAN-' + Date.now();
  const ticket = {
    id: ticketId,
    issueType: issueType || 'Unknown',
    location: location || '',
    latitude,
    longitude,
    photoBase64: photoBase64 || null,
    reportedBy: reportedBy || 'Nirmal Wari Sanitation Hub',
    status: status || 'DISPATCHED_TO_PANCHAYAT',
    receivedAt: new Date().toISOString()
  };
  sanitationStore.set(ticketId, ticket);
  console.log('Sanitation alert:', ticket);
  res.status(201).json({ status: 'ok', ticketId, message: 'Sanitation alert sent to backend', ticket });
});

app.get('/api/sanitation/all', (req, res) => {
  const tickets = Array.from(sanitationStore.values()).reverse();
  res.status(200).json({ status: 'ok', count: tickets.length, data: tickets });
});

app.post('/api/lost-child/report', (req, res) => {
  const { childName, age, gender, lastSeenLocation, lastSeenLatitude, lastSeenLongitude, description, contactNumber, photoBase64, reportedBy, reportedByRole } = req.body || {};
  if (!childName && !description) {
    return res.status(400).json({ status: 'error', message: 'childName or description required' });
  }
  const alertId = 'LCH-' + Date.now();
  const alert = {
    id: alertId,
    childName: childName || 'Unknown',
    age: age || null,
    gender: gender || 'Unknown',
    lastSeenLocation: lastSeenLocation || '',
    lastSeenLatitude,
    lastSeenLongitude,
    description: description || '',
    contactNumber: contactNumber || '',
    photoBase64: photoBase64 || null,
    reportedBy: reportedBy || 'Anonymous',
    reportedByRole: reportedByRole || 'varkari',
    status: 'ACTIVE',
    receivedAt: new Date().toISOString()
  };
  lostChildStore.set(alertId, alert);
  console.log('Lost child alert:', alert);
  res.status(201).json({ status: 'ok', alertId, message: 'Lost child alert broadcast to all varkaris', alert });
});

app.get('/api/lost-child/active', (req, res) => {
  const alerts = Array.from(lostChildStore.values()).filter(a => a.status === 'ACTIVE').reverse();
  res.status(200).json({ status: 'ok', count: alerts.length, data: alerts });
});

app.put('/api/lost-child/:alertId/resolve', (req, res) => {
  const alert = lostChildStore.get(req.params.alertId);
  if (!alert) {
    return res.status(404).json({ status: 'error', message: 'Alert not found' });
  }
  alert.status = 'RESOLVED';
  alert.resolvedAt = new Date().toISOString();
  res.status(200).json({ status: 'ok', message: 'Alert marked as resolved', alert });
});

app.get('/api/admin/users', (req, res) => {
  const users = Array.from(usersStore.values()).reverse();
  res.status(200).json({ status: 'ok', count: users.length, data: users });
});

app.get('/api/admin/devices', (req, res) => {
  const devices = Array.from(devicesStore.values()).reverse();
  res.status(200).json({ status: 'ok', count: devices.length, data: devices });
});

app.post('/api/traffic/update-vari-location', (req, res) => {
  const { latitude, longitude, role } = req.body || {};
  const entry = {
    latitude,
    longitude,
    role,
    updatedAt: new Date().toISOString()
  };
  trafficStore.set('latest', entry);
  console.log('Traffic update:', entry);
  res.status(200).json({ status: 'ok', received: entry });
});

app.get('/api/traffic/active-diversions', (req, res) => {
  const latest = trafficStore.get('latest');
  res.status(200).json({
    status: 'ok',
    active: latest ? [latest] : []
  });
});

app.post('/api/emergency/report', (req, res) => {
  const payload = {
    ...req.body,
    receivedAt: new Date().toISOString(),
    id: `EMR-${Date.now()}`
  };
  emergencyStore.set(payload.id, payload);
  console.log('Emergency report:', payload);
  res.status(200).json({ status: 'ok', id: payload.id });
});

app.post('/api/emergency/broadcast-position', (req, res) => {
  const payload = {
    ...req.body,
    receivedAt: new Date().toISOString(),
    id: `BC-${Date.now()}`
  };
  broadcastStore.set(payload.id, payload);
  console.log('Authority broadcast:', payload);
  res.status(200).json({ status: 'ok', id: payload.id, delivered: true });
});

app.get('/api/admin/emergency-reports', (req, res) => {
  const reports = Array.from(emergencyStore.values()).reverse();
  res.status(200).json({ status: 'ok', count: reports.length, data: reports });
});

app.get('/api/admin/broadcasts', (req, res) => {
  const broadcasts = Array.from(broadcastStore.values()).reverse();
  res.status(200).json({ status: 'ok', count: broadcasts.length, data: broadcasts });
});

app.get('/api/admin/traffic', (req, res) => {
  const traffic = Array.from(trafficStore.values()).reverse();
  res.status(200).json({ status: 'ok', count: traffic.length, data: traffic });
});

app.get('/api/admin/all', (req, res) => {
  res.status(200).json({
    status: 'ok',
    traffic: Array.from(trafficStore.values()).reverse(),
    emergencyReports: Array.from(emergencyStore.values()).reverse(),
    broadcasts: Array.from(broadcastStore.values()).reverse(),
    users: Array.from(usersStore.values()).reverse(),
    devices: Array.from(devicesStore.values()).reverse(),
    family: Array.from(familyStore.values()).reverse(),
    sevas: Array.from(sevasStore.values()).reverse(),
    sanitation: Array.from(sanitationStore.values()).reverse(),
    lostChild: Array.from(lostChildStore.values()).reverse()
  });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Varithon backend running on http://localhost:${PORT}`);
});

// ──────────────────────────────────────────────────────────────────
// Palkhi / Wari Schedule Data & API
// ──────────────────────────────────────────────────────────────────

const ASHADHI_EKADASHI_DATES = {
  2020: "2020-07-01",
  2021: "2021-07-20",
  2022: "2022-07-10",
  2023: "2023-06-29",
  2024: "2024-07-17",
  2025: "2025-07-06",
  2026: "2026-06-25",
  2027: "2027-07-14",
  2028: "2028-07-03",
  2029: "2029-07-21",
  2030: "2030-07-10",
};

const PALKHI_CONFIG = {
  dnyaneshwar: {
    name: "Sant Dnyaneshwar Maharaj Palkhi",
    startPoint: "Alandi",
    daysBeforeEkadashi: 18,
    color: "#EA4335",
    halts: [
      { day: 1, name: "Alandi", lat: 18.6756, lng: 73.8967 },
      { day: 2, name: "Pune (Bhavani Peth)", lat: 18.5074, lng: 73.8677 },
      { day: 3, name: "Pune (Bhavani Peth)", lat: 18.5074, lng: 73.8677 },
      { day: 4, name: "Saswad", lat: 18.3439, lng: 74.0305 },
      { day: 5, name: "Saswad", lat: 18.3439, lng: 74.0305 },
      { day: 6, name: "Jejuri", lat: 18.2755, lng: 74.1601 },
      { day: 7, name: "Valhe", lat: 18.1748, lng: 74.1565 },
      { day: 8, name: "Lonand", lat: 17.9546, lng: 74.1866 },
      { day: 9, name: "Lonand", lat: 17.9546, lng: 74.1866 },
      { day: 10, name: "Taradgaon", lat: 17.9625, lng: 74.2756 },
      { day: 11, name: "Phaltan", lat: 17.9866, lng: 74.4338 },
      { day: 12, name: "Barad", lat: 17.9157, lng: 74.6147 },
      { day: 13, name: "Natepute", lat: 17.9042, lng: 74.7708 },
      { day: 14, name: "Malshiras", lat: 17.8427, lng: 74.9208 },
      { day: 15, name: "Velapur", lat: 17.7562, lng: 75.0506 },
      { day: 16, name: "Bhandishegaon", lat: 17.7126, lng: 75.1843 },
      { day: 17, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 18, name: "Pandharpur", lat: 17.6775, lng: 75.3278 },
    ],
  },
  tukaram: {
    name: "Sant Tukaram Maharaj Palkhi",
    startPoint: "Dehu",
    daysBeforeEkadashi: 19,
    color: "#FBBC05",
    halts: [
      { day: 1, name: "Dehu", lat: 18.7188, lng: 73.7699 },
      { day: 2, name: "Akurdi", lat: 18.6496, lng: 73.7707 },
      { day: 3, name: "Pune (Nana Peth)", lat: 18.5158, lng: 73.8638 },
      { day: 4, name: "Pune (Nana Peth)", lat: 18.5158, lng: 73.8638 },
      { day: 5, name: "Loni Kalbhor", lat: 18.4892, lng: 74.0208 },
      { day: 6, name: "Yavat", lat: 18.4682, lng: 74.2882 },
      { day: 7, name: "Varvand", lat: 18.3976, lng: 74.4079 },
      { day: 8, name: "Undwadi Gavalyachi", lat: 18.2892, lng: 74.5012 },
      { day: 9, name: "Baramati", lat: 18.1517, lng: 74.5772 },
      { day: 10, name: "Sansar", lat: 18.0694, lng: 74.7567 },
      { day: 11, name: "Anthurne", lat: 18.0435, lng: 74.8845 },
      { day: 12, name: "Nimgaon Ketki", lat: 18.0573, lng: 74.9654 },
      { day: 13, name: "Indapur", lat: 18.1158, lng: 75.0345 },
      { day: 14, name: "Sarati", lat: 17.9942, lng: 75.0682 },
      { day: 15, name: "Akluj", lat: 17.8864, lng: 75.0217 },
      { day: 16, name: "Borgaon", lat: 17.7845, lng: 75.1412 },
      { day: 17, name: "Pirachi Kuroli", lat: 17.7289, lng: 75.2215 },
      { day: 18, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 19, name: "Pandharpur", lat: 17.6775, lng: 75.3278 },
    ],
  },
  muktabai: {
    name: "Sant Muktabai Palkhi",
    startPoint: "Muktainagar (Kothali)",
    daysBeforeEkadashi: 33,
    color: "#34A853",
    halts: [
      { day: 1, name: "Muktainagar (Kothali)", lat: 21.0536, lng: 76.0463 },
      { day: 2, name: "Bhusawal", lat: 21.0455, lng: 75.8011 },
      { day: 4, name: "Jalgaon", lat: 21.0077, lng: 75.5626 },
      { day: 7, name: "Pachora", lat: 20.6698, lng: 75.3524 },
      { day: 10, name: "Chalisgaon", lat: 20.4619, lng: 74.9984 },
      { day: 13, name: "Nandgaon", lat: 20.3106, lng: 74.6586 },
      { day: 15, name: "Yeola", lat: 20.0384, lng: 74.4883 },
      { day: 17, name: "Kopargaon", lat: 19.8872, lng: 74.4756 },
      { day: 20, name: "Rahuri", lat: 19.3900, lng: 74.6517 },
      { day: 22, name: "Ahmednagar", lat: 19.0952, lng: 74.7496 },
      { day: 26, name: "Karmala", lat: 18.4060, lng: 75.2014 },
      { day: 29, name: "Kurduwadi", lat: 18.0833, lng: 75.4313 },
      { day: 31, name: "Bhandishegaon", lat: 17.7126, lng: 75.1843 },
      { day: 32, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 33, name: "Pandharpur", lat: 17.6775, lng: 75.3278 },
    ],
  },
  rukhmini: {
    name: "Rukhmini Devi Palkhi",
    startPoint: "Kaundanyapur",
    daysBeforeEkadashi: 30,
    color: "#4285F4",
    halts: [
      { day: 1, name: "Kaundanyapur", lat: 20.9150, lng: 78.1065 },
      { day: 2, name: "Kurha", lat: 20.8403, lng: 78.0264 },
      { day: 4, name: "Pulgaon", lat: 20.7302, lng: 78.3243 },
      { day: 6, name: "Wardha", lat: 20.7453, lng: 78.6022 },
      { day: 10, name: "Yavatmal", lat: 20.3888, lng: 78.1204 },
      { day: 14, name: "Umarkhed", lat: 19.5960, lng: 77.6974 },
      { day: 17, name: "Hingoli", lat: 19.7155, lng: 77.1471 },
      { day: 20, name: "Parbhani", lat: 19.2644, lng: 76.7725 },
      { day: 23, name: "Majalgaon", lat: 19.1554, lng: 76.2230 },
      { day: 25, name: "Beed", lat: 18.9901, lng: 75.7531 },
      { day: 27, name: "Kalamb", lat: 18.0436, lng: 75.9220 },
      { day: 28, name: "Kurduwadi", lat: 18.0833, lng: 75.4313 },
      { day: 29, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 30, name: "Pandharpur", lat: 17.6775, lng: 75.3278 },
    ],
  },
  gajanan: {
    name: "Sant Gajanan Maharaj Palkhi",
    startPoint: "Shegaon",
    daysBeforeEkadashi: 33,
    color: "#0F9D58",
    halts: [
      { day: 1, name: "Shegaon", lat: 20.7937, lng: 76.6946 },
      { day: 4, name: "Akola", lat: 20.7059, lng: 77.0019 },
      { day: 10, name: "Risod", lat: 19.9749, lng: 76.7766 },
      { day: 15, name: "Parbhani", lat: 19.2644, lng: 76.7725 },
      { day: 19, name: "Parali Vaijaynath", lat: 18.8475, lng: 76.3197 },
      { day: 26, name: "Tuljapur", lat: 18.0131, lng: 76.0747 },
      { day: 29, name: "Solapur", lat: 17.6599, lng: 75.9064 },
      { day: 33, name: "Pandharpur", lat: 17.6775, lng: 75.3278 },
    ],
  },
  nivrutti: {
    name: "Sant Nivruttinath Maharaj Palkhi",
    startPoint: "Trimbakeshwar",
    daysBeforeEkadashi: 27,
    color: "#FF6F00",
    halts: [
      { day: 1, name: "Trimbakeshwar", lat: 19.9328, lng: 73.5312 },
      { day: 3, name: "Nashik (Panchavati)", lat: 20.0110, lng: 73.7902 },
      { day: 8, name: "Sinnar", lat: 19.8459, lng: 74.0013 },
      { day: 12, name: "Sangamner", lat: 19.5761, lng: 74.2057 },
      { day: 15, name: "Ahmednagar", lat: 19.0952, lng: 74.7496 },
      { day: 24, name: "Karmala", lat: 18.4060, lng: 75.2014 },
      { day: 26, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 27, name: "Pandharpur", lat: 17.6775, lng: 75.3278 },
    ],
  },
  sopan: {
    name: "Sant Sopankaka Palkhi",
    startPoint: "Saswad",
    daysBeforeEkadashi: 18,
    color: "#A142F4",
    halts: [
      { day: 1, name: "Saswad", lat: 18.3439, lng: 74.0305 },
      { day: 3, name: "Nira", lat: 18.1130, lng: 74.2155 },
      { day: 7, name: "Baramati", lat: 18.1517, lng: 74.5772 },
      { day: 10, name: "Akluj", lat: 17.8864, lng: 75.0217 },
      { day: 13, name: "Velapur", lat: 17.7562, lng: 75.0506 },
      { day: 17, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 18, name: "Pandharpur", lat: 17.6775, lng: 75.3278 },
    ],
  },
};

function getPalkhiScheduleForYear(palkhiKey, year) {
  const ekadashiStr = ASHADHI_EKADASHI_DATES[year];
  if (!ekadashiStr) {
    throw new Error(`Ashadhi Ekadashi date not configured for year ${year}`);
  }

  const palkhi = PALKHI_CONFIG[palkhiKey];
  if (!palkhi) {
    throw new Error(`Invalid Palkhi key: ${palkhiKey}`);
  }

  const ekadashiDate = new Date(ekadashiStr);
  const day1Date = new Date(ekadashiDate);
  day1Date.setDate(day1Date.getDate() - (palkhi.daysBeforeEkadashi - 1));

  const schedule = palkhi.halts.map((halt) => {
    const haltDate = new Date(day1Date);
    haltDate.setDate(haltDate.getDate() + (halt.day - 1));
    return {
      dayNumber: halt.day,
      locationName: halt.name,
      lat: halt.lat,
      lng: halt.lng,
      date: haltDate.toISOString().split("T")[0],
    };
  });

  return {
    year,
    palkhiName: palkhi.name,
    ashadhiEkadashiDate: ekadashiStr,
    day1Date: day1Date.toISOString().split("T")[0],
    schedule,
  };
}

app.get('/api/palkhi/list', (req, res) => {
  const list = Object.entries(PALKHI_CONFIG).map(([key, cfg]) => ({
    key,
    name: cfg.name,
    startPoint: cfg.startPoint,
    daysBeforeEkadashi: cfg.daysBeforeEkadashi,
    color: cfg.color,
    haltCount: cfg.halts.length,
  }));
  res.status(200).json({ status: 'ok', data: list });
});

app.get('/api/palkhi/:name', (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const palkhiKey = req.params.name.toLowerCase();
    const data = getPalkhiScheduleForYear(palkhiKey, year);
    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});
