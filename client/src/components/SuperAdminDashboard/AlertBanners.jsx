export default function AlertBanners({ message, error }) {
  return (
    <>
      {message && (
        <div style={{ padding: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', color: '#065f46', fontSize: '14px', fontWeight: '500', marginBottom: '24px' }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '16px', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '12px', color: '#991b1b', fontSize: '14px', fontWeight: '500', marginBottom: '24px' }}>
          {error}
        </div>
      )}
    </>
  );
}
