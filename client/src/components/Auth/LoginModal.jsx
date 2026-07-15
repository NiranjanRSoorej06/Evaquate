import { KeyRound, User, Eye, EyeOff, Lock, Globe, ShieldCheck, AlertCircle } from 'lucide-react';
import { detectRole } from './hooks/useAuth';

const ROLE_LABELS = {
  superadmin: { label: 'Super Admin', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  admin:      { label: 'School Admin', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  teacher:    { label: 'Teacher',      color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  student:    { label: 'Student',      color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
};

export default function LoginModal({
  onClose, username, setUsername, password, setPassword,
  showPassword, setShowPassword, loading, onSubmit
}) {
  const detectedRole = detectRole(username);
  const roleInfo = detectedRole ? ROLE_LABELS[detectedRole] : null;

  return (
    <div className="modal-overlay">
      <div className="login-card">
        <button className="close-modal-btn" onClick={onClose}>×</button>
        <div className="login-eyebrow">
          <Lock size={10} style={{ marginRight: '4px' }} /> Automated Portal Access
        </div>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Sign in to Evaquate</h2>
          <p style={{ color: '#78716c', fontSize: '14px', margin: 0 }}>
            Enter your assigned details below. The system automatically routes students, teachers, and admins to their proper workspaces.
          </p>
        </div>
        <form onSubmit={onSubmit} className="auth-vertical-form">
          <div className="field-group">
            <label className="field-label"><User size={13} color="#1d4ed8" /> Username / Student ID</label>
            <div className="field-input-wrap">
              <input
                type="text"
                className="field-input"
                placeholder="e.g. ABC · abc_1_a · abc_1_a_23 · superadmin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            {/* Live role detection badge */}
            {username.trim().length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {roleInfo ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '12px', fontWeight: 600, padding: '3px 10px',
                    borderRadius: '20px',
                    background: roleInfo.bg, color: roleInfo.color, border: `1px solid ${roleInfo.border}`
                  }}>
                    <ShieldCheck size={12} />
                    {roleInfo.label} detected
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '12px', fontWeight: 600, padding: '3px 10px',
                    borderRadius: '20px',
                    background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca'
                  }}>
                    <AlertCircle size={12} />
                    Unrecognised format
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="field-group">
            <label className="field-label"><KeyRound size={13} color="#1d4ed8" /> Password</label>
            <div className="field-input-wrap">
              <input type={showPassword ? 'text' : 'password'} className="field-input with-toggle" placeholder="Password (students: use your full name)" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', display: 'flex', alignItems: 'center', padding: '4px' }} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="submit-btn-wrap">
            <button type="submit" className="submit-btn" disabled={loading || !roleInfo}>
              {loading ? 'Entering Portal…' : 'Access Account'}
            </button>
          </div>
        </form>
        <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f5f4f0', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '12px', color: '#6b6661' }}>
          <Globe size={14} color="#78716c" />
          <span>Secure, managed link established. Safe workspace environment active.</span>
        </div>
      </div>
    </div>
  );
}
