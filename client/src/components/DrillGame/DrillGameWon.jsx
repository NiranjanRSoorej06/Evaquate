import { ShieldCheck, RotateCcw } from 'lucide-react';

export default function DrillGameWon({ timeTaken, score, onRestart }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <ShieldCheck size={52} color="var(--color-safe)" style={{ marginBottom: '16px' }} />
      <h3 style={{ fontSize: '26px', color: 'var(--color-safe)', marginBottom: '8px' }}>Safe Evacuation!</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
        You successfully navigated coordinates and reached the safe assembly point!
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '300px', margin: '0 auto 30px auto', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
        <div><span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Time Taken</span><span style={{ fontSize: '20px', fontWeight: 'bold' }}>{timeTaken}s</span></div>
        <div><span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Safety Score</span><span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-safe)' }}>{score} pts</span></div>
      </div>
      <button onClick={onRestart} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
        <RotateCcw size={16} /> Run Drill Again
      </button>
    </div>
  );
}
