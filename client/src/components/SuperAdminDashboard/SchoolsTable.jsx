import { CheckCircle, ShieldAlert } from 'lucide-react';

export default function SchoolsTable({ schools, onViewTeachers, onDisableSchool }) {
  if (schools.length === 0) {
    return (
      <p style={{ color: '#64748b', textAlign: 'center', padding: '40px', fontSize: '14px' }}>
        No schools found within the central system repository registry.
      </p>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>School Name</th>
            <th style={{ textAlign: 'left' }}>Unique Code</th>
            <th style={{ textAlign: 'left' }}>Blueprint State</th>
            <th style={{ textAlign: 'center' }}>Teachers</th>
            <th style={{ textAlign: 'center' }}>Students</th>
            <th style={{ textAlign: 'center' }}>Status</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {schools.map(s => (
            <tr key={s.id} className="clickable-row" onClick={() => onViewTeachers(s)}>
              <td style={{ fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>{s.name}</td>
              <td>
                <code style={{ background: '#f0f9ff', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: '#0369a1', border: '1px solid #e0f2fe' }}>{s.unique_code}</code>
              </td>
              <td>
                {s.blueprint_json ? (
                  <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                    <CheckCircle size={14} /> Ready
                  </span>
                ) : (
                  <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                    <ShieldAlert size={14} /> Pending
                  </span>
                )}
              </td>
              <td style={{ textAlign: 'center', fontWeight: '500' }}>{s.teacher_count || 0}</td>
              <td style={{ textAlign: 'center', fontWeight: '500' }}>{s.student_count || 0}</td>
              <td style={{ textAlign: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: s.disabled ? '#ef4444' : '#10b981' }}>
                  {s.disabled ? 'Disabled' : 'Active'}
                </span>
              </td>
              <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => onDisableSchool(s.id, s.disabled)} className="btn-danger">
                  {s.disabled ? 'Enable' : 'Disable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
