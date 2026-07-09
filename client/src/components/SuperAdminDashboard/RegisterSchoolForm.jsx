import { Plus, Eye, EyeOff } from 'lucide-react';

export default function RegisterSchoolForm({
  name, setName, code, setCode, password, setPassword,
  showRegisterPassword, setShowRegisterPassword, onSubmit
}) {
  return (
    <div className="premium-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ borderBottom: '1px solid #e0f2fe', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} color="#0284c7" /> Provision New Database Entity
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Establish a clean operational database slice and access credentials for a target academic facility.
        </p>
      </div>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label">School Name</label>
          <input type="text" className="form-input" placeholder="e.g. Springfield Elementary" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Unique School ID Code</label>
          <input type="text" className="form-input" placeholder="e.g. ABC (3-letter code)" value={code} onChange={e => setCode(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Access Passphrase</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input type={showRegisterPassword ? 'text' : 'password'} className="form-input" placeholder="Initialize root entity password" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: '40px' }} required />
            <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', display: 'flex', alignItems: 'center' }}>
              {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
          <Plus size={16} /> Finalize Node Registration
        </button>
      </form>
    </div>
  );
}
