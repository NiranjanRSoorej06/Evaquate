import { Eye, EyeOff } from 'lucide-react';

export default function PasswordResetModal({
  resetPassword, setResetPassword, showResetPassword, setShowResetPassword,
  onReset, onCancel
}) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="premium-card" style={{ maxWidth: '400px', width: '90%' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: 0, marginBottom: '16px' }}>Reset Password</h3>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input type={showResetPassword ? 'text' : 'password'} className="form-input" placeholder="Enter new password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} style={{ paddingRight: '40px' }} />
            <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', display: 'flex', alignItems: 'center' }}>
              {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onReset} className="btn-primary">Reset Password</button>
        </div>
      </div>
    </div>
  );
}
