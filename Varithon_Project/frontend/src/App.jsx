import { useState, useEffect } from 'react';
import './index.css';
import LoginScreen from './components/LoginScreen';
import VarkariDashboard from './components/VarkariDashboard';
import VarkariMitraDashboard from './components/VarkariMitraDashboard';
import VariSevakDashboard from './components/VariSevakDashboard';

const PILGRIMAGE_SECTORS = [
  {
    id: 'sec_pune', name: 'Pune - Hadapsar Sector', coords: '18.5089° N, 73.9260° E', lat: 18.5089, lng: 73.9260,
    blockedRoad: 'Solapur Road & Gadital Hadapsar Junction', alternateBypass: 'Magarpatta -> Kharadi Bypass OR Katraj-Dehu Road Bypass',
    checkpoints: ['Gadital Chowk Barricade', 'Magarpatta Naka'], delayMinutes: 35,
    advisory: 'Vari procession entering Hadapsar. Heavy trucks & intercity buses prohibited.',
    policeAction: 'Barricade Gadital intersection. Divert heavy traffic to Kharadi.', medicalAction: 'Station 2 mobile ambulances at Hadapsar flyover base.'
  },
  {
    id: 'sec_saswad', name: 'Dive Ghat - Saswad Sector', coords: '18.3450° N, 74.0120° E', lat: 18.3450, lng: 74.0120,
    blockedRoad: 'Hadapsar - Dive Ghat - Saswad Highway (SH-61)', alternateBypass: 'Divert via Kondhwa -> Bopdev Ghat -> Saswad OR Kedgaon-Chaufula Bypass',
    checkpoints: ['Wadki Naka Police Post', 'Dive Ghat Base Checkpoint', 'Saswad Phata'], delayMinutes: 45,
    advisory: 'Steep ghat section blocked for pedestrian safety. Green Corridor for Ambulances only.',
    policeAction: 'Close Dive Ghat for all regular vehicles. Station patrol at Wadki Naka.', medicalAction: 'Position emergency cardiac ambulance at Dive Ghat summit.'
  },
  {
    id: 'sec_jejuri', name: 'Saswad - Jejuri Sector', coords: '18.2800° N, 74.1500° E', lat: 18.2800, lng: 74.1500,
    blockedRoad: 'Saswad - Jejuri Highway (Old Palkhi Marg)', alternateBypass: 'Divert via Morgaon -> Supe -> Baramati OR Shirwal -> Lonand Route',
    checkpoints: ['Jejuri Naka Barricade', 'Nazare Phata Post'], delayMinutes: 30,
    advisory: 'Procession halting near Jejuri temple corridor. Heavy pilgrim footfall.',
    policeAction: 'Reroute goods trucks via Shirwal. Direct light cars through Morgaon bypass.', medicalAction: 'Activate Jejuri Rural Hospital emergency staging area.'
  },
  {
    id: 'sec_lonand', name: 'Lonand - Taradgaon Sector', coords: '18.0400° N, 74.1900° E', lat: 18.0400, lng: 74.1900,
    blockedRoad: 'Lonand - Shirwal Road & Lonand Market Stretch', alternateBypass: 'Divert via Nira -> Khandala -> NH-48 (Pune-Bangalore Hwy) Bypass',
    checkpoints: ['Lonand Railway Crossing Post', 'Nira Bridge Barricade'], delayMinutes: 25,
    advisory: 'Palkhi crossing Nira river basin. Heavy pedestrian bottleneck.',
    policeAction: 'Barricade Nira bridge for vehicles. Maintain single lane emergency corridor.', medicalAction: 'Station riverfront paramedic squad.'
  },
  {
    id: 'sec_pandharpur', name: 'Wakhari - Pandharpur Holy City Sector', coords: '17.6775° N, 75.3278° E', lat: 17.6775, lng: 75.3278,
    blockedRoad: 'All Central Arterial Roads entering Pandharpur Town & Core Temple Ring',
    alternateBypass: 'Park at Outer Mega-Parking (Wakhari / Isbavi) & Use E-Shuttle or Green Corridor',
    checkpoints: ['Wakhari Naka Mega-Barricade', 'Isbavi Ring Post', 'Bhimanagar Police Checkpoint'], delayMinutes: 60,
    advisory: 'Complete vehicular lockdown inside Pandharpur municipal limits. Over 1M pilgrims.',
    policeAction: 'Enforce outer perimeter barricades. Only emergency and VIP pass vehicles permitted.', medicalAction: 'Activate 10 centralized disaster medical pods and 20 ambulances.'
  }
];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vm_token');
    if (token) {
      fetch('https://varkari-mitra.onrender.com/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (data.status === 'ok') setUser(data.user); })
        .catch(() => localStorage.removeItem('vm_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => { localStorage.removeItem('vm_token'); setUser(null); };

  if (loading) return <div className="loading-screen">Loading...</div>;

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (user.role === 'varkari') {
    return <VarkariDashboard user={user} onLogout={handleLogout} />;
  }
  if (user.role === 'varkari_mitra') {
    return <VarkariMitraDashboard user={user} onLogout={handleLogout} />;
  }
  if (user.role === 'vari_sevak') {
    return <VariSevakDashboard user={user} onLogout={handleLogout} />;
  }

  return <LoginScreen onLogin={handleLogin} />;
}

export default App;
