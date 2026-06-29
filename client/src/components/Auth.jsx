import React, { useState } from 'react';
import { Shield, AlertCircle, KeyRound, User } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '4px', background: 'linear-gradient(135deg, #fff 40%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={36} style={{ color: 'var(--color-accent-primary)' }} /> GuardianPath AI
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Unified Disaster Preparedness & Security Portal
            </p>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--color-accent-primary)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: 'var(--color-accent-primary)', fontWeight: '600' }}>
            Single Sign-On Secure Login
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-fire)', borderRadius: '8px', padding: '12px', color: 'var(--color-fire)', fontSize: '13px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', width: '100%' }}>
          <div style={{ flex: '2 1 260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <User size={14} /> Username / Unique ID
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter username, ID, or roll number"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ height: '46px' }}
            />
          </div>
          <div style={{ flex: '2 1 260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <KeyRound size={14} /> Password / Student Name
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ height: '46px' }}
            />
          </div>
          <div style={{ flex: '1 0 auto' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{ height: '46px', padding: '0 32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', whiteSpace: 'nowrap' }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
