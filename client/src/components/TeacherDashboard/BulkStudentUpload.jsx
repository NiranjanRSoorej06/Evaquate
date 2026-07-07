import { Upload } from 'lucide-react';

export default function BulkStudentUpload({
  onDownloadTemplate, onFileChange, onSubmit, uploadingStudents
}) {
  return (
    <div style={{ marginTop: '28px' }}>
      <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Upload size={20} color="#0284c7" /> Bulk Student Upload
      </h3>
      <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '14px' }}>
        Download a sample CSV, fill in rows, and upload it as CSV, XLS, or XLSX.
      </p>
      <button type="button" onClick={onDownloadTemplate} className="btn-action" style={{ width: '100%', marginBottom: '16px' }}>
        Download student template
      </button>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label className="label-text">Upload student file</label>
          <input type="file" accept=".csv,.xls,.xlsx" onChange={onFileChange} className="form-control" style={{ padding: '10px 12px' }} required />
        </div>
        <div style={{ background: '#f8fafc', border: '1px dashed #bae6fd', borderRadius: '12px', padding: '14px 16px', color: '#0369a1', fontSize: '13px', marginBottom: '18px' }}>
          <strong>Required columns:</strong> STUDENT NAME, ROLL NUMBER
        </div>
        <button type="submit" className="btn-action" disabled={uploadingStudents} style={{ width: '100%' }}>
          {uploadingStudents ? 'Importing students...' : 'Upload student list'}
        </button>
      </form>
    </div>
  );
}
