/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Award, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Flame, 
  Droplet, 
  Wind, 
  Skull, 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  Activity,
  AlertTriangle,
  School,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Define TS Interfaces locally
export type DisasterType = 'earthquake' | 'fire' | 'flood' | 'gas_leak' | 'cyclone' | 'chemical_leak';

export interface DrillResult {
  studentName: string;
  disasterType: DisasterType;
  timeTaken: number;
  healthRemaining: number;
  score: number;
  maxScore: number;
  isSuccessful: boolean;
  actions: { timestamp: number; action: string; penaltyScore: number }[];
}

export interface Door {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
  isBlocked?: boolean;
  leadsTo?: string;
}

export interface Window {
  id: string;
  x: number;
  y: number;
  width: number;
}

export interface Furniture {
  id: string;
  name: string;
  type: 'desk' | 'table' | 'shelf' | 'cabinet' | 'equipment';
  x: number;
  y: number;
  width: number;
  height: number;
  canShelterUnder: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: 'classroom' | 'laboratory' | 'library' | 'office' | 'corridor' | 'staircase' | 'emergency_exit' | 'assembly_area' | 'playground' | 'restroom' | 'utility';
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  color: string;
  doors: Door[];
  windows: Window[];
  furniture: Furniture[];
}

export interface AssemblyArea {
  x: number;
  y: number;
  radius: number;
  name: string;
}

export interface SchoolLayout {
  schoolName: string;
  floorsCount: number;
  rooms: Room[];
  assemblyArea: AssemblyArea;
}

export interface Character {
  x: number;
  y: number;
  floor: number;
  health: number;
  lungSafety: number;
  isCrouching: boolean;
  isCoveringMouth: boolean;
  hasExtinguisher: boolean;
  extinguisherCharges: number;
  speed: number;
}

export interface Hazard {
  id: string;
  type: 'fire' | 'smoke' | 'water' | 'gas' | 'chemical' | 'debris';
  x: number;
  y: number;
  floor: number;
  radius: number;
  damagePerSec: number;
}

