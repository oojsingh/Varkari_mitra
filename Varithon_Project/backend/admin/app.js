const API = '/api/admin/all';
const POLL_INTERVAL = 3000;

let mapCanvas, ctx;
let mapWidth, mapHeight;

function init() {
  mapCanvas = document.getElementById('mapCanvas');
  ctx = mapCanvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  setInterval(updateClock, 1000);
  updateClock();

  fetchData();
  setInterval(fetchData, POLL_INTERVAL);
}

function resizeCanvas() {
  const container = mapCanvas.parentElement;
  mapCanvas.width = container.clientWidth;
  mapCanvas.height = container.clientHeight;
  mapWidth = mapCanvas.width;
  mapHeight = mapCanvas.height;
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', { hour12: false });
}

async function fetchData() {
  try {
    const res = await fetch(API);
    const json = await res.json();
    if (json.status === 'ok') {
      renderAll(json);
    }
  } catch (err) {
    console.error('Failed to fetch admin data:', err);
    document.getElementById('systemStatus').innerHTML = '<span class="dot" style="background:var(--alert);box-shadow:0 0 8px var(--alert)"></span><span class="label">SYSTEM OFFLINE</span>';
    document.getElementById('systemStatus').style.borderColor = 'var(--alert)';
    document.getElementById('systemStatus').style.color = 'var(--alert)';
  }
}

function renderAll(data) {
  const users = data.users || [];
  const devices = data.devices || [];
  const emergencies = data.emergencyReports || [];
  const broadcasts = data.broadcasts || [];
  const traffic = data.traffic || [];
  const sanitation = data.sanitation || [];
  const lostChild = data.lostChild || [];

  renderMetrics(users.length, devices.length, emergencies.length, traffic.length);
  renderMap(users, devices, emergencies, traffic);
  renderEmergencies(emergencies);
  renderBroadcasts(broadcasts);
  renderTraffic(traffic);
  renderSanitation(sanitation);
  renderLostChild(lostChild);
  renderDevices(devices);
  renderUsers(users);
}

function renderMetrics(users, devices, emergencies, traffic) {
  animateCounter('metricUsers', users);
  animateCounter('metricDevices', devices);
  animateCounter('metricEmergencies', emergencies);
  animateCounter('metricTraffic', traffic);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const step = target > current ? 1 : -1;
  let val = current;
  const interval = setInterval(() => {
    val += step;
    el.textContent = val;
    if (val === target) clearInterval(interval);
  }, 40);
}

function renderMap(users, devices, emergencies, traffic) {
  ctx.clearRect(0, 0, mapWidth, mapHeight);

  // Grid lines
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < mapWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, mapHeight);
    ctx.stroke();
  }
  for (let y = 0; y < mapHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(mapWidth, y);
    ctx.stroke();
  }

  // Radar sweep
  const cx = mapWidth / 2;
  const cy = mapHeight / 2;
  const maxRadius = Math.max(mapWidth, mapHeight);
  const time = Date.now() / 2000;
  const angle = (time % (Math.PI * 2));

  const grad = ctx.createConicGradient ? null : null;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const radarGrad = ctx.createLinearGradient(0, 0, maxRadius, 0);
  radarGrad.addColorStop(0, 'rgba(0, 229, 255, 0.15)');
  radarGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
  ctx.fillStyle = radarGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, maxRadius, -0.3, 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Draw points
  const points = [];

  // Traffic / varkari positions
  traffic.forEach(t => {
    if (t.latitude != null && t.longitude != null) {
      points.push({
        x: ((t.longitude + 180) / 360) * mapWidth,
        y: ((90 - t.latitude) / 180) * mapHeight,
        color: t.role === 'authority' ? '#ffab00' : '#00e5ff',
        label: t.role || 'varkari'
      });
    }
  });

  // Emergency markers
  emergencies.forEach(e => {
    if (e.latitude != null && e.longitude != null) {
      points.push({
        x: ((e.longitude + 180) / 360) * mapWidth,
        y: ((90 - e.latitude) / 180) * mapHeight,
        color: '#ff3d57',
        label: 'emergency',
        pulse: true
      });
    } else {
      // Scatter random if no coords
      points.push({
        x: Math.random() * mapWidth,
        y: Math.random() * mapHeight,
        color: '#ff3d57',
        label: 'emergency',
        pulse: true
      });
    }
  });

  // Draw connections between nearby points
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.stroke();
      }
    }
  }

  // Draw points
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.pulse ? 5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();

    if (p.pulse) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Glow
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.pulse ? 10 : 6, 0, Math.PI * 2);
    const glow = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.pulse ? 10 : 6);
    glow.addColorStop(0, p.color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  document.getElementById('mapCount').textContent = `${points.length} ACTIVE`;

  requestAnimationFrame(() => renderMap(users, devices, emergencies, traffic));
}

