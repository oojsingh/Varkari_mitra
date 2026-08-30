import express from 'express';
import bcrypt from 'bcryptjs';
import pool from './db.js';
import { fileURLToPath } from 'url';
import { dirname, join, readFileSync } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const corsOriginEnv = process.env.CORS_ORIGIN || '';
const allowedOrigins = corsOriginEnv.split(',').map(s => s.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.get('host');
  const currentOrigin = `${req.protocol}://${host}`;
  if (!origin || allowedOrigins.includes(origin) || origin === currentOrigin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  }
  next();
});
app.use(express.json());

const adminIndexPath = join(__dirname, 'admin', 'index.html');
let adminIndexHtml = null;
try {
  adminIndexHtml = readFileSync(adminIndexPath, 'utf8');
} catch (e) {
  console.warn('Admin UI not found at', adminIndexPath);
}

app.get('/', (req, res) => {
  if (adminIndexHtml) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(adminIndexHtml);
  }
  res.status(200).json({ status: 'ok', message: 'Varithon backend API' });
});

app.use('/admin', express.static(join(__dirname, 'admin')));

function generateToken() {
  return 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function getUserByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0] || null;
}

async function getUserByToken(token) {
  const res = await pool.query(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = $1 AND s.expires_at > NOW()',
    [token]
  );
  return res.rows[0] || null;
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  const user = await getUserByToken(token);
  if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  req.user = user;
  next();
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password required' });
  }
  const existing = await getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ status: 'error', message: 'User already exists' });
  }
  const userId = 'usr_' + Date.now();
  const userRole = role || 'varkari';
  const hashedPassword = await bcrypt.hash(password, 10);
  const kycStatus = userRole === 'varkari_mitra' ? 'PENDING' : 'NOT_REQUIRED';
  const locationSharing = userRole === 'varkari';
  await pool.query(
    `INSERT INTO users (id, email, password_hash, name, role, kyc_status, location_sharing, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [userId, email, hashedPassword, name || email.split('@')[0], userRole, kycStatus, locationSharing]
  );
  const token = generateToken();
  await pool.query('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL \'7 days\')', [token, userId]);
  const user = await getUserByEmail(email);
  const { password_hash: _, ...safeUser } = user;
  res.status(201).json({ status: 'ok', token, user: safeUser });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }
  const token = generateToken();
  await pool.query("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days')", [token, user.id]);
  const { password_hash: _, ...safeUser } = user;
  res.status(200).json({ status: 'ok', token, user: safeUser });
});

app.post('/api/auth/google', async (req, res) => {
  const { email, name, googleId, role } = req.body || {};
  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email required' });
  }
  let user = await getUserByEmail(email);
  const userRole = role || 'varkari';
  if (!user) {
    const userId = 'usr_' + Date.now();
    const kycStatus = userRole === 'varkari_mitra' ? 'PENDING' : 'NOT_REQUIRED';
    const locationSharing = userRole === 'varkari';
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, role, kyc_status, google_id, location_sharing, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [userId, email, null, name || email.split('@')[0], userRole, kycStatus, googleId || null, locationSharing]
    );
    user = await getUserByEmail(email);
  }
  const token = generateToken();
  await pool.query("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days')", [token, user.id]);
  const { password_hash: _, ...safeUser } = user;
  res.status(200).json({ status: 'ok', token, user: safeUser });
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = await getUserByToken(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const { password_hash: _, ...safeUser } = user;
  res.status(200).json({ status: 'ok', user: safeUser });
});

app.post('/api/kyc/submit', async (req, res) => {
  await requireAuth(req, res, async () => {
    const user = req.user;
    const { name, aadhaar, role } = req.body || {};
    user.kyc_status = 'VERIFIED';
    user.kyc_data = { name, aadhaar, role, submittedAt: new Date().toISOString() };
    if (name) user.name = name;
    await pool.query('UPDATE users SET kyc_status = $1, kyc_data = $2, name = $3 WHERE id = $4', [user.kyc_status, user.kyc_data, user.name, user.id]);
    res.status(200).json({ status: 'ok', message: 'KYC verified', kyc: user.kyc_data });
  });
});

app.get('/api/kyc/status', async (req, res) => {
  await requireAuth(req, res, async () => {
    res.status(200).json({ status: 'ok', kycStatus: req.user.kyc_status, kycData: req.user.kyc_data });
  });
});

app.post('/api/devices/register', async (req, res) => {
  await requireAuth(req, res, async () => {
    const { imei, name, phone } = req.body || {};
    const deviceId = 'dev_' + Date.now();
    await pool.query(
      `INSERT INTO devices (id, user_id, user_name, imei, name, phone, registered_at, last_seen)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [deviceId, req.user.id, req.user.name, imei || deviceId, name || 'My Device', phone || '']
    );
    const device = { id: deviceId, userId: req.user.id, userName: req.user.name, imei: imei || deviceId, name: name || 'My Device', phone: phone || '', registeredAt: new Date().toISOString(), lastSeen: new Date().toISOString() };
    res.status(201).json({ status: 'ok', device });
  });
});

