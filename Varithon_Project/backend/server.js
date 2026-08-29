import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const trafficStore = new Map();
const emergencyStore = new Map();
const broadcastStore = new Map();
const usersStore = new Map();
const devicesStore = new Map();
const sessionsStore = new Map();

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
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password required' });
  }
  if (getUserByEmail(email)) {
    return res.status(409).json({ status: 'error', message: 'User already exists' });
  }
  const userId = 'usr_' + Date.now();
  const user = { id: userId, email, password, name: name || email.split('@')[0], kycStatus: 'PENDING', kycData: null, createdAt: new Date().toISOString() };
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
  const { email, name, googleId } = req.body || {};
  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email required' });
  }
  let user = getUserByEmail(email);
  if (!user) {
    const userId = 'usr_' + Date.now();
    user = { id: userId, email, password: null, name: name || email.split('@')[0], kycStatus: 'PENDING', kycData: null, createdAt: new Date().toISOString(), googleId: googleId || null };
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
  res.status(200).json({ status: 'ok', message: 'Device tracked', device, owner: { name: targetUser.name, email: targetUser.email, kycStatus: targetUser.kycStatus } });
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
    devices: Array.from(devicesStore.values()).reverse()
  });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Varithon backend running on http://localhost:${PORT}`);
});
