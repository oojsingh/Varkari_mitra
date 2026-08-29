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
