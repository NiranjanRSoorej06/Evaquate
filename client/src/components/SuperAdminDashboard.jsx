import React, { useState, useEffect } from 'react';
import { Plus, ShieldAlert, Award, FileText, CheckCircle } from 'lucide-react';

export default function SuperAdminDashboard({ user, onLogout }) {
  const [schools, setSchools] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchSchools = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/superadmin/schools');
      const data = await response.json();
      setSchools(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleRegisterSchool = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/superadmin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, unique_code: code, password })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`School registered successfully! ID: ${code}`);
        setName('');
        setCode('');
        setPassword('');
        fetchSchools();
      } else {
        setError(data.message || 'Failed to register school.');
      }
    } catch (err) {
      setError('Connection failure.');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>Super Admin Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Welcome, {user.username}. Global Network Management</p>
        </div>
        <button onClick={onLogout} className="btn-secondary">Logout</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* School Directory */}
        <div>
          <div className="glass-panel" style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="var(--color-accent-primary)" />
              Registered Schools Directory
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>School Name</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Unique Code</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Blueprint State</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Teachers</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Students</th>
                </tr>
              </thead>
              <tbody>
                {schools.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: '600' }}>{s.name}</td>
                    <td style={{ padding: '16px 8px' }}><code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{s.unique_code}</code></td>
                    <td style={{ padding: '16px 8px' }}>
                      {s.blueprint_json ? (
                        <span style={{ color: 'var(--color-safe)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                          <CheckCircle size={14} /> Ready
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-earthquake)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                          <ShieldAlert size={14} /> Pending Upload
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 8px' }}>{s.teacher_count}</td>
                    <td style={{ padding: '16px 8px' }}>{s.student_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Register School */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} color="var(--color-accent-primary)" />
            Register New School
          </h2>

          {message && (
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-safe)', borderRadius: '8px', color: 'var(--color-safe)', fontSize: '13px', marginBottom: '16px' }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-fire)', borderRadius: '8px', color: 'var(--color-fire)', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterSchool}>
            <div className="form-group">
              <label className="form-label">School Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Springfield Elementary"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unique School ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SCH-78901"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Access Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Secure password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Register School
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
