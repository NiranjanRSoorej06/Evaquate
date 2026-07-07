import { Edit2, Trash2 } from 'lucide-react';

export default function TeacherPerformanceCard({ teacher, isMobile, onEdit, onDelete }) {
  const drillScores = teacher.students
    ? teacher.students.flatMap(s => (s.scores || []).filter(sc => sc.activity_type === 'drill'))
    : [];
  const avgEvacTime = drillScores.length > 0
    ? Math.round(drillScores.reduce((acc, s) => acc + s.duration_seconds, 0) / drillScores.length)
    : null;

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#ffffff' }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{teacher.teacher_name}</h4>
          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'inline-block', fontWeight: '500' }}>
            Tag: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>{teacher.teacher_id}</strong> &bull; Zone Target: <strong style={{ color: '#334155' }}>{teacher.class_assigned || 'Unassigned'}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
          {avgEvacTime !== null && (
            <div style={{ background: '#f0f9ff', padding: '6px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1' }}>{avgEvacTime}s Average Velocity</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button type="button" onClick={() => onEdit(teacher)} className="icon-btn" aria-label="Modify profile"><Edit2 size={14} /></button>
            <button type="button" onClick={() => onDelete(teacher.teacher_id)} className="icon-btn icon-btn-del" aria-label="Drop account"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
      {teacher.students && teacher.students.length > 0 ? (
        <div className="table-responsive-scroll">
          <table>
            <thead>
              <tr>
                <th>Student ID</th><th>Roll Number</th><th>Student Identity</th>
                <th>Drill Response</th><th>Seismic Evaluation</th><th>Hydrological Quiz</th><th>Erosion Assessment</th>
              </tr>
            </thead>
            <tbody>
              {teacher.students.map(student => {
                const scores = student.scores || [];
                const fireDrill = scores.find(sc => sc.disaster_type === 'fire' && sc.activity_type === 'drill');
                const eqQuiz = scores.find(sc => sc.disaster_type === 'earthquake' && sc.activity_type === 'quiz');
                const floodQuiz = scores.find(sc => sc.disaster_type === 'flood' && sc.activity_type === 'quiz');
                const lsQuiz = scores.find(sc => sc.disaster_type === 'landslide' && sc.activity_type === 'quiz');
                return (
                  <tr key={student.id || student.roll_no}>
                    <td style={{ color: '#64748b', fontWeight: '600', fontFamily: 'monospace' }}>{student.id}</td>
                    <td style={{ color: '#64748b', fontWeight: '600', fontFamily: 'monospace' }}>{student.roll_no}</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{student.name}</td>
                    <td style={{ color: '#0284c7', fontWeight: '700' }}>{fireDrill ? `${fireDrill.score} pts` : '—'}</td>
                    <td style={{ fontWeight: '500' }}>{eqQuiz ? `${eqQuiz.score}%` : '—'}</td>
                    <td style={{ fontWeight: '500' }}>{floodQuiz ? `${floodQuiz.score}%` : '—'}</td>
                    <td style={{ fontWeight: '500' }}>{lsQuiz ? `${lsQuiz.score}%` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ color: '#64748b', fontSize: '13px', padding: '20px 24px', fontWeight: '500', background: '#ffffff', fontStyle: 'italic' }}>
          No records linked to this command profile node.
        </div>
      )}
    </div>
  );
}
