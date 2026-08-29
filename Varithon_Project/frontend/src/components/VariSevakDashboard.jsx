import { useState, useEffect } from 'react';

export default function VariSevakDashboard({ user, onLogout }) {
  const [mySevas, setMySevas] = useState([]);
  const [allSevas, setAllSevas] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: 'General', price: '', location: '', availableFrom: '', availableTo: '' });
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [mine, all] = await Promise.all([window.api.mySevas(), window.api.allSevas()]);
      setMySevas(mine.data || []);
      setAllSevas(all.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const createSeva = async (e) => {
    e.preventDefault();
    try {
      await window.api.createSeva({ ...form, price: Number(form.price) || 0 });
      setForm({ title: '', description: '', category: 'General', price: '', location: '', availableFrom: '', availableTo: '' });
      setMessage('Seva created');
      load();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage(err.message); }
  };

  return (
    <div className="dashboard sevak-dash">
      <header className="dash-header">
        <div>
          <h2>🛕 Vari Sevak Dashboard</h2>
          <p className="user-greeting">Seva Parmarth, {user.name}</p>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      {message && <div className="toast">{message}</div>}

      <div className="dash-grid">
        <section className="card">
          <h3>➕ Create New Seva</h3>
          <form onSubmit={createSeva} className="seva-form">
            <input placeholder="Seva Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" />
            <div className="form-row">
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option>General</option>
                <option>Prasad</option>
                <option>Accommodation</option>
                <option>Transport</option>
                <option>Medical</option>
                <option>Guide</option>
              </select>
              <input placeholder="Price (₹)" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
            <input placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            <div className="form-row">
              <input placeholder="Available From" type="date" value={form.availableFrom} onChange={e => setForm({...form, availableFrom: e.target.value})} />
              <input placeholder="Available To" type="date" value={form.availableTo} onChange={e => setForm({...form, availableTo: e.target.value})} />
            </div>
            <button type="submit" className="primary-btn">Create Seva</button>
          </form>
        </section>

        <section className="card">
          <h3>📋 My Sevas ({mySevas.length})</h3>
          <div className="seva-list">
            {mySevas.length === 0 && <p className="muted">No sevas created yet</p>}
            {mySevas.map(s => (
              <div key={s.id} className="seva-item">
                <div className="seva-title">{s.title}</div>
                <div className="seva-meta">
                  <span className="badge">{s.category}</span>
                  <span>₹{s.price}</span>
                </div>
                {s.location && <p className="muted small">📍 {s.location}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="card full-width">
          <h3>🌐 Seva Marketplace ({allSevas.length})</h3>
          <div className="seva-grid">
            {allSevas.map(s => (
              <div key={s.id} className="seva-card">
                <div className="seva-card-title">{s.title}</div>
                <p className="seva-card-desc">{s.description}</p>
                <div className="seva-card-meta">
                  <span className="badge">{s.category}</span>
                  <span className="price">₹{s.price}</span>
                </div>
                <p className="muted small">by {s.sevakName}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>👤 Profile</h3>
          <div className="info-row"><span>Role:</span><strong>Vari Sevak</strong></div>
          <div className="info-row"><span>Email:</span><span>{user.email}</span></div>
          <div className="info-row"><span>Member ID:</span><span className="mono">{user.id}</span></div>
        </section>
      </div>
    </div>
  );
}
