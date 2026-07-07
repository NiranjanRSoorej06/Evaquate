import { BarChart3 } from 'lucide-react';

export default function StudentStatisticsTable({ students, getLatestScore, onDeleteStudent }) {
  return (
    <div className="panel-card">
      <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BarChart3 size={20} color="#0284c7" /> Student Statistics
      </h3>
      <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '14px' }}>Review performance for each student in your class.</p>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Student ID</th><th>Roll</th><th>Name</th><th>Fire Drill</th><th>Quiz</th><th></th></tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>No students yet.</td></tr>
            ) : students.map(student => (
              <tr key={student.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{student.id}</td>
                <td>{student.roll_no}</td>
                <td>{student.name}</td>
                <td>{getLatestScore(student, 'fire', 'drill') != null ? `${getLatestScore(student, 'fire', 'drill')} pts` : '?'}</td>
                <td>{getLatestScore(student, 'earthquake', 'quiz') != null ? `${getLatestScore(student, 'earthquake', 'quiz')}%` : '?'}</td>
                <td><button type="button" onClick={() => onDeleteStudent(student.id)} className="btn-danger-outline">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
