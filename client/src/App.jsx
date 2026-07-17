import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import DashboardWrapper from './pages/Dashboard';
import GamePage from './pages/Game';
import { ToastProvider } from './components/Toast';
import SplashScreen from './components/SplashScreen';

// Minimum time the splash is shown
const SPLASH_DURATION = 5500;

function App() {
  const [user, setUser]               = useState(null);
  // True until BOTH the session fetch AND the splash animation have finished
  const [showInitSplash, setShowInitSplash] = useState(true);
  const [sessionReady, setSessionReady]     = useState(false);
  const [splashReady, setSplashReady]       = useState(false);

  const [loginSplash, setLoginSplash] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  // Session check — sets sessionReady when fetch resolves
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/auth/session', {
          credentials: 'include',
          skipGlobalToast: true,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) setUser(data.user);
        }
      } catch (err) {
        console.error('Session validation failed:', err);
      } finally {
        setSessionReady(true);
      }
    };
    checkSession();
  }, []);

  // Dismiss initial splash only when BOTH conditions are met
  // Small delay lets the exit CSS animation finish before unmounting
  useEffect(() => {
    if (sessionReady && splashReady) {
      setTimeout(() => setShowInitSplash(false), 250);
    }
  }, [sessionReady, splashReady]);

  // Global unauthorized listener
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('auth-unauthorized', handler);
    return () => window.removeEventListener('auth-unauthorized', handler);
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setPendingUser(loggedInUser);
    setLoginSplash(true);
  };

  const handleSplashDone = () => {
    setUser(pendingUser);
    // Small delay lets the exit CSS animation finish before unmounting
    setTimeout(() => {
      setLoginSplash(false);
      setPendingUser(null);
    }, 250);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  // Initial app-load splash — plays full animation, waits for session fetch
  if (showInitSplash) {
    return (
      <SplashScreen
        message="Securing your session"
        autoExit={SPLASH_DURATION}
        onDone={() => setSplashReady(true)}
      />
    );
  }

  // Post-login transition — full cinematic splash, same as initial load
  if (loginSplash) {
    const roleMessages = {
      super_admin: 'Launching Super Admin Hub',
      admin:       'Preparing Admin Workspace',
      teacher:     'Loading Teacher Dashboard',
      student:     'Entering Drill Matrix',
    };
    const msg = roleMessages[pendingUser?.role] || 'Preparing your workspace';
    return (
      <SplashScreen
        key={`login-${pendingUser?.role}-${Date.now()}`}
        message={msg}
        autoExit={SPLASH_DURATION}
        onDone={handleSplashDone}
      />
    );
  }

  return (
    <ToastProvider>
      <Routes>
        <Route path="/game" element={<GamePage />} />
        <Route path="*" element={
          <>
            {user && <div className="bg-ambient" />}
            <main style={{ minHeight: '100vh' }}>
              <Routes>
                <Route path="/" element={
                  !user ? (
                    <Auth onLoginSuccess={handleLoginSuccess} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } />
                <Route path="/dashboard" element={
                  user ? (
                    <DashboardWrapper user={user} onLogout={handleLogout} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
    </ToastProvider>
  );
}

export default App;
