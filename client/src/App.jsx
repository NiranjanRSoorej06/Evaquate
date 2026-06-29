import React, { useState } from 'react';
import Auth from './components/Auth';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

function App() {
  const [user, setUser] = useState(null); // { id, name, role, school_id, ... }

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <>
      <div className="bg-ambient"></div>
      
      {user && (
        <nav className="navbar">
          <div className="nav-logo">
            <span>🛡️</span> GuardianPath AI
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Logged in as <strong style={{ color: '#fff' }}>{user.name || user.username}</strong> ({user.role.replace('_', ' ').toUpperCase()})
            </span>
          </div>
        </nav>
      )}

      <main style={{ minHeight: 'calc(100vh - 70px)' }}>
        {!user ? (
          <Auth onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {user.role === 'super_admin' && (
              <SuperAdminDashboard user={user} onLogout={handleLogout} />
            )}
            {user.role === 'admin' && (
              <AdminDashboard user={user} onLogout={handleLogout} />
            )}
            {user.role === 'teacher' && (
              <TeacherDashboard user={user} onLogout={handleLogout} />
            )}
            {user.role === 'student' && (
              <StudentDashboard user={user} onLogout={handleLogout} />
            )}
          </>
        )}
      </main>
    </>
  );
}

export default App;
