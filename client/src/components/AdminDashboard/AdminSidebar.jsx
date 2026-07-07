import { ShieldCheck, Sliders, UserPlus, Users } from 'lucide-react';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  setIsSidebarOpen,
  isMobile,
  isSidebarOpen,
  onLogout
}) {
  const navTo = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(1px)', zIndex: 1000 }} />
      )}
      <aside style={{
      width: '280px',
      backgroundColor: '#0284c7',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '40px',
      boxSizing: 'border-box',
      color: '#fff',
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1001,
      ...(isMobile ? {
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
      } : {})
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#ffffff', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={22} color="#0284c7" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, letterSpacing: '-0.3px' }}>Dashboard</h2>
          <span style={{ fontSize: '12px', color: '#e0f2fe', fontWeight: '500' }}>Admin Control Center</span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <button type="button" onClick={() => navTo('overview')} className={`nav-button ${activeTab === 'overview' ? 'nav-button-active' : ''}`}>
          <Sliders size={18} /> Overview Console
        </button>
        <button type="button" onClick={() => navTo('onboarding')} className={`nav-button ${activeTab === 'onboarding' ? 'nav-button-active' : ''}`}>
          <UserPlus size={18} /> Staff Profile Onboarding
        </button>
        <button type="button" onClick={() => navTo('performance')} className={`nav-button ${activeTab === 'performance' ? 'nav-button-active' : ''}`}>
          <Users size={18} /> Performance Registry
        </button>
      </nav>

      <button
        type="button"
        onClick={onLogout}
        style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
      >
        Sign Out
      </button>
    </aside>
    </>
  );
}
