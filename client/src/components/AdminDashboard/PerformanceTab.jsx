import TeacherPerformanceCard from './TeacherPerformanceCard';

export default function PerformanceTab({ data, isMobile, onEditTeacher, onDeleteTeacher }) {
  if (!data?.teachers || data.teachers.length === 0) {
    return (
      <div className="panel-card" style={{ padding: isMobile ? '16px' : '28px' }}>
        <p style={{ color: '#64748b', textAlign: 'center', padding: '32px 0', fontSize: '14px', fontWeight: '500' }}>
          No profile accounts registered in current database stack.
        </p>
      </div>
    );
  }

  return (
    <div className="panel-card" style={{ padding: isMobile ? '16px' : '28px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {data.teachers.map(teacher => (
          <TeacherPerformanceCard
            key={teacher.teacher_id}
            teacher={teacher}
            isMobile={isMobile}
            onEdit={onEditTeacher}
            onDelete={onDeleteTeacher}
          />
        ))}
      </div>
    </div>
  );
}