export interface ActionLog {
  time: number;
  description: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface Objective {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface EvaluationData {
  summary: string;
  correctActions: string[];
  criticalMistakes: string[];
  tips: string[];
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}


// Import component lazily to ensure canvas variables bind perfectly
import { SimulatorCanvas } from '../../components/Game/SimulatorCanvas';
import { audioEngine } from '../../components/Game/AudioEngine';

export default function App() {
  const [studentName, setStudentName] = useState<string>('Super Explorer');
  const [studentId, setStudentId] = useState<string | null>(null);
  // Initial default layout
  const [currentLayout, setCurrentLayout] = useState<SchoolLayout>({
    schoolName: "Empty Campus",
    floorsCount: 1,
    rooms: [],
    assemblyArea: { x: 50, y: 50, radius: 10, name: "Assembly Area" }
  });
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [blueprintLoading, setBlueprintLoading] = useState<boolean>(false);
  const [pendingDisaster, setPendingDisaster] = useState<DisasterType | null>(null);
  
  // Character active state
  const [character, setCharacter] = useState<Character>({
    x: 20,
    y: 20,
    floor: 1,
    health: 100,
    lungSafety: 100,
    isCrouching: false,
    isCoveringMouth: false,
    hasExtinguisher: false,
    extinguisherCharges: 0,
    speed: 16, // percentage step speed
  });

  // Drill simulator settings
  const [drillActive, setDrillActive] = useState<boolean>(false);
  const [disasterType, setDisasterType] = useState<DisasterType | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Objectives checklist
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Actions timeline tracking for Gemini evaluation
  const actionHistoryRef = useRef<Array<{ timestamp: number; action: string; penaltyScore: number }>>([]);

  // Refs to avoid stale closures in intervals and movement handlers
  const characterRef = useRef<Character>(character);
  const scoreRef = useRef<number>(score);
  const currentTimeRef = useRef<number>(currentTime);
  const disasterTypeRef = useRef<DisasterType | null>(disasterType);

  useEffect(() => {
    characterRef.current = character;
  }, [character]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    disasterTypeRef.current = disasterType;
  }, [disasterType]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const student = params.get('student');
    const sId = params.get('studentId');
    if (student) {
      setStudentName(decodeURIComponent(student));
    }
    if (sId) {
      setStudentId(sId);
    }

    // Read disaster type from URL params (assigned by Guardian AI)
    const disaster = params.get('disaster') as DisasterType | null;
    if (disaster) {
      setPendingDisaster(disaster);
    }

    // Auto-fetch school blueprint from Guardian AI backend
    const schoolId = params.get('school');
    if (schoolId) {
      setBlueprintLoading(true);
      fetch(`/api/public/school/${schoolId}/blueprint`)
        .then(res => res.json())
        .then(data => {
          // Handle case where backend returns a JSON string instead of object
          let layout = data;
          if (typeof data === 'string') {
            try { layout = JSON.parse(data); } catch { layout = null; }
          }
          if (layout && layout.schoolName && Array.isArray(layout.rooms) && layout.rooms.length > 0) {
            setCurrentLayout(layout);
            const firstFloorRoom = layout.rooms.find((r: Room) => r.floor === 1) || layout.rooms[0];
            if (firstFloorRoom) {
              setCharacter(prev => ({
                ...prev,
                floor: firstFloorRoom.floor,
                x: Math.round(firstFloorRoom.x + firstFloorRoom.width / 2),
                y: Math.round(firstFloorRoom.y + firstFloorRoom.height / 2)
              }));
            }
          } else {
            setErrorMsg('No school blueprint found. Please ask your admin to upload one.');
          }
          setBlueprintLoading(false);
        })
        .catch((err) => {
          console.error('Blueprint fetch error:', err);
          setErrorMsg('Could not load school blueprint from server.');
          setBlueprintLoading(false);
        });
    }
  }, []);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    audioEngine.setMute(soundEnabled);
  };

  // Time logging helper
  const addActionLog = (description: string, type: 'info' | 'success' | 'warning' | 'danger', penalty: number = 0) => {
    setActionLogs(prev => [...prev, { time: currentTime, description, type }]);
    actionHistoryRef.current.push({
      timestamp: currentTime,
      action: description,
      penaltyScore: penalty
    });
    if (penalty > 0) {
      setScore(prev => Math.max(0, prev - penalty));
    }
  };

  const completeObjective = (id: string) => {
    setObjectives(prev =>
      prev.map(obj => {
        if (obj.id === id && !obj.isCompleted) {
          addActionLog(`COMPLETED OBJECTIVE: ${obj.text}`, 'success');
          setScore(s => s + 20);
          return { ...obj, isCompleted: true };
        }
        return obj;
      })
    );
  };

  // -------------------------------------------------------------
  // TRIGGER EMERGENCY INCIDENT DRILL
  // -------------------------------------------------------------
  const handleStartDrill = (type: DisasterType) => {
    setDrillActive(true);
    setDisasterType(type);
    setCurrentTime(0);
    setScore(80); // Start with high safety score, penalize mistakes
    setMaxScore(100);
    setEvaluation(null);
    setIsEvaluating(false);
    setActionLogs([]);
    actionHistoryRef.current = [];

    // Trigger warning alert sound
    audioEngine.setMute(!soundEnabled);
    audioEngine.startSiren();

    addActionLog(`ALERT: Emergency drill [${type.toUpperCase()}] initialized inside school campus.`, 'danger');

    // Generate disaster-specific safety objectives
    const defaultObjectives: Record<DisasterType, Objective[]> = {
      earthquake: [
        { id: 'exit_classroom', text: 'Navigate out of the classroom', isCompleted: false },
        { id: 'crouch_table', text: 'Duck and cover under a sturdy desk/table during active shaking', isCompleted: false },
        { id: 'reach_assembly', text: 'Evacuate safely to the Soccer Field Assembly Point', isCompleted: false },
      ],
      fire: [
        { id: 'exit_classroom', text: 'Navigate out of the classroom', isCompleted: false },
        { id: 'crouch_table', text: 'Stay low to the floor (crouch) to avoid dense smoke', isCompleted: false },
        { id: 'extinguish_fire', text: 'Retrieve extinguisher from wall cabinets and douse fire blocks', isCompleted: false },
        { id: 'reach_assembly', text: 'Evacuate safely to the Soccer Field Assembly Point', isCompleted: false },
      ],
      flood: [
        { id: 'exit_classroom', text: 'Navigate out of the classroom', isCompleted: false },
        { id: 'climb_stairs', text: 'Climb staircases to high-ground upper floors immediately', isCompleted: false },
        { id: 'reach_assembly', text: 'Evacuate safely to designated assembly areas', isCompleted: false },
      ],
      cyclone: [
        { id: 'exit_classroom', text: 'Navigate out of the classroom', isCompleted: false },
        { id: 'crouch_table', text: 'Shelter in interior hallways away from glass windows', isCompleted: false },
        { id: 'reach_assembly', text: 'Evacuate safely once storm eye has passed', isCompleted: false },
      ],
      gas_leak: [
        { id: 'exit_classroom', text: 'Navigate out of the classroom', isCompleted: false },
        { id: 'reach_assembly', text: 'Cover mouth & evacuate down-wind to assembly areas', isCompleted: false },
      ],
      chemical_leak: [
        { id: 'exit_classroom', text: 'Navigate out of the classroom', isCompleted: false },
        { id: 'reach_assembly', text: 'Cover mouth & bypass yellow chemical puddles to assembly areas', isCompleted: false },
      ],
    };

    setObjectives(defaultObjectives[type] || defaultObjectives.fire);

    // Spawn randomized hazard points based on layout room dimensions
    const spawnedHazards: Hazard[] = [];
    currentLayout.rooms.forEach(room => {
      // Don't spawn hazards directly on the player starting room to give a small breathing room
      const distToPlayer = Math.sqrt(Math.pow((room.x + room.width / 2) - character.x, 2) + Math.pow((room.y + room.height / 2) - character.y, 2));
      if (distToPlayer < 20 && room.type === 'classroom') return;

      if (type === 'fire') {
        // Spawn fire spots in laboratories, offices, and corridors
        if (room.type === 'laboratory' || room.type === 'corridor' || room.type === 'utility') {
          spawnedHazards.push({
            id: `haz_fire_${room.id}`,
            type: 'fire',
            x: room.x + room.width / 2 + (Math.random() - 0.5) * 5,
            y: room.y + room.height / 2 + (Math.random() - 0.5) * 5,
            floor: room.floor,
            radius: 8,
            damagePerSec: 14,
          });
          spawnedHazards.push({
            id: `haz_smoke_${room.id}`,
            type: 'smoke',
            x: room.x + room.width / 2,
            y: room.y + room.height / 2,
            floor: room.floor,
            radius: 12,
            damagePerSec: 0, // Smoke impacts lung safety, not direct health
          });
        }
      } else if (type === 'earthquake') {
        // Spawn structural debris blocks
        if (room.type === 'library' || room.type === 'corridor') {
          spawnedHazards.push({
            id: `haz_debris_${room.id}`,
            type: 'debris',
            x: room.x + room.width / 3,
            y: room.y + room.height / 3,
            floor: room.floor,
            radius: 6,
            damagePerSec: 10,
          });
        }
      } else if (type === 'flood') {
        // Floodwater pools primarily on Floor 1
        if (room.floor === 1 && (room.type === 'corridor' || room.type === 'office' || room.type === 'playground')) {
          spawnedHazards.push({
            id: `haz_water_${room.id}`,
            type: 'water',
            x: room.x + room.width / 2,
            y: room.y + room.height / 2,
            floor: 1,
            radius: 15,
            damagePerSec: 8,
          });
        }
      } else if (type === 'gas_leak' || type === 'chemical_leak') {
        if (room.type === 'laboratory' || room.type === 'utility') {
          spawnedHazards.push({
            id: `haz_leak_${room.id}`,
            type: type === 'gas_leak' ? 'gas' : 'chemical',
            x: room.x + room.width / 2,
            y: room.y + room.height / 2,
            floor: room.floor,
            radius: 16,
            damagePerSec: 5,
          });
        }
      }
    });

    setHazards(spawnedHazards);

    if (type === 'earthquake') {
      audioEngine.startEarthquakeRumble();
    }
  };

  // Cancel/Reset drill
  const handleResetDrill = () => {
    setDrillActive(false);
    setDisasterType(null);
    setHazards([]);
    setCurrentTime(0);
    setEvaluation(null);
    setIsEvaluating(false);
    audioEngine.stopAll();

    // Reset character back to safely starting room
    const firstClassroom = currentLayout.rooms.find(r => r.type === 'classroom') || currentLayout.rooms[0];
    if (firstClassroom) {
      setCharacter({
        x: firstClassroom.x + firstClassroom.width / 2,
        y: firstClassroom.y + firstClassroom.height / 2,
        floor: firstClassroom.floor,
        health: 100,
        lungSafety: 100,
        isCrouching: false,
        isCoveringMouth: false,
        hasExtinguisher: false,
        extinguisherCharges: 0,
        speed: 16,
      });
    }
  };

  // Active game tick clock interval
  useEffect(() => {
    let timerId: number;
    if (drillActive) {
      timerId = window.setInterval(() => {
        setCurrentTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [drillActive]);

  // Periodic Damage, Suffocation, and Evacuation Checks
  useEffect(() => {
    let tickId: number;
    if (drillActive && disasterType) {
      tickId = window.setInterval(() => {
        const char = characterRef.current;
        // 1. Calculate proximity to active hazards
        let directHazardDamage = 0;
        let chokingRisk = false;
        let standingInPuddle = false;

        hazards.forEach(h => {
          if (h.floor !== char.floor) return;

          const dx = char.x - h.x;
          const dy = char.y - h.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= h.radius) {
            if (h.type === 'fire') {
              // Staying low (crouched) lowers direct fire/smoke burns!
              directHazardDamage += char.isCrouching ? h.damagePerSec * 0.35 : h.damagePerSec;
            } else if (h.type === 'smoke') {
              chokingRisk = true;
            } else if (h.type === 'water') {
              standingInPuddle = true;
              directHazardDamage += h.damagePerSec;
            } else if (h.type === 'gas' || h.type === 'chemical') {
              chokingRisk = true;
              directHazardDamage += h.damagePerSec;
            } else if (h.type === 'debris') {
              // Debris causes structural crush
              directHazardDamage += h.damagePerSec;
            }
          }
        });

        // 2. Compute Lung safety / Respiratory toxicity
        setCharacter(prev => {
          let nextLung = prev.lungSafety;
          let nextHealth = prev.health;

          if (chokingRisk) {
            // Covering mouth filters gases and slows down damage by 75%
            const filterMultiplier = prev.isCoveringMouth ? 0.25 : 1.0;
            // Hiding low under smoke helps too
            const altitudeMultiplier = prev.isCrouching ? 0.4 : 1.0;

            nextLung = Math.max(0, prev.lungSafety - (8 * filterMultiplier * altitudeMultiplier));
            
            if (prev.lungSafety > 10 && nextLung <= 10) {
              addActionLog("Choking warning! Heavy smoke and gases filling respiratory system. Seek shelter or cover mouth immediately!", "danger", 10);
            }
          } else {
            // Ambient lung regeneration when not standing in noxious gases
            nextLung = Math.min(100, prev.lungSafety + 4);
          }

          // If suffocation lung safety is 0, start losing direct health quickly
          if (nextLung <= 0) {
            directHazardDamage += 15; // 15 damage per tick from suffocation
          }

          if (directHazardDamage > 0) {
            nextHealth = Math.max(0, prev.health - (directHazardDamage / 5)); // Scaled damage
            
            // Sound feedback for hits
            audioEngine.playBeep(180, 0.1, 'sawtooth');

            if (prev.health > 20 && nextHealth <= 20) {
              addActionLog("CRITICAL VITALITY WARNING! Health dropping dangerously low from burns or toxicity.", "danger", 15);
            }
          }

          // If health reaches 0, player has failed
          if (nextHealth <= 0) {
            handleEndDrill(false);
          }

          return {
            ...prev,
            health: nextHealth,
            lungSafety: nextLung
          };
        });

        // 3. Check for evacuation success
        const dxToAssembly = char.x - currentLayout.assemblyArea.x;
        const dyToAssembly = char.y - currentLayout.assemblyArea.y;
        const distToAssembly = Math.sqrt(dxToAssembly * dxToAssembly + dyToAssembly * dyToAssembly);

        if (distToAssembly <= currentLayout.assemblyArea.radius && char.floor === 1) {
          // Success reached!
          handleEndDrill(true);
        }

      }, 400); // Check damage and victory conditions 2.5 times per second
    }

    return () => clearInterval(tickId);
  }, [drillActive, hazards, currentLayout, disasterType]);

  // -------------------------------------------------------------
  // POST-DRILL EVALUATION WITH BACKEND AND GEMINI AI
  // -------------------------------------------------------------
  const handleEndDrill = async (isSuccessful: boolean) => {
    setDrillActive(false);
    audioEngine.stopAll();

    if (isSuccessful) {
      audioEngine.playSuccess();
      completeObjective("reach_assembly");
    } else {
      audioEngine.playFailure();
    }

    addActionLog(
      isSuccessful 
        ? "SUCCESS: Congratulations! You reached the secure designated assembly area safely." 
        : "FAILURE: Critical safety breach. Student lost consciousness or became trapped.",
      isSuccessful ? 'success' : 'danger'
    );

    // Call evaluate endpoint
    try {
      setIsEvaluating(true);
      
      const calculatedScore = isSuccessful ? scoreRef.current + 20 : Math.max(10, scoreRef.current - 30);

      const drillResult: DrillResult = {
        studentName,
        disasterType: disasterTypeRef.current || 'fire',
        timeTaken: currentTimeRef.current,
        healthRemaining: characterRef.current.health,
        score: calculatedScore,
        maxScore: maxScore,
        isSuccessful,
        actions: actionHistoryRef.current
      };

      if (studentId) {
        fetch('/api/student/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            student_id: studentId,
            disaster_type: disasterTypeRef.current || 'fire',
            activity_type: 'drill',
            score: calculatedScore,
            duration_seconds: currentTimeRef.current
          })
        }).catch(err => console.error('Failed to save score to backend:', err));
      }

      const res = await fetch('/api/evaluate-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drillResult })
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluation(data.evaluation);
      } else {
        throw new Error('Could not retrieve evaluation scorecard.');
      }
    } catch (err) {
      console.error(err);
      // Fallback response if API fails
      setEvaluation({
        summary: isSuccessful 
          ? "Good evacuation effort, but you should practice faster execution during earthquakes and fire smoke."
          : "Evacuation failed due to excessive hazard contact. Re-evaluate exits and use safety equipment like extinguishers.",
        correctActions: isSuccessful ? ["Reconciled Floor 1 exits safely."] : ["Attempted floor navigation"],
        criticalMistakes: isSuccessful ? [] : ["Took direct damage from active hazards without crouching/sheltering"],
        tips: ["Duck under sturdy furniture during seismic rumbles", "Always check closed doors with back-of-hand for heat warnings"],
        grade: isSuccessful ? 'A' : 'F'
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const disastersList = [
    {
      type: 'earthquake' as DisasterType,
      label: 'Earthquake Shake!',
      emoji: '🌋',
      desc: 'Ground shake rumbles! Duck under a sturdy desk and cover your head!',
      color: 'bg-amber-100 border-amber-300 text-amber-800',
      hoverColor: 'hover:bg-amber-200 hover:border-amber-400',
    },
    {
      type: 'fire' as DisasterType,
      label: 'Fire Fighter Escape!',
      emoji: '🔥',
      desc: 'Flames and smoke are spreading. Crouch low to crawl, and find the exit!',
      color: 'bg-rose-100 border-rose-300 text-rose-800',
      hoverColor: 'hover:bg-rose-200 hover:border-rose-400',
    },
    {
      type: 'flood' as DisasterType,
      label: 'Rising Flood Escape!',
      emoji: '🌊',
      desc: 'Water is rising! Climb the staircases immediately to reach higher floors!',
      color: 'bg-sky-100 border-sky-300 text-sky-800',
      hoverColor: 'hover:bg-sky-200 hover:border-sky-400',
    },
    {
      type: 'cyclone' as DisasterType,
      label: 'Storm Windstorm!',
      emoji: '🌀',
      desc: 'Strong winds can break windows. Hide in hallways away from glass!',
      color: 'bg-teal-100 border-teal-300 text-teal-800',
      hoverColor: 'hover:bg-teal-200 hover:border-teal-400',
    },
    {
      type: 'gas_leak' as DisasterType,
      label: 'Toxic Gas Escape!',
      emoji: '💨',
      desc: 'Inhalation alert! Cover your nose/mouth immediately with your face mask!',
      color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
      hoverColor: 'hover:bg-emerald-200 hover:border-emerald-400',
    },
    {
      type: 'chemical_leak' as DisasterType,
      label: 'Chemical Spill Bypass!',
      emoji: '🧪',
      desc: 'Acidic puddles are on the floor. Bypass them carefully to reach safety!',
      color: 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800',
      hoverColor: 'hover:bg-fuchsia-200 hover:border-fuchsia-400',
    }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-[#f0f9ff] via-[#ffffff] to-[#fffbeb] text-slate-800 flex flex-col antialiased overflow-hidden">
      
      {/* Top Application Bar - Super cheerful & clean! */}
      <header className="px-6 py-4 bg-white/90 backdrop-blur-md border-b-4 border-amber-100 flex items-center justify-between shadow-md relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400" />
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-50 border-2 border-amber-200 text-amber-500 rounded-2xl shadow-sm animate-bounce-slow">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-sky-600 font-black uppercase tracking-widest block font-mono">🌟 FUN SAFETY GAME</span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight font-display">
              School Safety Hero! 🏫🦸
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-2xl border-2 border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider shadow-sm transition cursor-pointer"
            title="Return to Main Page"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={toggleSound}
            className={`p-2.5 rounded-2xl border-2 transition cursor-pointer shadow-sm ${
              soundEnabled 
                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' 
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
            }`}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border-2 border-emerald-100 font-mono text-[11px] text-emerald-700 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="font-bold">✨ AI SAFETY GUIDE ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Container - Full width gameplay vs beautiful landing */}
      <main className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        <div 
          style={{
            maxWidth: drillActive ? 'none' : '1440px',
            width: '100%',
            margin: drillActive ? '0 auto' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            boxSizing: 'border-box'
          }}
          className="transition-all duration-300 p-3 md:p-4 flex-1 min-h-0"
        >
          <AnimatePresence mode="wait">
          {!drillActive ? (
            <motion.div
              key="setup-screen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4 w-full"
            >
              {/* Cheerful Intro Card */}
              <div className="bg-gradient-to-r from-sky-400 to-sky-500 p-4 md:p-5 rounded-3xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-6 bottom-0 text-8xl opacity-15 pointer-events-none select-none">🦸</div>
                <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight">
                  Welcome to Safety Hero HQ, {studentName}! 🎒✨
                </h2>
                <p className="text-xs md:text-sm mt-1.5 font-bold text-sky-50 leading-relaxed max-w-2xl">
                  Become a life-saving champion! Explore different emergencies in school campuses. 
                  Learn correct steps like finding exit doors, crawling below fire smoke, and gathering at the soccer field!
                </p>
              </div>

              {/* Grid: 1. Name & Map on the top, 2. Missions on the bottom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* HERO NAME INPUT */}
                <div className="bg-white border-4 border-amber-100 p-3 rounded-3xl shadow-md flex flex-col justify-center">
                  <label className="text-xs font-black text-amber-800 uppercase tracking-wider block mb-2 font-display">
                    🦸 1. ENTER YOUR HERO NAME
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Super Explorer (Grade 5)"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 text-slate-800 text-sm rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition font-bold shadow-inner"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-bold leading-normal">
                    * Type any name to customize your safety evaluation report card!
                  </p>
                </div>

                {/* SCHOOL CAMPUS BLUEPRINT STATUS */}
                <div className="bg-white border-4 border-amber-100 p-3 rounded-3xl shadow-md">
                  <label className="text-xs font-black text-amber-800 uppercase tracking-wider block mb-2.5 font-display">
                    🏫 2. YOUR SCHOOL CAMPUS MAP
                  </label>

                  {blueprintLoading ? (
                    <div className="flex flex-col items-center justify-center gap-2 min-h-[70px] border-2 border-amber-200 rounded-2xl bg-amber-50/40 p-4">
                      <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                      <span className="text-[11px] text-amber-950 font-extrabold block">
                        Loading school blueprint...
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold leading-normal">
                        Fetching campus layout from Guardian AI server
                      </span>
                    </div>
                  ) : currentLayout.rooms.length > 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 min-h-[70px] border-2 border-emerald-200 rounded-2xl bg-emerald-50/40 p-4">
                      <MapPin className="w-6 h-6 text-emerald-500" />
                      <span className="text-[11px] text-emerald-950 font-extrabold block">
                        {currentLayout.schoolName}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold leading-normal">
                        {currentLayout.rooms.length} rooms • {currentLayout.floorsCount} floor{currentLayout.floorsCount !== 1 ? 's' : ''} • Loaded from admin blueprint
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 min-h-[70px] border-2 border-rose-200 rounded-2xl bg-rose-50/40 p-4">
                      <AlertTriangle className="w-6 h-6 text-rose-500" />
                      <span className="text-[11px] text-rose-950 font-extrabold block">
                        No school blueprint loaded
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold leading-normal">
                        Ask your school admin to upload a blueprint in Guardian AI
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Map Indicator */}
              <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-4 py-2 text-emerald-800 flex items-center justify-between text-xs font-bold shadow-sm">
                <span className="flex items-center gap-1.5">
                  <School className="w-4 h-4 text-emerald-600" />
                  Active Map: {currentLayout.schoolName} ({currentLayout.floorsCount} Floors)
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">🌟 READY TO START YOUR ASSIGNED DRILL:</span>
              </div>

              {/* DRILL MISSION READY CARD */}
              <div className="bg-white border-4 border-rose-50 p-3 rounded-3xl shadow-md">
                <h3 className="text-xs font-black text-rose-800 uppercase tracking-widest mb-4 font-display flex items-center gap-1.5">
                  🚀 3. YOUR EMERGENCY SAFETY QUEST!
                </h3>
                
                {errorMsg && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <div className="flex flex-col items-center gap-4">
                  {pendingDisaster ? (
                    <>
                      {(() => {
                        const dis = disastersList.find(d => d.type === pendingDisaster);
                        return dis ? (
                          <div className={`flex items-center gap-3 p-4 border-2 rounded-2xl w-full ${dis.color}`}>
                            <span className="text-3xl">{dis.emoji}</span>
                            <div className="flex-1">
                              <h4 className="font-black text-sm tracking-tight font-display">{dis.label}</h4>
                              <p className="text-[10px] opacity-90 mt-1 font-semibold leading-normal">{dis.desc}</p>
                            </div>
                            <span className="px-2.5 py-1 bg-white/70 text-[9px] rounded-full font-black uppercase tracking-wider text-slate-800">
                              ASSIGNED
                            </span>
                          </div>
                        ) : null;
                      })()}
                      <button
                        onClick={() => handleStartDrill(pendingDisaster)}
                        disabled={currentLayout.rooms.length === 0 || blueprintLoading}
                        className="w-full px-6 py-4 bg-rose-500 hover:bg-rose-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-rose-500/10"
                      >
                        <Play className="w-5 h-5" />
                        {blueprintLoading ? 'LOADING BLUEPRINT...' : currentLayout.rooms.length === 0 ? 'WAITING FOR BLUEPRINT...' : 'START DRILL MISSION!'}
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl w-full">
                      <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <span className="text-xs text-slate-600 font-bold">
                        No disaster drill assigned. Please start a drill from Guardian AI.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="gameplay-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3 flex-1 min-h-0 w-full"
            >
              {/* Full Width Game View Area */}
              <div className="flex-1 min-h-0 flex flex-col w-full">
                <SimulatorCanvas
                  layout={currentLayout}
                  onLayoutChange={setCurrentLayout}
                  character={character}
                  setCharacter={setCharacter}
                  hazards={hazards}
                  setHazards={setHazards}
                  drillActive={drillActive}
                  disasterType={disasterType}
                  onAction={addActionLog}
                  objectives={objectives}
                  completeObjective={completeObjective}
                  currentTime={currentTime}
                  actionLogs={actionLogs}
                />
              </div>

              {/* Bottom live stats tray - Super simple, clean & spacious */}
              <div className="bg-white border-4 border-amber-100 px-4 py-3 rounded-3xl shadow-md flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  {/* Score */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 block uppercase font-sans">MY HERO SCORE</span>
                      <span className="font-black text-slate-800 font-display text-sm">{score} / {maxScore}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block h-8 w-0.5 bg-slate-100" />

                  {/* Timer */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 block uppercase font-sans">MISSION TIMER</span>
                      <span className="font-black text-slate-800 font-mono text-sm">{currentTime} seconds</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block h-8 w-0.5 bg-slate-100" />

                  {/* Disaster Info */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 block uppercase font-sans">ACTIVE MISSION</span>
                      <span className="font-black text-rose-700 capitalize text-xs">
                        {disasterType?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={handleResetDrill}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 hover:text-slate-800 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" /> STOP & RESET MISSION
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>

      {/* GEMINI AI DRILL EVALUATION MODAL */}
      <AnimatePresence>
        {(isEvaluating || evaluation) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border-4 border-amber-200 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 scrollbar-thin text-slate-800"
            >
              {isEvaluating ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Sparkles className="w-12 h-12 text-amber-500 animate-spin" />
                  <div className="text-center">
                    <h3 className="text-xl font-black text-slate-800 font-display">AI Safety Guide</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto font-medium">Looking at your safety actions and creating your Report Card...</p>
                  </div>
                </div>
              ) : (
                evaluation && (
                  <div className="flex flex-col gap-6">
                    {/* Evaluation Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                      <div>
                        <span className="px-3 py-1 bg-amber-100 border-2 border-amber-200 text-amber-800 text-[11px] rounded-full font-black tracking-wide">
                          🏆 MISSION REPORT CARD
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 mt-2 font-display">
                          {studentName || 'Explorer'}'s Safety Report
                        </h3>
                        <p className="text-xs text-slate-500 font-bold capitalize mt-0.5">
                          Scenario: {disasterType?.replace('_', ' ')} Drill inside {currentLayout.schoolName}
                        </p>
                      </div>

                      {/* Performance Grade Badge */}
                      <div className="flex flex-col items-center justify-center bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-3.5 shadow-sm min-w-24">
                        <span className="text-[10px] text-amber-800 font-black block font-sans">GRADE</span>
                        <span className="text-4xl font-black text-amber-600 font-display">{evaluation.grade}</span>
                      </div>
                    </div>

                    {/* Safety Point Score Meter */}
                    <div className="bg-sky-50 border-2 border-sky-100 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-black text-sky-800 font-display">
                        <span>🌟 SAFETY SCORE POINTS</span>
                        <span>{score} / 100</span>
                      </div>
                      <div className="h-4 w-full bg-white rounded-full border-2 border-sky-200 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, score))}%` }}
                        />
                      </div>
                    </div>

                    {/* Performance Summary Text */}
                    <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-start gap-3 shadow-inner">
                      <Award className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-600 leading-relaxed font-sans font-bold">
                        <strong className="text-slate-800 block mb-1 font-display uppercase text-xs">GUIDE EVALUATION:</strong>
                        {evaluation.summary}
                      </div>
                    </div>

                    {/* Correct Protocols vs Hazards/Violations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex flex-col gap-2">
                        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 font-display">
                          ⭐ AWESOME SAFETY MOVES!
                        </h4>
                        <ul className="flex flex-col gap-1.5 text-xs text-slate-600 list-inside leading-relaxed font-sans font-bold">
                          {evaluation.correctActions.map((act, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span>🌟</span> <span>{act}</span>
                            </li>
                          ))}
                          {evaluation.correctActions.length === 0 && (
                            <span className="text-slate-400 italic font-medium">No actions recorded.</span>
                          )}
                        </ul>
                      </div>

                      <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex flex-col gap-2">
                        <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5 font-display">
                          ⚠️ THINGS TO WATCH OUT NEXT TIME!
                        </h4>
                        <ul className="flex flex-col gap-1.5 text-xs text-slate-600 list-inside leading-relaxed font-sans font-bold">
                          {evaluation.criticalMistakes.map((mis, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span>⚠️</span> <span>{mis}</span>
                            </li>
                          ))}
                          {evaluation.criticalMistakes.length === 0 && (
                            <span className="text-emerald-600 italic font-bold">Perfect safety protocol! Zero mistakes! 🎉</span>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Safety Tips */}
                    <div className="p-4 bg-sky-50/50 border-2 border-sky-100 rounded-2xl flex flex-col gap-2.5">
                      <h4 className="text-xs font-black text-sky-800 uppercase tracking-widest flex items-center gap-1.5 font-display">
                        💡 ADVICE FOR NEXT ADVENTURE
                      </h4>
                      <div className="flex flex-col gap-2">
                        {evaluation.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed font-sans font-bold">
                            <span className="text-sky-500 shrink-0">💡</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Close/Restart */}
                    <div className="flex justify-end gap-3 border-t-2 border-slate-100 pt-4">
                      <button
                        onClick={() => window.close()}
                        className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        BACK TO DASHBOARD
                      </button>
                      <button
                        onClick={handleResetDrill}
                        className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                      >
                        PLAY AGAIN! <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
