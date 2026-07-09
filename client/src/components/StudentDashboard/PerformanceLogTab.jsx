export default function PerformanceLogTab({ scoreHistory }) {
  return (
    <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e0f2fe', overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Modality</th>
            <th>Module</th>
            <th>Success Rate</th>
            <th>Duration</th>
            <th>Logged On</th>
          </tr>
        </thead>
        <tbody>
          {scoreHistory.length > 0 ? scoreHistory.map(sc => (
            <tr key={sc.id}>
              <td style={{ fontWeight: '700' }}>{sc.activity_type?.toUpperCase()}</td>
              <td style={{ textTransform: 'capitalize' }}>{sc.disaster_type}</td>
              <td style={{ fontWeight: '700', color: sc.score >= 80 ? '#10b981' : '#f59e0b' }}>
                {sc.score}{sc.activity_type === 'quiz' ? '%' : ' pts'}
              </td>
              <td>{sc.duration_seconds}s</td>
              <td style={{ color: '#64748b' }}>{new Date(sc.timestamp).toLocaleDateString()}</td>
            </tr>
          )) : (
            <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No session logs found yet. Start training to collect trophies!</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
