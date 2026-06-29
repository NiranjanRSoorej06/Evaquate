import React, { useState, useEffect } from 'react';
import { Plus, ShieldAlert, FileText, CheckCircle, LogOut, LayoutDashboard, Building2, Menu, X } from 'lucide-react';

export default function SuperAdminDashboard({ user, onLogout }) {
  const [schools, setSchools] = useState([]);
  const [sidebarTab, setSidebarTab] = useState('directory'); // 'directory', 'register'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // School Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Track screen resize safely
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize(); // Check layout on initial mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/superadmin/schools');
      const data = await response.json();
      setSchools(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleRegisterSchool = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/superadmin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, unique_code: code, password })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`School registered successfully! ID: ${code}`);
        setName('');
        setCode('');
        setPassword('');
        fetchSchools();
      } else {
        setError(data.message || 'Failed to register school.');
      }
    } catch (err) {
      setError('Connection failure.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%', minHeight: '100vh', backgroundColor: '#f0f9ff', fontFamily: '"Plus Jakarta Sans", sans-serif', position: 'relative', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght=400;500;600;700&display=swap');
        
        .sidebar-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 18px; border: none; background: transparent; color: #e0f2fe; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; font-size: 14px; font-weight: 500; }
        .sidebar-item:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
        .sidebar-active { background: rgba(255, 255, 255, 0.15) !important; color: #fff !important; font-weight: 600; }

        .premium-card { background: #fff; border-radius: 20px; padding: 24px; border: 1px solid #e0f2fe; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.03); }
        
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #bae6fd; background: #fff; color: #1e293b; font-size: 14px; outline: none; transition: all 0.2s; box-sizing: border-box; }
        .form-input:focus { border-color: #0284c7; box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1); }
        
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: #0284c7; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 14px; }
        .btn-primary:hover { background: #0369a1; transform: translateY(-1px); }

        .data-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 600px; }
        .data-table th { padding: 16px 12px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e0f2fe; }
        .data-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; background: #fff; }
        .data-table tr:last-child td { border-bottom: none; }
      ` }} />

      {/* Top Fixed Mobile Navbar */}
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0284c7', color: '#ffffff', padding: '16px 24px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 950, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)', height: '60px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutDashboard size={22} color="#ffffff" />
            <span style={{ fontWeight: '700', fontSize: '16px' }}>Super Hub</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            {isSidebarOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      )}

      {/* Dimmed backdrop background overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', zIndex: 990 }}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside style={{ 
        width: '280px', 
        background: '#0284c7', 
        padding: '32px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        color: '#fff', 
        boxSizing: 'border-box',
        zIndex: 1000,
        transition: 'transform 0.3s ease',
        ...(isMobile ? {
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
        } : {})
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ background: '#fff', padding: '8px', borderRadius: '10px' }}>
            <LayoutDashboard size={24} color="#0284c7" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Super Hub</h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => { setSidebarTab('directory'); setIsSidebarOpen(false); }} className={`sidebar-item ${sidebarTab === 'directory' ? 'sidebar-active' : ''}`}>
            <FileText size={18} /> Institution Directory
          </button>
          <button onClick={() => { setSidebarTab('register'); setIsSidebarOpen(false); }} className={`sidebar-item ${sidebarTab === 'register' ? 'sidebar-active' : ''}`}>
            <Plus size={18} /> Register Campus
          </button>
        </nav>

        <button onClick={onLogout} className="sidebar-item" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.1)' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* MAIN VIEWING CANVAS */}
      <main style={{ flex: 1, padding: isMobile ? '20px' : '40px', paddingTop: isMobile ? '84px' : '40px', overflowY: 'auto', boxSizing: 'border-box', width: '100%' }}>
        {/* Workspace Top Header */}
        <header style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '12px', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#0f172a', marginBottom: '6px', margin: 0 }}>
              {sidebarTab === 'directory' ? 'Global Network Directory' : 'System Provisioning Engine'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Root Operator: <span style={{ color: '#0284c7', fontWeight: '600' }}>{user?.username || 'Admin'}</span> | Domain Status: <span style={{ fontWeight: '600', color: '#10b981' }}>Active</span>
            </p>
          </div>
        </header>

        {/* Messaging Banners */}
        {message && (
          <div style={{ padding: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', color: '#065f46', fontSize: '14px', fontWeight: '500', marginBottom: '24px' }}>
            ✓ {message}
          </div>
        )}
        {error && (
          <div style={{ padding: '16px', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '12px', color: '#991b1b', fontSize: '14px', fontWeight: '500', marginBottom: '24px' }}>
            ✕ {error}
          </div>
        )}

        {/* TAB 1: SCHOOL DIRECTORY */}
        {sidebarTab === 'directory' && (
          <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 24px 12px 24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Building2 size={20} color="#0284c7" /> Managed Educational Campuses
              </h2>
            </div>

            {schools.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px', fontSize: '14px' }}>
                No schools found within the central system repository registry.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>School Name</th>
                      <th>Unique Code</th>
                      <th>Blueprint State</th>
                      <th style={{ textAlign: 'center' }}>Teachers</th>
                      <th style={{ textAlign: 'center' }}>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: '600', color: '#0f172a' }}>{s.name}</td>
                        <td>
                          <code style={{ background: '#f0f9ff', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: '#0369a1', border: '1px solid #e0f2fe' }}>
                            {s.unique_code}
                          </code>
                        </td>
                        <td>
                          {s.blueprint_json ? (
                            <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                              <CheckCircle size={14} /> Ready
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                              <ShieldAlert size={14} /> Pending Upload
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '500' }}>{s.teacher_count || 0}</td>
                        <td style={{ textAlign: 'center', fontWeight: '500' }}>{s.student_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGISTER NEW SCHOOL */}
        {sidebarTab === 'register' && (
          <div className="premium-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ borderBottom: '1px solid #e0f2fe', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="#0284c7" /> Provision New Database Entity
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Establish a clean operational database slice and access credentials for a target academic facility.
              </p>
            </div>

            <form onSubmit={handleRegisterSchool}>
              <div className="form-group">
                <label className="form-label">School Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Springfield Elementary"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unique School ID Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. SCH-78901"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Access Passphrase</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Initialize root entity password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                <Plus size={16} /> Finalize Node Registration
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}