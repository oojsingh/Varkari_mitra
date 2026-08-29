import { useState, useEffect } from 'react';
import FunctionalMap from './FunctionalMap';

export default function VarkariDashboard({ user, onLogout }) {
  const [location, setLocation] = useState(null);
  const [sharing, setSharing] = useState(user.locationSharing);
  const [family, setFamily] = useState([]);
  const [tracking, setTracking] = useState(null);
  const [newMember, setNewMember] = useState({ email: '', name: '', relation: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedSector, setSelectedSector] = useState(null);

  const loadFamily = async () => {
    try {
      const data = await window.api.myFamily();
      setFamily(data.data || []);
    } catch (e) { console.error(e); }
  };

  const loadTracking = async () => {
    try {
      const data = await window.api.trackVarkari(user.id);
      setTracking(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadFamily(); }, []);
  useEffect(() => { if (sharing) loadTracking(); else setTracking(null); }, [sharing]);

  const updateLocation = () => {
    if (!navigator.geolocation) return setMessage('Geolocation not supported');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await window.api.updateLocation(pos.coords.latitude, pos.coords.longitude);
          setLocation(data.user.lastLocation);
          setMessage('Location updated');
          setTimeout(() => setMessage(''), 3000);
        } catch (e) { setMessage(e.message); }
        setLoading(false);
      },
      (err) => { setMessage('Location access denied'); setLoading(false); }
    );
  };

  const addFamily = async (e) => {
    e.preventDefault();
    try {
      await window.api.addFamily(newMember.email, newMember.name, newMember.relation);
      setNewMember({ email: '', name: '', relation: '' });
      loadFamily();
      setMessage('Family member added');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) { setMessage(e.message); }
  };

  const toggleSharing = async () => {
    try {
      const data = await window.api.setSharing(!sharing);
      setSharing(data.sharing);
      setMessage(data.sharing ? 'Sharing enabled' : 'Sharing disabled');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) { setMessage(e.message); }
  };

  return (
    <div className="dashboard varkari-dash">
      <header className="dash-header">
        <div>
          <h2>🙏 Varkari Dashboard</h2>
          <p className="user-greeting">Namaste, {user.name}</p>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      {message && <div className="toast">{message}</div>}

      <div className="dash-grid">
        <section className="card map-full">
          <h3>🗺️ Live Palkhi Route Map</h3>
          <div style={{ height: '520px', width: '100%' }}>
            <FunctionalMap selectedSector={selectedSector} onSectorSelect={setSelectedSector} />
          </div>
          {selectedSector && (
            <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <strong>{selectedSector.name}</strong> — Delay: +{selectedSector.delay} mins
            </div>
          )}
        </section>

        <section className="card">
          <h3>📍 My Location</h3>
          <div className="location-controls">
            <button className="primary-btn" onClick={updateLocation} disabled={loading}>
              {loading ? 'Updating...' : 'Share Current Location'}
            </button>
            <button className={`toggle-btn ${sharing ? 'on' : 'off'}`} onClick={toggleSharing}>
              {sharing ? 'Sharing ON' : 'Sharing OFF'}
            </button>
          </div>
          {location && (
            <div className="location-data">
              <p>LAT: {location.latitude?.toFixed(5)}</p>
              <p>LON: {location.longitude?.toFixed(5)}</p>
              <p className="muted">Updated: {new Date(location.updatedAt).toLocaleTimeString()}</p>
            </div>
          )}
        </section>

        <section className="card">
          <h3>👨‍👩‍👧 Family Members</h3>
          <form onSubmit={addFamily} className="family-form">
            <input placeholder="Name" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} required />
            <input placeholder="Email" type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} required />
            <input placeholder="Relation" value={newMember.relation} onChange={e => setNewMember({...newMember, relation: e.target.value})} />
            <button type="submit" className="primary-btn small">Add Member</button>
          </form>
          <div className="family-list">
            {family.length === 0 && <p className="muted">No family members added</p>}
            {family.map(m => (
              <div key={m.id} className="family-item">
                <span>{m.name}</span>
                <span className="muted">{m.relation}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>🔍 Family View</h3>
          {tracking && tracking.sharing ? (
            <div className="tracking-info">
              <p><strong>Name:</strong> {tracking.varkari.name}</p>
              <p><strong>Email:</strong> {tracking.varkari.email}</p>
              {tracking.location && (
                <>
                  <p>LAT: {tracking.location.latitude?.toFixed(5)}</p>
                  <p>LON: {tracking.location.longitude?.toFixed(5)}</p>
                </>
              )}
            </div>
          ) : (
            <p className="muted">Enable location sharing to allow family to view your location</p>
          )}
        </section>

        <section className="card">
          <h3>📊 Account Info</h3>
          <div className="info-row"><span>Role:</span><strong>Varkari</strong></div>
          <div className="info-row"><span>Email:</span><span>{user.email}</span></div>
          <div className="info-row"><span>Member ID:</span><span className="mono">{user.id}</span></div>
        </section>
      </div>
    </div>
  );
}
