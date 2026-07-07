const CELL_TYPES = [
  { id: 'wall', label: 'Wall Asset', color: '#334155' },
  { id: 'empty', label: 'Walkway Unit', color: '#ffffff' },
  { id: 'door', label: 'Access Point', color: '#fef9c3' },
  { id: 'extinguisher', label: 'Extinguisher', color: '#ffe4e6' },
  { id: 'assembly', label: 'Assembly Zone', color: '#dcfce7' }
];

function getCellClass(cell) {
  if (cell === 1) return 'map-cell-wall';
  if (cell === 2) return 'map-cell-extinguisher';
  if (cell === 3) return 'map-cell-door';
  if (cell === 5) return 'map-cell-assembly';
  return 'map-cell-empty';
}

function getCellChar(cell) {
  if (cell === 2) return '🧯';
  if (cell === 3) return '🚪';
  if (cell === 5) return '🚩';
  return '';
}

export default function BlueprintEditor({
  blueprintJson, selectedCellType, setSelectedCellType, handleCellClick,
  handleWipeBlueprint, isMobile
}) {
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
        {CELL_TYPES.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedCellType(item.id)}
            style={{
              background: selectedCellType === item.id ? '#0284c7' : '#ffffff',
              border: `1px solid ${selectedCellType === item.id ? '#0284c7' : '#cbd5e1'}`,
              padding: '8px 14px', borderRadius: '8px',
              color: selectedCellType === item.id ? '#ffffff' : '#334155',
              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600'
            }}
          >
            <span style={{ width: '12px', height: '12px', background: item.color, borderRadius: '3px', border: '1px solid #cbd5e1' }} />
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', marginBottom: '16px' }}>
        <div className="map-grid-preview" style={{ gridTemplateColumns: `repeat(${blueprintJson.width || 1}, minmax(40px, 1fr))`, minWidth: '460px' }}>
          {blueprintJson.grid?.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <div key={`${rIdx}-${cIdx}`} onClick={() => handleCellClick(rIdx, cIdx)} className={`map-cell ${getCellClass(cell)}`}>
                {getCellChar(cell)}
              </div>
            ))
          )}
        </div>
      </div>
      <div style={{ marginTop: '24px' }}>
        <button type="button" onClick={handleWipeBlueprint} className="btn-danger-outline" style={{ width: isMobile ? '100%' : 'auto' }}>
          Wipe Configuration Layout
        </button>
      </div>
    </div>
  );
}
