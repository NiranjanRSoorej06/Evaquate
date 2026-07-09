import { useState, useEffect } from 'react';
import { useToast } from '../../Toast';

export function useSuperAdminDashboard() {
  const addToast = useToast();
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [sidebarTab, setSidebarTab] = useState('directory');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewLevel, setViewLevel] = useState('schools');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/superadmin/schools', { credentials: 'include' });
      const data = await response.json();
      setSchools(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async (schoolId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/superadmin/schools/${schoolId}/teachers`, { credentials: 'include', skipGlobalToast: true });
      const data = await response.json();
      setTeachers(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch teachers');
      addToast('Failed to fetch teachers', 'error');
    }
  };

  const fetchStudents = async (schoolId, teacherId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/superadmin/schools/${schoolId}/teachers/${teacherId}/students`, { credentials: 'include', skipGlobalToast: true });
      const data = await response.json();
      setStudents(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch students');
      addToast('Failed to fetch students', 'error');
    }
  };

  useEffect(() => {
    if (sidebarTab === 'directory') fetchSchools();
  }, [sidebarTab]);

  const handleRegisterSchool = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!/^[a-zA-Z]{3}$/.test(code)) {
      const msg = 'School ID Code must be exactly 3 alphabetic letters (e.g. ABC).';
      setError(msg);
      addToast(msg, 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/superadmin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, unique_code: code, password }),
        skipGlobalToast: true
      });
      const data = await response.json();
      if (data.success) {
        const msg = `School registered successfully! ID: ${code}`;
        setMessage(msg);
        addToast(msg, 'success');
        setName('');
        setCode('');
        setPassword('');
        setShowRegisterPassword(false);
        fetchSchools();
      } else {
        setError(data.message || 'Failed to register school.');
        addToast(data.message || 'Failed to register school.', 'error');
      }
    } catch (err) {
      setError('Connection failure.');
      addToast('Connection failure.', 'error');
    }
  };

  const handleViewTeachers = async (school) => {
    setSelectedSchool(school);
    setViewLevel('teachers');
    await fetchTeachers(school.id);
  };

  const handleViewStudents = async (teacher) => {
    setSelectedTeacher(teacher);
    setViewLevel('students');
    await fetchStudents(selectedSchool.id, teacher.id);
  };

  const handleDisableSchool = async (schoolId, currentDisabled) => {
    if (!window.confirm(`Are you sure you want to ${currentDisabled ? 'enable' : 'disable'} this school?`)) return;
    try {
      const response = await fetch(`http://localhost:3001/api/superadmin/schools/${schoolId}/disable`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ disabled: !currentDisabled }),
        skipGlobalToast: true
      });
      const data = await response.json();
      if (data.success) {
        const msg = `School ${!currentDisabled ? 'disabled' : 'enabled'} successfully.`;
        setMessage(msg);
        addToast(msg, 'success');
        fetchSchools();
      } else {
        setError(data.message || 'Failed to update school.');
        addToast(data.message || 'Failed to update school.', 'error');
      }
    } catch (err) {
      setError('Connection failure.');
      addToast('Connection failure.', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassword || !resetTarget) return;
    if (!window.confirm('Are you sure you want to reset this password?')) return;
    setError('');
    setMessage('');
    try {
      let url = '';
      if (resetTarget.type === 'teacher') {
        url = `http://localhost:3001/api/superadmin/schools/${selectedSchool.id}/teachers/${resetTarget.id}/reset-password`;
      } else {
        url = `http://localhost:3001/api/superadmin/schools/${selectedSchool.id}/teachers/${selectedTeacher.id}/students/${resetTarget.id}/reset-password`;
      }
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: resetPassword }),
        skipGlobalToast: true
      });
      const data = await response.json();
      if (data.success) {
        setMessage('Password reset successfully.');
        addToast('Password reset successfully.', 'success');
        setResetPassword('');
        setResetTarget(null);
        if (resetTarget.type === 'teacher') fetchTeachers(selectedSchool.id);
        else fetchStudents(selectedSchool.id, selectedTeacher.id);
      } else {
        setError(data.message || 'Failed to reset password.');
        addToast(data.message || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      setError('Connection failure.');
      addToast('Connection failure.', 'error');
    }
  };

  const openResetModal = (type, id) => {
    setResetTarget({ type, id });
    setResetPassword('');
  };

  return {
    schools, teachers, students, sidebarTab, setSidebarTab,
    isSidebarOpen, setIsSidebarOpen, isMobile, viewLevel, setViewLevel,
    selectedSchool, selectedTeacher, name, setName, code, setCode,
    password, setPassword, showRegisterPassword, setShowRegisterPassword,
    resetPassword, setResetPassword, showResetPassword, setShowResetPassword,
    resetTarget, setResetTarget, message, error,
    handleRegisterSchool, handleViewTeachers, handleViewStudents,
    handleDisableSchool, handleResetPassword, openResetModal
  };
}
