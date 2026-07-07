import { ShieldCheck, BarChart3, Upload, BookOpen } from 'lucide-react';

export default function TeacherSidebar({
  activeTab, setActiveTab, isMobile, isSidebarOpen, setIsSidebarOpen,
  setSelectedQuizDetail, onLogout
}) {
  const navClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'quizzes') setSelectedQuizDetail(null);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.3)', zIndex: 998 }} />
      )}
      <aside style={{
        width: '280px', backgroundColor: '#0284c7', color: '#fff', padding: '32px 20px',
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '28px',
        transition: 'transform 0.25s ease', zIndex: 1000,
        ...(isMobile ? { position: 'fixed', left: 0, top: 0, bottom: 0, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' } : {})
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="#0284c7" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Teacher Workspace</h2>
            <span style={{ fontSize: '12px', color: '#e0f2fe' }}>Class management</span>
          </div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button type="button" onClick={() => navClick('overview')} className={`nav-button ${activeTab === 'overview' ? 'nav-button-active' : ''}`}>
            <BarChart3 size={18} /> Overview Console
          </button>
          <button type="button" onClick={() => navClick('quiz')} className={`nav-button ${activeTab === 'quiz' ? 'nav-button-active' : ''}`}>
            <Upload size={18} /> Add Quiz
          </button>
          <button type="button" onClick={() => navClick('quizzes')} className={`nav-button ${activeTab === 'quizzes' ? 'nav-button-active' : ''}`}>
            <BookOpen size={18} /> My Quizzes
          </button>
        </nav>
        <button type="button" onClick={onLogout} style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
          Sign Out
        </button>
      </aside>
    </>
  );
}
