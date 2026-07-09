import { Gamepad2, Video, CheckSquare } from 'lucide-react';

const ACTIVITIES = [
  { id: 'drill', label: 'Evacuation Drill', icon: Gamepad2, note: 'Practice live escape paths.' },
  { id: 'video', label: 'Awareness Class', icon: Video, note: 'Watch safety guidelines.' },
  { id: 'quiz', label: 'Knowledge Quiz', icon: CheckSquare, note: 'Test your survival skills.' }
];

export default function ActivitySelector({ isMobile, activeTab, setActiveTab }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
      {ACTIVITIES.map(t => {
        const Icon = t.icon;
        return (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`activity-tab ${activeTab === t.id ? 'activity-tab-active' : ''}`}>
            <Icon size={22} color={activeTab === t.id ? '#0284c7' : '#94a3b8'} />
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: activeTab === t.id ? '#0284c7' : '#1e293b' }}>{t.label}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{t.note}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
