import './AdminDashboard.css';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import AdminMobileHeader from './AdminMobileHeader';
import AdminSidebar from './AdminSidebar';
import AlertMessages from './AlertMessages';
import OverviewTab from './OverviewTab';
import StaffOnboardingPanel from './StaffOnboardingPanel';
import PerformanceTab from './PerformanceTab';

const TAB_TITLES = {
  overview: 'System Infrastructure Overview',
  onboarding: 'Staff Profile Onboarding',
  performance: 'Institutional Performance Registers'
};

export default function AdminDashboard({ user, onLogout }) {
  const d = useAdminDashboard(user);

  if (d.loading || !d.data) {
    return <div className="loading-state">Preparing dashboard workspace...</div>;
  }

  const handleEditTeacher = (teacher) => {
    d.handleEditTeacherClick(teacher);
    d.setActiveTab('onboarding');
  };

  return (
    <div className="admin-dashboard">
      {d.isMobile && <AdminMobileHeader isSidebarOpen={d.isSidebarOpen} setIsSidebarOpen={d.setIsSidebarOpen} />}
      <AdminSidebar
        activeTab={d.activeTab} setActiveTab={d.setActiveTab}
        isMobile={d.isMobile} isSidebarOpen={d.isSidebarOpen}
        setIsSidebarOpen={d.setIsSidebarOpen} onLogout={onLogout}
      />
      <main style={{ flex: 1, padding: d.isMobile ? '20px' : '40px', paddingTop: d.isMobile ? '84px' : '40px', boxSizing: 'border-box', overflowY: 'auto', width: '100%' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: d.isMobile ? '22px' : '28px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              {TAB_TITLES[d.activeTab]}
            </h1>
            <p style={{ color: '#64748b', margin: '6px 0 0 0', fontSize: '15px', fontWeight: '500' }}>Welcome back, Workspace Coordinator</p>
          </div>
        </header>
        <AlertMessages successMsg={d.successMsg} errorMsg={d.errorMsg} />
        {d.activeTab === 'overview' && (
          <OverviewTab data={d.data} file={d.file} handleFileUpload={d.handleFileUpload} startAIScan={d.startAIScan} selectedCellType={d.selectedCellType} setSelectedCellType={d.setSelectedCellType} handleCellClick={d.handleCellClick} handleWipeBlueprint={d.handleWipeBlueprint} isMobile={d.isMobile} />
        )}
        {d.activeTab === 'onboarding' && (
          <StaffOnboardingPanel isMobile={d.isMobile} isEditingTeacher={d.isEditingTeacher} user={d.user} tName={d.tName} setTName={d.setTName} tClass={d.tClass} setTClass={d.setTClass} tPassword={d.tPassword} setTPassword={d.setTPassword} showPassword={d.showPassword} setShowPassword={d.setShowPassword} handleCreateTeacher={d.handleCreateTeacher} cancelEditTeacher={d.cancelEditTeacher} />
        )}
        {d.activeTab === 'performance' && (
          <PerformanceTab data={d.data} isMobile={d.isMobile} onEditTeacher={handleEditTeacher} onDeleteTeacher={d.handleDeleteTeacher} />
        )}
      </main>
    </div>
  );
}
