import React, { useState } from 'react';
import './index.css';

const PILGRIMAGE_SECTORS = [
  {
    id: 'sec_pune',
    name: 'Pune - Hadapsar Sector',
    coords: '18.5089° N, 73.9260° E',
    lat: 18.5089,
    lng: 73.9260,
    blockedRoad: 'Solapur Road & Gadital Hadapsar Junction',
    alternateBypass: 'Magarpatta -> Kharadi Bypass OR Katraj-Dehu Road Bypass',
    checkpoints: ['Gadital Chowk Barricade', 'Magarpatta Naka'],
    delayMinutes: 35,
    advisory: 'Vari procession entering Hadapsar. Heavy trucks & intercity buses prohibited.',
    policeAction: 'Barricade Gadital intersection. Divert heavy traffic to Kharadi.',
    medicalAction: 'Station 2 mobile ambulances at Hadapsar flyover base.'
  },
  {
    id: 'sec_saswad',
    name: 'Dive Ghat - Saswad Sector',
    coords: '18.3450° N, 74.0120° E',
    lat: 18.3450,
    lng: 74.0120,
    blockedRoad: 'Hadapsar - Dive Ghat - Saswad Highway (SH-61)',
    alternateBypass: 'Divert via Kondhwa -> Bopdev Ghat -> Saswad OR Kedgaon-Chaufula Bypass',
    checkpoints: ['Wadki Naka Police Post', 'Dive Ghat Base Checkpoint', 'Saswad Phata'],
    delayMinutes: 45,
    advisory: 'Steep ghat section blocked for pedestrian safety. Green Corridor for Ambulances only.',
    policeAction: 'Close Dive Ghat for all regular vehicles. Station patrol at Wadki Naka.',
    medicalAction: 'Position emergency cardiac ambulance at Dive Ghat summit.'
  },
  {
    id: 'sec_jejuri',
    name: 'Saswad - Jejuri Sector',
    coords: '18.2800° N, 74.1500° E',
    lat: 18.2800,
    lng: 74.1500,
    blockedRoad: 'Saswad - Jejuri Highway (Old Palkhi Marg)',
    alternateBypass: 'Divert via Morgaon -> Supe -> Baramati OR Shirwal -> Lonand Route',
    checkpoints: ['Jejuri Naka Barricade', 'Nazare Phata Post'],
    delayMinutes: 30,
    advisory: 'Procession halting near Jejuri temple corridor. Heavy pilgrim footfall.',
    policeAction: 'Reroute goods trucks via Shirwal. Direct light cars through Morgaon bypass.',
    medicalAction: 'Activate Jejuri Rural Hospital emergency staging area.'
  },
  {
    id: 'sec_lonand',
    name: 'Lonand - Taradgaon Sector',
    coords: '18.0400° N, 74.1900° E',
    lat: 18.0400,
    lng: 74.1900,
    blockedRoad: 'Lonand - Shirwal Road & Lonand Market Stretch',
    alternateBypass: 'Divert via Nira -> Khandala -> NH-48 (Pune-Bangalore Hwy) Bypass',
    checkpoints: ['Lonand Railway Crossing Post', 'Nira Bridge Barricade'],
    delayMinutes: 25,
    advisory: 'Palkhi crossing Nira river basin. Heavy pedestrian bottleneck.',
    policeAction: 'Barricade Nira bridge for vehicles. Maintain single lane emergency corridor.',
    medicalAction: 'Station riverfront paramedic squad.'
  },
  {
    id: 'sec_pandharpur',
    name: 'Wakhari - Pandharpur Holy City Sector',
    coords: '17.6775° N, 75.3278° E',
    lat: 17.6775,
    lng: 75.3278,
    blockedRoad: 'All Central Arterial Roads entering Pandharpur Town & Core Temple Ring',
    alternateBypass: 'Park at Outer Mega-Parking (Wakhari / Isbavi) & Use E-Shuttle or Green Corridor',
    checkpoints: ['Wakhari Naka Mega-Barricade', 'Isbavi Ring Post', 'Bhimanagar Police Checkpoint'],
    delayMinutes: 60,
    advisory: 'Complete vehicular lockdown inside Pandharpur municipal limits. Over 1M pilgrims.',
    policeAction: 'Enforce outer perimeter barricades. Only emergency and VIP pass vehicles permitted.',
    medicalAction: 'Activate 10 centralized disaster medical pods and 20 ambulances.'
  }
];