app.get('/api/devices/mine', async (req, res) => {
  await requireAuth(req, res, async () => {
    const result = await pool.query('SELECT * FROM devices WHERE user_id = $1 ORDER BY registered_at DESC', [req.user.id]);
    res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
  });
});

app.post('/api/devices/track', async (req, res) => {
  const { targetEmail, targetUserId, imei } = req.body || {};
  let targetUser = null;
  if (targetEmail) {
    targetUser = await getUserByEmail(targetEmail);
  } else if (targetUserId) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [targetUserId]);
    targetUser = result.rows[0];
  }
  if (!targetUser) {
    return res.status(404).json({ status: 'error', message: 'Target user not found' });
  }
  const devicesResult = await pool.query('SELECT * FROM devices WHERE user_id = $1', [targetUser.id]);
  if (devicesResult.rows.length === 0) {
    return res.status(404).json({ status: 'error', message: 'No devices registered for this user' });
  }
  let device;
  if (imei) {
    device = devicesResult.rows.find(d => d.imei === imei) || devicesResult.rows[0];
  } else {
    device = devicesResult.rows[0];
  }
  await pool.query('UPDATE devices SET last_seen = NOW() WHERE id = $1', [device.id]);
  res.status(200).json({ status: 'ok', message: 'Device tracked', device, owner: { name: targetUser.name, email: targetUser.email, kycStatus: targetUser.kyc_status, role: targetUser.role } });
});

app.post('/api/kyc/ekyc', async (req, res) => {
  await requireAuth(req, res, async () => {
    const user = req.user;
    if (user.role !== 'varkari_mitra') {
      return res.status(403).json({ status: 'error', message: 'eKYC only for Varkari Mitra' });
    }
    const { fullName, aadhaarNumber, address, phone, photoBase64 } = req.body || {};
    if (!fullName || !aadhaarNumber || !phone) {
      return res.status(400).json({ status: 'error', message: 'fullName, aadhaarNumber, phone required' });
    }
    user.kyc_status = 'VERIFIED';
    user.kyc_data = { fullName, aadhaarNumber, address, phone, photoBase64, submittedAt: new Date().toISOString() };
    if (fullName) user.name = fullName;
    await pool.query('UPDATE users SET kyc_status = $1, kyc_data = $2, name = $3 WHERE id = $4', [user.kyc_status, user.kyc_data, user.name, user.id]);
    const { password_hash: _, ...safeUser } = user;
    res.status(200).json({ status: 'ok', message: 'eKYC verified successfully', user: safeUser, kyc: user.kyc_data });
  });
});

app.post('/api/varkari/location', async (req, res) => {
  await requireAuth(req, res, async () => {
    const user = req.user;
    if (user.role !== 'varkari') {
      return res.status(403).json({ status: 'error', message: 'Only Varkari can update location' });
    }
    const { latitude, longitude } = req.body || {};
    if (latitude == null || longitude == null) {
      return res.status(400).json({ status: 'error', message: 'latitude and longitude required' });
    }
    await pool.query('UPDATE users SET last_location = $1 WHERE id = $2', [{ latitude, longitude, updatedAt: new Date().toISOString() }, user.id]);
    const updated = await getUserByEmail(user.email);
    const { password_hash: _, ...safeUser } = updated;
    res.status(200).json({ status: 'ok', message: 'Location updated', user: safeUser });
  });
});

