import { ShieldCheck, Menu, X } from 'lucide-react';

export default function AdminMobileHeader({ isSidebarOpen, onToggleSidebar }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#0284c7',
      color: '#ffffff',
      padding: '0 20px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      height: '60px',
      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShieldCheck size={22} color="#ffffff" />
        <span style={{ fontWeight: '700', fontSize: '15px', letterSpacing: '-0.2px' }}>Admin Workspace</span>
      </div>
      <button
        type="button"
        onClick={onToggleSidebar}
        style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}
