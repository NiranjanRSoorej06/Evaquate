import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../components/Toast';

export function useAdminDashboard(user) {
  const addToast = useToast();
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState('');
  const [selectedCellType, setSelectedCellType] = useState('wall');

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
    try {
      let response, resData;
      if (isEditingTeacher) {
        response = await fetch(`http://localhost:3001/api/admin/${user?.id}/teachers/${isEditingTeacher}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: tName, password: tPassword, class_assigned: tClass }),
          skipGlobalToast: true
        });
        resData = await response.json();
      } else {
        response = await fetch(`http://localhost:3001/api/admin/${user?.id}/teachers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: tName, password: tPassword, class_assigned: tClass }),
          skipGlobalToast: true
        });
        resData = await response.json();
      }

      if (resData.success) {
        addToast(
          isEditingTeacher
            ? 'Teacher updated successfully.'
            : `Teacher account created. Login ID: ${resData.teacher?.id || `${user?.unique_code}_${tClass}`.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          'success'
        );
        setTName('');
        setTPassword('');
        setTClass('');
        setIsEditingTeacher(null);
        setShowPassword(false);
        fetchDashboardData();
      } else {
        addToast(resData.message || 'Action failed.', 'error');
      }
    } catch (err) {
      addToast('Failed to reach backend.', 'error');
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
        addToast('Teacher account deleted.', 'success');
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
      setProcessError('');
    }
  };

  // Process a SchoolLayout JSON file using the exact same logic as the Game Website's
  // handleJSONUpload (game/src/App.tsx). Validates, normalizes defaults, and returns
  // a complete SchoolLayout object ready for the backend.
  const processSchoolLayoutJSON = (parsed) => {
    // Validate minimum required fields
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON format. Expected a school layout object.');
    }
    if (!parsed.schoolName || typeof parsed.schoolName !== 'string') {
      throw new Error('Missing or invalid "schoolName" property (must be a string).');
    }
    if (typeof parsed.floorsCount !== 'number' || parsed.floorsCount < 1) {
      throw new Error('Missing or invalid "floorsCount" property (must be a positive number).');
    }
    if (!Array.isArray(parsed.rooms) || parsed.rooms.length === 0) {
      throw new Error('Missing or empty "rooms" array.');
    }

    // Process and default missing values in rooms
    const defaultColorMap = {
      classroom: '#e0f2fe',
      laboratory: '#f0fdf4',
      library: '#fdf8f5',
      office: '#fef2f2',
      corridor: '#f1f5f9',
      staircase: '#fffbeb',
      emergency_exit: '#ecfdf5',
      assembly_area: '#f0fdf4',
      playground: '#f0fdf4',
      restroom: '#fafaf9',
      utility: '#f8fafc'
    };

    const processedRooms = parsed.rooms.map((room, index) => {
      if (!room.id) room.id = `rm_custom_${index}`;
      if (!room.name) room.name = `Room ${room.id.replace('rm_custom_', '')}`;
      if (!room.type) room.type = 'classroom';
      if (typeof room.x !== 'number' || typeof room.y !== 'number' ||
          typeof room.width !== 'number' || typeof room.height !== 'number') {
        throw new Error(`Room [${room.name || index}] is missing dimensions or coordinates (x, y, width, height must be numbers 0-100).`);
      }
      if (typeof room.floor !== 'number') room.floor = 1;
      room.color = room.color || defaultColorMap[room.type] || '#f1f5f9';

      // Default doors if not specified
      if (!room.doors || !Array.isArray(room.doors)) {
        room.doors = [{
          id: `door_${room.id}_auto`,
          x: Math.round(room.x + room.width / 2),
          y: Math.round(room.y + room.height),
          width: room.width > room.height ? 4 : 1,
          height: room.width > room.height ? 1 : 4,
          isOpen: true,
          isBlocked: false
        }];
      } else {
        room.doors = room.doors.map((door, dIndex) => ({
          id: door.id || `door_${room.id}_${dIndex}`,
          x: typeof door.x === 'number' ? door.x : room.x + room.width / 2,
          y: typeof door.y === 'number' ? door.y : room.y + room.height,
          width: typeof door.width === 'number' ? door.width : 4,
          height: typeof door.height === 'number' ? door.height : 1,
          isOpen: typeof door.isOpen === 'boolean' ? door.isOpen : true,
          isBlocked: typeof door.isBlocked === 'boolean' ? door.isBlocked : false,
          leadsTo: door.leadsTo || undefined
        }));
      }

      // Default windows
      if (!room.windows || !Array.isArray(room.windows)) {
        room.windows = [];
      } else {
        room.windows = room.windows.map((win, wIndex) => ({
          id: win.id || `win_${room.id}_${wIndex}`,
          x: typeof win.x === 'number' ? win.x : room.x + room.width / 3,
          y: typeof win.y === 'number' ? win.y : room.y,
          width: typeof win.width === 'number' ? win.width : 4
        }));
      }

      // Default furniture
      if (!room.furniture || !Array.isArray(room.furniture)) {
        room.furniture = [];
      } else {
        room.furniture = room.furniture.map((fur, fIndex) => ({
          id: fur.id || `fur_${room.id}_${fIndex}`,
          name: fur.name || 'Desk',
          type: fur.type || 'desk',
          x: typeof fur.x === 'number' ? fur.x : room.x + 2,
          y: typeof fur.y === 'number' ? fur.y : room.y + 2,
          width: typeof fur.width === 'number' ? fur.width : 3,
          height: typeof fur.height === 'number' ? fur.height : 2,
          canShelterUnder: typeof fur.canShelterUnder === 'boolean' ? fur.canShelterUnder : true
        }));
      }

      return room;
    });

    // Process assemblyArea
    let assemblyArea = parsed.assemblyArea;
    if (!assemblyArea || typeof assemblyArea !== 'object') {
      assemblyArea = { x: 80, y: 80, radius: 12, name: 'Designated Assembly Area' };
    } else {
      assemblyArea = {
        x: typeof assemblyArea.x === 'number' ? assemblyArea.x : 80,
        y: typeof assemblyArea.y === 'number' ? assemblyArea.y : 80,
        radius: typeof assemblyArea.radius === 'number' ? assemblyArea.radius : 12,
        name: assemblyArea.name || 'Safe Assembly Zone'
      };
    }

    return {
      schoolName: parsed.schoolName,
      floorsCount: parsed.floorsCount,
      rooms: processedRooms,
      assemblyArea
    };
  };

  const startAIScan = () => {
    if (!file) return;
    setIsProcessing(true);
    setProcessError('');

    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        const parsed = JSON.parse(text);

        // Process using exact same logic as game website
        const completeLayout = processSchoolLayoutJSON(parsed);

        // Send processed layout to backend
        const response = await fetch(`http://localhost:3001/api/admin/${user?.id}/blueprint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ blueprint_json: completeLayout }),
          skipGlobalToast: true
        });
        const resData = await response.json();
        if (resData.success) {
          setFile(null);
          addToast(`Blueprint loaded: ${completeLayout.schoolName} (${completeLayout.rooms.length} rooms, ${completeLayout.floorsCount} floor(s)).`, 'success');
          fetchDashboardData();
        } else {
          const errMsg = resData.message || 'Failed to save blueprint.';
          setProcessError(errMsg);
          addToast(errMsg, 'error');
        }
      } catch (err) {
        const errMsg = err.message || 'Syntax error inside JSON file.';
        setProcessError(errMsg);
        addToast(errMsg, 'error');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setProcessError('Error reading JSON file.');
      setIsProcessing(false);
    };
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
    isProcessing,
    processError,
    selectedCellType,
    setSelectedCellType,
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
