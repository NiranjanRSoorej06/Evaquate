import logoImg from '../../assets/logo_3.png';
import { Menu, X } from 'lucide-react';

export default function TeacherMobileHeader({ isSidebarOpen, setIsSidebarOpen }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0284c7', color: '#fff', padding: '0 20px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, height: '60px', boxShadow: '0 2px 8px rgba(2,132,199,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={logoImg} alt="EVAQUATE" style={{ height: '28px', width: 'auto' }} />
        <span style={{ fontWeight: '700' }}>Teacher Dashboard</span>
      </div>
      <button type="button" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}
