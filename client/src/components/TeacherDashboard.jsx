import React, { useState, useEffect } from 'react';
import { Plus, Upload, Download, Trash2, Award, Users, BarChart3, TrendingUp } from 'lucide-react';

export default function TeacherDashboard({ user, onLogout }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Student form state
  const [sName, setSName] = useState('');
  const [sRoll, setSRoll] = useState('');
  
  // CSV file import state
  const [csvContent, setCsvContent] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStudents = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.id}/students`);
      const data = await response.json();
      setStudents(data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sName, roll_no: sRoll, school_id: user.school_id })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`Student "${sName}" added. Password is set as full name.`);
        setSName('');
        setSRoll('');
        fetchStudents();
      } else {
        setErrorMsg(data.message || 'Failed to add student.');
      }
    } catch (err) {
      setErrorMsg('Connection error.');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.id}/students/${studentId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Student record removed.');
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Template downloader (Data URI)
  const downloadCsvTemplate = () => {
    const csvContent = "roll_no,name\n103,Peter Parker\n104,Bruce Wayne\n105,Clark Kent\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "student_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV Client Side
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const processCsvImport = async () => {
    if (!csvContent) return;
    setErrorMsg('');
    setSuccessMsg('');

    const lines = csvContent.split('\n');
    const importedStudents = [];

    // Skip header line (roll_no, name)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length >= 2) {
        const roll = parts[0].trim();
        const name = parts.slice(1).join(',').replace(/^"|"$/g, '').trim(); // support names with commas
        if (roll && name) {
          importedStudents.push({ roll_no: roll, name });
        }
      }
    }

    if (importedStudents.length === 0) {
      setErrorMsg('No valid rows found in CSV.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.id}/students/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: importedStudents, school_id: user.school_id })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`Successfully imported ${data.addedCount} students! (Skipped ${data.skippedCount} duplicates/invalid rows)`);
        setCsvFile(null);
        setCsvContent('');
        fetchStudents();
      }
    } catch (err) {
      setErrorMsg('Failed to process bulk upload.');
    }
  };

  // Calculate stats for Analytics Dashboard
  const allScores = students.flatMap(s => s.scores || []);
  const quizScores = allScores.filter(sc => sc.activity_type === 'quiz');
  const drillScores = allScores.filter(sc => sc.activity_type === 'drill');

  const avgQuizScore = quizScores.length > 0 
    ? Math.round(quizScores.reduce((acc, s) => acc + s.score, 0) / quizScores.length) 
    : 0;

  const avgDrillScore = drillScores.length > 0 
    ? Math.round(drillScores.reduce((acc, s) => acc + s.score, 0) / drillScores.length) 
    : 0;

  const avgEvacuationTime = drillScores.length > 0 
    ? Math.round(drillScores.reduce((acc, s) => acc + s.duration_seconds, 0) / drillScores.length) 
    : 0;

  // Calculate disaster averages for chart
  const disasters = ['fire', 'earthquake', 'flood', 'landslide'];
  const quizAverages = disasters.map(type => {
    const matching = quizScores.filter(sc => sc.disaster_type === type);
    const avg = matching.length > 0 ? Math.round(matching.reduce((acc, s) => acc + s.score, 0) / matching.length) : 0;
    return { name: type.charAt(0).toUpperCase() + type.slice(1), value: avg };
  });

  const drillAverages = disasters.map(type => {
    const matching = drillScores.filter(sc => sc.disaster_type === type);
    const avg = matching.length > 0 ? Math.round(matching.reduce((acc, s) => acc + s.score, 0) / matching.length) : 0;
    return { name: type.charAt(0).toUpperCase() + type.slice(1), value: avg };
  });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading teacher account...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>Teacher Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Welcome, <strong>{user.name}</strong> | School: {user.school_name} | Class Assigned: <strong>{user.class_assigned || 'Substitute'}</strong>
          </p>
        </div>
        <button onClick={onLogout} className="btn-secondary">Logout</button>
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

      {/* Analytics Summary */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Class Size</span>
          <span className="metric-value">{students.length}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-safe)' }}>Active Students</span>
        </div>
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Class Quiz Avg</span>
          <span className="metric-value">{avgQuizScore}%</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Goal: &gt; 80% passing</span>
        </div>
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Safety Drill Success</span>
          <span className="metric-value">{avgDrillScore} pts</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Evaluated evacuations</span>
        </div>
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Avg Evacuation Time</span>
          <span className="metric-value">{avgEvacuationTime}s</span>
          <span style={{ fontSize: '11px', color: 'var(--color-safe)' }}>Safe &lt; 60 seconds</span>
        </div>
      </div>

      {/* Charts section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', marginBottom: '40px', alignItems: 'stretch' }}>
        
        {/* Analytics Visualization */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--color-accent-primary)" />
            Class Analytics Dashboard
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>Average Quiz Scores (%)</h3>
              <div className="bar-chart-container">
                {quizAverages.map(bar => (
                  <div key={bar.name} className="bar-wrapper">
                    <div className="bar-column" style={{ height: `${bar.value}%` }}>
                      <span className="bar-value">{bar.value}%</span>
                    </div>
                    <span className="bar-label">{bar.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>Average Drill Scores (pts)</h3>
              <div className="bar-chart-container">
                {drillAverages.map(bar => (
                  <div key={bar.name} className="bar-wrapper">
                    <div className="bar-column" style={{ height: `${bar.value}%`, background: 'linear-gradient(to top, var(--color-safe), var(--color-accent-primary))' }}>
                      <span className="bar-value">{bar.value}</span>
                    </div>
                    <span className="bar-label">{bar.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add / Import Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--color-accent-primary)" />
              Student Registration & Import
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Register students manually, or import them in bulk using our spreadsheet template.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {/* Manual Form */}
            <form onSubmit={handleAddStudent} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Student Full Name"
                  value={sName}
                  onChange={e => setSName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Roll No"
                  value={sRoll}
                  onChange={e => setSRoll(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={16} /> Add Individual Student
              </button>
            </form>

            {/* Excel / CSV Import */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Excel / CSV Import</span>
                <button type="button" onClick={downloadCsvTemplate} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Download size={12} /> Template
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  id="csv-file"
                  style={{ display: 'none' }}
                />
                <label htmlFor="csv-file" className="btn-secondary" style={{ flex: 1, cursor: 'pointer', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  <Upload size={16} /> {csvFile ? csvFile.name : 'Select CSV File'}
                </label>
                {csvFile && (
                  <button onClick={processCsvImport} className="btn-primary">
                    Import
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Listing */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} color="var(--color-accent-primary)" />
          Student Performance roster
        </h2>

        {students.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '30px' }}>
            No students registered in this classroom yet. Use the sidebar to upload your class roster.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Roll No</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Full Name</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Temp Password</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center' }}>Fire Drill</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center' }}>EQ Quiz</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center' }}>Flood Quiz</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center' }}>Landslide Quiz</th>
                <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const fireDrill = student.scores.find(sc => sc.disaster_type === 'fire' && sc.activity_type === 'drill');
                const eqQuiz = student.scores.find(sc => sc.disaster_type === 'earthquake' && sc.activity_type === 'quiz');
                const floodQuiz = student.scores.find(sc => sc.disaster_type === 'flood' && sc.activity_type === 'quiz');
                const lsQuiz = student.scores.find(sc => sc.disaster_type === 'landslide' && sc.activity_type === 'quiz');

                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 'bold' }}>{student.roll_no}</td>
                    <td style={{ padding: '16px 8px', fontWeight: '600' }}>{student.name}</td>
                    <td style={{ padding: '16px 8px' }}><code style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{student.name}</code></td>
                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                      {fireDrill ? (
                        <span style={{ color: 'var(--color-safe)' }}>{fireDrill.score}pts ({fireDrill.duration_seconds}s)</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                      {eqQuiz ? `${eqQuiz.score}%` : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                      {floodQuiz ? `${floodQuiz.score}%` : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                      {lsQuiz ? `${lsQuiz.score}%` : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteStudent(student.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-fire)' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