const COMMUTER_ROUTES = [
  { id: 'r1', name: 'Pune -> Saswad', corridorSectorId: 'sec_saswad', normalTime: '45 mins' },
  { id: 'r2', name: 'Hadapsar -> Jejuri', corridorSectorId: 'sec_saswad', normalTime: '70 mins' },
  { id: 'r3', name: 'Pune -> Pandharpur (Direct)', corridorSectorId: 'sec_pandharpur', normalTime: '4.0 hrs' },
  { id: 'r4', name: 'Satara -> Pandharpur', corridorSectorId: 'sec_pandharpur', normalTime: '2.5 hrs' },
  { id: 'r5', name: 'Baramati -> Lonand', corridorSectorId: 'sec_lonand', normalTime: '55 mins' }
];

function App() {
  const [activeTab, setActiveTab] = useState('traffic'); // 'traffic' | 'emergency' | 'authorities'
  const [selectedSector, setSelectedSector] = useState(PILGRIMAGE_SECTORS[1]); // Default Dive Ghat
  const [selectedCommuterRoute, setSelectedCommuterRoute] = useState(COMMUTER_ROUTES[0]);
  const [authorityDispatchLog, setAuthorityDispatchLog] = useState([
    {
      id: 1,
      time: 'Just now',
      authority: '👮 Traffic Police',
      status: 'Delivered',
      action: 'Barricade active on Dive Ghat SH-61. Traffic rerouted to Bopdev Ghat.'
    },
    {
      id: 2,
      time: 'Just now',
      authority: '🏥 Medical 108 Dispatch',
      status: 'Delivered',
      action: 'Ambulance A1 and Sanjeevani Hospital placed on immediate standby within 1.2km.'
    },
    {
      id: 3,
      time: 'Just now',
      authority: '🏛️ District Collectorate',
      status: 'Delivered',
      action: 'Crowd density perimeter estimated at 350m radius. Civic water points active.'
    },
    {
      id: 4,
      time: 'Just now',
      authority: '🚒 Fire & Disaster Rescue',
      status: 'Delivered',
      action: 'Emergency Green Corridor cleared for high-speed responder access.'
    }
  ]);

  const isCommuterBlocked = selectedCommuterRoute.corridorSectorId === selectedSector.id;

  const handleBroadcastAuthorities = () => {
    const now = new Date().toLocaleTimeString();
    const newLogs = [
      {
        id: Date.now() + 1,
        time: now,
        authority: '👮 Traffic Police',
        status: 'Delivered',
        action: `[Live Broadcast] ${selectedSector.policeAction}`
      },
      {
        id: Date.now() + 2,
        time: now,
        authority: '🏥 Medical 108 Dispatch',
        status: 'Delivered',
        action: `[Live Broadcast] ${selectedSector.medicalAction}`
      },
      {
        id: Date.now() + 3,
        time: now,
        authority: '🏛️ District Admin & Temple Trust',
        status: 'Delivered',
        action: `[Live Broadcast] Vari position updated to ${selectedSector.name} (${selectedSector.coords}).`
      },
      {
        id: Date.now() + 4,
        time: now,
        authority: '🚒 Fire & Disaster Services',
        status: 'Delivered',
        action: `[Live Broadcast] Rapid response corridor designated around ${selectedSector.checkpoints[0]}.`
      }
    ];
    setAuthorityDispatchLog(prev => [...newLogs, ...prev.slice(0, 8)]);
  };

  return (
    <div className="dashboard-container">
      <header>
        <div className="logo-section">
          <h1>Varithon Dynamic Traffic &amp; Dispatch Command</h1>
          <p>Real-Time Pilgrimage Tracking • Dynamic Highway Diversions • Multi-Authority Dispatch</p>
        </div>
        <div className="header-controls">
          <div className="status-badge">
            <div className="status-dot"></div>
            Vari Live • {selectedSector.name}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'traffic' ? 'active' : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          🚦 Dynamic Traffic Diversion &amp; Map
        </button>
        <button
          className={`tab-btn ${activeTab === 'authorities' ? 'active' : ''}`}
          onClick={() => setActiveTab('authorities')}
        >
          📡 Multi-Authority Position Broadcast
        </button>
        <button
          className={`tab-btn ${activeTab === 'emergency' ? 'active' : ''}`}
          onClick={() => setActiveTab('emergency')}
        >
          🚑 Emergency Medical Dispatch
        </button>
      </nav>

      {/* TAB 1: TRAFFIC DIVERSION */}
      {activeTab === 'traffic' && (
        <main className="main-content">
          {/* Left Panel: Sector Selector & Commuter Route Checker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Live Sector Simulator */}
            <section className="glass-panel">
              <h2 className="panel-title">
                <span>📍</span> Vari Live Sector Simulation
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Select pilgrimage sector where Vari is currently positioned to see highway closures and diversions update dynamically:
              </p>
              <div className="sector-list">
                {PILGRIMAGE_SECTORS.map(sec => (
                  <button
                    key={sec.id}
                    className={`sector-btn ${selectedSector.id === sec.id ? 'active' : ''}`}
                    onClick={() => setSelectedSector(sec)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sec.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {sec.coords}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Commuter Route Checker */}
            <section className="glass-panel">
              <h2 className="panel-title">
                <span>🚗</span> Citizen / Driver Route Checker
              </h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  Select Travel Journey:
                </label>
                <select
                  className="route-select"
                  value={selectedCommuterRoute.id}
                  onChange={e => setSelectedCommuterRoute(COMMUTER_ROUTES.find(r => r.id === e.target.value))}
                >
                  {COMMUTER_ROUTES.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Est: {r.normalTime})
                    </option>
                  ))}
                </select>
              </div>

              {isCommuterBlocked ? (
                <div className="route-alert blocked">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--accent-red)' }}>
                    <span>⛔</span> ROAD BLOCKED BY VARI
                  </div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.88rem' }}>
                    Your path via <strong>{selectedSector.blockedRoad}</strong> is closed due to the Vari procession.
                  </p>
                  <div style={{ marginTop: '0.6rem', padding: '0.6rem', background: 'rgba(50, 215, 75, 0.1)', borderRadius: '8px', border: '1px solid rgba(50, 215, 75, 0.3)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-green)', fontSize: '0.85rem' }}>
                      🔄 Recommended Alternate Detour:
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                      {selectedSector.alternateBypass}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-orange)', marginTop: '4px' }}>
                      ⏱ Expected Extra Delay: +{selectedSector.delayMinutes} mins
                    </div>
                  </div>
                </div>
              ) : (
                <div className="route-alert open">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--accent-green)' }}>
                    <span>🟢</span> CORRIDOR OPEN &amp; CLEAR
                  </div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.88rem' }}>
                    Vari procession is not currently blocking this corridor. Standard highway navigation is clear.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Panel: Live Map Visualizer & Active Diversion Directives */}
          <section className="glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="map-placeholder">
              <div className="map-overlay"></div>

              {/* Pilgrimage Route Line Overlay (SVG) */}
              <svg className="route-svg" viewBox="0 0 800 400" preserveAspectRatio="none">
                {/* Regular Pilgrimage Highway */}
                <path d="M 50,80 Q 250,120 400,200 T 750,320" fill="none" stroke="#64748B" strokeWidth="4" strokeDasharray="6,6" />
                {/* Active Blocked Section */}
                <path d="M 320,160 Q 400,200 480,240" fill="none" stroke="#ff3b30" strokeWidth="8" />
                {/* Active Green Detour Bypass Route */}
                <path d="M 320,160 Q 380,80 480,240" fill="none" stroke="#32d74b" strokeWidth="5" strokeDasharray="4,4" />
              </svg>

              {/* Vari Procession Live Centroid Marker */}
              <div className="map-marker" style={{ top: '48%', left: '50%' }}>
                <div className="pulse-ring"></div>
                <div className="marker-dot"></div>
                <div className="marker-info">
                  <strong>🚩 Live Vari Procession Centroid</strong>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                    {selectedSector.coords} • Est. Radius ~350m
                  </p>
                </div>
              </div>

              {/* Checkpoint Pins */}
              <div className="checkpoint-pin" style={{ top: '38%', left: '40%' }}>
                <span>👮 Wadki Barricade</span>
              </div>
              <div className="checkpoint-pin" style={{ top: '60%', left: '60%' }}>
                <span>👮 Saswad Phata</span>
              </div>
            </div>

            {/* Active Diversion Details */}
            <div style={{ padding: '1.5rem', background: 'var(--surface-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h2 style={{ fontSize: '1.3rem', color: '#fff' }}>
                  Active Highway Diversion: <span style={{ color: 'var(--accent-orange)' }}>{selectedSector.name}</span>
                </h2>
                <span className="badge-danger">⛔ TRAFFIC DIVERTED</span>
              </div>

              <div className="diversion-grid">
                <div className="diversion-cell">
                  <div className="cell-label">⛔ Closed Highway Stretch</div>
                  <div className="cell-value danger">{selectedSector.blockedRoad}</div>
                </div>
                <div className="diversion-cell">
                  <div className="cell-label">🚗 Authorized Bypass Detour</div>
                  <div className="cell-value success">{selectedSector.alternateBypass}</div>
                </div>
                <div className="diversion-cell">
                  <div className="cell-label">👮 Police Barricades</div>
                  <div className="cell-value">{selectedSector.checkpoints.join(', ')}</div>
                </div>
                <div className="diversion-cell">
                  <div className="cell-label">⏱ Estimated Detour Delay</div>
                  <div className="cell-value warning">+{selectedSector.delayMinutes} Minutes</div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <strong>📢 Public &amp; Highway Advisory:</strong>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedSector.advisory}
                </p>
              </div>

              <div className="action-buttons" style={{ marginTop: '1.2rem' }}>
                <button className="btn btn-primary" onClick={handleBroadcastAuthorities}>
                  📡 Broadcast Position to All Authorities
                </button>
                <button className="btn btn-dispatch" onClick={() => alert("Green Corridor clearance signal dispatched to traffic police!")}>
                  🚑 Clear Emergency Green Corridor
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* TAB 2: MULTI-AUTHORITY BROADCAST */}
      {activeTab === 'authorities' && (
        <main className="main-content" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Authority Dispatch Summary */}
          <section className="glass-panel">
            <h2 className="panel-title">
              <span>📡</span> Integrated Authority Dispatch Hub
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Real-time Vari position and traffic diversion directives are automatically synthesized and broadcasted to key public bodies:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="authority-card">
                <div className="authority-card-header">
                  <span style={{ fontSize: '1.2rem' }}>👮</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>Traffic Police &amp; Highway Patrol</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Barricades, heavy vehicle diversions &amp; bypass control</div>
                  </div>
                  <span className="badge-success">LIVE SYNC</span>
                </div>
                <div className="authority-card-body">
                  <strong>Directives:</strong> {selectedSector.policeAction}
                </div>
              </div>

              <div className="authority-card">
                <div className="authority-card-header">
                  <span style={{ fontSize: '1.2rem' }}>🏥</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>District Health &amp; 108 Ambulances</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Paramedic stations, standby radius &amp; green corridor</div>
                  </div>
                  <span className="badge-success">LIVE SYNC</span>
                </div>
                <div className="authority-card-body">
                  <strong>Directives:</strong> {selectedSector.medicalAction}
                </div>
              </div>

              <div className="authority-card">
                <div className="authority-card-header">
                  <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>District Administration &amp; Temple Trust</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Crowd density tracking, water &amp; sanitation camp monitoring</div>
                  </div>
                  <span className="badge-success">LIVE SYNC</span>
                </div>
                <div className="authority-card-body">
                  <strong>Directives:</strong> Vari at {selectedSector.name} ({selectedSector.coords}). Track crowd buffer ~350m.
                </div>
              </div>

              <div className="authority-card">
                <div className="authority-card-header">
                  <span style={{ fontSize: '1.2rem' }}>🚒</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>Fire &amp; Disaster Rescue Operations</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rapid evacuation lane clearance &amp; standby rescue units</div>
                  </div>
                  <span className="badge-success">LIVE SYNC</span>
                </div>
                <div className="authority-card-body">
                  <strong>Directives:</strong> Evacuation lanes cleared across {selectedSector.checkpoints.join(' & ')}.
                </div>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={handleBroadcastAuthorities}>
              📡 Force Instant Multi-Authority Telemetry Broadcast
            </button>
          </section>

          {/* Live Transmission Log */}
          <section className="glass-panel">
            <h2 className="panel-title">
              <span>📋</span> Live Dispatch &amp; Transmission Log
            </h2>
            <div className="dispatch-log-list">
              {authorityDispatchLog.map(log => (
                <div key={log.id} className="log-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.authority}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>{log.status} • {log.time}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {log.action}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* TAB 3: EMERGENCY MEDICAL DISPATCH */}
      {activeTab === 'emergency' && (
        <main className="main-content">
          <section className="glass-panel">
            <h2 className="panel-title">
              <span>🚨</span> Active Emergency Medical Alerts (2)
            </h2>
            <div className="emergency-list">
              <div className="emergency-card active">
                <div className="card-header">
                  <span className="patient-name">Ganesh (Varkari Mitra)</span>
                  <span className="time-ago">Just now</span>
                </div>
                <div className="card-details">
                  <p><strong>Alert:</strong> Elderly Varkari fainted due to dehydration</p>
                  <p>📍 Near Saswad Dive Ghat (18.345° N, 74.012° E)</p>
                </div>
              </div>
              <div className="emergency-card">
                <div className="card-header">
                  <span className="patient-name">Ramesh Patil</span>
                  <span className="time-ago">15 mins ago</span>
                </div>
                <div className="card-details">
                  <p><strong>Alert:</strong> Minor leg injury during walk</p>
                  <p>📍 Pandharpur Hwy (18.400° N, 74.100° E)</p>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel">
            <h2 className="panel-title">
              <span>🚑</span> Emergency Responder Command
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Identified closest emergency infrastructure for current Vari position:
            </p>
            <div className="diversion-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="diversion-cell">
                <div className="cell-label">Nearest Hospital</div>
                <div className="cell-value success">Sanjeevani Hospital (0.8 km)</div>
              </div>
              <div className="diversion-cell">
                <div className="cell-label">Assigned Ambulance</div>
                <div className="cell-value warning">Ambulance A1 (1.2 km away)</div>
              </div>
            </div>
            <div className="action-buttons">
              <button className="btn btn-dispatch" onClick={() => alert("Ambulance A1 dispatched via Green Corridor!")}>
                Dispatch Ambulance A1
              </button>
              <button className="btn btn-primary" onClick={() => alert("Notification sent to Sanjeevani Hospital Emergency Trauma Unit!")}>
                Notify Sanjeevani Hospital
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
