import { AlertCircle, KeyRound, User, Eye, EyeOff, Lock, Globe } from 'lucide-react';

export default function LoginModal({
  onClose, error, username, setUsername, password, setPassword,
  showPassword, setShowPassword, loading, onSubmit
}) {
  return (
    <div className="modal-overlay">
      <div className="login-card">
        <button className="close-modal-btn" onClick={onClose}>×</button>
        <div className="login-eyebrow">
          <Lock size={10} style={{ marginRight: '4px' }} /> Automated Portal Access
        </div>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Sign in to GuardianPath</h2>
          <p style={{ color: '#78716c', fontSize: '14px', margin: 0 }}>
            Enter your assigned details below. The system automatically routes students, teachers, and admins to their proper workspaces.
          </p>
        </div>
        {error && (
          <div style={{ display: 'flex', gap: '8px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '14px 16px', color: '#b91c1c', fontSize: '13px', marginBottom: '24px', fontWeight: 500 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={onSubmit} className="auth-horizontal-form">
          <div className="field-group">
            <label className="field-label"><User size={13} color="#1d4ed8" /> Username / Student ID</label>
            <div className="field-input-wrap">
              <input type="text" className="field-input" placeholder="Teacher ID, school code, or student ID" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
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
            <button type="submit" className="submit-btn" disabled={loading}>
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
