import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit2, Upload, Compass, Users, UserPlus, Sliders, ShieldCheck, Menu, X, Eye, EyeOff } from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Responsive & Navigation States
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [tName, setTName] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tClass, setTClass] = useState('');
  const [isEditingTeacher, setIsEditingTeacher] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedCellType, setSelectedCellType] = useState('wall'); 
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Viewport Breakpoints dynamically
  useEffect(() => {
    const handleResize = () => {
      const mobileMode = window.innerWidth <= 1024;
      setIsMobile(mobileMode);
      if (!mobileMode) setIsSidebarOpen(false); // Clean up state if pulling window back to desktop size
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`http://localhost:3001/api/admin/${user.id}/dashboard`, { credentials: 'include' });
      const resData = await response.json();
      setData(resData);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let response, resData;
      if (isEditingTeacher) {
        response = await fetch(`http://localhost:3001/api/admin/${user?.id}/teachers/${isEditingTeacher}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: tName, password: tPassword, class_assigned: tClass })
        });
        resData = await response.json();
      } else {
        response = await fetch(`http://localhost:3001/api/admin/${user?.id}/teachers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: tName, password: tPassword, class_assigned: tClass })
        });
        resData = await response.json();
      }

      if (resData.success) {
        setSuccessMsg(
          isEditingTeacher
            ? 'Teacher updated successfully.'
            : `Teacher account created. Login ID: ${resData.teacher?.id || `${user?.unique_code}_${tClass}`.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
        );
        setTName(''); setTPassword(''); setTClass('');
        setIsEditingTeacher(null);
        setShowPassword(false);
        fetchDashboardData();
      } else {
        setErrorMsg(resData.message || 'Action failed.');
      }
    } catch (err) {
      setErrorMsg('Failed to reach backend.');
    }
  };

  const handleEditTeacherClick = (teacher) => {
    setIsEditingTeacher(teacher.teacher_id);
    setTName(teacher.teacher_name);
    setTPassword('');
    setTClass(teacher.class_assigned);
    setShowPassword(false);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    try {
      const response = await fetch(`http://localhost:3001/api/admin/${user?.id}/teachers/${teacherId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const resData = await response.json();
      if (resData.success) {
        setSuccessMsg('Teacher account deleted.');
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const finalizeScan = useCallback(async () => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('blueprint', file);
      const response = await fetch(`http://localhost:3001/api/admin/${user?.id}/blueprint`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const resData = await response.json();
      if (resData.success) {
        setIsScanning(false);
        setFile(null);
        setSuccessMsg('AI Floorplan scanning complete.');
        fetchDashboardData();
      }
    } catch (err) {
      setIsScanning(false);
      setErrorMsg('Scan uploaded but mapping failed.');
    }
  }, [file, user?.id, fetchDashboardData]);

  const startAIScan = () => {
    if (!file) return;
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          finalizeScan();
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleCellClick = async (rIndex, cIndex) => {
    if (!data?.blueprint_json) return;
    const updatedBlueprint = JSON.parse(JSON.stringify(data.blueprint_json));
    let val = 0;
    if (selectedCellType === 'wall') val = 1;
    else if (selectedCellType === 'extinguisher') val = 2;
    else if (selectedCellType === 'door') val = 3;
    else if (selectedCellType === 'assembly') val = 5;

    updatedBlueprint.grid[rIndex][cIndex] = val;
    const extinguishers = [];
    const doors = [];
    let assembly_zone = updatedBlueprint.elements?.assembly_zone;

    updatedBlueprint.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 2) extinguishers.push({ x: c, y: r });
        if (cell === 3) doors.push({ x: c, y: r });
        if (cell === 5) assembly_zone = { x: c, y: r };
      });
    });

    updatedBlueprint.elements = updatedBlueprint.elements || {};
    updatedBlueprint.elements.extinguishers = extinguishers;
    updatedBlueprint.elements.doors = doors;
    updatedBlueprint.elements.assembly_zone = assembly_zone;

    try {
      await fetch(`http://localhost:3001/api/admin/${user?.id}/blueprint`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ blueprint_json: updatedBlueprint })
      });
      setData(prev => ({ ...prev, blueprint_json: updatedBlueprint }));
    } catch (err) {
      console.error("Error saving updated grid", err);
    }
  };

  if (loading || !data) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', color: '#0284c7', fontWeight: '500' }}>Preparing dashboard workspace...</div>;

  // Shared Staff Profile Onboarding form panel — used in its own sidebar tab
  const StaffOnboardingPanel = (
    <div className="panel-card" style={{ maxWidth: isMobile ? '100%' : '560px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <UserPlus size={20} color="#0284c7" /> {isEditingTeacher ? 'Update Instructor Attributes' : 'Staff Profile Onboarding'}
      </h3>

      <form onSubmit={handleCreateTeacher}>
        <div style={{ marginBottom: '18px' }}>
          <label className="label-text">Legal Full Name</label>
          <input type="text" className="form-control" placeholder="e.g. Jonathan Miller" value={tName} onChange={e => setTName(e.target.value)} required />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label className="label-text">Room Assignment Scope</label>
          <input type="text" className="form-control" placeholder="e.g. Room 12-B" value={tClass} onChange={e => setTClass(e.target.value)} required disabled={!!isEditingTeacher} />
          {!isEditingTeacher && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Teacher login ID will be generated as <strong>{user?.unique_code}_&lt;class&gt;</strong> after you submit.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label className="label-text">Security Key {isEditingTeacher && '(Omit to protect existing)'}</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="••••••••"
              value={tPassword}
              onChange={e => setTPassword(e.target.value)}
              required={!isEditingTeacher}
              style={{ paddingRight: '44px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? 'Hide security key' : 'Show security key'}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button type="submit" className="btn-action" style={{ width: '100%' }}>{isEditingTeacher ? 'Commit System Updates' : 'Authorize Account Creation'}</button>
          {isEditingTeacher && (
            <button type="button" onClick={() => { setIsEditingTeacher(null); setTName(''); setTClass(''); setTPassword(''); setShowPassword(false); }} className="btn-secondary-link" style={{ width: '100%' }}>Abort</button>
          )}
        </div>
      </form>
    </div>
  );

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', margin: 0, padding: 0, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', backgroundColor: '#f0f9ff', color: '#1e293b', boxSizing: 'border-box' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        .panel-card { background: #ffffff; border: 1px solid #e0f2fe; border-radius: 16px; padding: 28px; box-shadow: 0 4px 20px rgba(2, 132, 199, 0.03); transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .panel-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(2, 132, 199, 0.06); }
        
        .btn-action { background: #0284c7; color: #ffffff; border: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 14px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15); }
        .btn-action:hover { background: #0369a1; transform: scale(1.02); box-shadow: 0 6px 16px rgba(2, 132, 199, 0.25); }
        
        .btn-secondary-link { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-size: 14px; text-align: center; }
        .btn-secondary-link:hover { background: #e0f2fe; color: #0369a1; border-color: #0284c7; }
        
        .btn-danger-outline { background: transparent; color: #b91c1c; border: 1px solid #fee2e2; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-danger-outline:hover { background: #fef2f2; border-color: #fca5a5; }
        
        /* Responsive Metrics CSS Grid rules */
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
        @media (max-width: 1200px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .metrics-grid { grid-template-columns: 1fr; gap: 16px; } }

        .metric-block { border-left: 5px solid #0284c7; background: #fff; }
        .metric-num { font-size: 42px; font-weight: 700; color: #0284c7; margin: 6px 0; display: block; }
        
        .form-control { width: 100%; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 8px; font-size: 14px; background: #fff; box-sizing: border-box; transition: border 0.2s; font-family: inherit; }
        .form-control:focus { border-color: #0284c7; box-shadow: 0 0 0 3px rgba(2,132,199,0.1); outline: none; }
        .label-text { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }
        
        .map-grid-preview { display: grid; gap: 8px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .map-cell { aspect-ratio: 1; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
        .map-cell:hover { transform: scale(1.1); box-shadow: 0 2px 8px rgba(0,0,0,0.08); z-index: 2; }
        .map-cell-wall { background: #334155; }
        .map-cell-empty { background: #ffffff; border: 1px dashed #cbd5e1; }
        .map-cell-extinguisher { background: #ffe4e6; border: 1px solid #fecaca; }
        .map-cell-door { background: #fef9c3; border: 1px solid #fef08a; }
        .map-cell-assembly { background: #dcfce7; border: 1px solid #bbf7d0; }
        
        .icon-btn { background: #f8fafc; border: 1px solid #e2e8f0; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.15s; }
        .icon-btn:hover { color: #0284c7; border-color: #0284c7; background: #ffffff; }
        .icon-btn-del:hover { color: #b91c1c; border-color: #fca5a5; background: #fef2f2; }
        
        .table-responsive-scroll { overflow-x: auto; width: 100%; border-radius: 8px; border: 1px solid #f1f5f9; }
        table { width: 100%; border-collapse: collapse; min-width: 650px; }
        table th { text-align: left; padding: 16px; color: #475569; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e2e8f0; background: #f1f5f9; }
        table td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; background: #ffffff; }
        table tr:last-child td { border-bottom: none; }
        table tr:hover td { background-color: #f8fafc; }
        
        .nav-button { background: transparent; border: none; color: #e0f2fe; padding: 12px 16px; border-radius: 10px; font-weight: 500; display: flex; align-items: center; gap: 12px; font-size: 14px; width: 100%; text-align: left; cursor: pointer; transition: all 0.2s; }
        .nav-button:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
        .nav-button-active { background: rgba(255, 255, 255, 0.15) !important; color: #fff !important; font-weight: 600; }
      ` }} />

      {/* Fixed Responsive Mobile Navigation Header Strip */}
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0284c7', color: '#ffffff', padding: '0 20px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, height: '60px', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={22} color="#ffffff" />
            <span style={{ fontWeight: '700', fontSize: '15px', letterSpacing: '-0.2px' }}>Admin Workspace</span>
          </div>
          <button type="button" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {/* Slide-out Sidebar Overlay Cover Backdrop */}
      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(1px)', zIndex: 1000 }} />
      )}

      {/* Dynamic Slide Drawer Sidebar Component */}
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
          <button 
            type="button" 
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} 
            className={`nav-button ${activeTab === 'overview' ? 'nav-button-active' : ''}`}
          >
            <Sliders size={18} /> Overview Console
          </button>
          <button 
            type="button" 
            onClick={() => { setActiveTab('onboarding'); setIsSidebarOpen(false); }} 
            className={`nav-button ${activeTab === 'onboarding' ? 'nav-button-active' : ''}`}
          >
            <UserPlus size={18} /> Staff Profile Onboarding
          </button>
          <button 
            type="button" 
            onClick={() => { setActiveTab('performance'); setIsSidebarOpen(false); }} 
            className={`nav-button ${activeTab === 'performance' ? 'nav-button-active' : ''}`}
          >
            <Users size={18} /> Performance Registry
          </button>
        </nav>

        <button type="button" onClick={onLogout} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}>
          Sign Out
        </button>
      </aside>

      {/* Main Panel Content Surface */}
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '20px' : '40px', 
        paddingTop: isMobile ? '84px' : '40px', 
        boxSizing: 'border-box', 
        overflowY: 'auto', 
        width: '100%' 
      }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              {activeTab === 'overview' && 'System Infrastructure Overview'}
              {activeTab === 'onboarding' && 'Staff Profile Onboarding'}
              {activeTab === 'performance' && 'Institutional Performance Registers'}
            </h1>
            <p style={{ color: '#64748b', margin: '6px 0 0 0', fontSize: '15px', fontWeight: '500' }}>Welcome back, Workspace Coordinator</p>
          </div>
        </header>

        {successMsg && (
          <div style={{ padding: '16px 20px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', color: '#166534', fontSize: '14px', fontWeight: '500', marginBottom: '24px' }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ padding: '16px 20px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', fontSize: '14px', fontWeight: '500', marginBottom: '24px' }}>
            {errorMsg}
          </div>
        )}

        {/* METRICS & OVERVIEW VIEW LAYER */}
        {activeTab === 'overview' && (
          <>
            {/* Responsive Metrics Row */}
            <div className="metrics-grid">
              <div className="panel-card metric-block">
                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Total Rooms</span>
                <span className="metric-num">{data?.blueprint_json?.rooms?.length || 4}</span>
                <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>Active profiles</span>
              </div>
              <div className="panel-card metric-block">
                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Configured Staff</span>
                <span className="metric-num">{data?.teachers?.length || 2}</span>
                <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>Active leaders</span>
              </div>
              <div className="panel-card metric-block">
                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Enrolled Students</span>
                <span className="metric-num">
                  {data?.teachers ? data.teachers.reduce((acc, t) => acc + (t.students?.length || 0), 0) : 3}
                </span>
                <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>Sync status green</span>
              </div>
              <div className="panel-card metric-block">
                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Blueprint Node</span>
                <span className="metric-num" style={{ color: '#0284c7' }}>Active</span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Floorplan matrix live</span>
              </div>
            </div>

            {/* Spatial Map Component (full width — onboarding now lives in its own tab) */}
            <div className="panel-card" style={{ overflow: 'hidden' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Compass size={20} color="#0284c7" /> Blueprint Layout Engine
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0', fontWeight: '500' }}>
                Select a design asset to overlay positioning nodes onto your mapped matrix.
              </p>

              {!data?.blueprint_json ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 20px', border: '2px dashed #bae6fd', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                  <Upload size={36} style={{ color: '#38bdf8', marginBottom: '16px' }} />
                  <p style={{ fontSize: '14px', marginBottom: '20px', color: '#475569', fontWeight: '500' }}>
                    Provide blueprint grid asset to deploy layout workspace.
                  </p>
                  <input type="file" accept="image/*" onChange={handleFileUpload} id="blueprint-file" style={{ display: 'none' }} />
                  <label htmlFor="blueprint-file" className="btn-secondary-link" style={{ cursor: 'pointer', padding: '12px 24px' }}>
                    Locate Source File
                  </label>
                  {file && <button type="button" onClick={startAIScan} className="btn-action" style={{ marginTop: '16px', width: '100%' }}>Initialize Grid Parser</button>}
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                    {[
                      { id: 'wall', label: 'Wall Asset', color: '#334155' },
                      { id: 'empty', label: 'Walkway Unit', color: '#ffffff' },
                      { id: 'door', label: 'Access Point', color: '#fef9c3' },
                      { id: 'extinguisher', label: 'Extinguisher', color: '#ffe4e6' },
                      { id: 'assembly', label: 'Assembly Zone', color: '#dcfce7' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedCellType(item.id)}
                        style={{
                          background: selectedCellType === item.id ? '#0284c7' : '#ffffff',
                          border: `1px solid ${selectedCellType === item.id ? '#0284c7' : '#cbd5e1'}`,
                          padding: '8px 14px',
                          borderRadius: '8px',
                          color: selectedCellType === item.id ? '#ffffff' : '#334155',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontWeight: '600'
                        }}
                      >
                        <span style={{ width: '12px', height: '12px', background: item.color, borderRadius: '3px', border: '1px solid #cbd5e1' }}></span>
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Matrix scroll frame to support wide multi-grid coordinates on small screens */}
                  <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', marginBottom: '16px' }}>
                    <div className="map-grid-preview" style={{ gridTemplateColumns: `repeat(${data.blueprint_json.width || 1}, minmax(40px, 1fr))`, minWidth: '460px' }}>
                      {data.blueprint_json.grid?.map((row, rIdx) => 
                        row.map((cell, cIdx) => {
                          let cellClass = 'map-cell-empty';
                          let displayChar = '';
                          if (cell === 1) cellClass = 'map-cell-wall';
                          if (cell === 2) { cellClass = 'map-cell-extinguisher'; displayChar = '🧯'; }
                          if (cell === 3) { cellClass = 'map-cell-door'; displayChar = '🚪'; }
                          if (cell === 5) { cellClass = 'map-cell-assembly'; displayChar = '🚩'; }

                          return (
                            <div key={`${rIdx}-${cIdx}`} onClick={() => handleCellClick(rIdx, cIdx)} className={`map-cell ${cellClass}`}>
                              {displayChar}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Purge spatial records?")) {
                          setData(prev => ({ ...prev, blueprint_json: null }));
                          fetch(`http://localhost:3001/api/admin/${user?.id}/blueprint`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ blueprint_json: null })
                          });
                        }
                      }}
                      className="btn-danger-outline"
                      style={{ width: isMobile ? '100%' : 'auto' }}
                    >Wipe Configuration Layout</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* STAFF PROFILE ONBOARDING VIEW LAYER */}
        {activeTab === 'onboarding' && StaffOnboardingPanel}

        {/* PERFORMANCE TABS SYSTEM ENGINE VIEW */}
        {activeTab === 'performance' && (
          <div className="panel-card" style={{ padding: isMobile ? '16px' : '28px' }}>
            {!data?.teachers || data.teachers.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '32px 0', fontSize: '14px', fontWeight: '500' }}>No profile accounts registered in current database stack.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {data.teachers.map(teacher => {
                  const drillScores = teacher.students ? teacher.students.flatMap(s => (s.scores || []).filter(sc => sc.activity_type === 'drill')) : [];
                  const avgEvacTime = drillScores.length > 0 ? Math.round(drillScores.reduce((acc, s) => acc + s.duration_seconds, 0) / drillScores.length) : null;

                  return (
                    <div key={teacher.teacher_id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#ffffff' }}>
                      
                      {/* Responsive Card Headers */}
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{teacher.teacher_name}</h4>
                          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'inline-block', fontWeight: '500' }}>
                            Tag: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>{teacher.teacher_id}</strong> &bull; Zone Target: <strong style={{ color: '#334155' }}>{teacher.class_assigned || 'Unassigned'}</strong>
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                          {avgEvacTime !== null && (
                            <div style={{ background: '#f0f9ff', padding: '6px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1' }}>{avgEvacTime}s Average Velocity</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                            <button type="button" onClick={() => { handleEditTeacherClick(teacher); setActiveTab('onboarding'); }} className="icon-btn" aria-label="Modify profile"><Edit2 size={14} /></button>
                            <button type="button" onClick={() => handleDeleteTeacher(teacher.teacher_id)} className="icon-btn icon-btn-del" aria-label="Drop account"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>

                      {/* Horizontal Responsive Frame Wrapper around data table */}
                      {teacher.students && teacher.students.length > 0 ? (
                        <div className="table-responsive-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>Student ID</th>
                                <th>Roll Number</th>
                                <th>Student Identity</th>
                                <th>Drill Response</th>
                                <th>Seismic Evaluation</th>
                                <th>Hydrological Quiz</th>
                                <th>Erosion Assessment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teacher.students.map(student => {
                                const studentScores = student.scores || [];
                                const fireDrill = studentScores.find(sc => sc.disaster_type === 'fire' && sc.activity_type === 'drill');
                                const eqQuiz = studentScores.find(sc => sc.disaster_type === 'earthquake' && sc.activity_type === 'quiz');
                                const floodQuiz = studentScores.find(sc => sc.disaster_type === 'flood' && sc.activity_type === 'quiz');
                                const lsQuiz = studentScores.find(sc => sc.disaster_type === 'landslide' && sc.activity_type === 'quiz');

                                return (
                                  <tr key={student.id || student.roll_no}>
                                    <td style={{ color: '#64748b', fontWeight: '600', fontFamily: 'monospace' }}>{student.id}</td>
                                    <td style={{ color: '#64748b', fontWeight: '600', fontFamily: 'monospace' }}>{student.roll_no}</td>
                                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{student.name}</td>
                                    <td style={{ color: '#0284c7', fontWeight: '700' }}>{fireDrill ? `${fireDrill.score} pts` : '—'}</td>
                                    <td style={{ fontWeight: '500' }}>{eqQuiz ? `${eqQuiz.score}%` : '—'}</td>
                                    <td style={{ fontWeight: '500' }}>{floodQuiz ? `${floodQuiz.score}%` : '—'}</td>
                                    <td style={{ fontWeight: '500' }}>{lsQuiz ? `${lsQuiz.score}%` : '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ color: '#64748b', fontSize: '13px', padding: '20px 24px', fontWeight: '500', background: '#ffffff', fontStyle: 'italic' }}>
                          No records linked to this command profile node.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}