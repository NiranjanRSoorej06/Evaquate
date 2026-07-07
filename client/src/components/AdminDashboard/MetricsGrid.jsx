export default function MetricsGrid({ data }) {
  const enrolledStudents = data?.teachers
    ? data.teachers.reduce((acc, t) => acc + (t.students?.length || 0), 0)
    : 3;

  return (
    <div className="metrics-grid">
      <div className="panel-card metric-block">
        <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Total Rooms</span>
        <span className="metric-num">{data?.blueprint_json?.rooms?.length || 4}</span>
        <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>Active profiles</span>
      </div>
      <div className="panel-card metric-block">
        <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Configured Staff</span>
        <span className="metric-num">{data?.teachers?.length || 2}</span>
        <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>Active leaders</span>
      </div>
      <div className="panel-card metric-block">
        <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Enrolled Students</span>
        <span className="metric-num">{enrolledStudents}</span>
        <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>Sync status green</span>
      </div>
      <div className="panel-card metric-block">
        <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Blueprint Node</span>
        <span className="metric-num" style={{ color: '#0284c7' }}>Active</span>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Floorplan matrix live</span>
      </div>
    </div>
  );
}
