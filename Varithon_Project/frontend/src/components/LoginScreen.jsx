import { useState } from 'react';

export default function LoginScreen({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('varkari');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (isRegister) {
        data = await window.api.register(email, password, name, role);
      } else {
        data = await window.api.login(email, password);
      }
      window.setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await window.api.googleLogin(email || 'user@example.com', name || 'User', null, role);
      window.setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">◉</div>
        <h1>VARKARI MITRA</h1>
        <p className="login-subtitle">{isRegister ? 'Create Account' : 'Welcome Back'}</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {isRegister && (
            <div className="form-group">
              <label>I am a...</label>
              <div className="role-selector">
                {['varkari', 'varkari_mitra', 'vari_sevak'].map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`role-btn ${role === r ? 'active' : ''}`}
                    onClick={() => setRole(r)}
                  >
                    {r === 'varkari' && '🙏 Varkari'}
                    {r === 'varkari_mitra' && '🤝 Varkari Mitra'}
                    {r === 'vari_sevak' && '🛕 Vari Sevak'}
                  </button>
                ))}
              </div>
              {role === 'varkari_mitra' && (
                <p className="role-hint">eKYC verification required after registration</p>
              )}
            </div>
          )}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="toggle-text">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button className="link-btn" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
