export default function AlertMessages({ successMsg, errorMsg }) {
  return (
    <>
      {successMsg && (
        <div style={{ padding: '16px 20px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', color: '#166534', fontSize: '14px', fontWeight: '500', marginBottom: '24px' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '16px 20px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', fontSize: '14px', fontWeight: '500', marginBottom: '24px' }}>
          {errorMsg}
        </div>
      )}
    </>
  );
}
