export default function DrillGamePlaying({ canvasRef, widthRef, heightRef, cellSize, health, extinguishers, timeTaken }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', gap: '30px', background: 'rgba(0,0,0,0.2)', padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--glass-border)', width: '100%', maxWidth: '600px', justifyContent: 'space-between', fontSize: '14px' }}>
        <div><span>Safety Health: </span><strong style={{ color: health > 50 ? 'var(--color-safe)' : 'var(--color-fire)' }}>{health}%</strong></div>
        <div><span>Extinguishers (SPACE): </span><strong style={{ color: extinguishers > 0 ? 'var(--color-safe)' : 'var(--color-text-muted)' }}>{extinguishers}</strong></div>
        <div><span>Time Elapsed: </span><strong>{timeTaken} seconds</strong></div>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '6px 12px', borderRadius: '4px' }}>
        Use <strong>WASD / Arrow Keys</strong> to move. Press <strong>Spacebar</strong> to use fire extinguisher when standing next to a fire. Reach the Green Flag safe assembly area.
      </div>
      <canvas
        ref={canvasRef}
        width={widthRef.current * cellSize}
        height={heightRef.current * cellSize}
        style={{ background: '#090d16', borderRadius: '8px', border: '2px solid var(--glass-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.7)' }}
      />
    </div>
  );
}
