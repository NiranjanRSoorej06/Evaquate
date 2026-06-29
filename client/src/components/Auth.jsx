import React, { useState } from 'react';
import { Shield, BookOpen, GraduationCap, Settings, AlertCircle } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [role, setRole] = useState('student'); // 'student', 'teacher', 'admin', 'super_admin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
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
          role,
          username: role === 'admin' ? '' : username,
          password,
          schoolCode: role === 'admin' ? schoolCode : ''
        })
      });

      const data = await response.json();
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Authentication failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'student', label: 'Student', icon: GraduationCap, desc: 'Practice safety drills and answer quizzes' },
    { id: 'teacher', label: 'Teacher', icon: BookOpen, desc: 'Manage your classes and check analytics' },
    { id: 'admin', label: 'School Admin', icon: Shield, desc: 'Manage school plan, teachers, and blueprints' },
    { id: 'super_admin', label: 'Super Admin', icon: Settings, desc: 'Manage registered schools on the network' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', background: 'linear-gradient(135deg, #fff 40%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GuardianPath AI
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Gamified Disaster Preparedness & Management Platform
          </p>
        </div>

        {/* Role Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {roles.map(r => {
            const Icon = r.icon;
            const active = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id);
                  setError('');
                  setUsername('');
                  setPassword('');
                  setSchoolCode('');
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px',
                  background: active ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active ? 'var(--color-accent-primary)' : 'var(--glass-border)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: active ? '#fff' : 'var(--color-text-secondary)',
                  transition: 'var(--transition-smooth)',
                  textAlign: 'center'
                }}
                className={active ? 'anim-pulse-glow' : ''}
              >
                <Icon size={24} style={{ marginBottom: '8px', color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)' }} />
                <span style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{r.label}</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>{r.desc}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-fire)', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: 'var(--color-fire)', fontSize: '13px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {role === 'admin' ? (
            <>
              <div className="form-group">
                <label className="form-label">School Unique ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. SCH-12345"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Access Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">
                  {role === 'student' ? 'Roll Number' : 'Username'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={role === 'student' ? 'Enter roll no (e.g. 101)' : 'Enter username'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {role === 'student' ? 'Full Name (Password)' : 'Password'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={role === 'student' ? 'Enter full name (case-sensitive)' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
