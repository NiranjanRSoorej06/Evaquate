import { ArrowLeft } from 'lucide-react';

export default function BreadcrumbNav({ viewLevel, selectedSchool, selectedTeacher, setViewLevel }) {
  if (viewLevel === 'schools') return null;

  return (
    <div style={{ padding: '12px 24px', background: '#f0f9ff', borderBottom: '1px solid #e0f2fe', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button onClick={() => setViewLevel('schools')} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: '13px' }}>
        <ArrowLeft size={16} /> Schools
      </button>
      <span style={{ color: '#cbd5e1' }}>›</span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{selectedSchool?.name}</span>
      {viewLevel === 'students' && (
        <>
          <span style={{ color: '#cbd5e1' }}>›</span>
          <button onClick={() => setViewLevel('teachers')} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            {selectedTeacher?.name}
          </button>
        </>
      )}
    </div>
  );
}
