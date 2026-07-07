import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function DrillGameOver({ onRestart }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <AlertTriangle size={52} color="var(--color-fire)" style={{ marginBottom: '16px' }} />
      <h3 style={{ fontSize: '26px', color: 'var(--color-fire)', marginBottom: '8px' }}>Evacuation Failed</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginBottom: '24px' }}>
        You took too much heat damage from the fires. Keep practice to learn safer routes!
      </p>
      <button onClick={onRestart} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
        <RotateCcw size={16} /> Retry Drill
      </button>
    </div>
  );
}