app.post('/api/family/add', async (req, res) => {
  await requireAuth(req, res, async () => {
    const user = req.user;
    if (user.role !== 'varkari') {
      return res.status(403).json({ status: 'error', message: 'Only Varkari can add family members' });
    }
    const { email, name, relation } = req.body || {};
    if (!email || !name) {
      return res.status(400).json({ status: 'error', message: 'email and name required' });
    }
    const familyId = 'fam_' + Date.now();
    await pool.query(
      `INSERT INTO family (id, varkari_id, varkari_name, email, name, relation, added_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [familyId, user.id, user.name, email, name, relation || 'Family']
    );
    const member = { id: familyId, varkariId: user.id, varkariName: user.name, email, name, relation: relation || 'Family', addedAt: new Date().toISOString() };
    res.status(201).json({ status: 'ok', member });
  });
});

app.get('/api/family/mine', async (req, res) => {
  await requireAuth(req, res, async () => {
    const result = await pool.query('SELECT * FROM family WHERE varkari_id = $1 ORDER BY added_at DESC', [req.user.id]);
    res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
  });
});

app.get('/api/family/track/:varkariId', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const viewer = await getUserByToken(token);
  if (!viewer) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const varkariId = req.params.varkariId;
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [varkariId]);
  const varkari = result.rows[0];
  if (!varkari || varkari.role !== 'varkari') {
    return res.status(404).json({ status: 'error', message: 'Varkari not found' });
  }
  const familyResult = await pool.query('SELECT * FROM family WHERE varkari_id = $1 AND email = $2', [varkariId, viewer.email]);
  const isFamily = familyResult.rows.length > 0;
  if (!isFamily && varkari.id !== viewer.id) {
    return res.status(403).json({ status: 'error', message: 'Not authorized to view this location' });
  }
  if (!varkari.location_sharing) {
    return res.status(200).json({ status: 'ok', sharing: false, message: 'Location sharing disabled' });
  }
  res.status(200).json({ status: 'ok', sharing: true, location: varkari.last_location, varkari: { id: varkari.id, name: varkari.name, email: varkari.email } });
});

app.put('/api/varkari/sharing', async (req, res) => {
  await requireAuth(req, res, async () => {
    const user = req.user;
    if (user.role !== 'varkari') {
      return res.status(403).json({ status: 'error', message: 'Only Varkari can change sharing' });
    }
    const { enabled } = req.body || {};
    await pool.query('UPDATE users SET location_sharing = $1 WHERE id = $2', [!!enabled, user.id]);
    const updated = await getUserByEmail(user.email);
    const { password_hash: _, ...safeUser } = updated;
    res.status(200).json({ status: 'ok', sharing: updated.location_sharing, user: safeUser });
  });
});

app.post('/api/sevas/create', async (req, res) => {
  await requireAuth(req, res, async () => {
    const user = req.user;
    if (user.role !== 'vari_sevak') {
      return res.status(403).json({ status: 'error', message: 'Only Vari Sevak can create sevas' });
    }
    const { title, description, category, price, location, availableFrom, availableTo } = req.body || {};
    if (!title) {
      return res.status(400).json({ status: 'error', message: 'title required' });
    }
    const sevaId = 'sev_' + Date.now();
    await pool.query(
      `INSERT INTO sevas (id, sevak_id, sevak_name, title, description, category, price, location, available_from, available_to, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [sevaId, user.id, user.name, title, description || '', category || 'General', price || 0, location || '', availableFrom || null, availableTo || null]
    );
    const seva = { id: sevaId, sevakId: user.id, sevakName: user.name, title, description: description || '', category: category || 'General', price: price || 0, location: location || '', availableFrom: availableFrom || null, availableTo: availableTo || null, createdAt: new Date().toISOString() };
    res.status(201).json({ status: 'ok', seva });
  });
});

app.get('/api/sevas', async (req, res) => {
  const result = await pool.query('SELECT * FROM sevas ORDER BY created_at DESC');
  res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
});

app.get('/api/sevas/mine', async (req, res) => {
  await requireAuth(req, res, async () => {
    const result = await pool.query('SELECT * FROM sevas WHERE sevak_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
  });
});

app.post('/api/sanitation/report', async (req, res) => {
  const { issueType, location, latitude, longitude, photoBase64, reportedBy, status } = req.body || {};
  const ticketId = 'SAN-' + Date.now();
  await pool.query(
    `INSERT INTO sanitation (id, issue_type, location, latitude, longitude, photo_base64, reported_by, status, received_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [ticketId, issueType || 'Unknown', location || '', latitude, longitude, photoBase64 || null, reportedBy || 'Nirmal Wari Sanitation Hub', status || 'DISPATCHED_TO_PANCHAYAT']
  );
  const ticket = { id: ticketId, issueType: issueType || 'Unknown', location: location || '', latitude, longitude, photoBase64: photoBase64 || null, reportedBy: reportedBy || 'Nirmal Wari Sanitation Hub', status: status || 'DISPATCHED_TO_PANCHAYAT', receivedAt: new Date().toISOString() };
  console.log('Sanitation alert:', ticket);
  res.status(201).json({ status: 'ok', ticketId, message: 'Sanitation alert sent to backend', ticket });
});

app.get('/api/sanitation/all', async (req, res) => {
  const result = await pool.query('SELECT * FROM sanitation ORDER BY received_at DESC');
  res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
});

app.post('/api/lost-child/report', async (req, res) => {
  const { childName, age, gender, lastSeenLocation, lastSeenLatitude, lastSeenLongitude, description, contactNumber, photoBase64, reportedBy, reportedByRole } = req.body || {};
  if (!childName && !description) {
    return res.status(400).json({ status: 'error', message: 'childName or description required' });
  }
  const alertId = 'LCH-' + Date.now();
  await pool.query(
    `INSERT INTO lost_child (id, child_name, age, gender, last_seen_location, last_seen_latitude, last_seen_longitude, description, contact_number, photo_base64, reported_by, reported_by_role, status, received_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
    [alertId, childName || 'Unknown', age || null, gender || 'Unknown', lastSeenLocation || '', lastSeenLatitude, lastSeenLongitude, description || '', contactNumber || '', photoBase64 || null, reportedBy || 'Anonymous', reportedByRole || 'varkari', 'ACTIVE']
  );
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
  console.log('Lost child alert:', alert);
  res.status(201).json({ status: 'ok', alertId, message: 'Lost child alert broadcast to all varkaris', alert });
});

app.get('/api/lost-child/active', async (req, res) => {
  const result = await pool.query("SELECT * FROM lost_child WHERE status = 'ACTIVE' ORDER BY received_at DESC");
  res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
});

app.put('/api/lost-child/:alertId/resolve', async (req, res) => {
  const result = await pool.query('UPDATE lost_child SET status = $1, resolved_at = NOW() WHERE id = $2 RETURNING *', ['RESOLVED', req.params.alertId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ status: 'error', message: 'Alert not found' });
  }
  res.status(200).json({ status: 'ok', message: 'Alert marked as resolved', alert: result.rows[0] });
});

app.get('/api/admin/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
});

app.get('/api/admin/devices', async (req, res) => {
  const result = await pool.query('SELECT * FROM devices ORDER BY last_seen DESC');
  res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
});

app.post('/api/traffic/update-vari-location', async (req, res) => {
  const { latitude, longitude, role } = req.body || {};
  await pool.query(
    `INSERT INTO traffic (key, location, role, updated_at)
     VALUES ('latest', ST_SetSRID(ST_MakePoint($1, $2), 4326), $3, NOW())
     ON CONFLICT (key) DO UPDATE SET location = EXCLUDED.location, role = EXCLUDED.role, updated_at = NOW()`,
    [longitude, latitude, role]
  );
  const entry = { latitude, longitude, role, updatedAt: new Date().toISOString() };
  console.log('Traffic update:', entry);
  res.status(200).json({ status: 'ok', received: entry });
});

app.get('/api/traffic/active-diversions', async (req, res) => {
  const result = await pool.query("SELECT * FROM traffic WHERE key = 'latest'");
  res.status(200).json({
    status: 'ok',
    active: result.rows.length > 0 ? [result.rows[0]] : []
  });
});

app.post('/api/emergency/report', async (req, res) => {
  const payload = {
    ...req.body,
    receivedAt: new Date().toISOString(),
    id: `EMR-${Date.now()}`
  };
  await pool.query('INSERT INTO emergency (id, data, received_at) VALUES ($1, $2, NOW())', [payload.id, payload]);
  console.log('Emergency report:', payload);
  res.status(200).json({ status: 'ok', id: payload.id });
});

app.post('/api/emergency/broadcast-position', async (req, res) => {
  const payload = {
    ...req.body,
    receivedAt: new Date().toISOString(),
    id: `BC-${Date.now()}`
  };
  await pool.query(
    `INSERT INTO broadcast (id, data, latitude, longitude, location, received_at)
     VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326), NOW())`,
    [payload.id, payload, payload.latitude, payload.longitude]
  );
  console.log('Authority broadcast:', payload);
  res.status(200).json({ status: 'ok', id: payload.id, delivered: true });
});

app.get('/api/admin/emergency-reports', async (req, res) => {
  const result = await pool.query('SELECT * FROM emergency ORDER BY received_at DESC');
  res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
});

app.get('/api/admin/broadcasts', async (req, res) => {
  const result = await pool.query('SELECT * FROM broadcast ORDER BY received_at DESC');
  res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
});

app.get('/api/admin/traffic', async (req, res) => {
  const result = await pool.query('SELECT * FROM traffic ORDER BY updated_at DESC');
  res.status(200).json({ status: 'ok', count: result.rows.length, data: result.rows });
});

app.get('/api/admin/all', async (req, res) => {
  const [traffic, emergencyReports, broadcasts, users, devices, family, sevas, sanitation, lostChild] = await Promise.all([
    pool.query('SELECT * FROM traffic ORDER BY updated_at DESC'),
    pool.query('SELECT * FROM emergency ORDER BY received_at DESC'),
    pool.query('SELECT * FROM broadcast ORDER BY received_at DESC'),
    pool.query('SELECT * FROM users ORDER BY created_at DESC'),
    pool.query('SELECT * FROM devices ORDER BY last_seen DESC'),
    pool.query('SELECT * FROM family ORDER BY added_at DESC'),
    pool.query('SELECT * FROM sevas ORDER BY created_at DESC'),
    pool.query('SELECT * FROM sanitation ORDER BY received_at DESC'),
    pool.query("SELECT * FROM lost_child ORDER BY received_at DESC"),
  ]);
  res.status(200).json({
    status: 'ok',
    traffic: traffic.rows,
    emergencyReports: emergencyReports.rows,
    broadcasts: broadcasts.rows,
    users: users.rows,
    devices: devices.rows,
    family: family.rows,
    sevas: sevas.rows,
    sanitation: sanitation.rows,
    lostChild: lostChild.rows
  });
});

const PALKHI_COLORS = {
  dnyaneshwar: '#EA4335',
  tukaram: '#FBBC05',
  muktabai: '#34A853',
  rukhmini: '#4285F4',
  gajanan: '#0F9D58',
  nivrutti: '#FF6F00',
  sopan: '#A142F4'
};

app.get('/api/palkhi/list', async (req, res) => {
  const result = await pool.query('SELECT DISTINCT palkhi_key, palkhi_name FROM palkhi_schedules ORDER BY palkhi_key');
  const data = result.rows.map(r => ({ key: r.palkhi_key, name: r.palkhi_name, color: PALKHI_COLORS[r.palkhi_key] || '#1a73e8' }));
  res.status(200).json({ status: 'ok', data });
});

app.get('/api/palkhi/:key', async (req, res) => {
  const { key } = req.params;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const result = await pool.query('SELECT * FROM palkhi_schedules WHERE palkhi_key = $1 AND year = $2 ORDER BY day_number', [key, year]);
  if (result.rows.length === 0) {
    return res.status(404).json({ status: 'error', message: 'Palkhi schedule not found' });
  }
  const schedule = result.rows.map(r => ({
    dayNumber: r.day_number,
    locationName: r.location_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lng),
    date: r.date.toISOString().split('T')[0]
  }));
  const palkhiName = result.rows[0].palkhi_name;
  const day1Date = schedule[0].date;
  const ashadhiEkadashiDate = schedule[schedule.length - 1].date;
  res.status(200).json({ status: 'ok', data: { palkhiName, day1Date, ashadhiEkadashiDate, schedule } });
});