function renderEmergencies(items) {
  const feed = document.getElementById('emergencyFeed');
  document.getElementById('emergencyBadge').textContent = `${items.length} ALERTS`;
  if (!items.length) {
    feed.innerHTML = '<div class="empty">No active emergencies</div>';
    return;
  }
  feed.innerHTML = items.map(e => `
    <div class="feed-item emergency">
      <div class="meta">
        <span>${e.id || 'EMR'}</span>
        <span>${new Date(e.receivedAt).toLocaleTimeString()}</span>
      </div>
      <div class="body">${formatObj(e)}</div>
    </div>
  `).join('');
}

function renderBroadcasts(items) {
  const feed = document.getElementById('broadcastFeed');
  document.getElementById('broadcastBadge').textContent = `${items.length} BROADCASTS`;
  if (!items.length) {
    feed.innerHTML = '<div class="empty">No broadcasts</div>';
    return;
  }
  feed.innerHTML = items.map(b => `
    <div class="feed-item broadcast">
      <div class="meta">
        <span>${b.id || 'BC'}</span>
        <span>${new Date(b.receivedAt).toLocaleTimeString()}</span>
      </div>
      <div class="body">${formatObj(b)}</div>
    </div>
  `).join('');
}

function renderTraffic(items) {
  const feed = document.getElementById('trafficFeed');
  document.getElementById('trafficBadge').textContent = `${items.length} ACTIVE`;
  if (!items.length) {
    feed.innerHTML = '<div class="empty">No traffic updates</div>';
    return;
  }
  feed.innerHTML = items.map(t => `
    <div class="feed-item traffic">
      <div class="meta">
        <span>${t.role || 'VARKARI'}</span>
        <span>${new Date(t.updatedAt).toLocaleTimeString()}</span>
      </div>
      <div class="body">LAT: ${t.latitude} | LON: ${t.longitude}</div>
    </div>
  `).join('');
}

function renderSanitation(items) {
  const feed = document.getElementById('sanitationFeed');
  document.getElementById('sanitationBadge').textContent = `${items.length} ALERTS`;
  if (!items.length) {
    feed.innerHTML = '<div class="empty">No sanitation alerts</div>';
    return;
  }
  feed.innerHTML = items.map(s => `
    <div class="feed-item emergency">
      <div class="meta">
        <span>${s.id || 'SAN'}</span>
        <span>${new Date(s.receivedAt).toLocaleTimeString()}</span>
      </div>
      <div class="body">
        <strong>${s.issueType}</strong><br/>
        ?? ${s.location}<br/>
        ?? ${s.status}
      </div>
    </div>
  `).join('');
}

function renderLostChild(items) {
  const feed = document.getElementById('lostChildFeed');
  const active = items.filter(i => i.status === 'ACTIVE').length;
  document.getElementById('lostChildBadge').textContent = `${active} ACTIVE`;
  if (!items.length) {
    feed.innerHTML = '<div class="empty">No lost child alerts</div>';
    return;
  }
  feed.innerHTML = items.map(l => `
    <div class="feed-item ${l.status === 'ACTIVE' ? 'emergency' : 'broadcast'}">
      <div class="meta">
        <span>${l.id || 'LCH'}</span>
        <span>${new Date(l.receivedAt).toLocaleTimeString()}</span>
      </div>
      <div class="body">
        <strong>?? ${l.childName || 'Unknown Child'}</strong><br/>
        Age: ${l.age || '?'} | Gender: ${l.gender || '?'}<br/>
        ?? ${l.lastSeenLocation || 'Location unknown'}<br/>
        ?? Contact: ${l.contactNumber || 'N/A'}<br/>
        ?? ${l.status}
      </div>
    </div>
  `).join('');
}

function renderDevices(items) {
  const tbody = document.querySelector('#deviceTable tbody');
  document.getElementById('deviceBadge').textContent = `${items.length} DEVICES`;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">No devices</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(d => `
    <tr>
      <td title="${d.imei}">${d.imei}</td>
      <td>${d.userId}</td>
      <td>${d.name}</td>
      <td>${d.phone}</td>
      <td>${new Date(d.lastSeen).toLocaleTimeString()}</td>
    </tr>
  `).join('');
}

function renderUsers(items) {
  const tbody = document.querySelector('#userTable tbody');
  document.getElementById('userBadge').textContent = `${items.length} USERS`;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">No users</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td class="${u.kycStatus === 'VERIFIED' ? 'kyc-verified' : 'kyc-pending'}">${u.kycStatus}</td>
      <td>${new Date(u.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

function formatObj(obj) {
  const entries = Object.entries(obj).filter(([k]) => !['id','receivedAt'].includes(k));
  return entries.map(([k,v]) => `${k}: ${v}`).join(' | ') || '{}';
}

document.addEventListener('DOMContentLoaded', init);
