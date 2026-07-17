import React from 'react';
import SuperAdminDashboard from '../../components/SuperAdminDashboard';
import AdminDashboard from '../../components/AdminDashboard';
import TeacherDashboard from '../../components/TeacherDashboard';
import StudentDashboard from '../../components/StudentDashboard';

export default function DashboardWrapper({ user, onLogout }) {
  switch (user?.role) {
    case 'super_admin':
      return <SuperAdminDashboard user={user} onLogout={onLogout} />;
    case 'admin':
      return <AdminDashboard user={user} onLogout={onLogout} />;
    case 'teacher':
      return <TeacherDashboard user={user} onLogout={onLogout} />;
    case 'student':
      return <StudentDashboard user={user} onLogout={onLogout} />;
    default:
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Invalid user role or unauthorized access.</h2>
        </div>
      );
  }
}
