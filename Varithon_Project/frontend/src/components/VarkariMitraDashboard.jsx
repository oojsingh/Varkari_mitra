import { useState, useEffect } from 'react';
import FunctionalMap from './FunctionalMap';

export default function VarkariMitraDashboard({ user, onLogout }) {
  const [kycStatus, setKycStatus] = useState(user.kycStatus);
  const [ekycForm, setEkycForm] = useState({ fullName: '', aadhaarNumber: '', address: '', phone: '', photoBase64: '' });
  const [incident, setIncident] = useState({ type: 'road_block', description: '', latitude: '', longitude: '' });
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedSector, setSelectedSector] = useState(null);

  const loadReports = async () => {
    try {
      const data = await window.api.adminAll();
      setReports(data.emergencyReports || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadReports(); }, []);

  const submitEkyc = async (e) => {
    e.preventDefault();
    try {
      const data = await window.api.ekyc(ekycForm);
      setKycStatus(data.user.kycStatus);
      setMessage('eKYC verified successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) { setMessage(err.message); }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    try {
      await window.api.emergencyReport({ ...incident, reportedBy: user.id, reportedByName: user.name });
      setIncident({ type: 'road_block', description: '', latitude: '', longitude: '' });
      setMessage('Incident reported');
      loadReports();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage(err.message); }
  };

  const needsEkyc = kycStatus !== 'VERIFIED';

  return (
    <div className="dashboard mitra-dash">
      <header className="dash-header">
        <div>
          <h2>🤝 Varkari Mitra Dashboard</h2>
          <p className="user-greeting">Welcome, {user.name}</p>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      {message && <div className="toast">{message}</div>}

      <div className="dash-grid">
        <section className="card map-full">
          <h3>🗺️ Live Palkhi Route & Sector Status</h3>
          <div style={{ height: '520px', width: '100%' }}>
            <FunctionalMap selectedSector={selectedSector} onSectorSelect={setSelectedSector} />
          </div>
        </section>

        {needsEkyc && (
          <section className="card ekyc-card">
            <h3>🔐 eKYC Verification Required</h3>
            <p className="muted">Complete eKYC to start reporting incidents and tracking</p>
            <form onSubmit={submitEkyc} className="ekyc-form">
              <div className="form-row">
                <input placeholder="Full Name" value={ekycForm.fullName} onChange={e => setEkycForm({...ekycForm, fullName: e.target.value})} required />
                <input placeholder="Phone" value={ekycForm.phone} onChange={e => setEkycForm({...ekycForm, phone: e.target.value})} required />
              </div>
              <div className="form-row">
                <input placeholder="Aadhaar Number" value={ekycForm.aadhaarNumber} onChange={e => setEkycForm({...ekycForm, aadhaarNumber: e.target.value})} required />
                <input placeholder="Address" value={ekycForm.address} onChange={e => setEkycForm({...ekycForm, address: e.target.value})} />
              </div>
              <textarea placeholder="Photo Base64 (optional)" value={ekycForm.photoBase64} onChange={e => setEkycForm({...ekycForm, photoBase64: e.target.value})} rows="2" />
              <button type="submit" className="primary-btn">Submit eKYC</button>
            </form>
          </section>
        )}

        {!needsEkyc && (
          <>
            <section className="card">
              <h3>📢 Report Incident</h3>
              <form onSubmit={submitReport} className="report-form">
                <div className="form-row">
                  <select value={incident.type} onChange={e => setIncident({...incident, type: e.target.value})}>
                    <option value="road_block">Road Block</option>
                    <option value="traffic_jam">Traffic Jam</option>
                    <option value="accident">Accident</option>
                    <option value="medical_emergency">Medical Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-row">
                  <input placeholder="Latitude" type="number" step="any" value={incident.latitude} onChange={e => setIncident({...incident, latitude: e.target.value})} />
                  <input placeholder="Longitude" type="number" step="any" value={incident.longitude} onChange={e => setIncident({...incident, longitude: e.target.value})} />
                </div>
                <textarea placeholder="Description" value={incident.description} onChange={e => setIncident({...incident, description: e.target.value})} rows="3" required />
                <button type="submit" className="primary-btn">Report Incident</button>
              </form>
            </section>

            <section className="card">
              <h3>📋 Recent Reports</h3>
              <div className="report-list">
                {reports.length === 0 && <p className="muted">No reports yet</p>}
                {reports.slice(0, 10).map(r => (
                  <div key={r.id} className="report-item">
                    <div className="report-header">
                      <span className="report-id">{r.id}</span>
                      <span className="muted">{new Date(r.receivedAt).toLocaleString()}</span>
                    </div>
                    <p>{r.description || r.type || 'Incident'}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="card">
          <h3>👤 Profile</h3>
          <div className="info-row"><span>Role:</span><strong>Varkari Mitra</strong></div>
          <div className="info-row"><span>Email:</span><span>{user.email}</span></div>
          <div className="info-row"><span>KYC:</span><span className={kycStatus === 'VERIFIED' ? 'text-ok' : 'text-warn'}>{kycStatus}</span></div>
          <div className="info-row"><span>Member ID:</span><span className="mono">{user.id}</span></div>
        </section>
      </div>
    </div>
  );
}
