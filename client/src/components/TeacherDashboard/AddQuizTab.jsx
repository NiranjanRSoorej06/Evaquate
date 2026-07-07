import { Upload } from 'lucide-react';
import { disasterOptions } from './constants';

export default function AddQuizTab({
  isMobile, selectedDisaster, setSelectedDisaster, setQuizFile,
  uploadingQuiz, handleQuizUpload
}) {
  return (
    <div className="panel-card" style={{ maxWidth: '900px' }}>
      <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Upload size={20} color="#0284c7" /> Add Quiz
      </h3>
      <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '14px' }}>
        Choose a disaster module and upload a CSV file. You can upload multiple quizzes (Quiz 1, Quiz 2, …) for the same disaster.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px', marginBottom: '22px' }}>
        {disasterOptions.map(option => (
          <button key={option.id} type="button" onClick={() => setSelectedDisaster(option.id)} style={{ textAlign: 'left', borderRadius: '14px', border: selectedDisaster === option.id ? '2px solid #0284c7' : '1px solid #e2e8f0', background: selectedDisaster === option.id ? '#f0f9ff' : '#fff', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${option.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <option.icon size={20} color={option.color} />
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#0f172a' }}>{option.label}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{option.description}</div>
            </div>
          </button>
        ))}
      </div>
      <form onSubmit={handleQuizUpload}>
        <div style={{ marginBottom: '16px' }}>
          <label className="label-text">Upload CSV File</label>
          <input type="file" accept=".csv" onChange={e => setQuizFile(e.target.files?.[0] || null)} className="form-control" style={{ padding: '10px 12px' }} required />
        </div>
        <div style={{ background: '#f8fafc', border: '1px dashed #bae6fd', borderRadius: '12px', padding: '14px 16px', color: '#0369a1', fontSize: '13px', marginBottom: '18px' }}>
          <strong>CSV format:</strong> question, option1, option2, option3, option4, answer
        </div>
        <button type="submit" className="btn-action" disabled={uploadingQuiz} style={{ width: '100%' }}>
          {uploadingQuiz ? 'Uploading quiz...' : 'Upload Quiz'}
        </button>
      </form>
    </div>
  );
}
