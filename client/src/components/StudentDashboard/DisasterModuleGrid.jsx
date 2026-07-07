import { ChevronRight } from 'lucide-react';
import { DISASTERS } from './constants';

export default function DisasterModuleGrid({ onSelectDisaster }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
      {DISASTERS.map(d => {
        const Icon = d.icon;
        return (
          <div key={d.id} className="module-card" onClick={() => onSelectDisaster(d.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ background: `${d.color}10`, width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Icon size={24} color={d.color} />
              </div>
              <span style={{ fontSize: '24px' }}>{d.emoji}</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', margin: 0 }}>{d.label}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px', marginTop: '8px' }}>{d.desc}</p>
            <div style={{ display: 'flex', alignItems: 'center', color: '#0284c7', fontSize: '13px', fontWeight: '600' }}>
              Let's Go! <ChevronRight size={16} style={{ marginLeft: '4px' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
