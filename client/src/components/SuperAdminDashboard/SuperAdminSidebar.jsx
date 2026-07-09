import { Plus, FileText, LogOut, LayoutDashboard } from 'lucide-react';

export default function SuperAdminSidebar({
  sidebarTab, setSidebarTab, setViewLevel, isMobile, isSidebarOpen,
  setIsSidebarOpen, onLogout
}) {
  return (
    <>
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', zIndex: 990 }}
        />
      )}
      <aside style={{
        width: '280px', background: '#0284c7', padding: '32px 20px', display: 'flex',
        flexDirection: 'column', color: '#fff', boxSizing: 'border-box', zIndex: 1000,
        transition: 'transform 0.3s ease',
        ...(isMobile ? { position: 'fixed', left: 0, top: 0, bottom: 0, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' } : {})
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ background: '#fff', padding: '8px', borderRadius: '10px' }}>
            <LayoutDashboard size={24} color="#0284c7" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Super Hub</h2>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => { setSidebarTab('directory'); setViewLevel('schools'); setIsSidebarOpen(false); }} className={`sidebar-item ${sidebarTab === 'directory' ? 'sidebar-active' : ''}`}>
            <FileText size={18} /> Institution Directory
          </button>
          <button onClick={() => { setSidebarTab('register'); setIsSidebarOpen(false); }} className={`sidebar-item ${sidebarTab === 'register' ? 'sidebar-active' : ''}`}>
            <Plus size={18} /> Register Campus
          </button>
        </nav>
      </aside>
    </>
  );
}
