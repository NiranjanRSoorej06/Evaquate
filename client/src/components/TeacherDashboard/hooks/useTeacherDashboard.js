import { useState, useEffect, useCallback } from 'react';
import { disasterOptions } from '../constants.js';
import { useToast } from '../../Toast';

export function useTeacherDashboard(user) {
  const addToast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
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
      const response = await fetch(`/api/teacher/${user.id}/students`, { credentials: 'include', skipGlobalToast: true });
      const data = await response.json();
      if (data?.students) setStudents(data.students);
    } catch (err) {
      console.error('Error fetching teacher data', err);
      setErrorMsg('Unable to load student data right now.');
      addToast('Unable to load student data right now.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchTeacherQuizzes = useCallback(async () => {
    if (!user?.id) return;
    setQuizzesLoading(true);
    try {
      const response = await fetch(`/api/teacher/${user.id}/quizzes`, { credentials: 'include', skipGlobalToast: true });
      const data = await response.json();
      if (data?.quizzes) {
        setAssignedQuizzes(data.quizzes);
        setAssignedQuizCount(data.assigned_count ?? data.quizzes.length);
      }
    } catch (err) {
      console.error('Error fetching teacher quizzes', err);
      setErrorMsg('Unable to load quiz status right now.');
      addToast('Unable to load quiz status right now.', 'error');
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
      const response = await fetch(`/api/teacher/${user.id}/quizzes/${quizId}`, { credentials: 'include', skipGlobalToast: true });
      const data = await response.json();
      if (data?.questions) setSelectedQuizDetail(data);
      else {
        setErrorMsg(data.message || 'Could not load quiz questions.');
        addToast(data.message || 'Could not load quiz questions.', 'error');
      }
    } catch {
      setErrorMsg('Could not load quiz questions.');
      addToast('Could not load quiz questions.', 'error');
    } finally {
      setQuizDetailLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId, label) => {
    if (!window.confirm(`Delete ${label || 'this quiz'}? Students will no longer see it.`)) return;
    try {
      const response = await fetch(`/api/teacher/${user.id}/quizzes/${quizId}`, {
        method: 'DELETE',
        credentials: 'include',
        skipGlobalToast: true
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`${label || 'Quiz'} deleted.`);
        addToast(`${label || 'Quiz'} deleted.`, 'success');
        if (selectedQuizDetail?.id === quizId) setSelectedQuizDetail(null);
        fetchTeacherQuizzes();
      } else {
        setErrorMsg(data.message || 'Could not delete quiz.');
        addToast(data.message || 'Could not delete quiz.', 'error');
      }
    } catch {
      setErrorMsg('Could not delete quiz.');
      addToast('Could not delete quiz.', 'error');
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
      const response = await fetch(`/api/teacher/${user?.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: studentName, roll_no: studentRollNo, school_id: user?.school_id }),
        skipGlobalToast: true
      });
      const data = await response.json();
      if (data.success) {
        const msg = `Student added. Login ID: ${data.student?.id || 'generated'} (password: name)`;
        setSuccessMsg(msg);
        addToast(msg, 'success');
        setStudentName('');
        setStudentRollNo('');
        fetchTeacherData();
      } else {
        setErrorMsg(data.message || 'Failed to add student.');
        addToast(data.message || 'Failed to add student.', 'error');
      }
    } catch {
      setErrorMsg('Could not connect to the server.');
      addToast('Could not connect to the server.', 'error');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Remove this student from your class?')) return;
    try {
      const response = await fetch(`/api/teacher/${user?.id}/students/${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
        skipGlobalToast: true
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Student removed.');
        addToast('Student removed.', 'success');
        fetchTeacherData();
      }
    } catch {
      setErrorMsg('Unable to remove student right now.');
      addToast('Unable to remove student right now.', 'error');
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
      addToast('Choose a student CSV or Excel file before uploading.', 'error');
      return;
    }
    setUploadingStudents(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (!user?.school_id) {
        setErrorMsg('Unable to determine your school. Please refresh the page.');
        addToast('Unable to determine your school. Please refresh the page.', 'error');
        setUploadingStudents(false);
        return;
      }
      const formData = new FormData();
      formData.append('student_file', studentFile);
      formData.append('school_id', user.school_id);
      const response = await fetch(`/api/teacher/${user?.id}/students/import`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        skipGlobalToast: true
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        console.error('Student import parse error:', parseErr, text);
      }
      if (response.ok && data?.success) {
        const msg = `${data.addedCount} student(s) imported. ${data.skippedCount || 0} skipped.`;
        setSuccessMsg(msg);
        addToast(msg, 'success');
        setStudentFile(null);
        fetchTeacherData();
      } else {
        setErrorMsg(data?.message || text || response.statusText || 'Student import failed.');
        addToast(data?.message || text || response.statusText || 'Student import failed.', 'error');
      }
    } catch (err) {
      console.error('Student import error', err);
      setErrorMsg('Could not upload the student file.');
      addToast('Could not upload the student file.', 'error');
    } finally {
      setUploadingStudents(false);
    }
  };

  const handleQuizUpload = async (e) => {
    e.preventDefault();
    if (!quizFile) {
      setErrorMsg('Choose a CSV file before uploading.');
      addToast('Choose a CSV file before uploading.', 'error');
      return;
    }
    setUploadingQuiz(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('quiz_file', quizFile);
      formData.append('disaster_type', selectedDisaster);
      const response = await fetch(`/api/teacher/${user?.id}/quizzes/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        skipGlobalToast: true
      });
      const data = await response.json();
      if (data.success) {
        const msg = `${data.label || 'Quiz'} uploaded for ${selectedDisaster}. Students can now access it.`;
        setSuccessMsg(msg);
        addToast(msg, 'success');
        setQuizFile(null);
        fetchTeacherQuizzes();
      } else {
        setErrorMsg(data.message || 'Quiz upload failed.');
        addToast(data.message || 'Quiz upload failed.', 'error');
      }
    } catch {
      setErrorMsg('Could not upload the quiz file.');
      addToast('Could not upload the quiz file.', 'error');
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
