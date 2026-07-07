import { useState, useEffect, useCallback } from 'react';
import { disasterOptions } from '../constants.js';

export function useTeacherDashboard(user) {
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
    if (activeTab === 'quizzes') fetchTeacherQuizzes();
  }, [activeTab, fetchTeacherQuizzes]);

  const getDisasterOption = (disasterType) => disasterOptions.find(option => option.id === disasterType);

  const handleViewQuiz = async (quizId) => {
    if (!user?.id) return;
    setQuizDetailLoading(true);
    setSelectedQuizDetail(null);
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.id}/quizzes/${quizId}`, { credentials: 'include' });
      const data = await response.json();
      if (data?.questions) setSelectedQuizDetail(data);
      else setErrorMsg(data.message || 'Could not load quiz questions.');
    } catch {
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
    } catch {
      setErrorMsg('Could not delete quiz.');
    }
  };

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
    } catch {
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
    } catch {
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

  const handleStudentFileChange = (e) => setStudentFile(e.target.files?.[0] || null);

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
        body: formData
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
        setErrorMsg(data?.message || text || response.statusText || 'Student import failed.');
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
    } catch {
      setErrorMsg('Could not upload the quiz file.');
    } finally {
      setUploadingQuiz(false);
    }
  };

  return {
    students, loading, activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, isMobile,
    studentName, setStudentName, studentRollNo, setStudentRollNo, studentFile, uploadingStudents,
    successMsg, errorMsg, selectedDisaster, setSelectedDisaster, quizFile, setQuizFile,
    uploadingQuiz, assignedQuizzes, assignedQuizCount, quizzesLoading, selectedQuizDetail,
    setSelectedQuizDetail, quizDetailLoading, getDisasterOption, handleViewQuiz, handleDeleteQuiz,
    getLatestScore, handleAddStudent, handleDeleteStudent, downloadStudentTemplate,
    handleStudentFileChange, handleImportStudents, handleQuizUpload
  };
}