function haversine(a, b) {
  const R = 6371;
  const dLat = (a[0] - b[0]) * Math.PI / 180;
  const dLng = (a[1] - b[1]) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

app.get('/api/varkari/group-tracking', async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, last_location FROM users WHERE role = 'varkari' AND location_sharing = true AND last_location IS NOT NULL`
  );
  const varkaris = result.rows
    .map((r) => {
      const loc = r.last_location;
      return {
        id: r.id,
        name: r.name,
        latitude: loc && typeof loc.latitude === 'number' ? loc.latitude : null,
        longitude: loc && typeof loc.longitude === 'number' ? loc.longitude : null,
        updatedAt: loc && loc.updatedAt ? loc.updatedAt : null,
      };
    })
    .filter((v) => v.latitude != null && v.longitude != null);

  let count = varkaris.length;
  let centerLat = 0;
  let centerLng = 0;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  if (count > 0) {
    varkaris.forEach((v) => {
      centerLat += v.latitude;
      centerLng += v.longitude;
      if (v.latitude < minLat) minLat = v.latitude;
      if (v.latitude > maxLat) maxLat = v.latitude;
      if (v.longitude < minLng) minLng = v.longitude;
      if (v.longitude > maxLng) maxLng = v.longitude;
    });
    centerLat = centerLat / count;
    centerLng = centerLng / count;
  }

  const spanKm = count > 1 ? haversine([minLat, minLng], [maxLat, maxLng]) : 0;

  res.status(200).json({
    status: 'ok',
    count,
    center: count > 0 ? { latitude: centerLat, longitude: centerLng } : null,
    bounds: count > 0 ? { minLat, maxLat, minLng, maxLng } : null,
    spanKm,
    varkaris,
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Varithon backend running on http://localhost:${PORT}`);
});
