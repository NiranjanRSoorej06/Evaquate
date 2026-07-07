import { useState, useEffect } from 'react';

export function useSuperAdminDashboard() {
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
      const response = await fetch(`http://localhost:3001/api/superadmin/schools/${schoolId}/teachers`, { credentials: 'include' });
      const data = await response.json();
      setTeachers(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch teachers');
    }
  };

  const fetchStudents = async (schoolId, teacherId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/superadmin/schools/${schoolId}/teachers/${teacherId}/students`, { credentials: 'include' });
      const data = await response.json();
      setStudents(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch students');
    }
  };

  useEffect(() => {
    if (sidebarTab === 'directory') fetchSchools();
  }, [sidebarTab]);

  const handleRegisterSchool = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await fetch('http://localhost:3001/api/superadmin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, unique_code: code, password })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`School registered successfully! ID: ${code}`);
        setName('');
        setCode('');
        setPassword('');
        setShowRegisterPassword(false);
        fetchSchools();
      } else {
        setError(data.message || 'Failed to register school.');
      }
    } catch (err) {
      setError('Connection failure.');
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
        body: JSON.stringify({ disabled: !currentDisabled })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`School ${!currentDisabled ? 'disabled' : 'enabled'} successfully.`);
        fetchSchools();
      } else {
        setError(data.message || 'Failed to update school.');
      }
    } catch (err) {
      setError('Connection failure.');
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
        body: JSON.stringify({ password: resetPassword })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('Password reset successfully.');
        setResetPassword('');
        setResetTarget(null);
        if (resetTarget.type === 'teacher') fetchTeachers(selectedSchool.id);
        else fetchStudents(selectedSchool.id, selectedTeacher.id);
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Connection failure.');
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
