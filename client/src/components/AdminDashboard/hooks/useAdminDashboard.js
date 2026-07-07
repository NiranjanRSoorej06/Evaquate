import { useState, useEffect, useCallback } from 'react';

export function useAdminDashboard(user) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`http://localhost:3001/api/admin/${user.id}/dashboard`, { credentials: 'include' });
      const resData = await response.json();
      setData(resData);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
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
        setTName('');
        setTPassword('');
        setTClass('');
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
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
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

  const cancelEditTeacher = () => {
    setIsEditingTeacher(null);
    setTName('');
    setTClass('');
    setTPassword('');
    setShowPassword(false);
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
      setScanProgress((prev) => {
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
      setData((prev) => ({ ...prev, blueprint_json: updatedBlueprint }));
    } catch (err) {
      console.error('Error saving updated grid', err);
    }
  };

  const handleWipeBlueprint = () => {
    if (!window.confirm('Purge spatial records?')) return;
    setData((prev) => ({ ...prev, blueprint_json: null }));
    fetch(`http://localhost:3001/api/admin/${user?.id}/blueprint`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ blueprint_json: null })
    });
  };

  return {
    data,
    loading,
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    isMobile,
    tName,
    setTName,
    tPassword,
    setTPassword,
    tClass,
    setTClass,
    isEditingTeacher,
    showPassword,
    setShowPassword,
    file,
    isScanning,
    scanProgress,
    selectedCellType,
    setSelectedCellType,
    successMsg,
    errorMsg,
    user,
    handleCreateTeacher,
    handleEditTeacherClick,
    handleDeleteTeacher,
    cancelEditTeacher,
    handleFileUpload,
    startAIScan,
    handleCellClick,
    handleWipeBlueprint
  };
}
