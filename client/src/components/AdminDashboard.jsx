import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Upload, AlertCircle, Compass, CheckCircle, Send, Users, UserPlus } from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Teacher form state
  const [tName, setTName] = useState('');
  const [tUsername, setTUsername] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tClass, setTClass] = useState('');
  const [isEditingTeacher, setIsEditingTeacher] = useState(null);
  
  // Blueprint upload simulation states
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedCellType, setSelectedCellType] = useState('wall'); // wall, extinguisher, door, empty, assembly
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/${user.id}/dashboard`);
      const resData = await response.json();
      setData(resData);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let response, resData;
      if (isEditingTeacher) {
        // Edit existing teacher class assignment
        response = await fetch(`http://localhost:3001/api/admin/${user.id}/teachers/${isEditingTeacher}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tName, password: tPassword, class_assigned: tClass })
        });
        resData = await response.json();
      } else {
        // Create new teacher
        response = await fetch(`http://localhost:3001/api/admin/${user.id}/teachers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tName, username: tUsername, password: tPassword, class_assigned: tClass })
        });
        resData = await response.json();
      }

      if (resData.success) {
        setSuccessMsg(isEditingTeacher ? 'Teacher updated!' : 'Teacher account created successfully!');
        setTName('');
        setTUsername('');
        setTPassword('');
        setTClass('');
        setIsEditingTeacher(null);
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
    setTUsername(teacher.teacher_username);
    setTPassword(''); // leave empty to not change
    setTClass(teacher.class_assigned);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Are you sure you want to delete this teacher? All their student records will be orphaned or deleted.")) return;
    try {
      const response = await fetch(`http://localhost:3001/api/admin/${user.id}/teachers/${teacherId}`, {
        method: 'DELETE'
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

  // Blueprint AI Parser simulation
  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
  };

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

  const finalizeScan = async () => {
    try {
      const formData = new FormData();
      formData.append('blueprint', file);

      const response = await fetch(`http://localhost:3001/api/admin/${user.id}/blueprint`, {
        method: 'POST',
        body: formData
      });
      const resData = await response.json();
      if (resData.success) {
        setIsScanning(false);
        setFile(null);
        setSuccessMsg('AI Floorplan scanning complete! School Map generated for gamification.');
        fetchDashboardData();
      }
    } catch (err) {
      setIsScanning(false);
      setErrorMsg('Scan uploaded but JSON mapping failed.');
    }
  };

  // Grid editing functions
  const handleCellClick = async (rIndex, cIndex) => {
    if (!data.blueprint_json) return;
    
    // Copy the blueprint grid
    const updatedBlueprint = JSON.parse(JSON.stringify(data.blueprint_json));
    
    // Toggle/Set values
    // Grid values: 0: empty, 1: wall, 2: extinguisher, 3: door, 4: secondary hazard, 5: assembly yard
    let val = 0;
    if (selectedCellType === 'wall') val = 1;
    else if (selectedCellType === 'extinguisher') val = 2;
    else if (selectedCellType === 'door') val = 3;
    else if (selectedCellType === 'assembly') val = 5;

    updatedBlueprint.grid[rIndex][cIndex] = val;

    // Update dynamic listings (extinguishers, doors, etc.)
    const extinguishers = [];
    const doors = [];
    let assembly_zone = updatedBlueprint.elements.assembly_zone;

    updatedBlueprint.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 2) extinguishers.push({ x: c, y: r });
        if (cell === 3) doors.push({ x: c, y: r });
        if (cell === 5) assembly_zone = { x: c, y: r };
      });
    });

    updatedBlueprint.elements.extinguishers = extinguishers;
    updatedBlueprint.elements.doors = doors;
    updatedBlueprint.elements.assembly_zone = assembly_zone;

    try {
      const response = await fetch(`http://localhost:3001/api/admin/${user.id}/blueprint`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint_json: updatedBlueprint })
      });
      const resData = await response.json();
      if (resData.success) {
        setData(prev => ({ ...prev, blueprint_json: updatedBlueprint }));
      }
    } catch (err) {
      console.error("Error saving updated grid", err);
    }
  };

  const handleContactSuperAdmin = () => {
    alert("Support request submitted to Super Admin. Our engineers will verify your school coordinates shortly.");
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard data...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>School Admin Portal</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Welcome, Principal / IT Lead of <strong style={{ color: '#fff' }}>{data.school_name}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleContactSuperAdmin} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Send size={16} /> Contact Super Admin
          </button>
          <button onClick={onLogout} className="btn-secondary">Logout</button>
        </div>
      </header>

      {successMsg && (
        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-safe)', borderRadius: '8px', color: 'var(--color-safe)', fontSize: '14px', marginBottom: '24px' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-fire)', borderRadius: '8px', color: 'var(--color-fire)', fontSize: '14px', marginBottom: '24px' }}>
          {errorMsg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Classrooms Registered</span>
          <span className="metric-value">{data.blueprint_json?.rooms?.length || 0}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-safe)' }}>Ready for drills</span>
        </div>
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Total Teachers</span>
          <span className="metric-value">{data.teachers.length}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Class leaders & substitutes</span>
        </div>
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Total Students enrolled</span>
          <span className="metric-value">
            {data.teachers.reduce((acc, t) => acc + t.students.length, 0)}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-flood)' }}>Syncing active scores</span>
        </div>
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Gamified Map Blueprint</span>
          <span className="metric-value" style={{ color: data.blueprint_uploaded ? 'var(--color-safe)' : 'var(--color-fire)' }}>
            {data.blueprint_uploaded ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Convert floorplan PNG/JPG</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start', marginBottom: '40px' }}>
        
        {/* Blueprint Section */}
        <div className="glass-panel" style={{ height: '100%' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} color="var(--color-accent-primary)" />
            School Floorplan & AI Gamification System
          </h2>

          {!data.blueprint_json ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--glass-border)', borderRadius: '12px' }}>
              <Upload size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
              <p style={{ fontSize: '15px', marginBottom: '20px', color: 'var(--color-text-secondary)' }}>
                Upload the school blueprint (architecture layout/fire safety plan JPG/PNG) to begin.
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <input type="file" accept="image/*" onChange={handleFileUpload} id="blueprint-file" style={{ display: 'none' }} />
                <label htmlFor="blueprint-file" className="btn-secondary" style={{ cursor: 'pointer' }}>
                  Choose Image File
                </label>
                {file && <span style={{ marginLeft: '10px', fontSize: '13px' }}>{file.name}</span>}
              </div>

              {file && !isScanning && (
                <button onClick={startAIScan} className="btn-primary">
                  Run AI Blueprint Parser
                </button>
              )}

              {isScanning && (
                <div style={{ marginTop: '20px' }} className="ai-scanline-container">
                  <div className="ai-scanline"></div>
                  <p style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--color-accent-primary)', fontWeight: 'bold' }}>
                    AI Scan & Obstacle Mapping: {scanProgress}%
                  </p>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                    <div style={{ width: `${scanProgress}%`, height: '100%', background: 'var(--color-accent-primary)', borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                <strong>Map Editor:</strong> Tap grid cells to modify elements. Make sure the school has at least one Green Assembly Area exit and Red Fire Extinguishers!
              </p>

              {/* Grid cell selector */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {[
                  { id: 'wall', label: 'Wall (Blocks)', color: '#374151' },
                  { id: 'empty', label: 'Walkway (Free)', color: 'rgba(255,255,255,0.05)' },
                  { id: 'door', label: 'Class Door', color: '#f59e0b' },
                  { id: 'extinguisher', label: 'Fire Extinguisher', color: '#ef4444' },
                  { id: 'assembly', label: 'Assembly Area', color: '#10b981' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedCellType(item.id)}
                    style={{
                      background: selectedCellType === item.id ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedCellType === item.id ? 'var(--color-accent-primary)' : 'var(--glass-border)'}`,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span style={{ width: '12px', height: '12px', background: item.color, borderRadius: '2px', display: 'inline-block' }}></span>
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Map grid display */}
              <div className="map-grid-preview" style={{ gridTemplateColumns: `repeat(${data.blueprint_json.width}, 1fr)` }}>
                {data.blueprint_json.grid.map((row, rIdx) => 
                  row.map((cell, cIdx) => {
                    let cellClass = 'map-cell-empty';
                    let displayChar = '';
                    if (cell === 1) cellClass = 'map-cell-wall';
                    if (cell === 2) { cellClass = 'map-cell-extinguisher'; displayChar = '🧯'; }
                    if (cell === 3) { cellClass = 'map-cell-door'; displayChar = '🚪'; }
                    if (cell === 5) { cellClass = 'map-cell-assembly'; displayChar = '🚩'; }

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        onClick={() => handleCellClick(rIdx, cIdx)}
                        className={`map-cell ${cellClass}`}
                      >
                        {displayChar}
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to reset the blueprint? This will delete the current layout.")) {
                      setData(prev => ({ ...prev, blueprint_json: null }));
                      // Send call to reset
                      fetch(`http://localhost:3001/api/admin/${user.id}/blueprint`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ blueprint_json: null })
                      });
                    }
                  }}
                  className="btn-danger"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Reset Layout
                </button>
                <button onClick={handleContactSuperAdmin} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Flag Conversion Bug
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manage Teachers */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--color-accent-primary)" />
            {isEditingTeacher ? 'Edit Teacher Class' : 'Create Teacher Credentials'}
          </h2>

          <form onSubmit={handleCreateTeacher} style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Johnathan Miller"
                value={tName}
                onChange={e => setTName(e.target.value)}
                required
              />
            </div>
            
            {!isEditingTeacher && (
              <div className="form-group">
                <label className="form-label">Unique Login ID / Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. T-104"
                  value={tUsername}
                  onChange={e => setTUsername(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password {isEditingTeacher && '(Leave blank to keep unchanged)'}</label>
              <input
                type="password"
                className="form-input"
                placeholder={isEditingTeacher ? '••••••••' : 'Provide temporary password'}
                value={tPassword}
                onChange={e => setTPassword(e.target.value)}
                required={!isEditingTeacher}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Class Assigned (e.g. Class 10-A, Floater)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Classroom name or leave as 'Substitute'"
                value={tClass}
                onChange={e => setTClass(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {isEditingTeacher ? 'Save Changes' : 'Generate Account'}
              </button>
              {isEditingTeacher && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTeacher(null);
                    setTName('');
                    setTUsername('');
                    setTClass('');
                    setTPassword('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Teachers list and Student details */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="var(--color-accent-primary)" />
          Teachers & Student Performance Index
        </h2>

        {data.teachers.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px' }}>
            No teachers registered yet. Use the sidebar to create accounts.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {data.teachers.map(teacher => {
              // Calculate class metrics
              const drillScores = teacher.students.flatMap(s => s.scores.filter(sc => sc.activity_type === 'drill'));
              const avgEvacTime = drillScores.length > 0
                ? Math.round(drillScores.reduce((acc, s) => acc + s.duration_seconds, 0) / drillScores.length)
                : null;

              return (
                <div key={teacher.teacher_id} style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '20px', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', color: '#fff' }}>{teacher.teacher_name}</h3>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Username: <code style={{ color: 'var(--color-accent-primary)' }}>{teacher.teacher_username}</code> | Assigned: <strong>{teacher.class_assigned || 'Substitute/Unassigned'}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {avgEvacTime && (
                        <div style={{ textAlign: 'right', marginRight: '10px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Avg Evacuation</span>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-safe)' }}>{avgEvacTime}s</span>
                        </div>
                      )}
                      <button onClick={() => handleEditTeacherClick(teacher)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteTeacher(teacher.teacher_id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-fire)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Student list under this teacher */}
                  {teacher.students.length === 0 ? (
                    <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      No students assigned to this teacher yet.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <th style={{ padding: '8px 4px', color: 'var(--color-text-secondary)' }}>Roll No</th>
                            <th style={{ padding: '8px 4px', color: 'var(--color-text-secondary)' }}>Student Name</th>
                            <th style={{ padding: '8px 4px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Fire Drill (Score/Time)</th>
                            <th style={{ padding: '8px 4px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Earthquake Quiz</th>
                            <th style={{ padding: '8px 4px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Flood Quiz</th>
                            <th style={{ padding: '8px 4px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Landslide Quiz</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacher.students.map(student => {
                            const fireDrill = student.scores.find(sc => sc.disaster_type === 'fire' && sc.activity_type === 'drill');
                            const eqQuiz = student.scores.find(sc => sc.disaster_type === 'earthquake' && sc.activity_type === 'quiz');
                            const floodQuiz = student.scores.find(sc => sc.disaster_type === 'flood' && sc.activity_type === 'quiz');
                            const lsQuiz = student.scores.find(sc => sc.disaster_type === 'landslide' && sc.activity_type === 'quiz');

                            return (
                              <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '10px 4px', fontWeight: 'bold' }}>{student.roll_no}</td>
                                <td style={{ padding: '10px 4px' }}>{student.name}</td>
                                <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                                  {fireDrill ? (
                                    <span style={{ color: 'var(--color-safe)' }}>
                                      {fireDrill.score}pts ({fireDrill.duration_seconds}s)
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                                  )}
                                </td>
                                <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                                  {eqQuiz ? `${eqQuiz.score}%` : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                                </td>
                                <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                                  {floodQuiz ? `${floodQuiz.score}%` : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                                </td>
                                <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                                  {lsQuiz ? `${lsQuiz.score}%` : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
