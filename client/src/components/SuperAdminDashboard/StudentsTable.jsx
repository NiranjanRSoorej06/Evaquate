import { Lock } from 'lucide-react';

export default function StudentsTable({ students, onResetPassword }) {
  if (students.length === 0) {
    return <p style={{ color: '#64748b', textAlign: 'center', padding: '40px', fontSize: '14px' }}>No students found for this teacher.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Student Name</th><th>Roll No</th><th>Password</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(st => (
            <tr key={st.id}>
              <td style={{ fontWeight: '600', color: '#0f172a' }}>{st.name}</td>
              <td style={{ fontSize: '13px' }}>{st.roll_no}</td>
              <td>
                <code style={{ background: '#f0f9ff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#0369a1', border: '1px solid #e0f2fe', fontFamily: 'monospace' }}>{st.password}</code>
              </td>
              <td style={{ textAlign: 'center' }}>
                <button onClick={() => onResetPassword('student', st.id)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
