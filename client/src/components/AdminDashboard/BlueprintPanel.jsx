import { Compass } from 'lucide-react';
import BlueprintUpload from './BlueprintUpload';
import BlueprintEditor from './BlueprintEditor';

export default function BlueprintPanel({
  data, file, handleFileUpload, startAIScan, selectedCellType, setSelectedCellType,
  handleCellClick, handleWipeBlueprint, isMobile
}) {
  return (
    <div className="panel-card" style={{ overflow: 'hidden' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Compass size={20} color="#0284c7" /> Blueprint Layout Engine
      </h3>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0', fontWeight: '500' }}>
        Select a design asset to overlay positioning nodes onto your mapped matrix.
      </p>
      {!data?.blueprint_json ? (
        <BlueprintUpload file={file} handleFileUpload={handleFileUpload} startAIScan={startAIScan} />
      ) : (
        <BlueprintEditor
          blueprintJson={data.blueprint_json}
          selectedCellType={selectedCellType}
          setSelectedCellType={setSelectedCellType}
          handleCellClick={handleCellClick}
          handleWipeBlueprint={handleWipeBlueprint}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
