import { Play, Gamepad2 } from 'lucide-react';

export default function DrillGameIdle({ onStart }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <Gamepad2 size={48} style={{ color: 'var(--color-accent-primary)', marginBottom: '16px' }} />
      <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>Prepare to Evacuate Springfield Elementary</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px', maxWidth: '480px' }}>
        A simulation has been mapped out based on your school plan. Learn exit locations and safely escape obstacles.
      </p>
      <button onClick={onStart} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Play size={18} /> Launch Safety Drill
      </button>
    </div>
  );
}
