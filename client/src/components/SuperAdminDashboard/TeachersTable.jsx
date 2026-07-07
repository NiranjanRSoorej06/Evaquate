import { Lock } from 'lucide-react';

export default function TeachersTable({ teachers, onViewStudents, onResetPassword }) {
  if (teachers.length === 0) {
    return <p style={{ color: '#64748b', textAlign: 'center', padding: '40px', fontSize: '14px' }}>No teachers found for this school.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Teacher Name</th><th>Username</th><th>Password</th><th>Class Assigned</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map(t => (
            <tr key={t.id} className="clickable-row" onClick={() => onViewStudents(t)}>
              <td style={{ fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>{t.name}</td>
              <td style={{ fontSize: '13px' }}>{t.username}</td>
              <td>
                <code style={{ background: '#f0f9ff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#0369a1', border: '1px solid #e0f2fe', fontFamily: 'monospace' }}>{t.password}</code>
              </td>
              <td>{t.class_assigned || 'N/A'}</td>
              <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => onResetPassword('teacher', t.id)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={14} /> Reset
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
