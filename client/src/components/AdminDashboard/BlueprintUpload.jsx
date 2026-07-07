import { Upload } from 'lucide-react';

export default function BlueprintUpload({ file, handleFileUpload, startAIScan }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 20px', border: '2px dashed #bae6fd', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
      <Upload size={36} style={{ color: '#38bdf8', marginBottom: '16px' }} />
      <p style={{ fontSize: '14px', marginBottom: '20px', color: '#475569', fontWeight: '500' }}>
        Provide blueprint grid asset to deploy layout workspace.
      </p>
      <input type="file" accept="image/*" onChange={handleFileUpload} id="blueprint-file" style={{ display: 'none' }} />
      <label htmlFor="blueprint-file" className="btn-secondary-link" style={{ cursor: 'pointer', padding: '12px 24px' }}>
        Locate Source File
      </label>
      {file && (
        <button type="button" onClick={startAIScan} className="btn-action" style={{ marginTop: '16px', width: '100%' }}>
          Initialize Grid Parser
        </button>
      )}
    </div>
  );
}
