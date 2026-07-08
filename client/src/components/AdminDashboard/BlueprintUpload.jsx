import { Upload, FileJson } from 'lucide-react';

export default function BlueprintUpload({ file, handleFileUpload, startAIScan, isProcessing, processError }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 20px', border: '2px dashed #bae6fd', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
      <FileJson size={36} style={{ color: '#38bdf8', marginBottom: '16px' }} />
      <p style={{ fontSize: '14px', marginBottom: '8px', color: '#475569', fontWeight: '500' }}>
        Provide school blueprint JSON file to deploy layout workspace.
      </p>
      <p style={{ fontSize: '12px', marginBottom: '20px', color: '#94a3b8', fontWeight: '400' }}>
        Upload a SchoolLayout JSON (same format as the Drill Simulator).
      </p>
      <input type="file" accept="application/json,.json" onChange={handleFileUpload} id="blueprint-file" style={{ display: 'none' }} />
      <label htmlFor="blueprint-file" className="btn-secondary-link" style={{ cursor: 'pointer', padding: '12px 24px' }}>
        Locate JSON Source File
      </label>
      {file && (
        <div style={{ marginTop: '16px', width: '100%' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
            Selected: {file.name}
          </p>
          <button type="button" onClick={startAIScan} className="btn-action" style={{ width: '100%' }} disabled={isProcessing}>
            {isProcessing ? 'Processing JSON...' : 'Initialize Layout Parser'}
          </button>
        </div>
      )}
      {processError && (
        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '12px', width: '100%', textAlign: 'left' }}>
          {processError}
        </div>
      )}
    </div>
  );
}
