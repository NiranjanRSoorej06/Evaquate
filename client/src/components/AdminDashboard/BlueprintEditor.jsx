import { FileJson, Building2, MapPin, DoorOpen, Armchair, Flag } from 'lucide-react';

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

// Detect if blueprint is in game-format SchoolLayout (vs legacy grid format)
function isSchoolLayoutFormat(bp) {
  return bp && Array.isArray(bp.rooms) && typeof bp.schoolName === 'string' && !Array.isArray(bp.grid);
}

// Layout summary view for game-format JSON blueprints
function LayoutSummary({ blueprintJson, handleWipeBlueprint, isMobile }) {
  const { schoolName, floorsCount, rooms, assemblyArea } = blueprintJson;
  const totalDoors = rooms.reduce((acc, r) => acc + (r.doors?.length || 0), 0);
  const totalFurniture = rooms.reduce((acc, r) => acc + (r.furniture?.length || 0), 0);

  const statBox = (icon, label, value) => (
    <div style={{
      flex: '1 1 120px', minWidth: '120px', background: '#f0f9ff',
      border: '1px solid #e0f2fe', borderRadius: '10px', padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: '4px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7' }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{value}</span>
    </div>
  );

  const typeColors = {
    classroom: '#e0f2fe', laboratory: '#f0fdf4', library: '#fdf8f5', office: '#fef2f2',
    corridor: '#f1f5f9', staircase: '#fffbeb', emergency_exit: '#ecfdf5',
    assembly_area: '#f0fdf4', playground: '#f0fdf4', restroom: '#fafaf9', utility: '#f8fafc'
  };

  return (
    <div>
      {/* School name banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <FileJson size={28} color="#fff" />
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{schoolName}</div>
          <div style={{ fontSize: '12px', color: '#bae6fd', fontWeight: '500' }}>
            SchoolLayout JSON &mdash; compatible with Drill Simulator
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        {statBox(<Building2 size={14} />, 'Floors', floorsCount)}
        {statBox(<MapPin size={14} />, 'Rooms', rooms.length)}
        {statBox(<DoorOpen size={14} />, 'Doors', totalDoors)}
        {statBox(<Armchair size={14} />, 'Furniture', totalFurniture)}
      </div>

      {/* Room list */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
          Room Layout
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {rooms.map((room, i) => (
            <div key={room.id || i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '8px', padding: '8px 12px'
            }}>
              <span style={{
                width: '12px', height: '12px', borderRadius: '3px', flexShrink: 0,
                background: room.color || typeColors[room.type] || '#f1f5f9',
                border: '1px solid #cbd5e1'
              }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', flex: 1 }}>
                {room.name}
              </span>
              <span style={{
                fontSize: '11px', fontWeight: '600', color: '#64748b',
                background: '#e0f2fe', borderRadius: '20px', padding: '2px 8px'
              }}>
                F{room.floor || 1} &middot; {room.type}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {room.doors?.length || 0} door{(room.doors?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Assembly area */}
      {assemblyArea && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <Flag size={16} color="#16a34a" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#166534' }}>
              Assembly: {assemblyArea.name || 'Safe Assembly Zone'}
            </div>
            <div style={{ fontSize: '11px', color: '#4ade80' }}>
              Position: ({assemblyArea.x}, {assemblyArea.y}) &middot; Radius: {assemblyArea.radius}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <button type="button" onClick={handleWipeBlueprint} className="btn-danger-outline" style={{ width: isMobile ? '100%' : 'auto' }}>
          Wipe Configuration Layout
        </button>
      </div>
    </div>
  );
}

export default function BlueprintEditor({
  blueprintJson, selectedCellType, setSelectedCellType, handleCellClick,
  handleWipeBlueprint, isMobile
}) {
  // If blueprint is in game-format SchoolLayout, show the layout summary
  if (isSchoolLayoutFormat(blueprintJson)) {
    return (
      <LayoutSummary
        blueprintJson={blueprintJson}
        handleWipeBlueprint={handleWipeBlueprint}
        isMobile={isMobile}
      />
    );
  }

  // Legacy grid format editor
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
