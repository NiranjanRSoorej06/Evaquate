import React, { useState } from 'react';
import { Shield, AlertCircle, KeyRound, User, Eye, EyeOff } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <style>{`
        .auth-card {
          width: 100%;
          max-width: 1000px;
          padding: 60px;
          display: flex;
          flex-direction: column;
          gap: 45px;
        }
        .auth-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 30px;
        }
        .auth-form {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 30px;
          align-items: flex-end;
          width: 100%;
        }
        .auth-form-field {
          flex: 2 1 280px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .auth-submit-btn-container {
          flex: 1 0 auto;
        }
        @media (max-width: 768px) {
          .auth-card {
            padding: 30px;
            gap: 30px;
          }
          .auth-header {
            padding-bottom: 20px;
            gap: 16px;
          }
          .auth-form {
            flex-direction: column;
            align-items: stretch;
            gap: 20px;
          }
          .auth-form-field {
            flex: 1 1 auto;
          }
          .auth-submit-btn-container {
            flex: 1 1 auto;
          }
        }
      `}</style>

      <div className="glass-panel auth-card">
        <div className="auth-header">
          <div>
            <h1 style={{ fontSize: '38px', marginBottom: '6px', background: 'linear-gradient(135deg, #fff 40%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={42} style={{ color: 'var(--color-accent-primary)' }} /> GuardianPath AI
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>
              Unified Disaster Preparedness & Security Portal
            </p>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--color-accent-primary)', borderRadius: '24px', padding: '8px 20px', fontSize: '13px', color: 'var(--color-accent-primary)', fontWeight: '600' }}>
            Single Sign-On Secure Login
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-fire)', borderRadius: '8px', padding: '16px', color: 'var(--color-fire)', fontSize: '14px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-field">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '15px' }}>
              <User size={16} /> Username / Unique ID
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter username, ID, or roll number"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ height: '56px', fontSize: '16px' }}
            />
          </div>
          <div className="auth-form-field">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '15px' }}>
              <KeyRound size={16} /> Password / Student Name
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ height: '56px', paddingRight: '55px', width: '100%', fontSize: '16px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'var(--transition-fast)'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="auth-submit-btn-container">
            <button
              type="submit"
              className="btn-primary"
              style={{ height: '56px', padding: '0 48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', whiteSpace: 'nowrap', fontSize: '16px' }}
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
