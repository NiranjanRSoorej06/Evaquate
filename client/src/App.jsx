import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { ToastProvider } from './components/Toast';

function App() {
  const [user, setUser] = useState(null); // { id, name, role, school_id, ... }
  const [loading, setLoading] = useState(true);

  // Check for active session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/auth/session', {
          credentials: 'include',
          skipGlobalToast: true
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Session validation failed:', err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Listen for global unauthorized events to automatically logout
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>GuardianPath AI</div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Securing your session...</div>
        </div>
      </div>
    );
  }


  return (
    <ToastProvider>
      <div className="bg-ambient"></div>

      <main style={{ minHeight: '100vh' }}>
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
    </ToastProvider>
  );
}

export default App;
