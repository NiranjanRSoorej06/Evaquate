import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, UserPlus, BarChart3, ShieldCheck, Menu, X, Upload, Flame, ShieldAlert, Waves, Mountain, BookOpen, ChevronLeft } from 'lucide-react';

const disasterOptions = [
  { id: 'fire', label: 'Fire Safety', description: 'Fire escape and extinguisher basics', icon: Flame, color: '#ef4444' },
  { id: 'earthquake', label: 'Earthquake Drill', description: 'Drop, cover and hold procedures', icon: ShieldAlert, color: '#f97316' },
  { id: 'flood', label: 'Flood Survival', description: 'Safe routes and high-ground planning', icon: Waves, color: '#0ea5e9' },
  { id: 'landslide', label: 'Landslide Safety', description: 'Evacuation and hazard awareness', icon: Mountain, color: '#8b5cf6' }
];

export default function TeacherDashboard({ user, onLogout }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentFile, setStudentFile] = useState(null);
  const [uploadingStudents, setUploadingStudents] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedDisaster, setSelectedDisaster] = useState('fire');
  const [quizFile, setQuizFile] = useState(null);
  const [uploadingQuiz, setUploadingQuiz] = useState(false);
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [assignedQuizCount, setAssignedQuizCount] = useState(0);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [selectedQuizDetail, setSelectedQuizDetail] = useState(null);
  const [quizDetailLoading, setQuizDetailLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobileMode = window.innerWidth <= 1024;
      setIsMobile(mobileMode);
      if (!mobileMode) setIsSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTeacherData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.id}/students`, { credentials: 'include' });
      const data = await response.json();
      if (data?.students) setStudents(data.students);
    } catch (err) {
      console.error('Error fetching teacher data', err);
      setErrorMsg('Unable to load student data right now.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchTeacherQuizzes = useCallback(async () => {
    if (!user?.id) return;
    setQuizzesLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.id}/quizzes`, { credentials: 'include' });
      const data = await response.json();
      if (data?.quizzes) {
        setAssignedQuizzes(data.quizzes);
        setAssignedQuizCount(data.assigned_count ?? data.quizzes.length);
      }
    } catch (err) {
      console.error('Error fetching teacher quizzes', err);
      setErrorMsg('Unable to load quiz status right now.');
    } finally {
      setQuizzesLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTeacherData();
    fetchTeacherQuizzes();
  }, [fetchTeacherData, fetchTeacherQuizzes]);

  useEffect(() => {
    if (activeTab === 'quizzes') {
      fetchTeacherQuizzes();
    }
  }, [activeTab, fetchTeacherQuizzes]);

  const getDisasterOption = (disasterType) => disasterOptions.find(option => option.id === disasterType);

  const handleViewQuiz = async (quizId) => {
    if (!user?.id) return;
    setQuizDetailLoading(true);
    setSelectedQuizDetail(null);
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.id}/quizzes/${quizId}`, { credentials: 'include' });
      const data = await response.json();
      if (data?.questions) {
        setSelectedQuizDetail(data);
      } else {
        setErrorMsg(data.message || 'Could not load quiz questions.');
      }
    } catch (err) {
      setErrorMsg('Could not load quiz questions.');
    } finally {
      setQuizDetailLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId, label) => {
    if (!window.confirm(`Delete ${label || 'this quiz'}? Students will no longer see it.`)) return;
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.id}/quizzes/${quizId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`${label || 'Quiz'} deleted.`);
        if (selectedQuizDetail?.id === quizId) setSelectedQuizDetail(null);
        fetchTeacherQuizzes();
      } else {
        setErrorMsg(data.message || 'Could not delete quiz.');
      }
    } catch (err) {
      setErrorMsg('Could not delete quiz.');
    }
  };

  const answerLabel = (index) => ['A', 'B', 'C', 'D'][index] || '?';

  const getLatestScore = (student, disasterType, activityType) => {
    const score = (student.scores || []).find(sc => sc.disaster_type === disasterType && sc.activity_type === activityType);
    return score ? score.score : null;
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user?.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: studentName, roll_no: studentRollNo, school_id: user?.school_id })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`Student added. Login ID: ${data.student?.id || 'generated'} (password: name)`);
        setStudentName('');
        setStudentRollNo('');
        fetchTeacherData();
      } else {
        setErrorMsg(data.message || 'Failed to add student.');
      }
    } catch (err) {
      setErrorMsg('Could not connect to the server.');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Remove this student from your class?')) return;
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user?.id}/students/${studentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Student removed.');
        fetchTeacherData();
      }
    } catch (err) {
      setErrorMsg('Unable to remove student right now.');
    }
  };

  const downloadStudentTemplate = () => {
    const csvContent = 'STUDENT NAME,ROLL NUMBER\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStudentFileChange = (e) => {
    setStudentFile(e.target.files?.[0] || null);
  };

  const handleImportStudents = async (e) => {
    e.preventDefault();
    if (!studentFile) {
      setErrorMsg('Choose a student CSV or Excel file before uploading.');
      return;
    }

    setUploadingStudents(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!user?.school_id) {
        setErrorMsg('Unable to determine your school. Please refresh the page.');
        setUploadingStudents(false);
        return;
      }

      const formData = new FormData();
      formData.append('student_file', studentFile);
      formData.append('school_id', user.school_id);

      const response = await fetch(`http://localhost:3001/api/teacher/${user?.id}/students/import`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        console.error('Student import parse error:', parseErr, text);
      }

      if (response.ok && data?.success) {
        setSuccessMsg(`${data.addedCount} student(s) imported. ${data.skippedCount || 0} skipped.`);
        setStudentFile(null);
        fetchTeacherData();
      } else {
        const message = data?.message || text || response.statusText || 'Student import failed.';
        setErrorMsg(message);
      }
    } catch (err) {
      console.error('Student import error', err);
      setErrorMsg('Could not upload the student file.');
    } finally {
      setUploadingStudents(false);
    }
  };

  const handleQuizUpload = async (e) => {
    e.preventDefault();
    if (!quizFile) {
      setErrorMsg('Choose a CSV file before uploading.');
      return;
    }

    setUploadingQuiz(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('quiz_file', quizFile);
      formData.append('disaster_type', selectedDisaster);

      const response = await fetch(`http://localhost:3001/api/teacher/${user?.id}/quizzes/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`${data.label || 'Quiz'} uploaded for ${selectedDisaster}. Students can now access it.`);
        setQuizFile(null);
        fetchTeacherQuizzes();
      } else {
        setErrorMsg(data.message || 'Quiz upload failed.');
      }
    } catch (err) {
      setErrorMsg('Could not upload the quiz file.');
    } finally {
      setUploadingQuiz(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#0284c7', fontWeight: '600' }}>Preparing your teacher dashboard...</div>;
  }

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', backgroundColor: '#f0f9ff', color: '#0f172a', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .panel-card { background: #ffffff; border: 1px solid #e0f2fe; border-radius: 16px; padding: 24px; box-shadow: 0 4px 18px rgba(2, 132, 199, 0.04); }
        .btn-action { background: #0284c7; color: #fff; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .btn-action:hover { background: #0369a1; }
        .btn-danger-outline { background: transparent; color: #b91c1c; border: 1px solid #fee2e2; padding: 10px 16px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .btn-danger-outline:hover { background: #fef2f2; }
        .form-control { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }
        .form-control:focus { border-color: #0284c7; outline: none; box-shadow: 0 0 0 3px rgba(2,132,199,0.08); }
        .label-text { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
        .nav-button { background: transparent; border: none; color: #e0f2fe; padding: 12px 14px; border-radius: 10px; font-weight: 500; display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; cursor: pointer; }
        .nav-button:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .nav-button-active { background: rgba(255,255,255,0.15) !important; color: #fff !important; font-weight: 600; }
        .quiz-status-card { text-align: left; border-radius: 14px; border: 1px solid #e2e8f0; background: #fff; padding: 18px; cursor: pointer; transition: all 0.15s ease; width: 100%; font-family: inherit; }
        .quiz-status-card:hover { border-color: #0284c7; box-shadow: 0 8px 20px rgba(2, 132, 199, 0.08); transform: translateY(-1px); }
        .quiz-status-card-disabled { cursor: default; opacity: 0.72; }
        .quiz-status-card-disabled:hover { border-color: #e2e8f0; box-shadow: none; transform: none; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .status-assigned { background: #dcfce7; color: #166534; }
        .status-unassigned { background: #f1f5f9; color: #64748b; }
        .question-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; }
        .option-pill { display: inline-block; padding: 8px 12px; border-radius: 8px; background: #fff; border: 1px solid #e2e8f0; font-size: 13px; margin: 4px 8px 4px 0; }
        .option-pill-correct { background: #dcfce7; border-color: #86efac; color: #166534; font-weight: 600; }
        .quiz-list-item { display: flex; align-items: center; gap: 12px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; background: #fff; }
        .quiz-list-actions { display: flex; gap: 8px; margin-left: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px 10px; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        tr:last-child td { border-bottom: none; }
      `}</style>

      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0284c7', color: '#fff', padding: '0 20px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, height: '60px', boxShadow: '0 2px 8px rgba(2,132,199,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="#fff" />
            <span style={{ fontWeight: '700' }}>Teacher Dashboard</span>
          </div>
          <button type="button" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {isMobile && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.3)', zIndex: 998 }} />}

      <aside style={{ width: '280px', backgroundColor: '#0284c7', color: '#fff', padding: '32px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '28px', transition: 'transform 0.25s ease', zIndex: 1000, ...(isMobile ? { position: 'fixed', left: 0, top: 0, bottom: 0, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="#0284c7" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Teacher Workspace</h2>
            <span style={{ fontSize: '12px', color: '#e0f2fe' }}>Class management</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button type="button" onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} className={`nav-button ${activeTab === 'overview' ? 'nav-button-active' : ''}`}>
            <BarChart3 size={18} /> Overview Console
          </button>
          <button type="button" onClick={() => { setActiveTab('quiz'); setIsSidebarOpen(false); }} className={`nav-button ${activeTab === 'quiz' ? 'nav-button-active' : ''}`}>
            <Upload size={18} /> Add Quiz
          </button>
          <button type="button" onClick={() => { setActiveTab('quizzes'); setSelectedQuizDetail(null); setIsSidebarOpen(false); }} className={`nav-button ${activeTab === 'quizzes' ? 'nav-button-active' : ''}`}>
            <BookOpen size={18} /> My Quizzes
          </button>
        </nav>

        <button type="button" onClick={onLogout} style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
          Sign Out
        </button>
      </aside>

      <main style={{ flex: 1, padding: isMobile ? '24px 20px 20px' : '40px', paddingTop: isMobile ? '84px' : '40px', boxSizing: 'border-box', overflowY: 'auto' }}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', margin: 0 }}>Teacher Control Center</h1>
          <p style={{ color: '#64748b', margin: '6px 0 0 0' }}>Welcome back, {user?.name || 'Teacher'} • {user?.class_assigned || 'Classroom'}</p>
        </header>

        {successMsg && <div style={{ padding: '14px 16px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', color: '#166534', marginBottom: '20px' }}>{successMsg}</div>}
        {errorMsg && <div style={{ padding: '14px 16px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', marginBottom: '20px' }}>{errorMsg}</div>}

        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className="panel-card">
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Students</div>
                <div style={{ fontSize: '30px', fontWeight: '700', color: '#0284c7', marginTop: '6px' }}>{students.length}</div>
              </div>
              <div className="panel-card">
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Assigned Quizzes</div>
                <div style={{ fontSize: '30px', fontWeight: '700', color: '#0284c7', marginTop: '6px' }}>{assignedQuizCount}</div>
              </div>
              <div className="panel-card">
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Latest Drill</div>
                <div style={{ fontSize: '30px', fontWeight: '700', color: '#0284c7', marginTop: '6px' }}>{students.length ? `${students[0]?.scores?.find(sc => sc.activity_type === 'drill')?.score || 0} pts` : '0 pts'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.1fr', gap: '24px' }}>
              <div className="panel-card">
                <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><UserPlus size={20} color="#0284c7" /> Add Student</h3>
                <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '14px' }}>
                  Students log in with their <strong>Student ID</strong> and password (their full name).
                </p>
                <form onSubmit={handleAddStudent}>
                  <div style={{ marginBottom: '16px' }}><label className="label-text">Student Name</label><input type="text" className="form-control" value={studentName} onChange={e => setStudentName(e.target.value)} required /></div>
                  <div style={{ marginBottom: '20px' }}><label className="label-text">Roll Number</label><input type="text" className="form-control" value={studentRollNo} onChange={e => setStudentRollNo(e.target.value)} required /></div>
                  <button type="submit" className="btn-action" style={{ width: '100%' }}>Add Student</button>
                </form>

                <div style={{ marginTop: '28px' }}>
                  <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><Upload size={20} color="#0284c7" /> Bulk Student Upload</h3>
                  <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '14px' }}>
                    Download a sample CSV, fill in rows, and upload it as CSV, XLS, or XLSX.
                  </p>
                  <button type="button" onClick={downloadStudentTemplate} className="btn-action" style={{ width: '100%', marginBottom: '16px' }}>
                    Download student template
                  </button>
                  <form onSubmit={handleImportStudents}>
                    <div style={{ marginBottom: '16px' }}>
                      <label className="label-text">Upload student file</label>
                      <input
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        onChange={handleStudentFileChange}
                        className="form-control"
                        style={{ padding: '10px 12px' }}
                        required
                      />
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px dashed #bae6fd', borderRadius: '12px', padding: '14px 16px', color: '#0369a1', fontSize: '13px', marginBottom: '18px' }}>
                      <strong>Required columns:</strong> STUDENT NAME, ROLL NUMBER
                    </div>
                    <button type="submit" className="btn-action" disabled={uploadingStudents} style={{ width: '100%' }}>
                      {uploadingStudents ? 'Importing students...' : 'Upload student list'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="panel-card">
                <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 size={20} color="#0284c7" /> Student Statistics</h3>
                <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '14px' }}>Review performance for each student in your class.</p>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr><th>Student ID</th><th>Roll</th><th>Name</th><th>Fire Drill</th><th>Quiz</th><th></th></tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>No students yet.</td></tr>
                      ) : students.map(student => (
                        <tr key={student.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{student.id}</td>
                          <td>{student.roll_no}</td>
                          <td>{student.name}</td>
                          <td>{getLatestScore(student, 'fire', 'drill') != null ? `${getLatestScore(student, 'fire', 'drill')} pts` : '?'}</td>
                          <td>{getLatestScore(student, 'earthquake', 'quiz') != null ? `${getLatestScore(student, 'earthquake', 'quiz')}%` : '?'}</td>
                          <td><button type="button" onClick={() => handleDeleteStudent(student.id)} className="btn-danger-outline">Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'quizzes' && (
          <div style={{ maxWidth: '960px' }}>
            {!selectedQuizDetail ? (
              <div className="panel-card">
                <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BookOpen size={20} color="#0284c7" /> My Quizzes
                </h3>
                <p style={{ color: '#64748b', margin: '0 0 24px 0', fontSize: '14px' }}>
                  View or delete uploaded quizzes. You can upload multiple quizzes per disaster from Add Quiz.
                </p>

                {quizzesLoading ? (
                  <p style={{ color: '#64748b' }}>Loading quizzes...</p>
                ) : assignedQuizzes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {disasterOptions.map(option => {
                      const moduleQuizzes = assignedQuizzes.filter(quiz => quiz.disaster_type === option.id);
                      if (moduleQuizzes.length === 0) return null;
                      const Icon = option.icon;
                      return (
                        <div key={option.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${option.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon size={18} color={option.color} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{option.label}</h4>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {moduleQuizzes.map(quiz => (
                              <div key={quiz.id} className="quiz-list-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{quiz.label || quiz.title}</div>
                                  <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                                    {quiz.question_count} question{quiz.question_count === 1 ? '' : 's'}
                                  </div>
                                </div>
                                <div className="quiz-list-actions" style={{ display: 'flex', gap: '8px' }}>
                                  <button type="button" onClick={() => handleViewQuiz(quiz.id)} className="btn-action" style={{ padding: '8px 14px', fontSize: '13px' }}>View</button>
                                  <button type="button" onClick={() => handleDeleteQuiz(quiz.id, quiz.label)} className="btn-danger-outline" style={{ padding: '8px 14px', fontSize: '13px' }}>Delete</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ color: '#64748b', margin: 0 }}>No quizzes uploaded yet. Use Add Quiz to upload your first one.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="panel-card">
                <button
                  type="button"
                  onClick={() => setSelectedQuizDetail(null)}
                  style={{ background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, marginBottom: '18px', fontWeight: '600', fontSize: '14px' }}
                >
                  <ChevronLeft size={18} /> Back to my quizzes
                </button>

                {quizDetailLoading ? (
                  <p style={{ color: '#64748b' }}>Loading questions...</p>
                ) : (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '700' }}>{selectedQuizDetail.label || selectedQuizDetail.title}</h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        {getDisasterOption(selectedQuizDetail.disaster_type)?.label || selectedQuizDetail.disaster_type} • {selectedQuizDetail.questions.length} questions
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {selectedQuizDetail.questions.map((question, index) => (
                        <div key={index} className="question-card">
                          <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                            Q{index + 1}. {question.question}
                          </div>
                          <div>
                            {question.options.map((option, optionIndex) => (
                              <span
                                key={optionIndex}
                                className={`option-pill ${optionIndex === question.answer ? 'option-pill-correct' : ''}`}
                              >
                                {answerLabel(optionIndex)}. {option}
                                {optionIndex === question.answer ? ' ✓' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="panel-card" style={{ maxWidth: '900px' }}>
            <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><Upload size={20} color="#0284c7" /> Add Quiz</h3>
            <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '14px' }}>Choose a disaster module and upload a CSV file. You can upload multiple quizzes (Quiz 1, Quiz 2, …) for the same disaster.</p>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px', marginBottom: '22px' }}>
              {disasterOptions.map(option => (
                <button key={option.id} type="button" onClick={() => setSelectedDisaster(option.id)} style={{ textAlign: 'left', borderRadius: '14px', border: selectedDisaster === option.id ? '2px solid #0284c7' : '1px solid #e2e8f0', background: selectedDisaster === option.id ? '#f0f9ff' : '#fff', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${option.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <option.icon size={20} color={option.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{option.label}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{option.description}</div>
                  </div>
                </button>
              ))}
            </div>

            <form onSubmit={handleQuizUpload}>
              <div style={{ marginBottom: '16px' }}>
                <label className="label-text">Upload CSV File</label>
                <input type="file" accept=".csv" onChange={e => setQuizFile(e.target.files?.[0] || null)} className="form-control" style={{ padding: '10px 12px' }} required />
              </div>
              <div style={{ background: '#f8fafc', border: '1px dashed #bae6fd', borderRadius: '12px', padding: '14px 16px', color: '#0369a1', fontSize: '13px', marginBottom: '18px' }}>
                <strong>CSV format:</strong> question, option1, option2, option3, option4, answer
              </div>
              <button type="submit" className="btn-action" disabled={uploadingQuiz} style={{ width: '100%' }}>{uploadingQuiz ? 'Uploading quiz...' : 'Upload Quiz'}</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
