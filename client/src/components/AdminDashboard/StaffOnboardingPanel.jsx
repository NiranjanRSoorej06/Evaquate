import { UserPlus, Eye, EyeOff } from 'lucide-react';

export default function StaffOnboardingPanel({
  isMobile, isEditingTeacher, user, tName, setTName, tClass, setTClass,
  tPassword, setTPassword, showPassword, setShowPassword,
  handleCreateTeacher, cancelEditTeacher
}) {
  return (
    <div className="panel-card" style={{ maxWidth: isMobile ? '100%' : '560px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <UserPlus size={20} color="#0284c7" /> {isEditingTeacher ? 'Update Instructor Attributes' : 'Staff Profile Onboarding'}
      </h3>
      <form onSubmit={handleCreateTeacher}>
        <div style={{ marginBottom: '18px' }}>
          <label className="label-text">Faculty Name</label>
          <input type="text" className="form-control" placeholder="e.g. Jonathan Miller" value={tName} onChange={e => setTName(e.target.value)} required />
        </div>
        <div style={{ marginBottom: '18px' }}>
          <label className="label-text">Class Assigned</label>
          <input type="text" className="form-control" placeholder="e.g. Room 12-B" value={tClass} onChange={e => setTClass(e.target.value)} required disabled={!!isEditingTeacher} />
          {!isEditingTeacher && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Teacher login ID will be generated as <strong>{user?.unique_code}_&lt;class&gt;</strong> after you submit.
            </p>
          )}
        </div>
        <div style={{ marginBottom: '28px' }}>
          <label className="label-text">Password {isEditingTeacher && '(Omit to protect existing)'}</label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="••••••••" value={tPassword} onChange={e => setTPassword(e.target.value)} required={!isEditingTeacher} style={{ paddingRight: '44px' }} />
            <button type="button" onClick={() => setShowPassword(prev => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button type="submit" className="btn-action" style={{ width: '100%' }}>{isEditingTeacher ? 'Commit System Updates' : 'Authorize Account Creation'}</button>
          {isEditingTeacher && (
            <button type="button" onClick={cancelEditTeacher} className="btn-secondary-link" style={{ width: '100%' }}>Abort</button>
          )}
        </div>
      </form>
    </div>
  );
}
