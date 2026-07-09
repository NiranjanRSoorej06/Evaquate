import { GraduationCap, Menu, X } from 'lucide-react';

export default function StudentMobileHeader({ isSidebarOpen, setIsSidebarOpen }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0284c7', color: '#ffffff', padding: '16px 24px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 950, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)', height: '60px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <GraduationCap size={22} color="#ffffff" />
        <span style={{ fontWeight: '700', fontSize: '16px' }}>Drill Matrix</span>
      </div>
      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
        {isSidebarOpen ? <X size={26} /> : <Menu size={26} />}
      </button>
    </div>
  );
}
