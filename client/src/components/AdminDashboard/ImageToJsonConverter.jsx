import { useState, useRef } from 'react';
import { ImageIcon, Download, Loader2, AlertCircle, CheckCircle2, Sparkles, UploadCloud } from 'lucide-react';

export default function ImageToJsonConverter({ user }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState('');
  const [convertSuccess, setConvertSuccess] = useState(false);
  const [resultJson, setResultJson] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setConvertError('');
    setConvertSuccess(false);
    setResultJson(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    setConvertError('');
    setConvertSuccess(false);
    setResultJson(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result);
    reader.readAsDataURL(file);
  };

  const handleConvert = async () => {
    if (!imageFile) return;
    setIsConverting(true);
    setConvertError('');
    setConvertSuccess(false);
    setResultJson(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(
        `http://localhost:3001/api/admin/${user?.id}/image-to-json`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setConvertError(data.message || 'Conversion failed. Please try again.');
        return;
      }

      setResultJson(data.layout);
      setConvertSuccess(true);
    } catch (err) {
      setConvertError('Network error. Make sure the server is running.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!resultJson) return;
    const blob = new Blob([JSON.stringify(resultJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const schoolName = (resultJson.schoolName || 'school_layout')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');
    a.download = `${schoolName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setConvertError('');
    setConvertSuccess(false);
    setResultJson(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="panel-card" style={{ marginBottom: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Sparkles size={20} color="#0284c7" />
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          AI Blueprint Converter
        </h3>
        <span style={{
          fontSize: '11px', fontWeight: '700', padding: '2px 10px',
          borderRadius: '20px', background: '#e0f2fe', color: '#0284c7',
          letterSpacing: '0.05em', textTransform: 'uppercase'
        }}>
          Gemini AI
        </span>
      </div>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0', fontWeight: '500' }}>
        Upload a school blueprint image (PNG/JPG) to automatically generate a game-ready JSON layout file.
        Download the JSON and use it in the Blueprint Layout Engine below.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: imagePreview ? '1fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
        {/* Drop zone */}
        <div>
          <div
            id="image-converter-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', textAlign: 'center',
              padding: '36px 20px',
              border: imageFile ? '2px solid #0284c7' : '2px dashed #bae6fd',
              borderRadius: '12px',
              backgroundColor: imageFile ? '#f0f9ff' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '160px',
            }}
          >
            <input
              ref={fileInputRef}
              id="image-converter-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            {imageFile ? (
              <>
                <ImageIcon size={32} color="#0284c7" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0' }}>
                  {imageFile.name}
                </p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                  {(imageFile.size / 1024).toFixed(1)} KB · Click to change
                </p>
              </>
            ) : (
              <>
                <UploadCloud size={36} color="#38bdf8" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#475569', margin: '0 0 4px 0' }}>
                  Drop blueprint image here
                </p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                  or click to browse — PNG, JPG, WEBP
                </p>
              </>
            )}
            <label
              htmlFor="image-converter-input"
              className="btn-secondary-link"
              style={{ cursor: 'pointer', padding: '8px 18px', fontSize: '13px', pointerEvents: 'none' }}
            >
              {imageFile ? 'Change Image' : 'Select Image File'}
            </label>
          </div>
        </div>

        {/* Preview panel */}
        {imagePreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              borderRadius: '10px', overflow: 'hidden',
              border: '1px solid #e0f2fe', background: '#f0f9ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: '160px', maxHeight: '220px'
            }}>
              <img
                src={imagePreview}
                alt="Blueprint preview"
                style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {imageFile && !convertSuccess && (
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            id="image-converter-convert-btn"
            type="button"
            onClick={handleConvert}
            className="btn-action"
            disabled={isConverting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px', justifyContent: 'center' }}
          >
            {isConverting ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Analysing Blueprint...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Convert to JSON
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary-link"
            disabled={isConverting}
            style={{ padding: '12px 20px', fontSize: '14px' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Error */}
      {convertError && (
        <div style={{
          marginTop: '16px', padding: '12px 16px',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '10px', color: '#b91c1c', fontSize: '13px',
          display: 'flex', alignItems: 'flex-start', gap: '10px'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{convertError}</span>
        </div>
      )}

      {/* Success + Download */}
      {convertSuccess && resultJson && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            padding: '14px 18px',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: '10px', color: '#15803d', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '14px'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: '600' }}>Conversion successful!</span>
              {resultJson.schoolName && (
                <span style={{ fontWeight: '400' }}>
                  {' '}· <strong>{resultJson.schoolName}</strong> · {resultJson.rooms?.length || 0} rooms · {resultJson.floorsCount || 1} floor(s)
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              id="image-converter-download-btn"
              type="button"
              onClick={handleDownload}
              className="btn-action"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Download size={16} />
              Download JSON File
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary-link"
              style={{ padding: '12px 20px', fontSize: '14px' }}
            >
              Convert Another Image
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '12px 0 0 0' }}>
            ↓ After downloading, upload the JSON file in the <strong>Blueprint Layout Engine</strong> section below.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
