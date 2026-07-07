export default function AlertMessages({ successMsg, errorMsg }) {
  return (
    <>
      {successMsg && (
        <div style={{ padding: '14px 16px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', color: '#166534', marginBottom: '20px' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '14px 16px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}
    </>
  );
}
