import { GraduationCap, Sliders, Award, LogOut } from 'lucide-react';

export default function StudentSidebar({
  sidebarTab, isMobile, isSidebarOpen, setIsSidebarOpen,
  goToOverview, goToPerformance, onLogout
}) {
  return (
    <>
      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', zIndex: 990 }} />
      )}
      <aside style={{
        width: '280px', background: '#0284c7', padding: '32px 20px', display: 'flex',
        flexDirection: 'column', color: '#fff', zIndex: 1000, boxSizing: 'border-box',
        transition: 'transform 0.3s ease',
        ...(isMobile ? { position: 'fixed', left: 0, top: 0, bottom: 0, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' } : {})
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#fff', padding: '8px', borderRadius: '10px' }}>
              <GraduationCap size={24} color="#0284c7" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Drill Matrix</h2>
          </div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={goToOverview} className={`sidebar-item ${sidebarTab === 'overview' ? 'sidebar-active' : ''}`}>
            <Sliders size={18} /> Training Console
          </button>
          <button onClick={goToPerformance} className={`sidebar-item ${sidebarTab === 'performance' ? 'sidebar-active' : ''}`}>
            <Award size={18} /> Performance Logs
          </button>
        </nav>
        <button onClick={onLogout} className="sidebar-item" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.1)' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>
    </>
  );
}
