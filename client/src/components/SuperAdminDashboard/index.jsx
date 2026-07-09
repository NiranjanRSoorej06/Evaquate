import './SuperAdminDashboard.css';
import { useSuperAdminDashboard } from './hooks/useSuperAdminDashboard';
import SuperAdminMobileHeader from './SuperAdminMobileHeader';
import SuperAdminSidebar from './SuperAdminSidebar';
import AlertBanners from './AlertBanners';
import DirectoryTab from './DirectoryTab';
import RegisterSchoolForm from './RegisterSchoolForm';
import PasswordResetModal from './PasswordResetModal';
import { LogOut } from 'lucide-react';

export default function SuperAdminDashboard({ user, onLogout }) {
  const d = useSuperAdminDashboard();

  return (
    <div className="super-admin-dashboard">
      {d.isMobile && <SuperAdminMobileHeader isSidebarOpen={d.isSidebarOpen} setIsSidebarOpen={d.setIsSidebarOpen} />}
      <SuperAdminSidebar sidebarTab={d.sidebarTab} setSidebarTab={d.setSidebarTab} setViewLevel={d.setViewLevel} isMobile={d.isMobile} isSidebarOpen={d.isSidebarOpen} setIsSidebarOpen={d.setIsSidebarOpen} onLogout={onLogout} />
      <main style={{ flex: 1, padding: d.isMobile ? '20px' : '40px', paddingTop: d.isMobile ? '84px' : '40px', overflowY: 'auto', boxSizing: 'border-box', width: '100%' }}>
        <header style={{ display: 'flex', flexDirection: d.isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: d.isMobile ? 'flex-start' : 'center', gap: '12px', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: d.isMobile ? '22px' : '28px', fontWeight: '700', color: '#0f172a', marginBottom: '6px', margin: 0 }}>
              {d.sidebarTab === 'directory' ? 'Global Network Directory' : 'System Provisioning Engine'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Root Operator: <span style={{ color: '#0284c7', fontWeight: '600' }}>{user?.username || 'Admin'}</span> | Domain Status: <span style={{ fontWeight: '600', color: '#10b981' }}>Active</span>
            </p>
          </div>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </header>
        <AlertBanners message={d.message} error={d.error} />
        {d.sidebarTab === 'directory' && (
          <DirectoryTab viewLevel={d.viewLevel} setViewLevel={d.setViewLevel} selectedSchool={d.selectedSchool} selectedTeacher={d.selectedTeacher} schools={d.schools} teachers={d.teachers} students={d.students} onViewTeachers={d.handleViewTeachers} onViewStudents={d.handleViewStudents} onDisableSchool={d.handleDisableSchool} onResetPassword={d.openResetModal} />
        )}
        {d.sidebarTab === 'register' && (
          <RegisterSchoolForm name={d.name} setName={d.setName} code={d.code} setCode={d.setCode} password={d.password} setPassword={d.setPassword} showRegisterPassword={d.showRegisterPassword} setShowRegisterPassword={d.setShowRegisterPassword} onSubmit={d.handleRegisterSchool} />
        )}
        {d.resetTarget && (
          <PasswordResetModal resetPassword={d.resetPassword} setResetPassword={d.setResetPassword} showResetPassword={d.showResetPassword} setShowResetPassword={d.setShowResetPassword} onReset={d.handleResetPassword} onCancel={() => d.setResetTarget(null)} />
        )}
      </main>
    </div>
  );
}
