/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Room, SchoolLayout, DisasterType, Hazard, Player, NPC, ActionFeedback, DrillResult } from '../types';
import ThreeDCanvas from './ThreeDCanvas';
import { Play, Heart, Shield, Award, Clock, ArrowRight, UserCheck, AlertOctagon, HelpCircle, CheckCircle, Crosshair, Users, ShieldAlert } from 'lucide-react';

interface DrillPlatformProps {
  layout: SchoolLayout;
  onDrillComplete: (result: DrillResult) => void;
  disasterType: DisasterType;
  randomizedBlockages: boolean;
}

export default function DrillPlatform({
  layout,
  onDrillComplete,
  disasterType,
  randomizedBlockages
}: DrillPlatformProps) {
  // ----------------------------------------------------------------------
  // GAME INITIAL STATE GENERATORS
  // ----------------------------------------------------------------------

  const [role, setRole] = useState<Player['role']>('student');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);

  // Core Simulation State Refs and States
  const [player, setPlayer] = useState<Player>({
    id: 'user_1',
    name: 'Student Defender',
    role: 'student',
    x: 18, // Inside Class 101
    y: 20,
    floor: 1,
    health: 100,
    oxygen: 100,
    isDucked: false,
    hasGasMask: false,
    hasExtinguisher: false,
    hasFirstAidKit: false,
    isEvacuated: false,
    score: 100,
    xp: 0,
    statusLogs: ['Simulation initialized. Alarms active.']
  });

  const [npcs, setNpcs] = useState<NPC[]>([
    { id: 'npc_1', name: 'Jimmy (Classmate)', role: 'student', x: 26, y: 25, floor: 1, health: 60, isInjured: true, isSaved: false, classroomID: 'rm_101' },
    { id: 'npc_2', name: 'Sarah (Science Teacher)', role: 'teacher', x: 48, y: 18, floor: 1, health: 100, isInjured: false, isSaved: false, classroomID: 'rm_102' },
    { id: 'npc_3', name: 'Principal Harris', role: 'staff', x: 15, y: 65, floor: 1, health: 40, isInjured: true, isSaved: false, classroomID: 'rm_admin' }
  ]);

  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [showEvacPaths, setShowEvacPaths] = useState<boolean>(false);

  // Local mutable copy of rooms for the active drill session (for opening/closing doors, etc.)
  const [drillRooms, setDrillRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (layout) {
      setDrillRooms(layout.rooms);
    }
  }, [layout]);

  // Handle door toggle (open/close) during active simulation
  const handleToggleDoor = (roomId: string, doorId: string) => {
    let wasOpened = false;
    let targetRoomName = '';
    
    setDrillRooms(prevRooms => prevRooms.map(room => {
      if (room.id === roomId) {
        targetRoomName = room.name;
        const updatedDoors = room.doors.map(door => {
          if (door.id === doorId) {
            wasOpened = !door.isOpen;
            return { ...door, isOpen: wasOpened };
          }
          return door;
        });
        return { ...room, doors: updatedDoors };
      }
      return room;
    }));

    if (wasOpened) {
      addActionLog(`Opened door of ${targetRoomName}`, 5, true, "Established an open evacuation path to escape hazardous areas.");
    } else {
      addActionLog(`Closed door of ${targetRoomName}`, 2, true, "Compartmentalized room boundaries to limit toxic smoke or hazard propagation.");
    }
  };

  // Tracks actions taken by the user for AI feedback evaluation
  const actionHistory = useRef<ActionFeedback[]>([]);

  const addActionLog = (action: string, scoreChange: number, isCorrect: boolean, explanation: string) => {
    const timestamp = new Date().toLocaleTimeString();
    actionHistory.current.push({
      timestamp,
      action,
      scoreChange,
      isCorrect,
      explanation
    });

    setPlayer(prev => ({
      ...prev,
      score: Math.max(0, prev.score + scoreChange),
      statusLogs: [...prev.statusLogs.slice(-4), `[${timestamp}] ${action} (${scoreChange > 0 ? '+' : ''}${scoreChange} score)`]
    }));
  };

  // ----------------------------------------------------------------------
  // SIMULATION INIT ON ROLE PLAY START
  // ----------------------------------------------------------------------

  const handleStartDrill = () => {
    setIsPlaying(true);
    setTimer(0);
    actionHistory.current = [];
    setDrillRooms(layout.rooms);

    // Trigger starting positions and hazards based on chosen role and disaster type
    let startX = 18;
    let startY = 22;
    let startFloor = 1;

    if (role === 'teacher') {
      startX = 45; startY = 20; // In science lab
    } else if (role === 'principal') {
      startX = 18; startY = 62; // In admin office
    }

    setPlayer({
      id: 'user_1',
      name: `User (${role.toUpperCase()})`,
      role,
      x: startX,
      y: startY,
      floor: startFloor,
      health: 100,
      oxygen: 100,
      isDucked: false,
      hasGasMask: false,
      hasExtinguisher: false,
      hasFirstAidKit: false,
      isEvacuated: false,
      score: 120,
      xp: 0,
      statusLogs: [`Evacuation alert! Evacuate safely as ${role.toUpperCase()}.`]
    });

    // Generate Adaptive Hazards list based on selected disaster type
    const list: Hazard[] = [];

    if (disasterType === 'fire') {
      list.push({ id: 'h_f1', type: 'fire', x: 38, y: 48, floor: 1, radius: 8, intensity: 0.9, message: "Main corridor blocked by chemical fire spill." });
      list.push({ id: 'h_s1', type: 'smoke', x: 25, y: 45, floor: 1, radius: 12, intensity: 0.7, message: "Thick carbon monoxide smoke cloud drifting." });
      if (randomizedBlockages) {
        list.push({ id: 'h_f2', type: 'debris', x: 68, y: 48, floor: 1, radius: 6, intensity: 1.0, message: "Corridor passage collapsed." });
      }
    } else if (disasterType === 'earthquake') {
      list.push({ id: 'h_e1', type: 'debris', x: 50, y: 46, floor: 1, radius: 6, intensity: 0.8, message: "Ceiling tiles falling in lobby." });
      list.push({ id: 'h_e2', type: 'debris', x: 84, y: 48, floor: 1, radius: 5, intensity: 0.9, message: "Rubble blocking east exit corridors." });
    } else if (disasterType === 'flood') {
      list.push({ id: 'h_fl1', type: 'water', x: 45, y: 48, floor: 1, radius: 15, intensity: 0.6, message: "Ground floor rising water levels." });
      list.push({ id: 'h_fl2', type: 'electrical', x: 60, y: 64, floor: 1, radius: 8, intensity: 1.0, message: "Utility room short-circuit water risk." });
    } else if (disasterType === 'chemical_leak') {
      list.push({ id: 'h_c1', type: 'chemical_gas', x: 48, y: 15, floor: 1, radius: 12, intensity: 0.9, message: "Highly acidic sulfuric vapor escaping lab." });
    } else if (disasterType === 'gas_leak') {
      list.push({ id: 'h_g1', type: 'chemical_gas', x: 18, y: 46, floor: 1, radius: 10, intensity: 0.85, message: "Methane gas leakage. DO NOT trigger fire triggers." });
    }

    setHazards(list);

    // Dynamic NPCs positioning based on role
    setNpcs([
      { id: 'npc_1', name: 'Jimmy (Classmate)', role: 'student', x: 26, y: 25, floor: 1, health: 60, isInjured: true, isSaved: false, classroomID: 'rm_101' },
      { id: 'npc_2', name: 'Sarah (Science Teacher)', role: 'teacher', x: 48, y: 18, floor: 1, health: 100, isInjured: false, isSaved: false, classroomID: 'rm_102' },
      { id: 'npc_3', name: 'Principal Harris', role: 'staff', x: 15, y: 65, floor: 1, health: 40, isInjured: true, isSaved: false, classroomID: 'rm_admin' }
    ]);

    addActionLog("Entered Drill Platform", 0, true, `Began disaster drill simulator representing role: ${role.toUpperCase()}`);
  };

  // ----------------------------------------------------------------------
  // DYNAMIC EVACUATION LOGIC & GAME HEARTBEAT TICKS (1 sec interval)
  // ----------------------------------------------------------------------

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimer(prev => prev + 1);

      // 1. Hazard collision checker
      setPlayer(prev => {
        let currentHealth = prev.health;
        let currentOxygen = prev.oxygen;
        let healthDeducted = false;
        let suffocationDeducted = false;

        // Check distance to each active hazard
        hazards.forEach(hazard => {
          if (hazard.floor !== prev.floor) return;

          const dist = Math.hypot(prev.x - hazard.x, prev.y - hazard.y);
          if (dist <= hazard.radius) {
            
            // Standing inside fire or collapsing debris
            if (hazard.type === 'fire') {
              if (prev.isDucked) {
                // Shelter mitigates partial debris but fire burns regardless
                currentHealth = Math.max(0, currentHealth - 4);
              } else {
                currentHealth = Math.max(0, currentHealth - 8);
              }
              healthDeducted = true;
            }

            if (hazard.type === 'debris') {
              if (!prev.isDucked) {
                currentHealth = Math.max(0, currentHealth - 6);
                healthDeducted = true;
              }
            }

            if (hazard.type === 'electrical') {
              currentHealth = Math.max(0, currentHealth - 12);
              healthDeducted = true;
            }

            // Standing inside smoke or chemical clouds
            if (hazard.type === 'smoke' || hazard.type === 'chemical_gas') {
              if (!prev.hasGasMask) {
                currentOxygen = Math.max(0, currentOxygen - 6);
                if (currentOxygen === 0) {
                  currentHealth = Math.max(0, currentHealth - 4);
                  healthDeducted = true;
                }
                suffocationDeducted = true;
              }
            }

            // Standing in deep rising flood water
            if (hazard.type === 'water') {
              currentHealth = Math.max(0, currentHealth - 2);
              healthDeducted = true;
            }
          }
        });

        // Regenerate oxygen slowly if outside smoke bounds
        if (!suffocationDeducted && currentOxygen < 100) {
          currentOxygen = Math.min(100, currentOxygen + 5);
        }

        // Deduct scores occasionally for high-risk lingering inside hazard fields
        let scoreDeduction = 0;
        if (healthDeducted && Math.random() < 0.25) {
          scoreDeduction = -5;
        }

        // Check if player's health reached 0
        if (currentHealth === 0) {
          clearInterval(interval);
          handleDrillFailure("Fainted / Sustained fatal injuries inside severe hazard zones.");
        }

        return {
          ...prev,
          health: currentHealth,
          oxygen: currentOxygen,
          score: Math.max(0, prev.score + scoreDeduction)
        };
      });

      // 2. Check if player has entered the Assembly Area (Safely evacuated!)
      const distToAssembly = Math.hypot(player.x - layout.assemblyArea.x, player.y - layout.assemblyArea.y);
      if (distToAssembly <= layout.assemblyArea.radius && player.floor === 1) {
        clearInterval(interval);
        handleEvacuationSuccess();
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, hazards, player.x, player.y, player.floor]);

  // ----------------------------------------------------------------------
  // PLAYER INTERACTIVE CONTROLS / PROCEDURES
  // ----------------------------------------------------------------------

  // Handle Ducking Cover action (Key for earthquakes)
  const toggleDuck = () => {
    setPlayer(prev => {
      const nextDuck = !prev.isDucked;
      
      if (disasterType === 'earthquake') {
        if (nextDuck) {
          addActionLog("Took Cover Under Sturdy Desk", 15, true, "Proper protective shelter established during high-seismic tremors.");
        } else {
          addActionLog("Stood Up During Shaking", -10, false, "Avoid standing upright during shaking; dangerous debris hazards are active.");
        }
      } else {
        // Muted actions for other drills
        addActionLog(nextDuck ? "Crouched down" : "Stood up", 0, true, "Changed body posture.");
      }

      return {
        ...prev,
        isDucked: nextDuck
      };
    });
  };

  // Move between floors if standing on Staircase rooms
  const handleFloorChange = (direction: 'up' | 'down') => {
    // Check if player is standing in a staircase room
    const currentRoom = drillRooms.find(room => 
      room.floor === player.floor && 
      player.x >= room.x && 
      player.x <= (room.x + room.width) && 
      player.y >= room.y && 
      player.y <= (room.y + room.height)
    );

    if (currentRoom && currentRoom.type === 'staircase') {
      const targetFloor = direction === 'up' ? player.floor + 1 : player.floor - 1;
      if (targetFloor >= 1 && targetFloor <= layout.floorsCount) {
        setPlayer(prev => ({
          ...prev,
          floor: targetFloor
        }));
        setActiveFloor(targetFloor);
        addActionLog(`Navigated stairs ${direction.toUpperCase()}`, 10, true, `Transitioned between levels to Floor ${targetFloor}`);
      }
    } else {
      setPlayer(prev => ({
        ...prev,
        statusLogs: [...prev.statusLogs, "⚠️ You must stand inside East Wing Stairwell to change floors."]
      }));
    }
  };

  // Collect supplies handler
  const collectItem = (itemType: string) => {
    setPlayer(prev => {
      if (itemType === 'extinguisher' && !prev.hasExtinguisher) {
        addActionLog("Picked Up Fire Extinguisher", 20, true, "Grabbed CO2 extinguisher from Science lab safety stash.");
        return { ...prev, hasExtinguisher: true };
      }
      if (itemType === 'first_aid_kit' && !prev.hasFirstAidKit) {
        addActionLog("Acquired Field Medical Kit", 20, true, "Secured classroom bandages and first aid kits.");
        return { ...prev, hasFirstAidKit: true };
      }
      if (itemType === 'gas_mask' && !prev.hasGasMask) {
        addActionLog("Equipped Toxic Gas Respirator", 20, true, "Sealed breathing lines from gas leaks.");
        return { ...prev, hasGasMask: true };
      }
      return prev;
    });
  };

  // Rescuing NPCs
  const rescueNPC = (npcId: string) => {
    const targetNPC = npcs.find(n => n.id === npcId);
    if (!targetNPC) return;

    if (!player.hasFirstAidKit) {
      setPlayer(prev => ({
        ...prev,
        statusLogs: [...prev.statusLogs, "⚠️ First Aid Kit is required to bandage injuries! Locate it in the Library."]
      }));
      return;
    }

    setNpcs(prev => prev.map(n => {
      if (n.id === npcId) {
        return { ...n, isInjured: false, isSaved: true };
      }
      return n;
    }));

    addActionLog(`Rescued ${targetNPC.name}`, 35, true, `Applied first-aid to classmate suffering minor fractures and guided them to the assembly yard.`);
  };

  // Use CO2 spray on fire hazards in front of player
  const triggerCO2Spray = () => {
    if (!player.hasExtinguisher) {
      setPlayer(prev => ({
        ...prev,
        statusLogs: [...prev.statusLogs, "⚠️ Locate CO2 Extinguisher from Science Lab workbench first!"]
      }));
      return;
    }

    // Find if any fire hazard is near player's x/y coords
    let extinguished = false;
    const remainingHazards = hazards.filter(hazard => {
      if (hazard.type === 'fire' && hazard.floor === player.floor) {
        const dist = Math.hypot(player.x - hazard.x, player.y - hazard.y);
        if (dist <= hazard.radius + 8) {
          extinguished = true;
          return false; // Remove hazard from list
        }
      }
      return true;
    });

    if (extinguished) {
      setHazards(remainingHazards);
      addActionLog("Neutralized Corridor Chemical Fire", 30, true, "Sprayed pressurized carbon dioxide, clear-cutting escape route corridors.");
    } else {
      addActionLog("Sprayed CO2 Extinguisher", -2, false, "Discharged extinguisher into empty corridors without active flame targets.");
    }
  };

  // ----------------------------------------------------------------------
  // SIMULATION ENDSTATES (SUCCESS & FAILURE HANDLERS)
  // ----------------------------------------------------------------------

  const handleEvacuationSuccess = () => {
    setIsPlaying(false);
    
    // Calculate final scores based on role requirements
    let bonus = 0;
    let feedbackSummary = "Excellent safety. You successfully evacuated to the designated playground assembly area.";

    if (role === 'teacher') {
      // Teachers get massive bonuses if they guided school staff or counted missing
      const rescuedStaffCount = npcs.filter(n => n.isSaved).length;
      bonus += rescuedStaffCount * 25;
      feedbackSummary = `Teacher response certified. Guided ${rescuedStaffCount} student groups safely to soccer fields.`;
    }

    // Achievements calculation
    let badge = "Disaster Safety Cadet";
    if (disasterType === 'fire') badge = "Fire Evacuation Expert";
    if (disasterType === 'earthquake') badge = "Earthquake Survivor";
    if (disasterType === 'chemical_leak') badge = "Chemical Rescue Hero";

    addActionLog("Reached Assembly Area", 40 + bonus, true, "Successfully evacuated the digital twin structure via open exit doorways.");

    onDrillComplete({
      id: `drill_${Date.now()}`,
      studentName: player.name,
      date: new Date().toLocaleDateString(),
      disasterType,
      timeTaken: timer,
      score: Math.min(100, Math.floor(player.score)),
      maxScore: 100,
      healthRemaining: player.health,
      isSuccessful: true,
      actions: actionHistory.current,
      feedbackSummary,
      badgeEarned: badge
    });
  };

  const handleDrillFailure = (reason: string) => {
    setIsPlaying(false);
    
    onDrillComplete({
      id: `drill_${Date.now()}`,
      studentName: player.name,
      date: new Date().toLocaleDateString(),
      disasterType,
      timeTaken: timer,
      score: Math.min(100, Math.floor(player.score * 0.4)), // reduced score for failure
      maxScore: 100,
      healthRemaining: player.health,
      isSuccessful: false,
      actions: actionHistory.current,
      feedbackSummary: `Evacuation Failed: ${reason}`,
      badgeEarned: "Preparedness Cadet"
    });
  };

  // Check if player is standing inside any staircase
  const currentRoom = drillRooms.find(room => 
    room.floor === player.floor && 
    player.x >= room.x && 
    player.x <= (room.x + room.width) && 
    player.y >= room.y && 
    player.y <= (room.y + room.height)
  );
  const isOnStairs = currentRoom?.type === 'staircase';

  // Find doors near the player (within 12 units) on their current floor
  const nearbyDoors = drillRooms
    .filter(room => room.floor === player.floor)
    .flatMap(room => room.doors.map(door => ({
      ...door,
      roomId: room.id,
      roomName: room.name,
      distance: Math.hypot(player.x - door.x, player.y - door.y)
    })))
    .filter(door => door.distance < 12.0);

  const nearestDoor = nearbyDoors.length > 0 
    ? nearbyDoors.reduce((prev, curr) => prev.distance < curr.distance ? prev : curr)
    : null;

  return (
    <div className="flex flex-col gap-5 text-white" id="drill-platform-viewport">
      
      {/* Onboarding / Role Selector screen */}
      {!isPlaying ? (
        <div className="bg-brand-card border border-slate-800/85 rounded-2xl p-6.5 max-w-2xl mx-auto flex flex-col gap-5 text-center items-center shadow-xl">
          <div className="bg-cyan-950 p-3 rounded-full border border-cyan-500/30 shadow-sleek-glow">
            <ShieldAlert className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-xl tracking-tight text-slate-100">Practice Adaptive Campus Evacuation</h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-2 max-w-lg">
              Select your role to configure customized preparedness checklists. Each role carries specific safety objectives on the active Digital Twin of the campus.
            </p>
          </div>

          {/* Role Grid selection */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-2">
            <button
              onClick={() => setRole('student')}
              className={`p-4.5 rounded-2xl border text-xs text-left transition-all duration-300 flex flex-col justify-between ${
                role === 'student' 
                  ? 'bg-cyan-950/30 border-cyan-500 font-bold shadow-sleek-glow' 
                  : 'bg-brand-canvas/50 border-slate-800 hover:border-slate-700 hover:bg-brand-canvas/80'
              }`}
              id="role-student"
            >
              <span className={`font-bold block text-sm ${role === 'student' ? 'text-cyan-400' : 'text-slate-200'}`}>Student Role</span>
              <span className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">Objectives: Duck & Cover. Find low smoke escape routes. Move immediately to soccer field gates.</span>
            </button>
            
            <button
              onClick={() => setRole('teacher')}
              className={`p-4.5 rounded-2xl border text-xs text-left transition-all duration-300 flex flex-col justify-between ${
                role === 'teacher' 
                  ? 'bg-cyan-950/30 border-cyan-500 font-bold shadow-sleek-glow' 
                  : 'bg-brand-canvas/50 border-slate-800 hover:border-slate-700 hover:bg-brand-canvas/80'
              }`}
              id="role-teacher"
            >
              <span className={`font-bold block text-sm ${role === 'teacher' ? 'text-cyan-400' : 'text-slate-200'}`}>Teacher Role</span>
              <span className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">Objectives: Gather emergency first-aid toolkits, treat classmate NPCs, guide pods to outer assembly gates.</span>
            </button>
          </div>

          <button
            onClick={handleStartDrill}
            className="w-full max-w-xs bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 border border-cyan-500/20 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 mt-4 shadow-lg shadow-cyan-950/60"
            id="btn-start-simulation-drill"
          >
            Start Virtual Drill <Play className="w-4 h-4 fill-current text-white" />
          </button>
        </div>
      ) : (
        // Active Evacuation Gameplay Area
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Active 3D Twin Canvas */}
          <div className="lg:col-span-8 bg-brand-canvas border border-slate-800/80 rounded-2xl h-[560px] overflow-hidden shadow-2xl flex flex-col">
            <ThreeDCanvas
              layout={{ ...layout, rooms: drillRooms }}
              player={player}
              npcs={npcs}
              hazards={hazards}
              activeFloor={activeFloor}
              disasterType={disasterType}
              showPaths={showEvacPaths}
              onPlayerMove={(nx, ny, nf) => setPlayer(p => ({ ...p, x: nx, y: ny, floor: nf }))}
              onInteractNPC={rescueNPC}
              onInteractItem={collectItem}
              isDrillRunning={isPlaying}
              onToggleDoor={handleToggleDoor}
            />
          </div>

          {/* Drill Status HUD and controller */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Live Metrics Card */}
            <div className="bg-brand-card border border-slate-800/85 rounded-2xl p-4.5 flex flex-col gap-4 shadow-lg">
              <div className="flex justify-between items-center text-xs">
                <span className="bg-brand-canvas px-3 py-1 rounded-xl text-cyan-400 border border-slate-800 font-mono font-bold uppercase tracking-wider capitalize">{role} Objective</span>
                <div className="flex items-center gap-1 font-mono font-bold text-emerald-400 text-sm">
                  <Clock className="w-4 h-4 text-emerald-400" /> {timer}s
                </div>
              </div>

              {/* Health and Oxygen Stats */}
              <div className="flex flex-col gap-3.5 mt-1 bg-brand-canvas p-3.5 rounded-xl border border-slate-850/80 shadow-inner">
                
                {/* Health Bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-bold font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-rose-500"><Heart className="w-3.5 h-3.5 fill-current text-rose-500" /> VITAL HEALTH</span>
                    <span>{player.health}%</span>
                  </div>
                  <div className="w-full bg-[#0A0F1D] h-2.5 rounded-full p-0.5 overflow-hidden border border-slate-850/80">
                    <div
                      className="bg-gradient-to-r from-red-500 to-rose-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${player.health}%` }}
                    />
                  </div>
                </div>

                {/* Oxygen Gauge */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-bold font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-cyan-400">💨 AIRWAY OXYGEN</span>
                    <span>{player.oxygen}%</span>
                  </div>
                  <div className="w-full bg-[#0A0F1D] h-2.5 rounded-full p-0.5 overflow-hidden border border-slate-850/80">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-sleek-glow"
                      style={{ width: `${player.oxygen}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* Inventory Checklist */}
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">EMERGENCY INVENTORY</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-1.5 rounded-xl border text-center transition font-mono text-[9px] ${player.hasExtinguisher ? 'bg-red-950/40 border-red-800 text-red-400 font-bold shadow-sm' : 'bg-brand-canvas border-slate-850/60 text-slate-600'}`}>
                    🧯 CO2 Spray
                  </div>
                  <div className={`p-1.5 rounded-xl border text-center transition font-mono text-[9px] ${player.hasFirstAidKit ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 font-bold shadow-sm' : 'bg-brand-canvas border-slate-850/60 text-slate-600'}`}>
                    ➕ Med Kit
                  </div>
                  <div className={`p-1.5 rounded-xl border text-center transition font-mono text-[9px] ${player.hasGasMask ? 'bg-cyan-950/40 border-cyan-800 text-cyan-400 font-bold shadow-sm animate-pulse' : 'bg-brand-canvas border-slate-850/60 text-slate-600'}`}>
                    😷 Gas Mask
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Action triggers */}
            <div className="bg-brand-card border border-slate-800/85 rounded-2xl p-4.5 flex flex-col gap-3 shadow-lg">
              <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">EMERGENCY ACTIONS</span>
              
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={toggleDuck}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all ${
                    player.isDucked 
                      ? 'bg-cyan-600 text-white border border-cyan-400 shadow-md shadow-cyan-950/80 font-bold' 
                      : 'bg-brand-canvas border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                  id="btn-duck-action"
                >
                  {player.isDucked ? "🛡️ STAND UP" : "🛡️ DUCK AND COVER UNDER DESK"}
                </button>

                {nearestDoor && (
                  <div className="flex flex-col gap-1 mt-0.5">
                    <button
                      onClick={() => handleToggleDoor(nearestDoor.roomId, nearestDoor.id)}
                      className={`w-full py-3 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 text-white shadow-md ${
                        nearestDoor.isBlocked 
                          ? 'bg-red-950/40 border border-red-900/40 text-red-500 cursor-not-allowed'
                          : nearestDoor.isOpen
                            ? 'bg-amber-600 hover:bg-amber-500 border border-amber-400/30 shadow-amber-950/40'
                            : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 shadow-emerald-950/40'
                      }`}
                      disabled={nearestDoor.isBlocked}
                      id="btn-toggle-door"
                    >
                      {nearestDoor.isBlocked 
                        ? "🚪 DOOR IS PERMANENTLY BLOCKED!" 
                        : nearestDoor.isOpen 
                          ? `🚪 CLOSE DOOR (${nearestDoor.roomName})` 
                          : `🚪 OPEN DOOR (${nearestDoor.roomName})`}
                    </button>
                    {!nearestDoor.isBlocked && (
                      <span className="text-[9px] text-center text-slate-500 font-medium tracking-tight animate-pulse">
                        💡 Tip: You can also press the <span className="font-mono bg-slate-900 px-1 py-0.5 rounded text-cyan-400 border border-slate-800">E</span> key near doors!
                      </span>
                    )}
                  </div>
                )}

                {player.hasExtinguisher && (
                  <button
                    onClick={triggerCO2Spray}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500/20 font-bold text-xs rounded-xl transition shadow-md shadow-red-950/40 flex items-center justify-center gap-1.5 text-white"
                    id="btn-extinguish-action"
                  >
                    🧯 SPRAY CO2 EXTINGUISHER
                  </button>
                )}

                {isOnStairs && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleFloorChange('up')}
                      className="py-2.5 bg-brand-canvas hover:bg-slate-900 border border-slate-800 rounded-xl font-semibold text-xs text-slate-200 transition"
                      id="btn-climb-up"
                    >
                      ▲ Climb Stairs
                    </button>
                    <button
                      onClick={() => handleFloorChange('down')}
                      className="py-2.5 bg-brand-canvas hover:bg-slate-900 border border-slate-800 rounded-xl font-semibold text-xs text-slate-200 transition"
                      id="btn-climb-down"
                    >
                      ▼ Descend Stairs
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-1 bg-brand-canvas p-2 rounded-xl border border-slate-850">
                <span className="text-[11px] text-slate-400">Show Evacuation Arrows</span>
                <input
                  type="checkbox"
                  id="chk-show-arrows"
                  checked={showEvacPaths}
                  onChange={(e) => {
                    setShowEvacPaths(e.target.checked);
                    if (e.target.checked) {
                      addActionLog("Activated Evacuation Guidance", 5, true, "Loaded structural exit routing helpers to corridors.");
                    }
                  }}
                  className="w-4 h-4 text-cyan-600 bg-brand-card border-slate-800 rounded focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Live Evacuation Log feeds */}
            <div className="bg-brand-card border border-slate-800/85 rounded-2xl p-4.5 flex-1 flex flex-col gap-2 min-h-[150px] shadow-lg">
              <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">LIVE EVACUATION CHRONOLOGY</span>
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-36 font-mono text-[10px] text-slate-400">
                {player.statusLogs.map((log, idx) => (
                  <div key={idx} className="p-2 bg-brand-canvas border border-slate-850 rounded-xl text-[10px] leading-relaxed text-slate-300">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Instant Quit option */}
            <button
              onClick={() => handleDrillFailure("Aborted drill manually.")}
              className="w-full py-2 bg-brand-canvas border border-red-950/40 hover:border-red-900/60 hover:bg-red-950/20 text-red-400 font-bold text-xs rounded-xl transition"
              id="btn-abort-simulation"
            >
              Abort Simulation
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
